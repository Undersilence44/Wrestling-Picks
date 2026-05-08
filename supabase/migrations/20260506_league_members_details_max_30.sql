-- Migration: League member detail page support + 30 active member cap
-- Safe to run on an existing Supabase database.

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

-- Make sure public league pages can show active league members and profile names through existing RLS.
-- These policies are intentionally idempotent-friendly by dropping/recreating only the member select policy.
drop policy if exists "members_select_same_league" on public.league_members;
create policy "members_select_same_league" on public.league_members
for select using (
  public.is_active_member(league_id)
  or exists(select 1 from public.leagues l where l.id = league_id and l.visibility = 'public')
);
