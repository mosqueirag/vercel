begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

-- Fixtures are inserted as the database owner and rolled back at the end.
insert into public.news_admins (email) values ('admin-test@coopsar.local');
insert into public.services (id, slug, name, description, status)
values
  ('10000000-0000-0000-0000-000000000001', 'energia-test', 'Energía test', 'Servicio de prueba', 'published'),
  ('10000000-0000-0000-0000-000000000002', 'borrador-test', 'Borrador test', 'Servicio privado', 'draft');
insert into public.service_alerts (service, title, detail, status, published, published_at)
values
  ('energia-test', 'Alerta visible', 'Detalle público', 'maintenance', true, now()),
  ('energia-test', 'Alerta privada', 'Detalle privado', 'unknown', false, null);
insert into public.news_articles (slug, title, category, excerpt, lead, content, status, published_at)
values
  ('noticia-publica-test', 'Noticia pública', 'Test', 'Resumen', 'Entrada', 'Contenido', 'published', now()),
  ('noticia-borrador-test', 'Noticia borrador', 'Test', 'Resumen', 'Entrada', 'Contenido', 'draft', null);
insert into public.service_address_coverage (street_normalized, street_number, plan_name, technology)
values ('CALLE TEST', 100, 'Plan interno', 'fibra');

set local role anon;
select is((select count(*)::integer from public.services where slug like '%-test'), 1, 'anon reads only published services');
select is((select count(*)::integer from public.service_alerts where title like 'Alerta %'), 1, 'anon reads only active published alerts');
select is((select count(*)::integer from public.news_articles where slug like '%-test'), 1, 'anon reads only published news');
select throws_ok(
  $$ select count(*) from public.internet_requests $$,
  '42501',
  'permission denied for table internet_requests',
  'anon cannot read commercial requests'
);
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
