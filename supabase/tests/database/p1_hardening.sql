begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

set local role service_role;
select ok(public.consume_rate_limit('test-limit', repeat('a', 64), 2, 60), 'first interaction is allowed');
select ok(public.consume_rate_limit('test-limit', repeat('a', 64), 2, 60), 'second interaction is allowed');
select isnt(public.consume_rate_limit('test-limit', repeat('a', 64), 2, 60), true, 'third interaction is blocked');
select ok(public.consume_rate_limit('custom-limit', repeat('b', 64), 4, 60), 'custom limit is accepted');

reset role;
set local role anon;
select throws_ok($$ select public.consume_rate_limit('x', repeat('c',64), 2, 60) $$, '42501', null, 'anon cannot call rate limiter RPC');
select throws_ok($$ select public.claim_integration_outbox(5) $$, '42501', null, 'anon cannot claim outbox events');
select throws_ok($$ select count(*) from public.integration_outbox $$, '42501', 'permission denied for table integration_outbox', 'anon cannot read outbox');

reset role;
insert into public.user_journeys (journey_id, session_id, entry_page) values ('JRN-2026-ABCDEF12', 'SES-ABCDEF1234567890', '/');
set local role service_role;
select lives_ok($$ select public.create_internet_request_with_outbox('NET-2026-CCCCCCCC','JRN-2026-ABCDEF12','SES-ABCDEF1234567890','hogar','Persona Test','2974000000','test@example.com','Calle 123','Centro','Plan test','Mañana',true,'web',repeat('d',64)) $$, 'server atomically creates lead and outbox');
select is((select journey_id from public.internet_requests where request_number='NET-2026-CCCCCCCC'), 'JRN-2026-ABCDEF12', 'lead keeps journey association');
select is((select count(*)::integer from public.integration_outbox where payload->>'requestNumber'='NET-2026-CCCCCCCC'), 1, 'outbox contains one minimal event');
select lives_ok($$ insert into public.service_requests (request_number,request_type,service,journey_id,session_id,full_name,phone,email,payload,consent) values ('SRV-2026-EEEEEEEE','ownership_change','general','JRN-2026-ABCDEF12','SES-ABCDEF1234567890','Persona Test','2974000000','test@example.com','{"accountNumber":"123","currentHolder":"Anterior","newHolder":"Nuevo"}',true) $$, 'service role creates a validated service request');
select is((select count(*)::integer from public.service_requests where request_number='SRV-2026-EEEEEEEE'), 1, 'service request is stored privately');
select * from finish();
rollback;
