-- Fase 4E.1: auditoría privada de decisiones editoriales. No modifica contenido.
create table public.content_editorial_proposal_audit (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.content_editorial_proposals(id) on delete cascade,
  action text not null check (action in ('approved', 'rejected', 'needs_validation', 'applied', 'stale')),
  actor_email text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index content_editorial_proposal_audit_proposal_idx on public.content_editorial_proposal_audit (proposal_id, created_at desc);
alter table public.content_editorial_proposal_audit enable row level security;
revoke all on public.content_editorial_proposal_audit from anon, authenticated;
grant all on public.content_editorial_proposal_audit to service_role;

comment on table public.content_editorial_proposal_audit is
  'Private audit trail for human editorial review. It never contains the original content or contact values.';
