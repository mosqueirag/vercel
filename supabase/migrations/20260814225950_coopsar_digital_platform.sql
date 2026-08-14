-- COOPSAR digital platform. Apply only after review in a non-production branch.
create table if not exists public.help_articles (id uuid primary key default gen_random_uuid(), slug text unique not null, title text not null, category text not null, content text not null, status text not null default 'draft' check (status in ('draft','published')), updated_at timestamptz not null default now());
create table if not exists public.faqs (id uuid primary key default gen_random_uuid(), question text not null, answer text not null, category text not null, status text not null default 'draft' check (status in ('draft','published')), sort_order integer not null default 0, updated_at timestamptz not null default now());
create table if not exists public.services (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text not null, status text not null default 'draft' check (status in ('draft','published')), updated_at timestamptz not null default now());
create table if not exists public.internet_plans (id uuid primary key default gen_random_uuid(), name text not null, audience text not null, speed_label text, technology text, price_label text, benefits jsonb not null default '[]', status text not null default 'draft' check (status in ('draft','published')), updated_at timestamptz not null default now());
create table if not exists public.coverage_zones (id uuid primary key default gen_random_uuid(), zone text not null, technology text, availability text not null default 'unconfirmed' check (availability in ('unconfirmed','available','unavailable','evaluation')), updated_at timestamptz not null default now());
create table if not exists public.service_alerts (id uuid primary key default gen_random_uuid(), service text not null, title text not null, detail text not null, status text not null check (status in ('operational','maintenance','partial','outage','unknown')), starts_at timestamptz, ends_at timestamptz, published boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.assistant_events (id uuid primary key default gen_random_uuid(), session_hash text not null, intent text, resolved boolean, handed_to_whatsapp boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.internet_requests (id uuid primary key default gen_random_uuid(), request_number text unique not null, customer_type text not null, full_name text not null, phone text not null, email text not null, address text not null, zone text not null, selected_plan text, preferred_contact_time text, consent boolean not null, source text not null default 'web', status text not null default 'new', created_at timestamptz not null default now());

alter table public.help_articles enable row level security; alter table public.faqs enable row level security; alter table public.services enable row level security; alter table public.internet_plans enable row level security; alter table public.coverage_zones enable row level security; alter table public.service_alerts enable row level security; alter table public.assistant_events enable row level security; alter table public.internet_requests enable row level security;

grant select on public.help_articles, public.faqs, public.services, public.internet_plans, public.coverage_zones, public.service_alerts to anon, authenticated;
revoke all on public.assistant_events, public.internet_requests from anon, authenticated;
grant all on public.help_articles, public.faqs, public.services, public.internet_plans, public.coverage_zones, public.service_alerts, public.assistant_events, public.internet_requests to service_role;

create policy "published help is public" on public.help_articles for select to anon, authenticated using (status = 'published');
create policy "published faqs are public" on public.faqs for select to anon, authenticated using (status = 'published');
create policy "published services are public" on public.services for select to anon, authenticated using (status = 'published');
create policy "published plans are public" on public.internet_plans for select to anon, authenticated using (status = 'published');
create policy "coverage can be consulted" on public.coverage_zones for select to anon, authenticated using (true);
create policy "published alerts are public" on public.service_alerts for select to anon, authenticated using (published = true and (ends_at is null or ends_at > now()));

create index if not exists assistant_events_created_at_idx on public.assistant_events (created_at desc);
create index if not exists assistant_events_intent_idx on public.assistant_events (intent);
create index if not exists internet_requests_created_at_idx on public.internet_requests (created_at desc);
create index if not exists service_alerts_active_idx on public.service_alerts (published, starts_at, ends_at);
