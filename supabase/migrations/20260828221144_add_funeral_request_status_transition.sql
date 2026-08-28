-- Fase 4G.3.1.7: transición privada y atómica de estado + auditoría.
-- La función se ejecuta sólo mediante el cliente administrativo server-side.

create or replace function public.update_funeral_family_request_status(
  p_request_id uuid,
  p_new_status text,
  p_actor_email text
) returns table(status text, unchanged boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old_status text;
begin
  if p_new_status not in ('new', 'in_review', 'waiting_customer', 'approved', 'rejected', 'completed', 'cancelled') then
    raise exception 'invalid funeral family update status' using errcode = '22023';
  end if;

  select r.status into v_old_status
  from public.funeral_family_update_requests r
  where r.id = p_request_id
  for update;

  if not found then
    raise exception 'funeral family update request not found' using errcode = 'P0002';
  end if;

  if v_old_status = p_new_status then
    return query select v_old_status, true;
    return;
  end if;

  update public.funeral_family_update_requests
  set status = p_new_status
  where id = p_request_id;

  insert into public.funeral_family_update_audit (request_id, action, old_status, new_status, actor_email)
  values (p_request_id, 'status_changed', v_old_status, p_new_status, nullif(btrim(p_actor_email), ''));

  return query select p_new_status, false;
end;
$$;

revoke execute on function public.update_funeral_family_request_status(uuid, text, text) from public, anon, authenticated;
grant execute on function public.update_funeral_family_request_status(uuid, text, text) to service_role;
