begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

set local role service_role;
select lives_ok($$ select * from public.create_funeral_family_update_request('SEP-2026-4A310001', 'JRN-2026-4A310001', 'SES-4A3100010000001', 'TEST-1', 'Persona Titular', '12345678', '2974000001', 'test@coopsar.local', true, 'test', 'test-funeral-dedupe', '[{"full_name":"Integrante Test","dni":"23456789","birth_date":"1990-01-01","relationship":"other"}]'::jsonb) $$, 'service role can create a private request atomically');
select is((select count(*)::integer from public.funeral_family_update_requests where request_number = 'SEP-2026-4A310001'), 1, 'request is persisted once');
select is((select count(*)::integer from public.funeral_family_update_members), 1, 'member is persisted with request');
select is((select count(*)::integer from public.funeral_family_update_audit where action = 'created'), 1, 'creation audit is recorded');
select is((select created from public.create_funeral_family_update_request('SEP-2026-4A310002', 'JRN-2026-4A310001', 'SES-4A3100010000001', 'TEST-1', 'Persona Titular', '12345678', '2974000001', 'test@coopsar.local', true, 'test', 'test-funeral-dedupe', '[{"full_name":"Integrante Test","dni":"23456789","birth_date":"1990-01-01","relationship":"other"}]'::jsonb)), false, 'deduplication reuses existing request without adding PII rows');
reset role;
set local role anon;
select throws_ok($$ select count(*) from public.funeral_family_update_requests $$, '42501', 'permission denied for table funeral_family_update_requests', 'anon cannot read private requests');
select throws_ok($$ select count(*) from public.funeral_family_update_members $$, '42501', 'permission denied for table funeral_family_update_members', 'anon cannot read private family members');
select throws_ok($$ select count(*) from public.funeral_family_update_audit $$, '42501', 'permission denied for table funeral_family_update_audit', 'anon cannot read private audit');
reset role;
select * from finish();
rollback;
