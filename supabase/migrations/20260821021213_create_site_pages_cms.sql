-- Phase 4A: editable system pages. This migration is additive and is not
-- applied to staging automatically.
create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('energia', 'internet', 'fibra-optica', 'telefonia', 'sepelio', 'tramites', 'cortes-programados', 'medios-de-pago', 'centro-de-ayuda', 'institucional', 'contacto', 'privacidad')),
  eyebrow text not null check (length(btrim(eyebrow)) between 2 and 120),
  title text not null check (length(btrim(title)) between 2 and 180),
  intro text not null check (length(btrim(intro)) between 2 and 1200),
  image_url text,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_pages_public_idx on public.site_pages (slug, status, sort_order);
alter table public.site_pages enable row level security;
revoke all on public.site_pages from anon, authenticated;
grant select on public.site_pages to anon, authenticated;
grant all on public.site_pages to service_role;

create policy "published site pages are public" on public.site_pages
for select to anon, authenticated using (status = 'published');
create policy "news admins manage site pages" on public.site_pages
for all to authenticated using ((select private.is_news_admin())) with check ((select private.is_news_admin()));

create trigger site_pages_updated_at before update on public.site_pages
for each row execute function public.set_platform_updated_at();

insert into public.site_pages (slug, eyebrow, title, intro, items, status, sort_order)
values
  ('energia', 'Energía eléctrica', 'Energía para la comunidad', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 10),
  ('internet', 'Conectividad', 'Internet para cada necesidad', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 20),
  ('fibra-optica', 'Fibra óptica', 'Conectividad de nueva generación', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 30),
  ('telefonia', 'Telefonía', 'Comunicación y soporte local', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 40),
  ('sepelio', 'Servicio solidario', 'Acompañamiento cuando más se necesita', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 50),
  ('tramites', 'Autoservicio', 'Trámites y gestiones', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 60),
  ('cortes-programados', 'Estado de servicios', 'Cortes y alertas operativas', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 70),
  ('medios-de-pago', 'Facturas', 'Facturas y medios de pago', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 80),
  ('centro-de-ayuda', 'Ayuda', 'Centro de ayuda COOPSAR', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 90),
  ('institucional', 'Nuestra cooperativa', 'COOPSAR, cerca de la comunidad', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 100),
  ('contacto', 'Atención', 'Contactate con COOPSAR', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 110),
  ('privacidad', 'Privacidad', 'Uso responsable de tus datos', 'Contenido editable pendiente de publicación.', '[]'::jsonb, 'draft', 120)
on conflict (slug) do nothing;

comment on table public.site_pages is 'Editable public system pages. Draft rows are never returned to public visitors.';
