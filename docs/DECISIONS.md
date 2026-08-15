# Decisions

- Supabase was chosen for distributed limits to avoid instance-local state and another infrastructure provider.
- Rate-limit identifiers use a server-side salt and SHA-256; only hashes and expiring counters are stored.
- Journey events are structured and exclude conversations and lead PII.
- Commercial records and integration outbox are server-only. Published knowledge, plans, services and active alerts are public-read. Editorial operations remain admin-only.
- n8n receives only event type and request number. Personal data stays in Supabase.
