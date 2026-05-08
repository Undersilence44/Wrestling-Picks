-- v8 member display/profile visibility patch
-- This migration makes member display more reliable for existing databases.
-- It allows logged-in users to read basic profile rows so league member lists and ALM dropdowns can show names.

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_members" on public.profiles;
drop policy if exists "profiles_select_authenticated" on public.profiles;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);
