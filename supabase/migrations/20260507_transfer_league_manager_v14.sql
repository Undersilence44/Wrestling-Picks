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
