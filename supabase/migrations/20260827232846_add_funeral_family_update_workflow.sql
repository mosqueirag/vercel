-- Fase 4G.3.1: solicitudes privadas de actualización de grupo familiar.
-- No publica contenido, no integra automatizaciones y no expone PII a roles de navegador.

create table public.funeral_family_update_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique check (request_number ~ '^SEP-[0-9]{4}-[A-F0-9]{8}$'),
  journey_id text,
  session_id text,
  member_number text not null check (length(btrim(member_number)) between 1 and 80),
  holder_full_name text not null check (length(btrim(holder_full_name)) between 3 and 120),
  holder_dni text not null check (holder_dni ~ '^[0-9]{7,8}$'),
  phone text not null check (length(btrim(phone)) between 8 and 30),
  email text,
  status text not null default 'new' check (status in ('new','in_review','waiting_customer','approved','rejected','completed','cancelled')),
  consent boolean not null check (consent),
  consent_at timestamptz not null,
  source text not null default 'sepelio_web' check (length(btrim(source)) between 2 and 40),
  deduplication_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.funeral_family_update_members (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.funeral_family_update_requests(id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) between 3 and 120),
  dni text not null check (dni ~ '^[0-9]{7,8}$'),
  birth_date date not null check (birth_date <= current_date and birth_date >= date '1900-01-01'),
  relationship text not null check (relationship in ('spouse','cohabitant','child','parent','other')),
  created_at timestamptz not null default now()
);

create table public.funeral_family_update_audit (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.funeral_family_update_requests(id) on delete cascade,
  action text not null check (action in ('created','status_changed')),
  old_status text,
  new_status text,
  actor_email text,
  created_at timestamptz not null default now()
);

create index funeral_family_update_requests_status_idx on public.funeral_family_update_requests(status, created_at desc);
create index funeral_family_update_requests_member_number_idx on public.funeral_family_update_requests(member_number);
create index funeral_family_update_members_request_idx on public.funeral_family_update_members(request_id);
create index funeral_family_update_audit_request_idx on public.funeral_family_update_audit(request_id, created_at desc);

alter table public.funeral_family_update_requests enable row level security;
alter table public.funeral_family_update_members enable row level security;
alter table public.funeral_family_update_audit enable row level security;
revoke all on public.funeral_family_update_requests, public.funeral_family_update_members, public.funeral_family_update_audit from public, anon, authenticated;
grant all on public.funeral_family_update_requests, public.funeral_family_update_members, public.funeral_family_update_audit to service_role;
create policy "browser roles cannot access funeral family requests" on public.funeral_family_update_requests for all to anon, authenticated using (false) with check (false);
create policy "browser roles cannot access funeral family members" on public.funeral_family_update_members for all to anon, authenticated using (false) with check (false);
create policy "browser roles cannot access funeral family audit" on public.funeral_family_update_audit for all to anon, authenticated using (false) with check (false);

create trigger funeral_family_update_requests_updated_at
before update on public.funeral_family_update_requests
for each row execute function public.set_platform_updated_at();

create or replace function public.create_funeral_family_update_request(
  p_request_number text,
  p_journey_id text,
  p_session_id text,
  p_member_number text,
  p_holder_full_name text,
  p_holder_dni text,
  p_phone text,
  p_email text,
  p_consent boolean,
  p_source text,
  p_deduplication_key text,
  p_members jsonb
) returns table(request_number text, created boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_request_id uuid;
  v_existing_number text;
  v_member jsonb;
begin
  if p_consent is distinct from true or jsonb_typeof(p_members) <> 'array' or jsonb_array_length(p_members) < 1 or jsonb_array_length(p_members) > 10 then
    raise exception 'invalid funeral family update payload' using errcode = '22023';
  end if;

  insert into public.funeral_family_update_requests (
    request_number, journey_id, session_id, member_number, holder_full_name, holder_dni, phone, email,
    consent, consent_at, source, deduplication_key
  ) values (
    p_request_number, nullif(p_journey_id, ''), nullif(p_session_id, ''), p_member_number, p_holder_full_name,
    p_holder_dni, p_phone, nullif(lower(p_email), ''), p_consent, clock_timestamp(), p_source, p_deduplication_key
  ) on conflict (deduplication_key) do nothing returning id into v_request_id;

  if v_request_id is null then
    select r.request_number into v_existing_number from public.funeral_family_update_requests r where r.deduplication_key = p_deduplication_key;
    return query select v_existing_number, false;
    return;
  end if;

  for v_member in select value from jsonb_array_elements(p_members)
  loop
    insert into public.funeral_family_update_members (request_id, full_name, dni, birth_date, relationship)
    values (v_request_id, v_member->>'full_name', v_member->>'dni', (v_member->>'birth_date')::date, v_member->>'relationship');
  end loop;
  insert into public.funeral_family_update_audit (request_id, action, new_status) values (v_request_id, 'created', 'new');
  return query select p_request_number, true;
end;
$$;
revoke execute on function public.create_funeral_family_update_request(text,text,text,text,text,text,text,text,boolean,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_funeral_family_update_request(text,text,text,text,text,text,text,text,boolean,text,text,jsonb) to service_role;

comment on table public.funeral_family_update_requests is 'Private operational Sepelio family-update requests. Retention policy requires a human decision before production.';
comment on table public.funeral_family_update_members is 'Private members submitted for operational review; not a determination of eligibility.';
