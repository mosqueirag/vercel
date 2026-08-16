-- P1 hardening: distributed atomic limits, lead deduplication and reliable outbox.
create table if not exists private.rate_limit_buckets (
  scope text not null,
  key_hash text not null check (length(key_hash) = 64),
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  expires_at timestamptz not null,
  primary key (scope, key_hash, window_start)
);

revoke all on private.rate_limit_buckets from public, anon, authenticated;
grant all on private.rate_limit_buckets to service_role;
create index if not exists rate_limit_buckets_expiry_idx on private.rate_limit_buckets (expires_at);

create or replace function public.consume_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  bucket_start timestamptz;
  new_count integer;
begin
  if length(p_scope) not between 1 and 80
     or p_key_hash !~ '^[a-f0-9]{64}$'
     or p_limit not between 1 and 10000
     or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid rate limit configuration';
  end if;

  bucket_start := to_timestamp(floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds);

  insert into private.rate_limit_buckets (scope, key_hash, window_start, request_count, expires_at)
  values (p_scope, p_key_hash, bucket_start, 1, bucket_start + make_interval(secs => p_window_seconds * 2))
  on conflict (scope, key_hash, window_start) do update
    set request_count = private.rate_limit_buckets.request_count + 1
  returning request_count into new_count;

  if random() < 0.02 then
    delete from private.rate_limit_buckets where expires_at < clock_timestamp();
  end if;

  return new_count <= p_limit;
end;
$$;

revoke execute on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

alter table public.internet_requests
  add column if not exists session_id text,
  add column if not exists deduplication_key text;

alter table public.internet_requests
  drop constraint if exists internet_requests_session_id_check;
alter table public.internet_requests
  add constraint internet_requests_session_id_check
  check (session_id is null or session_id ~ '^SES-[A-F0-9]{16}$');
alter table public.internet_requests
  drop constraint if exists internet_requests_deduplication_key_check;
alter table public.internet_requests
  add constraint internet_requests_deduplication_key_check
  check (deduplication_key is null or length(deduplication_key) = 64);
create unique index if not exists internet_requests_deduplication_idx
  on public.internet_requests (deduplication_key)
  where deduplication_key is not null;

create table if not exists public.integration_outbox (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('internet_request.created')),
  aggregate_id uuid not null references public.internet_requests(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'processing', 'delivered', 'error')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.integration_outbox enable row level security;
revoke all on public.integration_outbox from public, anon, authenticated;
revoke all on sequence public.integration_outbox_id_seq from public, anon, authenticated;
grant all on public.integration_outbox to service_role;
grant usage, select on sequence public.integration_outbox_id_seq to service_role;
create policy "browser roles cannot access integration outbox" on public.integration_outbox
for all to anon, authenticated using (false) with check (false);
create index if not exists integration_outbox_delivery_idx
  on public.integration_outbox (status, next_attempt_at, created_at)
  where status in ('pending', 'error');

create trigger integration_outbox_updated_at before update on public.integration_outbox
for each row execute function public.set_platform_updated_at();

create or replace function public.create_internet_request_with_outbox(
  p_request_number text,
  p_journey_id text,
  p_session_id text,
  p_customer_type text,
  p_full_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_zone text,
  p_selected_plan text,
  p_preferred_contact_time text,
  p_consent boolean,
  p_source text,
  p_deduplication_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id uuid;
begin
  insert into public.internet_requests (
    request_number, journey_id, session_id, customer_type, full_name, phone,
    email, address, zone, selected_plan, preferred_contact_time, consent,
    source, deduplication_key
  ) values (
    p_request_number, p_journey_id, p_session_id, p_customer_type, p_full_name,
    p_phone, lower(p_email), p_address, p_zone, nullif(p_selected_plan, ''),
    nullif(p_preferred_contact_time, ''), p_consent, p_source, p_deduplication_key
  ) returning id into request_id;

  insert into public.integration_outbox (event_type, aggregate_id, payload)
  values ('internet_request.created', request_id, jsonb_build_object(
    'event', 'internet_request.created',
    'requestNumber', p_request_number
  ));

  return request_id;
end;
$$;

revoke execute on function public.create_internet_request_with_outbox(
  text, text, text, text, text, text, text, text, text, text, text, boolean, text, text
) from public, anon, authenticated;
grant execute on function public.create_internet_request_with_outbox(
  text, text, text, text, text, text, text, text, text, text, text, boolean, text, text
) to service_role;

comment on table private.rate_limit_buckets is 'Hashed, atomic, distributed endpoint limits. Rows expire and are opportunistically cleaned.';
comment on table public.integration_outbox is 'Server-only integration events with delivery state and retry scheduling.';

create or replace function public.claim_integration_outbox(p_limit integer default 5)
returns table (id bigint, event_type text, payload jsonb, attempts integer)
language sql security definer set search_path = '' as $$
  with candidates as (
    select o.id from public.integration_outbox o
    where o.status in ('pending', 'error') and o.next_attempt_at <= clock_timestamp()
    order by o.created_at for update skip locked limit greatest(1, least(p_limit, 25))
  )
  update public.integration_outbox o set status = 'processing', attempts = o.attempts + 1
  from candidates c where o.id = c.id
  returning o.id, o.event_type, o.payload, o.attempts;
$$;
revoke execute on function public.claim_integration_outbox(integer) from public, anon, authenticated;
grant execute on function public.claim_integration_outbox(integer) to service_role;
