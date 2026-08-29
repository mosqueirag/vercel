-- Adds document-level traceability for future private DNI view audits.
-- Historical audit rows remain compatible and intentionally retain null values.
alter table public.funeral_family_update_audit
  add column document_id uuid references public.funeral_family_update_documents(id) on delete set null,
  add column document_type text check (document_type in ('holder_dni_front', 'holder_dni_back'));

create index funeral_family_update_audit_document_view_idx
  on public.funeral_family_update_audit (request_id, document_id, created_at desc)
  where action = 'document_viewed';

comment on column public.funeral_family_update_audit.document_id is
  'Private DNI document metadata identifier for document_viewed audit events. Never stores storage paths or signed URLs.';
comment on column public.funeral_family_update_audit.document_type is
  'Private DNI document type for document_viewed audit events. Historical audit rows may be null.';
