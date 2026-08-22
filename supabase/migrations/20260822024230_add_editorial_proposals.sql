-- Fase 4E.1: propuestas editoriales privadas. Nunca publican ni reemplazan
-- contenido; el Centro de Gestión las revisa mediante un cliente server-side.
create table if not exists public.content_editorial_proposals (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('service', 'help_article', 'faq', 'internet_plan', 'contact_channel')),
  entity_id uuid not null,
  source_hash text not null check (source_hash ~ '^[a-f0-9]{64}$'),
  prompt_version text not null,
  proposal jsonb not null check (jsonb_typeof(proposal) = 'object'),
  detected_facts jsonb not null default '[]'::jsonb check (jsonb_typeof(detected_facts) = 'array'),
  validation_flags jsonb not null default '[]'::jsonb check (jsonb_typeof(validation_flags) = 'array'),
  risk_level text not null default 'low' check (risk_level in ('low', 'medium', 'high', 'restricted')),
  status text not null default 'generated' check (status in ('generated', 'needs_validation', 'approved', 'rejected', 'applied', 'stale')),
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, source_hash, prompt_version)
);

create index if not exists content_editorial_proposals_review_idx
  on public.content_editorial_proposals (status, risk_level, created_at desc);
create index if not exists content_editorial_proposals_entity_idx
  on public.content_editorial_proposals (entity_type, entity_id);

alter table public.content_editorial_proposals enable row level security;
revoke all on public.content_editorial_proposals from anon, authenticated;
grant all on public.content_editorial_proposals to service_role;

create trigger content_editorial_proposals_updated_at
before update on public.content_editorial_proposals
for each row execute function public.set_platform_updated_at();

comment on table public.content_editorial_proposals is
  'Private, reviewable AI editorial proposals. A proposal never publishes or changes a published record automatically.';
