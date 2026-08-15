# Decisions

- Supabase was chosen for distributed limits to avoid instance-local state and another infrastructure provider.
- Rate-limit identifiers use a server-side salt and SHA-256; only hashes and expiring counters are stored.
- Journey events are structured and exclude conversations and lead PII.
- Commercial records and integration outbox are server-only. Published knowledge, plans, services and active alerts are public-read. Editorial operations remain admin-only.
- n8n receives only event type and request number. Personal data stays in Supabase.
- CI pins Node 22 LTS and Supabase CLI 2.114.0. The database job is local and disposable, uses no remote project reference, and treats migration or RLS failures as release blockers.
- `main` must require the `quality` and `supabase-tests` checks. Branch protection is not weakened to accommodate deployments.
- COOPIA service processes use one `service_requests` aggregate instead of one table/form per minor procedure. Common identity/contact fields remain columns; only explicitly allow-listed, request-specific fields enter `payload`.
- Informational intent may render guidance or offer a form, but no write occurs until the user submits an explicit confirmation. Public tracking numbers are random `SRV-YYYY-XXXXXXXX` values rather than sequential IDs.
- The existing remote Supabase reference is treated as potential production because its name and migration history do not establish that it is a disposable development environment. Staging must be a separate project named `coopsar-staging`; no production project is repurposed for tests.
