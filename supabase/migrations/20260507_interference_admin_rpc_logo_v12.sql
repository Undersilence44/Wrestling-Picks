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
