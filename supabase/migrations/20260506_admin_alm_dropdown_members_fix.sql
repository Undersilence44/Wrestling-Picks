-- v9 ALM dropdown/member visibility patch
-- Run this on existing Supabase databases if the admin ALM dropdown is empty
-- even though the league has active members.

alter table public.profiles enable row level security;
alter table public.league_members enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "league_members_select_active_same_league" on public.league_members;
create policy "league_members_select_active_same_league"
on public.league_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.league_members lm_self
    where lm_self.league_id = league_members.league_id
      and lm_self.user_id = auth.uid()
      and lm_self.status = 'active'
  )
);
