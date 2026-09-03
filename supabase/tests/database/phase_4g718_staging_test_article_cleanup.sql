begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

-- The fixture is seeded after migrations locally. Reapply the exact migration
-- predicate inside this transaction to verify the staging cleanup semantics.
select is(
  (select status from public.help_articles where slug = 'articulo-test-staging'),
  'published',
  'the synthetic staging article begins published in the local fixture'
);

insert into public.help_articles (slug, title, category, summary, content, status, published_at)
values
  ('energia-estimar-consumo-real-test', 'Artículo real de energía', 'ENERGIA', 'Resumen', 'Contenido', 'published', now()),
  ('otro-articulo-test-staging', 'Artículo TEST de staging', 'TEST', 'Resumen', 'Contenido', 'published', now());

update public.help_articles
set
  status = 'archived',
  updated_at = now()
where slug = 'articulo-test-staging'
  and category = 'TEST'
  and title = 'Artículo TEST de staging'
  and status = 'published';

select is(
  (select status from public.help_articles where slug = 'articulo-test-staging'),
  'archived',
  'only the exact synthetic article is archived'
);
select is(
  (select status from public.help_articles where slug = 'energia-estimar-consumo-real-test'),
  'published',
  'a real article remains published'
);
select is(
  (select status from public.help_articles where slug = 'otro-articulo-test-staging'),
  'published',
  'a TEST article with another slug remains published'
);
select is(
  (select count(*)::integer from public.help_articles where slug = 'articulo-test-staging' and status = 'published' and published_at <= now()),
  0,
  'the archived article no longer satisfies published-only reads'
);
select is(
  (select count(*)::integer from public.help_articles where slug = 'articulo-test-staging' and published_at is not null),
  1,
  'the historical published_at value is preserved'
);

select * from finish();
rollback;
