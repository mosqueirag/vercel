-- Removes one synthetic staging fixture from public consumers without deleting it.
-- The predicate deliberately identifies the exact QA artifact only.
update public.help_articles
set
  status = 'archived',
  updated_at = now()
where slug = 'articulo-test-staging'
  and category = 'TEST'
  and title = 'Artículo TEST de staging'
  and status = 'published';
