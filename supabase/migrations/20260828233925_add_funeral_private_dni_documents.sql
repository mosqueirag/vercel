-- Private, holder-only DNI documents for Sepelio family update requests.
-- Retention is deliberately pending a human production decision.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'funeral-private-documents',
  'funeral-private-documents',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table public.funeral_document_upload_sessions (
  id uuid primary key,
  front_path text not null unique,
  back_path text not null unique,
  front_mime_type text not null check (front_mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  back_mime_type text not null check (back_mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  front_file_size bigint not null check (front_file_size > 0 and front_file_size <= 8388608),
  back_file_size bigint not null check (back_file_size > 0 and back_file_size <= 8388608),
  status text not null default 'pending' check (status in ('pending', 'consumed', 'discarded', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create table public.funeral_family_update_documents (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.funeral_family_update_requests(id) on delete cascade,
  member_id uuid references public.funeral_family_update_members(id) on delete cascade,
  document_type text not null check (document_type in ('holder_dni_front', 'holder_dni_back')),
  storage_bucket text not null check (storage_bucket = 'funeral-private-documents'),
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size bigint not null check (file_size > 0 and file_size <= 8388608),
  created_at timestamptz not null default now(),
  unique (request_id, document_type)
);

create index funeral_document_upload_sessions_expiry_idx on public.funeral_document_upload_sessions(status, expires_at);
create index funeral_family_update_documents_request_idx on public.funeral_family_update_documents(request_id, document_type);

alter table public.funeral_document_upload_sessions enable row level security;
alter table public.funeral_family_update_documents enable row level security;
revoke all on public.funeral_document_upload_sessions, public.funeral_family_update_documents from public, anon, authenticated;
grant all on public.funeral_document_upload_sessions, public.funeral_family_update_documents to service_role;
create policy "browser roles cannot access funeral upload sessions" on public.funeral_document_upload_sessions for all to anon, authenticated using (false) with check (false);
create policy "browser roles cannot access funeral documents" on public.funeral_family_update_documents for all to anon, authenticated using (false) with check (false);

-- No storage.objects policy is created for this bucket. Existing policies are
-- bucket-scoped to other buckets, so browser roles cannot enumerate, read,
-- update or delete funeral-private-documents. Signed upload/read URLs are
-- issued only by the server for an exact server-generated object path.

alter table public.funeral_family_update_audit drop constraint funeral_family_update_audit_action_check;
alter table public.funeral_family_update_audit add constraint funeral_family_update_audit_action_check
  check (action in ('created', 'status_changed', 'document_viewed'));

create or replace function public.create_funeral_family_update_with_documents(
  p_upload_id uuid,
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
) returns table(request_number text, created boolean, cleanup_required boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_upload public.funeral_document_upload_sessions%rowtype;
  v_request_id uuid;
  v_existing_number text;
  v_member jsonb;
  v_front storage.objects%rowtype;
  v_back storage.objects%rowtype;
begin
  if p_consent is distinct from true or jsonb_typeof(p_members) <> 'array' or jsonb_array_length(p_members) < 1 or jsonb_array_length(p_members) > 10 then
    raise exception 'invalid funeral family update payload' using errcode = '22023';
  end if;

  select * into v_upload from public.funeral_document_upload_sessions
    where id = p_upload_id and status = 'pending' and expires_at > clock_timestamp() for update;
  if not found then raise exception 'invalid, expired or consumed document upload' using errcode = '22023'; end if;

  select * into v_front from storage.objects where bucket_id = 'funeral-private-documents' and name = v_upload.front_path;
  select * into v_back from storage.objects where bucket_id = 'funeral-private-documents' and name = v_upload.back_path;
  if not found or v_front.id is null or v_back.id is null
    or coalesce(v_front.metadata->>'mimetype', '') <> v_upload.front_mime_type
    or coalesce(v_back.metadata->>'mimetype', '') <> v_upload.back_mime_type
    or coalesce((v_front.metadata->>'size')::bigint, 0) <> v_upload.front_file_size
    or coalesce((v_back.metadata->>'size')::bigint, 0) <> v_upload.back_file_size then
    raise exception 'required document upload is incomplete or invalid' using errcode = '22023';
  end if;

  insert into public.funeral_family_update_requests (
    request_number, journey_id, session_id, member_number, holder_full_name, holder_dni, phone, email,
    consent, consent_at, source, deduplication_key
  ) values (
    p_request_number, nullif(p_journey_id, ''), nullif(p_session_id, ''), p_member_number, p_holder_full_name,
    p_holder_dni, p_phone, nullif(lower(p_email), ''), p_consent, clock_timestamp(), p_source, p_deduplication_key
  ) on conflict (deduplication_key) do nothing returning id into v_request_id;

  if v_request_id is null then
    select request_number into v_existing_number from public.funeral_family_update_requests where deduplication_key = p_deduplication_key;
    update public.funeral_document_upload_sessions set status = 'discarded' where id = p_upload_id;
    return query select v_existing_number, false, true;
    return;
  end if;

  for v_member in select value from jsonb_array_elements(p_members) loop
    insert into public.funeral_family_update_members (request_id, full_name, dni, birth_date, relationship)
    values (v_request_id, v_member->>'full_name', v_member->>'dni', (v_member->>'birth_date')::date, v_member->>'relationship');
  end loop;

  insert into public.funeral_family_update_documents (request_id, document_type, storage_bucket, storage_path, mime_type, file_size)
  values
    (v_request_id, 'holder_dni_front', 'funeral-private-documents', v_upload.front_path, v_upload.front_mime_type, v_upload.front_file_size),
    (v_request_id, 'holder_dni_back', 'funeral-private-documents', v_upload.back_path, v_upload.back_mime_type, v_upload.back_file_size);
  insert into public.funeral_family_update_audit (request_id, action, new_status) values (v_request_id, 'created', 'new');
  update public.funeral_document_upload_sessions set status = 'consumed', consumed_at = clock_timestamp() where id = p_upload_id;
  return query select p_request_number, true, false;
end;
$$;
revoke execute on function public.create_funeral_family_update_with_documents(uuid,text,text,text,text,text,text,text,text,boolean,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_funeral_family_update_with_documents(uuid,text,text,text,text,text,text,text,text,boolean,text,text,jsonb) to service_role;

comment on table public.funeral_family_update_documents is 'Private Sepelio holder DNI metadata. Objects live only in private Storage. Retention policy is pending human decision before production.';
