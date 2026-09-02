begin;

create extension if not exists pgtap with schema extensions;
select plan(27);

delete from public.site_pages where slug in ('energia', 'internet', 'telefonia', 'sepelio', 'tramites', 'institucional', 'contacto');

insert into public.site_pages (id, slug, eyebrow, title, intro, items, status, sort_order)
values
  ('40000000-0000-0000-0000-000000000001', 'energia', 'Ayuda', 'Uno', 'Intro', '[]'::jsonb, 'draft', 901),
  ('40000000-0000-0000-0000-000000000002', 'internet', 'Ayuda', 'Dos', 'Intro', '[]'::jsonb, 'draft', 902),
  ('40000000-0000-0000-0000-000000000003', 'telefonia', 'Ayuda', 'Tres', 'Intro', '[]'::jsonb, 'draft', 903),
  ('40000000-0000-0000-0000-000000000004', 'sepelio', 'Ayuda', 'Cuatro', 'Intro', '[]'::jsonb, 'draft', 904),
  ('40000000-0000-0000-0000-000000000005', 'tramites', 'Ayuda', 'Cinco', 'Intro', '[]'::jsonb, 'draft', 905),
  ('40000000-0000-0000-0000-000000000006', 'institucional', 'Ayuda', 'Seis', 'Intro', '[]'::jsonb, 'published', 906),
  ('40000000-0000-0000-0000-000000000007', 'contacto', 'Ayuda', 'Siete', 'Intro', '[]'::jsonb, 'draft', 907);

insert into public.content_editorial_proposals (id, entity_type, entity_id, source_hash, prompt_version, proposal, risk_level, status)
values
  ('50000000-0000-0000-0000-000000000001', 'site_page', '40000000-0000-0000-0000-000000000001', repeat('a', 64), 'atomic-v1', '{}'::jsonb, 'low', 'applied'),
  ('50000000-0000-0000-0000-000000000002', 'site_page', '40000000-0000-0000-0000-000000000002', repeat('b', 64), 'atomic-v1', '{}'::jsonb, 'medium', 'applied'),
  ('50000000-0000-0000-0000-000000000003', 'site_page', '40000000-0000-0000-0000-000000000003', repeat('c', 64), 'atomic-v1', '{}'::jsonb, 'low', 'generated'),
  ('50000000-0000-0000-0000-000000000004', 'site_page', '40000000-0000-0000-0000-000000000004', repeat('d', 64), 'atomic-v1', '{}'::jsonb, 'low', 'applied'),
  ('50000000-0000-0000-0000-000000000005', 'site_page', '40000000-0000-0000-0000-000000000005', repeat('e', 64), 'atomic-v1', '{}'::jsonb, 'low', 'applied'),
  ('50000000-0000-0000-0000-000000000006', 'site_page', '40000000-0000-0000-0000-000000000006', repeat('f', 64), 'atomic-v1', '{}'::jsonb, 'low', 'applied'),
  ('50000000-0000-0000-0000-000000000007', 'site_page', '40000000-0000-0000-0000-000000000007', repeat('0', 64), 'atomic-v1', '{}'::jsonb, 'low', 'applied');

select ok(to_regprocedure('public.publish_site_page_editorial_proposal(uuid,uuid,text)') is not null, 'site page atomic publication RPC exists');
select ok(not (select prosecdef from pg_proc where oid = 'public.publish_site_page_editorial_proposal(uuid,uuid,text)'::regprocedure), 'site page publication RPC is security invoker');

set local role anon;
select ok(not has_function_privilege('public.publish_site_page_editorial_proposal(uuid,uuid,text)'::regprocedure, 'EXECUTE'), 'anon cannot execute site page publication RPC');
reset role;
set local role authenticated;
select ok(not has_function_privilege('public.publish_site_page_editorial_proposal(uuid,uuid,text)'::regprocedure, 'EXECUTE'), 'authenticated cannot execute site page publication RPC');
reset role;
set local role service_role;
select ok(has_function_privilege('public.publish_site_page_editorial_proposal(uuid,uuid,text)'::regprocedure, 'EXECUTE'), 'service role can execute site page publication RPC');
select lives_ok($$ select public.publish_site_page_editorial_proposal('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'editor@coopsar.test') $$, 'applied low-risk draft site page publishes atomically');
select is((select status from public.site_pages where id = '40000000-0000-0000-0000-000000000001'), 'published', 'only page status changes to published');
select is((select status from public.content_editorial_proposals where id = '50000000-0000-0000-0000-000000000001'), 'published', 'proposal becomes published');
select is((select count(*)::integer from public.content_editorial_proposal_audit where proposal_id = '50000000-0000-0000-0000-000000000001' and action = 'published'), 1, 'one published audit exists');
select lives_ok($$ select public.publish_site_page_editorial_proposal('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'editor@coopsar.test') $$, 'publication retry is idempotent');
select is((select count(*)::integer from public.content_editorial_proposal_audit where proposal_id = '50000000-0000-0000-0000-000000000001' and action = 'published'), 1, 'retry does not duplicate audit');
select throws_ok($$ select public.publish_site_page_editorial_proposal('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'editor@coopsar.test') $$, 'P0001', 'site_page_publication_risk_not_low', 'non-low risk is rejected');
select is((select status from public.site_pages where id = '40000000-0000-0000-0000-000000000002'), 'draft', 'risk rejection writes no page change');
select throws_ok($$ select public.publish_site_page_editorial_proposal('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 'editor@coopsar.test') $$, 'P0001', 'site_page_publication_proposal_not_applied', 'unapplied proposal is rejected');
select is((select status from public.site_pages where id = '40000000-0000-0000-0000-000000000003'), 'draft', 'unapplied rejection writes no page change');
select throws_ok($$ select public.publish_site_page_editorial_proposal('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000005', 'editor@coopsar.test') $$, 'P0001', 'site_page_publication_target_mismatch', 'incorrect target is rejected');
select is((select status from public.site_pages where id = '40000000-0000-0000-0000-000000000005'), 'draft', 'target mismatch writes no page change');
select throws_ok($$ select public.publish_site_page_editorial_proposal('50000000-0000-0000-0000-000000000099', '40000000-0000-0000-0000-000000000004', 'editor@coopsar.test') $$, 'P0001', 'site_page_publication_proposal_not_found', 'nonexistent proposal is rejected');
select throws_ok($$ select public.publish_site_page_editorial_proposal('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', 'editor@coopsar.test') $$, 'P0001', 'site_page_publication_page_not_draft', 'non-draft page is rejected');
select is((select status from public.content_editorial_proposals where id = '50000000-0000-0000-0000-000000000006'), 'applied', 'non-draft page rejection writes no proposal change');
reset role;

create function public.pgtap_fail_site_page_publication_audit() returns trigger language plpgsql as $$ begin raise exception 'forced audit failure' using errcode = 'P0001'; end $$;
create trigger pgtap_fail_site_page_publication_audit before insert on public.content_editorial_proposal_audit for each row when (new.proposal_id = '50000000-0000-0000-0000-000000000005'::uuid) execute function public.pgtap_fail_site_page_publication_audit();
set local role service_role;
select throws_ok($$ select public.publish_site_page_editorial_proposal('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', 'editor@coopsar.test') $$, 'P0001', 'forced audit failure', 'audit failure aborts publication transaction');
select is((select status from public.site_pages where id = '40000000-0000-0000-0000-000000000005'), 'draft', 'audit failure rolls page back');
select is((select status from public.content_editorial_proposals where id = '50000000-0000-0000-0000-000000000005'), 'applied', 'audit failure rolls proposal back');
select is((select count(*)::integer from public.content_editorial_proposal_audit where proposal_id = '50000000-0000-0000-0000-000000000005'), 0, 'audit failure leaves no audit row');
reset role;
drop trigger pgtap_fail_site_page_publication_audit on public.content_editorial_proposal_audit;
create function public.pgtap_fail_site_page_publication_proposal() returns trigger language plpgsql as $$ begin raise exception 'forced proposal failure' using errcode = 'P0001'; end $$;
create trigger pgtap_fail_site_page_publication_proposal before update on public.content_editorial_proposals for each row when (new.id = '50000000-0000-0000-0000-000000000007'::uuid) execute function public.pgtap_fail_site_page_publication_proposal();
set local role service_role;
select throws_ok($$ select public.publish_site_page_editorial_proposal('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', 'editor@coopsar.test') $$, 'P0001', 'forced proposal failure', 'proposal update failure aborts publication transaction');
select is((select status from public.site_pages where id = '40000000-0000-0000-0000-000000000007'), 'draft', 'proposal failure rolls page back');
select is((select count(*)::integer from public.content_editorial_proposal_audit where proposal_id = '50000000-0000-0000-0000-000000000007'), 0, 'proposal failure leaves no audit row');
reset role;

select * from finish();
rollback;
