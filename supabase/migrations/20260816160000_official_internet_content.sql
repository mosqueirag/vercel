-- Phase 2A: administrable public content. No production data or coverage is seeded here.
create table if not exists public.public_contact_channels (
  id uuid primary key default gen_random_uuid(),
  service text not null check (service in ('general', 'internet', 'energy', 'funeral', 'billing', 'phone')),
  channel_type text not null check (channel_type in ('phone', 'whatsapp', 'url', 'address', 'hours')),
  label text not null check (length(btrim(label)) between 2 and 120),
  value text not null check (length(btrim(value)) between 2 and 500),
  public_value text not null check (length(btrim(public_value)) between 2 and 500),
  purpose text not null check (length(btrim(purpose)) between 2 and 80),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0 check (sort_order >= 0),
  published_at timestamptz,
  updated_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service, channel_type, purpose),
  check (status <> 'published' or published_at is not null)
);

alter table public.internet_plans
  add column if not exists description text,
  add column if not exists conditions text,
  add column if not exists installation_price numeric(12,2) check (installation_price is null or installation_price >= 0);

alter table public.service_address_coverage
  add column if not exists plan_id uuid references public.internet_plans(id) on delete set null,
  add column if not exists source text not null default 'manual_admin'
    check (source in ('manual_admin', 'csv_import', 'network_export', 'verified_internal')),
  add column if not exists verified_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists public_contact_channels_public_idx
  on public.public_contact_channels (status, service, purpose, sort_order);
create index if not exists service_address_coverage_plan_idx
  on public.service_address_coverage (plan_id) where plan_id is not null;

alter table public.public_contact_channels enable row level security;
revoke all on public.public_contact_channels from anon, authenticated;
grant select on public.public_contact_channels to anon, authenticated;
grant all on public.public_contact_channels to service_role;

create policy "published public contacts are readable" on public.public_contact_channels
for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "news admins manage public contacts" on public.public_contact_channels
for all to authenticated using ((select private.is_news_admin())) with check ((select private.is_news_admin()));

create trigger public_contact_channels_updated_at before update on public.public_contact_channels
for each row execute function public.set_platform_updated_at();
create trigger service_address_coverage_updated_at before update on public.service_address_coverage
for each row execute function public.set_platform_updated_at();

comment on table public.public_contact_channels is 'Published public contact channels only; never stores secrets or internal credentials.';
comment on column public.service_address_coverage.source is 'Administrative source label only; never network topology.';
