begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

-- Isolated fixtures: no real contacts or addresses are used in disposable DB tests.
insert into public.user_journeys (journey_id, session_id)
values ('JRN-2026-3B7E5701', 'SES-3B7E570100000001');
insert into public.internet_requests (
  request_number, journey_id, session_id, request_type, customer_type, full_name, phone, email,
  address, street, street_number, zone, coverage_status, consent, contact_consent_at, status
) values
  ('NET-2026-3B7E5701', 'JRN-2026-3B7E5701', 'SES-3B7E570100000001', 'installation', 'hogar', 'Persona Test 1', '2974000001', 'test1@coopsar.local', 'CALLE TEST 100', 'CALLE TEST', 100, 'ZONA TEST', 'unknown', true, now(), 'new'),
  ('NET-2026-3B7E5702', 'JRN-2026-3B7E5701', 'SES-3B7E570100000001', 'fiber_waitlist', 'hogar', 'Persona Test 2', '2974000002', null, 'CALLE TEST 200', 'CALLE TEST', 200, 'ZONA TEST', 'unknown', true, now(), 'waiting_coverage'),
  ('NET-2026-3B7E5703', 'JRN-2026-3B7E5701', 'SES-3B7E570100000001', 'fiber_waitlist', 'hogar', 'Persona Test 3', '2974000003', null, 'CALLE TEST 300', 'CALLE TEST', 300, 'ZONA TEST', 'unknown', true, now(), 'waiting_coverage');

set local role anon;
select throws_ok($$ select count(*) from public.internet_requests where request_type = 'fiber_waitlist' $$, '42501', 'permission denied for table internet_requests', 'anon cannot read fiber waitlist');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"email":"admin-test@coopsar.local","role":"authenticated"}', true);
select throws_ok($$ select count(*) from public.internet_requests $$, '42501', 'permission denied for table internet_requests', 'authorized admin has no direct browser access to commercial leads');
reset role;

set local role service_role;
select is((select count(*)::integer from public.internet_requests where request_type = 'fiber_waitlist' and zone = 'ZONA TEST'), 2, 'server-only inbox can read fiber waitlist');
select lives_ok($$ update public.internet_requests set status = 'contacted' where request_number = 'NET-2026-3B7E5701' $$, 'server-only inbox can change an existing commercial status');
select is((select status from public.internet_requests where request_number = 'NET-2026-3B7E5701'), 'contacted', 'commercial status change persists');
select throws_ok($$ update public.internet_requests set status = 'invalid_status' where request_number = 'NET-2026-3B7E5701' $$, '23514', null, 'invalid commercial status is rejected by the existing constraint');
select is((select count(*)::integer from (select street from public.internet_requests where request_type = 'fiber_waitlist' and street is not null group by street having count(*) >= 2) grouped), 1, 'fiber demand can be aggregated without selecting contact fields');
reset role;
set local role anon;
select throws_ok($$ select count(*) from public.integration_outbox $$, '42501', 'permission denied for table integration_outbox', 'browser role cannot read integration outbox');
reset role;

select * from finish();
rollback;
