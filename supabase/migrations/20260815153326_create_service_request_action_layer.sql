-- Phase 2A: private, reusable action/request layer for COOPIA.
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique check (request_number ~ '^SRV-[0-9]{4}-[A-F0-9]{8}$'),
  request_type text not null check (request_type in ('complaint','ownership_change','new_supply','digital_invoice','phone_request')),
  service text not null check (service in ('billing','internet','fiber','energy','phone','funeral','general')),
  journey_id text not null references public.user_journeys(journey_id) on delete restrict,
  session_id text not null check (session_id ~ '^SES-[A-F0-9]{16}$'),
  status text not null default 'new' check (status in ('new','in_review','waiting_customer','assigned','resolved','closed','cancelled')),
  full_name text not null check (length(btrim(full_name)) between 3 and 120),
  phone text not null check (length(btrim(phone)) between 8 and 30),
  email text not null check (position('@' in email) > 1),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  consent boolean not null check (consent),
  source text not null default 'coopia' check (length(source) between 2 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_requests enable row level security;
revoke all on public.service_requests from public, anon, authenticated;
grant all on public.service_requests to service_role;
create policy "browser roles cannot access service requests" on public.service_requests
for all to anon, authenticated using (false) with check (false);
create index service_requests_journey_idx on public.service_requests (journey_id, created_at desc);
create index service_requests_operations_idx on public.service_requests (request_type, status, created_at desc);
create trigger service_requests_updated_at before update on public.service_requests
for each row execute function public.set_platform_updated_at();
comment on table public.service_requests is 'Private COOPIA requests. Browser roles have no direct access; payload is allow-listed by the server schema.';
