begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select ok((select public = false from storage.buckets where id = 'funeral-private-documents'), 'DNI bucket is private');
select is((select file_size_limit from storage.buckets where id = 'funeral-private-documents'), 8388608, 'DNI bucket caps files at 8 MB');
select is((select array_to_string(allowed_mime_types, ',') from storage.buckets where id = 'funeral-private-documents'), 'image/jpeg,image/png,image/webp', 'DNI bucket allows only image files');

set local role anon;
select throws_ok($$ select count(*) from public.funeral_document_upload_sessions $$, '42501', 'permission denied for table funeral_document_upload_sessions', 'anon cannot read private upload sessions');
select throws_ok($$ select count(*) from public.funeral_family_update_documents $$, '42501', 'permission denied for table funeral_family_update_documents', 'anon cannot read private DNI metadata');
select throws_ok($$ select * from public.create_funeral_family_update_with_documents('11111111-1111-4111-8111-111111111111'::uuid, 'SEP-TEST', '', '', 'TEST', 'Test', '12345678', '0000000000', '', true, 'test', 'test', '[]'::jsonb) $$, '42501', 'permission denied for function create_funeral_family_update_with_documents', 'anon cannot invoke document-backed request RPC');
reset role;

set local role authenticated;
select throws_ok($$ select count(*) from public.funeral_document_upload_sessions $$, '42501', 'permission denied for table funeral_document_upload_sessions', 'authenticated cannot read private upload sessions');
select throws_ok($$ select count(*) from public.funeral_family_update_documents $$, '42501', 'permission denied for table funeral_family_update_documents', 'authenticated cannot read private DNI metadata');
reset role;

set local role service_role;
insert into public.funeral_document_upload_sessions (id, front_path, back_path, front_mime_type, back_mime_type, front_file_size, back_file_size, expires_at)
values ('11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111/holder-dni-front.jpg', '11111111-1111-4111-8111-111111111111/holder-dni-back.jpg', 'image/jpeg', 'image/jpeg', 1, 1, now() + interval '10 minutes');
select is((select count(*)::integer from public.funeral_document_upload_sessions), 1, 'service role can create an upload session');
select throws_ok($$ select * from public.create_funeral_family_update_with_documents('11111111-1111-4111-8111-111111111111'::uuid, 'SEP-2026-4G320001', '', '', 'TEST', 'Test', '12345678', '0000000000', '', true, 'test', 'test-documents', '[{"full_name":"Member Test","dni":"23456789","birth_date":"1990-01-01","relationship":"other"}]'::jsonb) $$, '22023', 'required document metadata is required before the request is created');
select is((select count(*)::integer from public.funeral_family_update_requests where request_number = 'SEP-2026-4G320001'), 0, 'incomplete uploads do not create requests');
reset role;

select * from finish();
rollback;
