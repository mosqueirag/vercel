-- Explicitly deny browser roles in addition to revoked grants and default-deny RLS.
create policy "browser roles cannot access journeys"
on public.user_journeys for all to anon, authenticated
using (false) with check (false);

create policy "browser roles cannot access journey events"
on public.journey_events for all to anon, authenticated
using (false) with check (false);

create index if not exists user_journeys_user_id_idx
on public.user_journeys (user_id)
where user_id is not null;
