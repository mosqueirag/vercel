-- Fase 4G.2.8.1: correct an inverted staging-only catalogue reconciliation.
-- This is additive, slug-based and idempotent. It never deletes rows, never
-- touches published plans, and only restores the two records archived by the
-- preceding catalog reconciliation actor.

alter table public.internet_plan_admin_audit
  drop constraint if exists internet_plan_admin_audit_action_check;

alter table public.internet_plan_admin_audit
  add constraint internet_plan_admin_audit_action_check
  check (action in ('created', 'updated', 'published', 'archived', 'deleted', 'restored'));

with restored_home_50 as (
  update public.internet_plans
  set
    name = 'PLAN HOGAR 50 MB',
    audience = 'home',
    technology = 'FTTH',
    speed_down_mbps = 50,
    price_amount = 32279.41,
    currency = 'ARS',
    status = 'draft',
    published_at = null,
    deleted_at = null,
    deleted_by = null
  where slug = 'plan-hogar-50-mb'
    and status <> 'published'
    and deleted_by = 'catalog-reconciliation@coopsar-staging.local'
    and (
      status is distinct from 'draft'
      or deleted_at is not null
      or name is distinct from 'PLAN HOGAR 50 MB'
      or audience is distinct from 'home'
      or technology is distinct from 'FTTH'
      or speed_down_mbps is distinct from 50
      or price_amount is distinct from 32279.41
      or currency is distinct from 'ARS'
    )
  returning id
), restored_wireless_20 as (
  update public.internet_plans
  set
    name = 'INALAMBRICO 20 MB',
    audience = 'home',
    technology = 'WIRELESS',
    speed_down_mbps = 20,
    price_amount = 27480.55,
    currency = 'ARS',
    status = 'draft',
    published_at = null,
    deleted_at = null,
    deleted_by = null
  where slug = 'inalambrico-20-mb'
    and status <> 'published'
    and deleted_by = 'catalog-reconciliation@coopsar-staging.local'
    and (
      status is distinct from 'draft'
      or deleted_at is not null
      or name is distinct from 'INALAMBRICO 20 MB'
      or audience is distinct from 'home'
      or technology is distinct from 'WIRELESS'
      or speed_down_mbps is distinct from 20
      or price_amount is distinct from 27480.55
      or currency is distinct from 'ARS'
    )
  returning id
), retired_home_50_legacy as (
  update public.internet_plans
  set
    status = 'archived',
    published_at = null,
    deleted_at = now(),
    deleted_by = 'catalog-correction-4g28@coopsar-staging.local'
  where slug = 'hogar-50-megas-legacy'
    and status <> 'published'
    and deleted_at is null
  returning id
), retired_wireless_20_legacy as (
  update public.internet_plans
  set
    status = 'archived',
    published_at = null,
    deleted_at = now(),
    deleted_by = 'catalog-correction-4g28@coopsar-staging.local'
  where slug = 'inalambrico-20-megas-legacy'
    and status <> 'published'
    and deleted_at is null
  returning id, 'deleted'::text as action
), audit_rows as (
  select id, 'restored'::text as action from restored_home_50
  union all
  select id, 'restored'::text as action from restored_wireless_20
  union all
  select id, 'deleted'::text as action from retired_home_50_legacy
  union all
  select id, action from retired_wireless_20_legacy
)
insert into public.internet_plan_admin_audit (plan_id, action, actor_email)
select id, action, 'catalog-correction-4g28@coopsar-staging.local'
from audit_rows;

comment on constraint internet_plan_admin_audit_action_check on public.internet_plan_admin_audit is
  'Administrative lifecycle actions, including idempotent corrections that restore a previously soft-deleted draft.';
