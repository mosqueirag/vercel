-- PostgREST translates `on_conflict=import_key` to `ON CONFLICT (import_key)`.
-- Partial unique indexes cannot be inferred by that form, so replace the two
-- import-only partial indexes with ordinary unique indexes. PostgreSQL allows
-- multiple NULL values in a unique index, preserving the intended semantics.
--
-- This migration is additive with respect to data: it only rebuilds indexes
-- after explicitly refusing to proceed if duplicate non-null import keys exist.

do $$
begin
  if exists (
    select 1
    from public.faqs
    where import_key is not null
    group by import_key
    having count(*) > 1
  ) then
    raise exception 'Cannot rebuild faqs import_key index: duplicate non-null import_key values exist';
  end if;

  if exists (
    select 1
    from public.public_contact_channels
    where import_key is not null
    group by import_key
    having count(*) > 1
  ) then
    raise exception 'Cannot rebuild public_contact_channels import_key index: duplicate non-null import_key values exist';
  end if;
end
$$;

drop index if exists public.faqs_import_key_unique_idx;
drop index if exists public.public_contact_channels_import_key_unique_idx;

create unique index faqs_import_key_unique_idx
  on public.faqs (import_key);

create unique index public_contact_channels_import_key_unique_idx
  on public.public_contact_channels (import_key);
