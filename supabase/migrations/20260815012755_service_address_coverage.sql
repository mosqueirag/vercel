-- Private service footprint used only by server-side coverage checks.
create table if not exists public.service_address_coverage (
  id bigint generated always as identity primary key,
  street_normalized text not null,
  street_number integer not null check (street_number > 0),
  plan_name text not null,
  technology text not null,
  speed_down_mbps integer check (speed_down_mbps is null or speed_down_mbps > 0),
  source_updated_at date,
  created_at timestamptz not null default now(),
  unique (street_normalized, street_number, plan_name)
);

alter table public.service_address_coverage enable row level security;
revoke all on table public.service_address_coverage from anon, authenticated;
revoke all on sequence public.service_address_coverage_id_seq from anon, authenticated;
grant select, insert, update on table public.service_address_coverage to service_role;
grant usage, select on sequence public.service_address_coverage_id_seq to service_role;

create index if not exists service_address_coverage_lookup_idx
  on public.service_address_coverage (street_normalized, street_number);

comment on table public.service_address_coverage is
  'Private active-service footprint. Never expose rows directly to browser clients.';
