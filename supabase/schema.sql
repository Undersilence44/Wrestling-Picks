-- Wrestling Picks Supabase Schema + RLS
-- Run this in a NEW Supabase project SQL editor for the cleanest deployment.

create extension if not exists pgcrypto;

create type public.league_visibility as enum ('public', 'private');
create type public.league_role as enum ('LM', 'ALM', 'OFFICER', 'MEMBER');
create type public.member_status as enum ('invited', 'active', 'removed');
create type public.scoring_type as enum ('ranked', 'fixed', 'fantasy');
create type public.event_status as enum ('open', 'locked', 'final');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  full_name text default '',
  email text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  visibility public.league_visibility not null default 'public',
  scoring_type public.scoring_type not null default 'ranked',
  fixed_points int not null default 1 check (fixed_points >= 1),
  perfect_bonus int not null default 5 check (perfect_bonus >= 0),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.league_role not null default 'MEMBER',
  status public.member_status not null default 'active',
  invited_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  name text not null,
  event_date timestamptz not null,
  status public.event_status not null default 'open',
  perfect_bonus int not null default 5 check (perfect_bonus >= 0),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  match_order int not null,
  match_title text not null default '',
  competitor_a text not null,
  competitor_b text not null,
  competitor_c text,
  competitor_d text,
  competitor_e text,
  competitor_f text,
  winner text,
  points_override int check (points_override is null or points_override >= 0),
  created_at timestamptz not null default now(),
  unique(event_id, match_order)
);

create table public.picks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  predicted_winner text not null,
  confidence_rank int check (confidence_rank is null or confidence_rank >= 1),
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, match_id, user_id)
);

create table public.interference_bets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  prediction text not null default '',
  wager int not null default 0 check (wager >= 0),
  admin_points int not null default 0,
  admin_note text not null default '',
  points_awarded int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create table public.event_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  league_id uuid not null references public.leagues(id) on delete cascade,
  pick_points int not null default 0,
  interference_points int not null default 0,
  perfect_bonus_points int not null default 0,
  total_points int generated always as (greatest(pick_points + interference_points + perfect_bonus_points, 0)) stored,
  correct_picks int not null default 0,
  wrong_picks int not null default 0,
  is_perfect boolean not null default false,
  created_at timestamptz not null default now(),
  unique(event_id, user_id)
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, '')
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_active_member(target_league uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.league_members lm where lm.league_id = target_league and lm.user_id = target_user and lm.status = 'active');
$$;

create or replace function public.has_league_admin(target_league uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.league_members lm where lm.league_id = target_league and lm.user_id = target_user and lm.status = 'active' and lm.role in ('LM','ALM'));
$$;

create or replace function public.is_league_lm(target_league uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.league_members lm where lm.league_id = target_league and lm.user_id = target_user and lm.status = 'active' and lm.role = 'LM');
$$;

-- v10: picks save UX, fixed scoring support, and leaderboard result calculation.
-- Run this in Supabase SQL Editor for an existing database.

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

  -- Update each pick row with the points it earned.
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

  -- Rebuild this event's result rows so leaderboard_view updates cleanly.
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
    scored.user_id,
    v_league_id,
    coalesce(sum(scored.pick_points), 0)::int as pick_points,
    coalesce(max(scored.interference_points), 0)::int as interference_points,
    case
      when v_resulted_matches > 0 and coalesce(sum(scored.correct_pick), 0)::int = v_resulted_matches then v_perfect_bonus
      else 0
    end as perfect_bonus_points,
    coalesce(sum(scored.correct_pick), 0)::int as correct_picks,
    coalesce(sum(scored.wrong_pick), 0)::int as wrong_picks,
    (v_resulted_matches > 0 and coalesce(sum(scored.correct_pick), 0)::int = v_resulted_matches) as is_perfect
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
  ) scored
  group by scored.user_id;
end;
$$;

grant execute on function public.calculate_event_results(uuid) to authenticated;


create or replace view public.leaderboard_view with (security_invoker = true) as
select
  er.league_id,
  l.name as league_name,
  er.user_id,
  coalesce(nullif(p.display_name, ''), p.email) as display_name,
  sum(er.total_points)::int as total_points,
  sum(er.correct_picks)::int as correct_picks,
  sum(er.wrong_picks)::int as wrong_picks,
  sum(case when er.is_perfect then 1 else 0 end)::int as perfect_events,
  sum(er.interference_points)::int as interference_total
from public.event_results er
join public.leagues l on l.id = er.league_id
join public.profiles p on p.id = er.user_id
group by er.league_id, l.name, er.user_id, p.display_name, p.email;

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.events enable row level security;
alter table public.matches enable row level security;
alter table public.picks enable row level security;
alter table public.interference_bets enable row level security;
alter table public.event_results enable row level security;

create policy "profiles_select_members" on public.profiles for select using (auth.uid() = id or exists(select 1 from public.league_members a join public.league_members b on a.league_id=b.league_id where a.user_id=auth.uid() and b.user_id=profiles.id and a.status='active' and b.status='active'));
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);

create policy "leagues_select_public_or_member" on public.leagues for select using (visibility='public' or public.is_active_member(id));
create policy "leagues_insert_auth" on public.leagues for insert with check (auth.uid() = created_by);
create policy "leagues_update_lm" on public.leagues for update using (public.is_league_lm(id)) with check (public.is_league_lm(id));
create policy "leagues_delete_lm" on public.leagues for delete using (public.is_league_lm(id));

create policy "members_select_same_league" on public.league_members for select using (public.is_active_member(league_id) or exists(select 1 from public.leagues l where l.id=league_id and l.visibility='public'));
create policy "members_insert_creator_lm_public_self_or_admin" on public.league_members for insert with check (
  (
    role = 'LM'
    and status = 'active'
    and user_id = auth.uid()
    and exists(
      select 1
      from public.leagues l
      where l.id = league_id
        and l.created_by = auth.uid()
    )
  )
  or
  (
    role = 'MEMBER'
    and status = 'active'
    and user_id = auth.uid()
    and exists(
      select 1
      from public.leagues l
      where l.id = league_id
        and l.visibility = 'public'
    )
  )
  or public.has_league_admin(league_id)
);
create policy "members_update_lm_only" on public.league_members for update using (public.is_league_lm(league_id)) with check (public.is_league_lm(league_id));
create policy "members_delete_lm_only" on public.league_members for delete using (public.is_league_lm(league_id));

create policy "events_select_members" on public.events for select using (public.is_active_member(league_id));
create policy "events_insert_admin" on public.events for insert with check (public.has_league_admin(league_id));
create policy "events_update_admin" on public.events for update using (public.has_league_admin(league_id)) with check (public.has_league_admin(league_id));
create policy "events_delete_lm" on public.events for delete using (public.is_league_lm(league_id));

create policy "matches_select_members" on public.matches for select using (exists(select 1 from public.events e where e.id=event_id and public.is_active_member(e.league_id)));
create policy "matches_insert_admin" on public.matches for insert with check (exists(select 1 from public.events e where e.id=event_id and public.has_league_admin(e.league_id)));
create policy "matches_update_admin" on public.matches for update using (exists(select 1 from public.events e where e.id=event_id and public.has_league_admin(e.league_id))) with check (exists(select 1 from public.events e where e.id=event_id and public.has_league_admin(e.league_id)));
create policy "matches_delete_admin" on public.matches for delete using (exists(select 1 from public.events e where e.id=event_id and public.has_league_admin(e.league_id)));

create policy "picks_select_self_or_admin" on public.picks for select using (user_id=auth.uid() or exists(select 1 from public.events e where e.id=event_id and public.has_league_admin(e.league_id)));
create policy "picks_insert_self_member_open" on public.picks for insert with check (user_id=auth.uid() and exists(select 1 from public.events e where e.id=event_id and e.status='open' and public.is_active_member(e.league_id)));
create policy "picks_update_self_member_open" on public.picks for update using (user_id=auth.uid() and exists(select 1 from public.events e where e.id=event_id and e.status='open' and public.is_active_member(e.league_id))) with check (user_id=auth.uid());

create policy "bets_select_self_or_admin" on public.interference_bets for select using (user_id=auth.uid() or exists(select 1 from public.events e where e.id=event_id and public.has_league_admin(e.league_id)));
create policy "bets_insert_self_member_open" on public.interference_bets for insert with check (user_id=auth.uid() and wager >= 0 and exists(select 1 from public.events e where e.id=event_id and e.status='open' and public.is_active_member(e.league_id)));
create policy "bets_update_self_member_open" on public.interference_bets for update using (user_id=auth.uid() and exists(select 1 from public.events e where e.id=event_id and e.status='open' and public.is_active_member(e.league_id))) with check (user_id=auth.uid() and wager >= 0);
create policy "bets_admin_update_points" on public.interference_bets for update using (exists(select 1 from public.events e where e.id=event_id and public.has_league_admin(e.league_id, auth.uid()))) with check (exists(select 1 from public.events e where e.id=event_id and public.has_league_admin(e.league_id, auth.uid())));

create policy "results_select_members" on public.event_results for select using (public.is_active_member(league_id));
create policy "results_admin_write" on public.event_results for all using (public.has_league_admin(league_id)) with check (public.has_league_admin(league_id));

-- League active member cap: max 30 active members per league.
create or replace function public.enforce_league_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_count int;
begin
  if new.status = 'active' and (tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.status is distinct from new.status)) then
    select count(*)
      into active_count
      from public.league_members
      where league_id = new.league_id
        and status = 'active';

    if active_count >= 30 then
      raise exception 'League member limit reached. Each league can only have 30 active members.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_league_member_limit_before_write on public.league_members;
create trigger enforce_league_member_limit_before_write
before insert or update of status on public.league_members
for each row
execute function public.enforce_league_member_limit();
-- v12: reliable LM/ALM interference admin scoring.
-- This fixes cases where the pick saves but the admin page shows no submissions because RLS blocks joined reads.

create or replace function public.admin_get_interference_submissions(target_event_id uuid)
returns table (
  bet_id uuid,
  event_id uuid,
  user_id uuid,
  prediction text,
  wager integer,
  admin_points integer,
  points_awarded integer,
  admin_note text,
  created_at timestamptz,
  display_name text,
  full_name text,
  email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_league_id uuid;
begin
  select e.league_id into v_league_id
  from public.events e
  where e.id = target_event_id;

  if v_league_id is null then
    raise exception 'Event not found';
  end if;

  if not public.has_league_admin(v_league_id, auth.uid()) then
    raise exception 'Only LM or ALM users can view interference submissions for this event';
  end if;

  return query
  select
    ib.id as bet_id,
    ib.event_id,
    ib.user_id,
    ib.prediction,
    ib.wager,
    coalesce(ib.admin_points, 0)::integer as admin_points,
    coalesce(ib.points_awarded, 0)::integer as points_awarded,
    coalesce(ib.admin_note, '')::text as admin_note,
    ib.created_at,
    coalesce(p.display_name, '')::text as display_name,
    coalesce(p.full_name, '')::text as full_name,
    coalesce(p.email, '')::text as email
  from public.interference_bets ib
  left join public.profiles p on p.id = ib.user_id
  where ib.event_id = target_event_id
    and (
      nullif(trim(coalesce(ib.prediction, '')), '') is not null
      or coalesce(ib.wager, 0) > 0
      or coalesce(ib.admin_points, 0) <> 0
      or coalesce(ib.points_awarded, 0) <> 0
    )
  order by ib.created_at asc;
end;
$$;

grant execute on function public.admin_get_interference_submissions(uuid) to authenticated;

create or replace function public.admin_score_interference_submission(
  target_event_id uuid,
  target_bet_id uuid,
  target_points integer,
  target_note text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_league_id uuid;
begin
  select e.league_id into v_league_id
  from public.events e
  where e.id = target_event_id;

  if v_league_id is null then
    raise exception 'Event not found';
  end if;

  if not public.has_league_admin(v_league_id, auth.uid()) then
    raise exception 'Only LM or ALM users can score interference submissions for this event';
  end if;

  update public.interference_bets
  set
    admin_points = target_points,
    points_awarded = target_points,
    admin_note = coalesce(target_note, ''),
    updated_at = now()
  where id = target_bet_id
    and event_id = target_event_id;

  if not found then
    raise exception 'Interference submission not found';
  end if;
end;
$$;

grant execute on function public.admin_score_interference_submission(uuid, uuid, integer, text) to authenticated;

-- Keep RLS policies present for direct reads/updates too, but the admin page now uses the RPCs above.
drop policy if exists "bets_select_self_or_admin" on public.interference_bets;
create policy "bets_select_self_or_admin"
on public.interference_bets
for select
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.events e
    where e.id = event_id
      and public.has_league_admin(e.league_id, auth.uid())
  )
);

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
-- v14: League Manager transfer support.
-- Run this in Supabase SQL Editor for an existing database.

create or replace function public.transfer_league_manager(
  target_league_id uuid,
  target_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_lm_member_id uuid;
  new_lm_user_id uuid;
begin
  if current_user_id is null then
    raise exception 'You must be logged in to transfer LM';
  end if;

  select id into current_lm_member_id
  from public.league_members
  where league_id = target_league_id
    and user_id = current_user_id
    and status = 'active'
    and role = 'LM'
  limit 1;

  if current_lm_member_id is null then
    raise exception 'Only the current League Manager can transfer LM';
  end if;

  select user_id into new_lm_user_id
  from public.league_members
  where id = target_member_id
    and league_id = target_league_id
    and status = 'active'
  limit 1;

  if new_lm_user_id is null then
    raise exception 'Selected user is not an active member of this league';
  end if;

  if new_lm_user_id = current_user_id then
    raise exception 'You are already the League Manager';
  end if;

  -- Demote every current LM in that league first, then promote the selected member.
  -- This keeps one active LM per league after the transfer finishes.
  update public.league_members
  set role = 'MEMBER', updated_at = now()
  where league_id = target_league_id
    and status = 'active'
    and role = 'LM';

  update public.league_members
  set role = 'LM', updated_at = now()
  where id = target_member_id
    and league_id = target_league_id
    and status = 'active';
end;
$$;

grant execute on function public.transfer_league_manager(uuid, uuid) to authenticated;


-- v15: LM-only event deletion with full cleanup.
-- v15: LM-only event deletion with cleanup for picks, interference bets, matches, and leaderboard points.

create or replace function public.delete_event_as_lm(target_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_league_id uuid;
begin
  select e.league_id
  into v_league_id
  from public.events e
  where e.id = target_event_id;

  if v_league_id is null then
    raise exception 'Event not found';
  end if;

  if not exists (
    select 1
    from public.league_members lm
    where lm.league_id = v_league_id
      and lm.user_id = auth.uid()
      and lm.status = 'active'
      and lm.role = 'LM'
  ) then
    raise exception 'Only the League Manager can delete events';
  end if;

  -- Explicit deletes keep existing databases safe even if older foreign keys were not created with ON DELETE CASCADE.
  delete from public.event_results where event_id = target_event_id;
  delete from public.interference_bets where event_id = target_event_id;
  delete from public.picks where event_id = target_event_id;
  delete from public.matches where event_id = target_event_id;
  delete from public.events where id = target_event_id;
end;
$$;

grant execute on function public.delete_event_as_lm(uuid) to authenticated;
