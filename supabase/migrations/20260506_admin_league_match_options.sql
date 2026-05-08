-- Migration for existing Wrestling Picks databases.
-- Run this once in Supabase SQL Editor if your database was created from an older zip.

alter table public.matches
  add column if not exists match_title text not null default '',
  add column if not exists competitor_c text,
  add column if not exists competitor_d text,
  add column if not exists competitor_e text,
  add column if not exists competitor_f text;

update public.matches
set match_title = trim(coalesce(competitor_a, '') || ' vs ' || coalesce(competitor_b, ''))
where coalesce(match_title, '') = '';

create or replace function public.has_league_admin(target_league uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.league_members lm
    where lm.league_id = target_league
      and lm.user_id = target_user
      and lm.status = 'active'
      and lm.role in ('LM','ALM')
  );
$$;

create or replace function public.is_league_lm(target_league uuid, target_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.league_members lm
    where lm.league_id = target_league
      and lm.user_id = target_user
      and lm.status = 'active'
      and lm.role = 'LM'
  );
$$;

drop policy if exists "leagues_delete_lm" on public.leagues;
create policy "leagues_delete_lm" on public.leagues
  for delete using (public.is_league_lm(id));

drop policy if exists "members_update_lm_only" on public.league_members;
create policy "members_update_lm_only" on public.league_members
  for update using (public.is_league_lm(league_id))
  with check (public.is_league_lm(league_id));

drop policy if exists "matches_insert_admin" on public.matches;
create policy "matches_insert_admin" on public.matches
  for insert with check (
    exists(select 1 from public.events e where e.id = event_id and public.has_league_admin(e.league_id))
  );

drop policy if exists "matches_update_admin" on public.matches;
create policy "matches_update_admin" on public.matches
  for update using (
    exists(select 1 from public.events e where e.id = event_id and public.has_league_admin(e.league_id))
  ) with check (
    exists(select 1 from public.events e where e.id = event_id and public.has_league_admin(e.league_id))
  );
