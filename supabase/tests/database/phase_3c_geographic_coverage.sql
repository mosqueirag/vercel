begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

insert into public.coverage_zones (zone_name, availability, status, source_layer, source_version, technologies, geometry, active)
values
  ('TEST FTTH', 'evaluation', 'draft', 'TEST FTTH', 'test-ftth-v1', array['FTTH'], extensions.st_multi(extensions.st_geomfromtext('POLYGON((0 0, 2 0, 2 2, 0 0))', 4326)), true),
  ('TEST ADSL', 'evaluation', 'draft', 'TEST ADSL', 'test-adsl-v1', array['ADSL'], extensions.st_multi(extensions.st_geomfromtext('POLYGON((3 0, 5 0, 5 2, 3 0))', 4326)), true),
  ('TEST URBANO', 'evaluation', 'draft', 'TEST URBANO', 'test-urbano-v1', array['ADSL','WIRELESS'], extensions.st_multi(extensions.st_geomfromtext('POLYGON((6 0, 8 0, 8 2, 6 0))', 4326)), true);

select is((select count(*)::integer from public.coverage_zones where source_layer like 'TEST %'), 3, 'test fixtures use three non-sensitive zones');
select is((select extensions.st_srid(geometry) from public.coverage_zones where source_layer = 'TEST FTTH'), 4326, 'zone geometry uses WGS84 SRID');
select ok((select extensions.st_covers(geometry, extensions.st_setsrid(extensions.st_makepoint(1, 1), 4326)) from public.coverage_zones where source_layer = 'TEST FTTH'), 'PostGIS includes an FTTH point');
select ok((select extensions.st_covers(geometry, extensions.st_setsrid(extensions.st_makepoint(3, 0), 4326)) from public.coverage_zones where source_layer = 'TEST ADSL'), 'PostGIS includes a boundary point');
select is((select count(*)::integer from public.resolve_coverage_zones(1, 1)), 1, 'server resolver returns matching FTTH zone');
select is((select count(*)::integer from public.resolve_coverage_zones(4, 1)), 1, 'server resolver returns matching ADSL zone');
select is((select technologies from public.resolve_coverage_zones(7, 1)), array['ADSL','WIRELESS']::text[], 'server resolver returns multiple approved technologies');
select is((select count(*)::integer from public.resolve_coverage_zones(20, 20)), 0, 'server resolver returns no match outside zones');
select lives_ok(
  $$ select public.upsert_geographic_coverage_zone('TEST IMPORT', 'Test import', array['FTTH'], '{"type":"Polygon","coordinates":[[[9,0],[10,0],[10,1],[9,0]]]}'::jsonb, 'test.geojson', 'test-import-v1') $$,
  'service importer accepts a valid Polygon and converts it to MultiPolygon'
);
select lives_ok(
  $$ select public.upsert_geographic_coverage_zone('TEST IMPORT', 'Test import v2', array['ADSL'], '{"type":"Polygon","coordinates":[[[9,0],[10,0],[10,1],[9,0]]]}'::jsonb, 'test.geojson', 'test-import-v2') $$,
  'service importer accepts a future source version'
);
select is(
  (select count(*)::integer from public.coverage_zones where source_layer = 'TEST IMPORT' and active),
  1,
  'only one version of a source layer remains active'
);
select throws_ok(
  $$ insert into public.coverage_zones (zone_name, availability, status, source_layer, source_version, technologies, active) values ('BAD TECH', 'evaluation', 'draft', 'BAD TECH', 'bad-v1', array['SATELLITE'], true) $$,
  '23514', null, 'unsupported geographic technology is rejected'
);

set local role anon;
select throws_ok($$ select count(*) from public.coverage_zones $$, '42501', 'permission denied for table coverage_zones', 'anon cannot select coverage zones');
select throws_ok($$ select * from public.resolve_coverage_zones(1, 1) $$, '42501', 'permission denied for function resolve_coverage_zones', 'anon cannot resolve coverage zones directly');
reset role;
set local role authenticated;
select throws_ok($$ select count(*) from public.coverage_zones $$, '42501', 'permission denied for table coverage_zones', 'authenticated cannot select coverage zones');
select throws_ok($$ select * from public.resolve_coverage_zones(1, 1) $$, '42501', 'permission denied for function resolve_coverage_zones', 'authenticated cannot resolve coverage zones directly');
reset role;
set local role service_role;
select lives_ok($$ select * from public.resolve_coverage_zones(1, 1) $$, 'service role can resolve geographic zones for the backend');

select * from finish();
rollback;
