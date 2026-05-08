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
