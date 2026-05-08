-- v11: interference prediction details and LM/ALM admin scoring.
-- Run this in Supabase SQL Editor for an existing database.

alter table public.interference_bets
  add column if not exists admin_points int not null default 0,
  add column if not exists admin_note text not null default '',
  add column if not exists updated_at timestamptz not null default now();

-- Keep old rows usable. Prediction now stores the member's detailed interference description.
update public.interference_bets
set prediction = ''
where prediction = 'none';

-- Allow LM/ALM users to score interference bets after reviewing the member description.
drop policy if exists "bets_admin_update_points" on public.interference_bets;
create policy "bets_admin_update_points"
on public.interference_bets
for update
using (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and public.has_league_admin(e.league_id, auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and public.has_league_admin(e.league_id, auth.uid())
  )
);

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
    coalesce(max(combined.interference_points), 0)::int as interference_points,
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
      ib.admin_points as interference_points,
      0::int as correct_pick,
      0::int as wrong_pick
    from public.interference_bets ib
    where ib.event_id = target_event_id
  ) combined
  group by combined.user_id;
end;
$$;

grant execute on function public.calculate_event_results(uuid) to authenticated;
