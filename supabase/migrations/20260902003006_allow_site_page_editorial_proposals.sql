-- Fase 4G.7.2A: site_page is editorial-copy-only; it never grants publication.
alter table public.content_editorial_proposals
  drop constraint if exists content_editorial_proposals_entity_type_check;

alter table public.content_editorial_proposals
  add constraint content_editorial_proposals_entity_type_check
  check (entity_type in ('service', 'help_article', 'faq', 'internet_plan', 'contact_channel', 'site_page'));
