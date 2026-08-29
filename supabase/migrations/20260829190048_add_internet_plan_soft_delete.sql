-- Fase 4G.2.8: retain plan lifecycle history while removing retired drafts
-- from every catalog surface. This migration is additive and never deletes
-- commercial records.
alter table public.internet_plans
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;

create index if not exists internet_plans_active_catalog_idx
  on public.internet_plans (status, audience, sort_order)
  where deleted_at is null;

drop policy if exists "published plans are public" on public.internet_plans;
create policy "published plans are public" on public.internet_plans
  for select to anon, authenticated
  using (status = 'published' and published_at <= now() and deleted_at is null);

alter table public.internet_plan_admin_audit
  drop constraint if exists internet_plan_admin_audit_action_check;

alter table public.internet_plan_admin_audit
  add constraint internet_plan_admin_audit_action_check
  check (action in ('created', 'updated', 'published', 'archived', 'deleted'));

comment on column public.internet_plans.deleted_at is
  'Soft-delete timestamp. Deleted plans remain retained for private audit only.';
comment on column public.internet_plans.deleted_by is
  'Administrative actor that soft-deleted the plan.';
