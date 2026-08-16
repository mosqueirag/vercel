-- P1: public contacts are delivered by the server-side DAL. Direct Data API
-- access would expose every column, including internal audit data.
-- This is permissions-only and does not alter rows or rerun prior SQL.
revoke select on table public.public_contact_channels from anon, authenticated;

comment on table public.public_contact_channels is
  'Managed through protected server endpoints. Public clients receive the allowlisted projection from lib/data/public-content.ts; direct anon/authenticated SELECT is revoked.';
