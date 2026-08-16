alter table public.service_address_coverage alter column plan_name drop not null;
create unique index if not exists service_address_coverage_address_technology_key on public.service_address_coverage (street_normalized, street_number, technology);
