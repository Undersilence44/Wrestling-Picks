-- v13: score floor, interference totals, and finalized-pick review support.
-- Run this in Supabase SQL Editor after v12.

-- Make event_results.total_points unable to go below 0.
-- This preserves all existing pick/interference/perfect columns, but changes the generated total.
alter table public.event_results
  drop column if exists total_points;

alter table public.event_results
  add column total_points int generated always as (
    greatest(pick_points + interference_points + perfect_bonus_points, 0)
  ) stored;

-- Recreate scoring so negative interference points subtract from totals,
-- but the generated total_points column floors the final total at 0.
create or replace function public.calculate_event_results(target_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_league_id uuid;
  v_scoring_type public.scoring_type;
  v_fixed_points int;
  v_perfect_bonus int;
  v_resulted_matches int;
begin
  select
    e.league_id,
    l.scoring_type,
    l.fixed_points,
    coalesce(e.perfect_bonus, l.perfect_bonus, 5)
  into v_league_id, v_scoring_type, v_fixed_points, v_perfect_bonus
  from public.events e
  join public.leagues l on l.id = e.league_id
  where e.id = target_event_id;

  if v_league_id is null then
    raise exception 'Event not found';
  end if;

  if not public.has_league_admin(v_league_id, auth.uid()) then
    raise exception 'Only LM or ALM users can calculate event results';
  end if;

  select count(*)
  into v_resulted_matches
  from public.matches
  where event_id = target_event_id
    and winner is not null
    and trim(winner) <> '';

  update public.picks p
  set
    points_awarded = case
      when m.winner is not null and trim(m.winner) <> '' and p.predicted_winner = m.winner then
        coalesce(
          m.points_override,
          case
            when v_scoring_type = 'fixed' then v_fixed_points
            when v_scoring_type = 'ranked' then coalesce(p.confidence_rank, 0)
            else 0
          end
        )
      else 0
    end,
    updated_at = now()
  from public.matches m
  where m.id = p.match_id
    and p.event_id = target_event_id
    and m.event_id = target_event_id;

  -- Keep the bet row visibly scored for the admin panel and audit/history.
  update public.interference_bets
  set points_awarded = admin_points,
      updated_at = now()
  where event_id = target_event_id;

  delete from public.event_results
  where event_id = target_event_id;

  insert into public.event_results (
    event_id,
    user_id,
    league_id,
    pick_points,
    interference_points,
    perfect_bonus_points,
    correct_picks,
    wrong_picks,
    is_perfect
  )
  select
    target_event_id,
    combined.user_id,
    v_league_id,
    coalesce(sum(combined.pick_points), 0)::int as pick_points,
    coalesce(sum(combined.interference_points), 0)::int as interference_points,
    case
      when v_resulted_matches > 0 and coalesce(sum(combined.correct_pick), 0)::int = v_resulted_matches then v_perfect_bonus
      else 0
    end as perfect_bonus_points,
    coalesce(sum(combined.correct_pick), 0)::int as correct_picks,
    coalesce(sum(combined.wrong_pick), 0)::int as wrong_picks,
    (v_resulted_matches > 0 and coalesce(sum(combined.correct_pick), 0)::int = v_resulted_matches) as is_perfect
  from (
    select
      p.user_id,
      p.points_awarded as pick_points,
      0::int as interference_points,
      case when m.winner is not null and trim(m.winner) <> '' and p.predicted_winner = m.winner then 1 else 0 end as correct_pick,
      case when m.winner is not null and trim(m.winner) <> '' and p.predicted_winner <> m.winner then 1 else 0 end as wrong_pick
    from public.picks p
    join public.matches m on m.id = p.match_id
    where p.event_id = target_event_id
      and m.event_id = target_event_id
      and m.winner is not null
      and trim(m.winner) <> ''

    union all

    select
      ib.user_id,
      0::int as pick_points,
      coalesce(ib.admin_points, 0)::int as interference_points,
      0::int as correct_pick,
      0::int as wrong_pick
    from public.interference_bets ib
    where ib.event_id = target_event_id
  ) combined
  group by combined.user_id;
end;
$$;

grant execute on function public.calculate_event_results(uuid) to authenticated;

-- Refresh the leaderboard view so it exposes the floored total plus interference +/- clearly.
drop view if exists public.leaderboard_view;

create or replace view public.leaderboard_view with (security_invoker = true) as
select
  er.league_id,
  l.name as league_name,
  er.user_id,
  coalesce(nullif(p.display_name, ''), p.email) as display_name,
  sum(er.pick_points)::int as event_points,
  sum(er.interference_points)::int as interference_total,
  sum(er.perfect_bonus_points)::int as perfect_bonus_total,
  sum(er.total_points)::int as total_points,
  sum(er.correct_picks)::int as correct_picks,
  sum(er.wrong_picks)::int as wrong_picks,
  sum(case when er.is_perfect then 1 else 0 end)::int as perfect_events
from public.event_results er
join public.leagues l on l.id = er.league_id
join public.profiles p on p.id = er.user_id
group by er.league_id, l.name, er.user_id, p.display_name, p.email;
