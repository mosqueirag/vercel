-- Fase 4G.2.3: private, additive audit for explicit Internet plan operations.
-- It does not publish, edit or delete any plan.
create table if not exists public.internet_plan_admin_audit (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.internet_plans(id) on delete cascade,
  action text not null check (action in ('created', 'updated', 'published', 'archived')),
  actor_email text not null,
  created_at timestamptz not null default now()
);

create index if not exists internet_plan_admin_audit_plan_idx
  on public.internet_plan_admin_audit (plan_id, created_at desc);

alter table public.internet_plan_admin_audit enable row level security;
revoke all on public.internet_plan_admin_audit from anon, authenticated;
grant all on public.internet_plan_admin_audit to service_role;

comment on table public.internet_plan_admin_audit is
  'Private administrative trace for Internet offer lifecycle; does not contain commercial request PII.';
