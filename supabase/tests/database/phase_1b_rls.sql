begin;

create extension if not exists pgtap with schema extensions;
select plan(23);

-- Fixtures are inserted as the database owner and rolled back at the end.
insert into public.news_admins (email) values ('admin-test@coopsar.local');
insert into public.services (id, slug, name, description, status)
values
  ('10000000-0000-0000-0000-000000000001', 'pgtap-energia', 'Energía test', 'Servicio de prueba', 'published'),
  ('10000000-0000-0000-0000-000000000002', 'pgtap-borrador', 'Borrador test', 'Servicio privado', 'draft');
insert into public.service_alerts (service, title, detail, status, published, published_at)
values
  ('pgtap-energia', 'Alerta pgTAP visible', 'Detalle público', 'maintenance', true, now()),
  ('pgtap-energia', 'Alerta pgTAP privada', 'Detalle privado', 'unknown', false, null);
insert into public.news_articles (slug, title, category, excerpt, lead, content, status, published_at)
values
  ('noticia-publica-test', 'Noticia pública', 'Test', 'Resumen', 'Entrada', 'Contenido', 'published', now()),
  ('noticia-borrador-test', 'Noticia borrador', 'Test', 'Resumen', 'Entrada', 'Contenido', 'draft', null);
insert into public.service_address_coverage (street_normalized, street_number, plan_name, technology)
values ('CALLE TEST', 100, 'Plan interno', 'fibra');
insert into public.help_articles (slug, title, category, content, status, published_at) values
  ('ayuda-publica-test', 'Ayuda pública', 'Test', 'Contenido', 'published', now()),
  ('ayuda-borrador-test', 'Ayuda borrador', 'Test', 'Contenido', 'draft', null);
insert into public.faqs (question, answer, category, status, published_at) values
  ('¿Pregunta pública?', 'Respuesta', 'Test', 'published', now()),
  ('¿Pregunta borrador?', 'Respuesta', 'Test', 'draft', null);
insert into public.internet_plans (slug, name, audience, status, published_at) values
  ('plan-publico-test', 'Plan público', 'home', 'published', now()),
  ('plan-borrador-test', 'Plan borrador', 'home', 'draft', null);
insert into public.coverage_zones (service_id, zone_name, availability, status, published_at) values
  ('10000000-0000-0000-0000-000000000001', 'Zona pública test', 'available', 'published', now()),
  ('10000000-0000-0000-0000-000000000001', 'Zona borrador test', 'unconfirmed', 'draft', null);
insert into public.public_contact_channels (service, channel_type, label, value, public_value, purpose, status, published_at) values
  ('internet', 'whatsapp', 'Contacto público test', '5490000000001', 'Canal público test', 'support', 'published', now()),
  ('internet', 'phone', 'Contacto borrador test', '2974000000', 'Canal borrador test', 'support', 'draft', null);

set local role anon;
select is((select count(*)::integer from public.services where slug like 'pgtap-%'), 1, 'anon reads only published services');
select is((select count(*)::integer from public.service_alerts where title like 'Alerta pgTAP %'), 1, 'anon reads only active published alerts');
select is((select count(*)::integer from public.news_articles where slug like '%-test'), 1, 'anon reads only published news');
select is((select count(*)::integer from public.help_articles where slug like '%-test'), 1, 'anon reads only published help articles');
select is((select count(*)::integer from public.faqs where category = 'Test'), 1, 'anon reads only published FAQs');
select is((select count(*)::integer from public.internet_plans where slug like '%-test'), 1, 'anon reads only published plans');
select is((select count(*)::integer from public.coverage_zones where zone_name like '%test'), 1, 'anon reads only published coverage zones');
select is((select count(*)::integer from public.public_contact_channels where label like 'Contacto % test'), 1, 'anon reads only published public contacts');
select throws_ok(
  $$ select count(*) from public.internet_requests $$,
  '42501',
  'permission denied for table internet_requests',
  'anon cannot read commercial requests'
);
select throws_ok($$ select count(*) from public.user_journeys $$, '42501', 'permission denied for table user_journeys', 'anon cannot read journeys');
select throws_ok($$ select count(*) from public.journey_events $$, '42501', 'permission denied for table journey_events', 'anon cannot read journey events');
select throws_ok($$ select count(*) from public.service_requests $$, '42501', 'permission denied for table service_requests', 'anon cannot read service requests');
select throws_ok(
  $$ select count(*) from public.service_address_coverage $$,
  '42501',
  'permission denied for table service_address_coverage',
  'anon cannot read address-level coverage'
);
select throws_ok(
  $$ insert into public.internet_requests
     (request_number, customer_type, full_name, phone, email, address, zone, consent)
     values ('NET-2026-AAAAAAAA', 'hogar', 'Persona Test', '2974000000', 'anon@test.local', 'Calle 1', '', true) $$,
  '42501',
  'permission denied for table internet_requests',
  'anon cannot insert commercial requests directly'
);

reset role;
set local role service_role;
select lives_ok(
  $$ insert into public.internet_requests
     (request_number, customer_type, full_name, phone, email, address, zone, consent)
     values ('NET-2026-BBBBBBBB', 'hogar', 'Persona Servidor', '2974000001', 'server@test.local', 'Calle 2', '', true) $$,
  'server can insert an internet request'
);
select is((select count(*)::integer from public.internet_requests where request_number = 'NET-2026-BBBBBBBB'), 1, 'server can read its inserted request');

reset role;
set local role authenticated;
select throws_ok($$ select count(*) from public.user_journeys $$, '42501', 'permission denied for table user_journeys', 'authenticated cannot read journeys');
select throws_ok($$ select count(*) from public.journey_events $$, '42501', 'permission denied for table journey_events', 'authenticated cannot read journey events');
select throws_ok($$ select count(*) from public.service_requests $$, '42501', 'permission denied for table service_requests', 'authenticated cannot read service requests');
select set_config('request.jwt.claims', '{"email":"admin-test@coopsar.local","role":"authenticated"}', true);
select lives_ok(
  $$ insert into public.news_articles
     (slug, title, category, excerpt, lead, content, status)
     values ('noticia-admin-test', 'Creada por admin', 'Test', 'Resumen', 'Entrada', 'Contenido', 'draft') $$,
  'authorized admin can create draft news'
);
select is((select count(*)::integer from public.news_articles where slug = 'noticia-admin-test'), 1, 'authorized admin can read draft news');

select set_config('request.jwt.claims', '{"email":"no-autorizado@coopsar.local","role":"authenticated"}', true);
select throws_ok(
  $$ insert into public.news_articles
     (slug, title, category, excerpt, lead, content, status)
     values ('noticia-no-autorizada-test', 'No permitida', 'Test', 'Resumen', 'Entrada', 'Contenido', 'draft') $$,
  '42501',
  'new row violates row-level security policy for table "news_articles"',
  'unauthorized authenticated user cannot create news'
);
select is((select count(*)::integer from public.news_articles where slug = 'noticia-borrador-test'), 0, 'unauthorized user cannot read draft news');

select * from finish();
rollback;
