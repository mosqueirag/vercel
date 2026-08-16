-- Official imports may arrive with an unknown audience. Keep those rows in
-- draft, but make an audience mandatory before any public publication.
alter table public.internet_plans alter column audience drop not null;

do $$
declare existing_constraint text;
begin
  select c.conname into existing_constraint
  from pg_constraint c
  where c.conrelid = 'public.internet_plans'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) like '%audience%'
  limit 1;
  if existing_constraint is not null then
    execute format('alter table public.internet_plans drop constraint %I', existing_constraint);
  end if;
end $$;

alter table public.internet_plans
  add constraint internet_plans_audience_check
  check (audience is null or audience in ('home', 'business', 'enterprise', 'all'));

alter table public.internet_plans
  add constraint internet_plans_published_audience_check
  check (status <> 'published' or audience is not null);
