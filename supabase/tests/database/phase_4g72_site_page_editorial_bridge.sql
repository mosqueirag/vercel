begin;
create extension if not exists pgtap with schema extensions;
select plan(3);
select lives_ok($$ insert into public.content_editorial_proposals (entity_type, entity_id, source_hash, prompt_version, proposal) values ('site_page', gen_random_uuid(), repeat('a', 64), 'pgtap-site-page', '{}'::jsonb) $$, 'site_page editorial proposals are accepted');
select throws_ok($$ insert into public.content_editorial_proposals (entity_type, entity_id, source_hash, prompt_version, proposal) values ('unsupported', gen_random_uuid(), repeat('b', 64), 'pgtap-site-page', '{}'::jsonb) $$, '23514', null, 'unsupported editorial entity types remain rejected');
set local role anon;
select throws_ok($$ select * from public.content_editorial_proposals where entity_type = 'site_page' $$, '42501', null, 'proposal rows remain private from anon');
select * from finish();
rollback;
