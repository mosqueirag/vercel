-- Synthetic COOPSAR staging fixtures only. Never use this file for production data.
-- All values are explicitly marked TEST and contain no personal information.

insert into public.services (slug, name, description, status, sort_order)
values
  ('internet-test', 'Internet TEST', 'Servicio sintético exclusivo para validar staging.', 'published', 999),
  ('energia-test', 'Energía TEST', 'Servicio sintético exclusivo para validar staging.', 'published', 998)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.faqs (service_id, question, answer, category, status, sort_order, published_at)
select s.id, 'FAQ TEST: ¿Cómo funciona staging?', 'Esta respuesta es sintética y se usa únicamente para validar la arquitectura de staging.', 'TEST', 'published', 999, now()
from public.services s
where s.slug = 'internet-test'
  and not exists (select 1 from public.faqs f where f.question = 'FAQ TEST: ¿Cómo funciona staging?');

insert into public.help_articles (service_id, slug, title, category, summary, content, status, published_at)
select s.id, 'articulo-test-staging', 'Artículo TEST de staging', 'TEST', 'Contenido sintético para validar la lectura pública.', 'Este artículo no contiene información institucional ni requisitos reales.', 'published', now()
from public.services s
where s.slug = 'internet-test'
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  content = excluded.content,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.internet_plans (service_id, slug, name, audience, benefits, installation_notes, status, sort_order, published_at)
select s.id, 'plan-test-sin-precio', 'Plan TEST sin precio', 'home', '["Solo staging"]'::jsonb, 'No es una oferta comercial.', 'published', 999, now()
from public.services s
where s.slug = 'internet-test'
on conflict (slug) do update set
  name = excluded.name,
  speed_down_mbps = null,
  speed_up_mbps = null,
  technology = null,
  price_amount = null,
  currency = null,
  benefits = excluded.benefits,
  installation_notes = excluded.installation_notes,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.coverage_zones (service_id, zone_name, technology, availability, public_notes, status, published_at)
select s.id, 'Zona TEST 999', 'TEST', 'evaluation', 'Cobertura sintética para staging; no confirma disponibilidad.', 'published', now()
from public.services s
where s.slug = 'internet-test'
on conflict (service_id, zone_name, technology) do update set
  availability = excluded.availability,
  public_notes = excluded.public_notes,
  status = excluded.status,
  published_at = excluded.published_at;

insert into public.service_alerts (service, title, detail, status, starts_at, ends_at, published, published_at)
select 'energia-test', 'Alerta TEST activa', 'Alerta sintética para validar el selector de estados en staging.', 'maintenance', now() - interval '5 minutes', now() + interval '1 hour', true, now()
where not exists (select 1 from public.service_alerts a where a.title = 'Alerta TEST activa');

insert into public.service_address_coverage (street_normalized, street_number, plan_name, technology, speed_down_mbps, source_updated_at)
values
  ('TEST', 100, 'Plan TEST sin precio', 'TEST', null, current_date),
  ('TEST', 200, 'Plan TEST sin precio', 'TEST', null, current_date),
  ('TEST', 300, 'Plan TEST sin precio', 'TEST', null, current_date),
  ('TEST', 400, 'Plan TEST sin precio', 'TEST', null, current_date),
  ('TEST', 500, 'Plan TEST sin precio', 'TEST', null, current_date),
  ('TEST', 999, 'Plan TEST sin precio', 'TEST', null, current_date)
on conflict (street_normalized, street_number, plan_name) do update set
  technology = excluded.technology,
  speed_down_mbps = excluded.speed_down_mbps,
  source_updated_at = excluded.source_updated_at;

update public.service_address_coverage
set coverage_status = case street_number
  when 100 then 'available'
  when 200 then 'nearby'
  when 300 then 'planned'
  when 400 then 'unavailable'
  else 'unknown'
end,
plan_slug = 'plan-test-sin-precio'
where street_normalized = 'TEST';
