-- Phase 1B: additive platform schema. No production data is modified.
-- assistant_events is intentionally not created: journey_events already stores
-- the same anonymous assistant telemetry without prompts or PII.

create or replace function public.set_platform_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.set_platform_updated_at() from public, anon, authenticated;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) between 2 and 120),
  description text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_articles (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) between 3 and 180),
  category text not null,
  summary text,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete set null,
  question text not null check (length(btrim(question)) between 3 and 300),
  answer text not null,
  category text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0 check (sort_order >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create table if not exists public.internet_plans (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (length(btrim(name)) between 2 and 120),
  audience text not null check (audience in ('home', 'business', 'enterprise', 'all')),
  speed_down_mbps integer check (speed_down_mbps is null or speed_down_mbps > 0),
  speed_up_mbps integer check (speed_up_mbps is null or speed_up_mbps > 0),
  technology text,
  price_amount numeric(12,2) check (price_amount is null or price_amount >= 0),
  currency char(3) check (currency is null or currency ~ '^[A-Z]{3}$'),
  benefits jsonb not null default '[]'::jsonb check (jsonb_typeof(benefits) = 'array'),
  installation_notes text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0 check (sort_order >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((price_amount is null and currency is null) or (price_amount is not null and currency is not null)),
  check (status <> 'published' or published_at is not null)
);

-- Public, coarse-grained zones only. Exact addresses stay in the private
-- service_address_coverage table and are queried exclusively by the backend.
create table if not exists public.coverage_zones (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  zone_name text not null check (length(btrim(zone_name)) between 2 and 160),
  technology text,
  availability text not null default 'unconfirmed'
    check (availability in ('unconfirmed', 'available', 'unavailable', 'evaluation')),
  public_notes text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, zone_name, technology),
  check (status <> 'published' or published_at is not null)
);

create table if not exists public.service_alerts (
  id uuid primary key default gen_random_uuid(),
  service text not null references public.services(slug) on update cascade on delete restrict,
  title text not null check (length(btrim(title)) between 3 and 180),
  detail text not null,
  status text not null check (status in ('operational', 'maintenance', 'partial', 'outage', 'unknown')),
  starts_at timestamptz,
  ends_at timestamptz,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (not published or published_at is not null)
);

create table if not exists public.internet_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique check (request_number ~ '^NET-[0-9]{4}-[A-F0-9]{8}$'),
  journey_id text references public.user_journeys(journey_id) on delete set null,
  customer_type text not null check (customer_type in ('hogar', 'comercio', 'empresa')),
  full_name text not null check (length(btrim(full_name)) between 2 and 160),
  phone text not null check (length(btrim(phone)) between 6 and 40),
  email text not null check (position('@' in email) > 1),
  address text not null check (length(btrim(address)) between 3 and 240),
  zone text not null default '',
  selected_plan text,
  preferred_contact_time text,
  consent boolean not null check (consent),
  source text not null default 'web',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'closed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists help_articles_public_idx on public.help_articles (status, published_at desc);
create index if not exists help_articles_service_idx on public.help_articles (service_id);
create index if not exists faqs_public_idx on public.faqs (status, category, sort_order);
create index if not exists faqs_service_idx on public.faqs (service_id);
create index if not exists services_public_idx on public.services (status, sort_order);
create index if not exists internet_plans_public_idx on public.internet_plans (status, audience, sort_order);
create index if not exists internet_plans_service_idx on public.internet_plans (service_id);
create index if not exists coverage_zones_public_idx on public.coverage_zones (status, availability, zone_name);
create index if not exists service_alerts_public_idx on public.service_alerts (published, service, starts_at desc, ends_at);
create index if not exists internet_requests_created_idx on public.internet_requests (created_at desc);
create index if not exists internet_requests_status_idx on public.internet_requests (status, created_at desc);
create index if not exists internet_requests_journey_idx on public.internet_requests (journey_id) where journey_id is not null;

do $$
declare table_name text;
begin
  foreach table_name in array array['services','help_articles','faqs','internet_plans','coverage_zones','service_alerts','internet_requests']
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

revoke all on public.services, public.help_articles, public.faqs,
  public.internet_plans, public.coverage_zones, public.service_alerts,
  public.internet_requests from anon, authenticated;

grant select on public.services, public.help_articles, public.faqs,
  public.internet_plans, public.coverage_zones, public.service_alerts
  to anon, authenticated;

grant insert, update, delete on public.services, public.help_articles, public.faqs,
  public.internet_plans, public.coverage_zones, public.service_alerts
  to authenticated;

grant all on public.services, public.help_articles, public.faqs,
  public.internet_plans, public.coverage_zones, public.service_alerts,
  public.internet_requests to service_role;

create policy "published services are public" on public.services
for select to anon, authenticated using (status = 'published');
create policy "published help is public" on public.help_articles
for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "published faqs are public" on public.faqs
for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "published plans are public" on public.internet_plans
for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "published coverage zones are public" on public.coverage_zones
for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "published alerts are public" on public.service_alerts
for select to anon, authenticated using (
  published and published_at <= now()
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);

create policy "news admins manage services" on public.services
for all to authenticated using ((select private.is_news_admin())) with check ((select private.is_news_admin()));
create policy "news admins manage help" on public.help_articles
for all to authenticated using ((select private.is_news_admin())) with check ((select private.is_news_admin()));
create policy "news admins manage faqs" on public.faqs
for all to authenticated using ((select private.is_news_admin())) with check ((select private.is_news_admin()));
create policy "news admins manage plans" on public.internet_plans
for all to authenticated using ((select private.is_news_admin())) with check ((select private.is_news_admin()));
create policy "news admins manage coverage zones" on public.coverage_zones
for all to authenticated using ((select private.is_news_admin())) with check ((select private.is_news_admin()));
create policy "news admins manage alerts" on public.service_alerts
for all to authenticated using ((select private.is_news_admin())) with check ((select private.is_news_admin()));

create policy "browser roles cannot access internet requests" on public.internet_requests
for all to anon, authenticated using (false) with check (false);

create trigger services_updated_at before update on public.services
for each row execute function public.set_platform_updated_at();
create trigger help_articles_updated_at before update on public.help_articles
for each row execute function public.set_platform_updated_at();
create trigger faqs_updated_at before update on public.faqs
for each row execute function public.set_platform_updated_at();
create trigger internet_plans_updated_at before update on public.internet_plans
for each row execute function public.set_platform_updated_at();
create trigger coverage_zones_updated_at before update on public.coverage_zones
for each row execute function public.set_platform_updated_at();
create trigger service_alerts_updated_at before update on public.service_alerts
for each row execute function public.set_platform_updated_at();
create trigger internet_requests_updated_at before update on public.internet_requests
for each row execute function public.set_platform_updated_at();

comment on table public.coverage_zones is 'Coarse public coverage guidance; never stores customer addresses.';
comment on table public.internet_requests is 'Private commercial requests. Server/service_role access only.';
comment on table public.journey_events is 'Canonical assistant and navigation event store; replaces the planned assistant_events table.';
