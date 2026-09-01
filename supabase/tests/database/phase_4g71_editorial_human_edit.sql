begin;

create extension if not exists pgtap with schema extensions;
select plan(29);

insert into public.help_articles (id, slug, title, category, summary, content, status, published_at)
values (
  '11111111-1111-1111-1111-111111111111',
  'test-editorial-human-edit',
  'T00',
  'test',
  'S0',
  'C0',
  'draft',
  null
);

insert into public.content_editorial_proposals (
  id, entity_type, entity_id, source_hash, prompt_version, proposal, status
) values (
  '22222222-2222-2222-2222-222222222222',
  'help_article',
  '11111111-1111-1111-1111-111111111111',
  repeat('a', 64),
  'test-v1',
  '{"initial":"P0"}'::jsonb,
  'applied'
), (
  '33333333-3333-3333-3333-333333333333',
  'help_article',
  '11111111-1111-1111-1111-111111111111',
  repeat('b', 64),
  'test-v1',
  '{"initial":"invalid"}'::jsonb,
  'generated'
);

select ok(
  to_regprocedure('public.apply_editorial_human_edit(uuid,text,text,text,text,text,text)') is not null,
  'human edit RPC exists'
);
select ok(
  not (select prosecdef from pg_proc where oid = 'public.apply_editorial_human_edit(uuid,text,text,text,text,text,text)'::regprocedure),
  'human edit RPC is security invoker'
);

set local role service_role;
select ok(
  has_function_privilege(
    'public.apply_editorial_human_edit(uuid,text,text,text,text,text,text)'::regprocedure,
    'EXECUTE'
  ),
  'service_role can execute the human edit RPC'
);
reset role;

set local role anon;
select ok(
  not has_function_privilege(
    'public.apply_editorial_human_edit(uuid,text,text,text,text,text,text)'::regprocedure,
    'EXECUTE'
  ),
  'anon cannot execute the human edit RPC'
);
reset role;

set local role authenticated;
select ok(
  not has_function_privilege(
    'public.apply_editorial_human_edit(uuid,text,text,text,text,text,text)'::regprocedure,
    'EXECUTE'
  ),
  'authenticated cannot execute the human edit RPC'
);
reset role;

set local role service_role;
select lives_ok(
  $$ select public.apply_editorial_human_edit(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'editor@coopsar.test',
    'T11',
    'S1',
    'C1',
    'before-hash',
    'after-hash'
  ) $$,
  'human_edited is allowed for an applied proposal and draft article'
);
select is((select title from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), 'T11', 'success path updates article title');
select is((select summary from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), 'S1', 'success path updates article summary');
select is((select content from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), 'C1', 'success path updates article content');
select is((select proposal ->> 'rewritten_title' from public.content_editorial_proposals where id = '22222222-2222-2222-2222-222222222222'), 'T11', 'success path updates proposal JSON');
select is((select count(*)::integer from public.content_editorial_proposal_audit where proposal_id = '22222222-2222-2222-2222-222222222222' and action = 'human_edited'), 1, 'success path writes one human_edited audit');
select is((select status from public.content_editorial_proposals where id = '22222222-2222-2222-2222-222222222222'), 'applied', 'proposal remains applied');
select is((select status from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), 'draft', 'article remains draft');
select ok((select published_at is null from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), 'article remains unpublished');

create temporary table editorial_human_edit_snapshot as
select
  ha.updated_at as article_updated_at,
  cep.updated_at as proposal_updated_at
from public.help_articles ha
join public.content_editorial_proposals cep on cep.entity_id = ha.id
where cep.id = '22222222-2222-2222-2222-222222222222';

select lives_ok(
  $$ select public.apply_editorial_human_edit(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'editor@coopsar.test',
    'T11', 'S1', 'C1', 'same-before-hash', 'same-after-hash'
  ) $$,
  'no-op human edit is accepted without writing'
);
select is((select updated_at::text from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), (select article_updated_at::text from editorial_human_edit_snapshot), 'no-op preserves article updated_at');
select is((select updated_at::text from public.content_editorial_proposals where id = '22222222-2222-2222-2222-222222222222'), (select proposal_updated_at::text from editorial_human_edit_snapshot), 'no-op preserves proposal updated_at');
select is((select count(*)::integer from public.content_editorial_proposal_audit where proposal_id = '22222222-2222-2222-2222-222222222222' and action = 'human_edited'), 1, 'no-op does not insert another audit');
select lives_ok(
  $$ select public.apply_editorial_human_edit(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'editor@coopsar.test',
    'T11', 'S2', 'C2', 'partial-before-hash', 'partial-after-hash'
  ) $$,
  'real partial human edit is persisted'
);
select is((select summary from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), 'S2', 'partial edit updates only supplied summary');
select is((select content from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), 'C2', 'partial edit updates only supplied content');
select is((select (metadata -> 'changed_fields')::text from public.content_editorial_proposal_audit where proposal_id = '22222222-2222-2222-2222-222222222222' and metadata ->> 'before_hash' = 'partial-before-hash'), '["summary", "content"]', 'audit lists only fields that changed');
select throws_ok(
  $$ select public.apply_editorial_human_edit(
    '33333333-3333-3333-3333-333333333333'::uuid,
    'editor@coopsar.test',
    'invalid', 'invalid', 'invalid', 'before-hash', 'after-hash'
  ) $$,
  'P0001',
  'human_edit_not_allowed',
  'invalid proposal status is rejected'
);

-- A NULL actor violates the non-null audit column after the function has
-- attempted its three updates. Restore the literal T0/S0/C0/P0 baseline so
-- the rollback assertion demonstrates the complete before/after invariant.
update public.help_articles
set title = 'T00', summary = 'S0', content = 'C0'
where id = '11111111-1111-1111-1111-111111111111';
update public.content_editorial_proposals
set proposal = '{"initial":"P0"}'::jsonb
where id = '22222222-2222-2222-2222-222222222222';
delete from public.content_editorial_proposal_audit
where proposal_id = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  $$ select public.apply_editorial_human_edit(
    '22222222-2222-2222-2222-222222222222'::uuid,
    null,
    'T22', 'S2', 'C2', 'before-hash-2', 'after-hash-2'
  ) $$,
  '23502',
  null,
  'forced audit failure rejects the complete human edit transaction'
);
select is((select title from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), 'T00', 'rollback preserves T0 article title');
select is((select summary from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), 'S0', 'rollback preserves S0 article summary');
select is((select content from public.help_articles where id = '11111111-1111-1111-1111-111111111111'), 'C0', 'rollback preserves C0 article content');
select is((select proposal ->> 'initial' from public.content_editorial_proposals where id = '22222222-2222-2222-2222-222222222222'), 'P0', 'rollback preserves P0 proposal JSON');
select is((select count(*)::integer from public.content_editorial_proposal_audit where proposal_id = '22222222-2222-2222-2222-222222222222' and action = 'human_edited'), 0, 'rollback preserves N audit count');
reset role;

select * from finish();
rollback;
