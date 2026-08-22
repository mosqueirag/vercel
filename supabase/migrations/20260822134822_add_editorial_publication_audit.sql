-- Fase 4E.2: amplía la auditoría privada. No publica ni modifica contenido.
alter table public.content_editorial_proposal_audit
  drop constraint if exists content_editorial_proposal_audit_action_check;

alter table public.content_editorial_proposal_audit
  add constraint content_editorial_proposal_audit_action_check
  check (action in ('approved', 'rejected', 'needs_validation', 'applied', 'stale', 'published', 'publication_blocked'));

comment on column public.content_editorial_proposal_audit.action is
  'Human editorial decision or controlled publication gate result. No content body is stored.';
