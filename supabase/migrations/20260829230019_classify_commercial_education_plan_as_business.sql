-- Staging catalog governance: this explicit commercial/educational draft
-- belongs to the business audience. No price, speed, status, or technology
-- is changed. The WHERE clause keeps the change additive and idempotent.
update public.internet_plans
set audience = 'business'
where slug = 'ftth-comercial-y-educacional-50-mb'
  and audience is null
  and status = 'draft'
  and deleted_at is null;
