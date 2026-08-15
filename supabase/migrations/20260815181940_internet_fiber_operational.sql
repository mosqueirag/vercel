-- Phase 1C: additive Internet/Fiber operational journey. Staging only until reviewed.
-- Exact coverage remains server-only in service_address_coverage.
alter table public.service_address_coverage
  add column if not exists coverage_status text not null default 'available'
    check (coverage_status in ('available','nearby','planned','unavailable','unknown')),
  add column if not exists plan_slug text;

alter table public.internet_requests
  add column if not exists request_type text not null default 'installation'
    check (request_type in ('installation','coverage_validation','fiber_waitlist')),
  add column if not exists street text,
  add column if not exists street_number integer check (street_number is null or street_number > 0),
  add column if not exists coverage_status text check (coverage_status is null or coverage_status in ('available','nearby','planned','unavailable','unknown')),
  add column if not exists plan_id uuid references public.internet_plans(id) on delete set null,
  add column if not exists contact_consent_at timestamptz,
  add column if not exists marketing_opt_in boolean not null default false,
  add column if not exists marketing_opt_in_at timestamptz;

alter table public.internet_requests alter column email drop not null;
alter table public.internet_requests drop constraint if exists internet_requests_status_check;
alter table public.internet_requests add constraint internet_requests_status_check check (status in (
  'new','contacted','qualified','installation_pending','completed','lost',
  'waiting_coverage','notified','converted','closed','cancelled'
));
alter table public.internet_requests add constraint internet_requests_marketing_consent_check
  check ((marketing_opt_in = false and marketing_opt_in_at is null) or (marketing_opt_in = true and marketing_opt_in_at is not null));
create index if not exists internet_requests_type_status_idx on public.internet_requests (request_type, status, created_at desc);

alter table public.integration_outbox drop constraint if exists integration_outbox_event_type_check;
alter table public.integration_outbox add constraint integration_outbox_event_type_check
  check (event_type in ('internet_request.created','fiber_waitlist.created'));

create or replace function public.create_internet_request_v2_with_outbox(
  p_request_number text, p_journey_id text, p_session_id text, p_request_type text,
  p_customer_type text, p_full_name text, p_phone text, p_email text,
  p_street text, p_street_number integer, p_zone text, p_coverage_status text,
  p_plan_id uuid, p_selected_plan text, p_contact_consent boolean,
  p_marketing_opt_in boolean, p_source text, p_deduplication_key text
) returns table(request_number text, created boolean)
language plpgsql security definer set search_path = '' as $$
declare request_id uuid; existing_number text; event_name text;
begin
  insert into public.internet_requests (
    request_number, journey_id, session_id, request_type, customer_type, full_name, phone, email,
    address, street, street_number, zone, coverage_status, plan_id, selected_plan,
    consent, contact_consent_at, marketing_opt_in, marketing_opt_in_at, source, deduplication_key, status
  ) values (
    p_request_number, p_journey_id, p_session_id, p_request_type, p_customer_type, p_full_name, p_phone, nullif(lower(p_email), ''),
    concat_ws(' ', p_street, p_street_number::text), p_street, p_street_number, coalesce(p_zone, ''), p_coverage_status, p_plan_id, nullif(p_selected_plan, ''),
    p_contact_consent, clock_timestamp(), p_marketing_opt_in, case when p_marketing_opt_in then clock_timestamp() else null end, p_source, p_deduplication_key,
    case when p_request_type = 'fiber_waitlist' then 'waiting_coverage' else 'new' end
  ) on conflict (deduplication_key) where deduplication_key is not null do nothing
  returning id into request_id;

  if request_id is null then
    select r.request_number into existing_number from public.internet_requests r where r.deduplication_key = p_deduplication_key;
    return query select existing_number, false; return;
  end if;
  event_name := case when p_request_type = 'fiber_waitlist' then 'fiber_waitlist.created' else 'internet_request.created' end;
  insert into public.integration_outbox (event_type, aggregate_id, payload)
  values (event_name, request_id, jsonb_build_object('event', event_name, 'requestNumber', p_request_number, 'requestType', p_request_type));
  return query select p_request_number, true;
end;
$$;
revoke execute on function public.create_internet_request_v2_with_outbox(text,text,text,text,text,text,text,text,text,integer,text,text,uuid,text,boolean,boolean,text,text) from public, anon, authenticated;
grant execute on function public.create_internet_request_v2_with_outbox(text,text,text,text,text,text,text,text,text,integer,text,text,uuid,text,boolean,boolean,text,text) to service_role;

comment on column public.service_address_coverage.coverage_status is 'Server-only commercial result; never expose infrastructure details.';
