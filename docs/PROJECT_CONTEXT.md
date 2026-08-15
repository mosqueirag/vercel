# COOPSAR project context

The current branch hardens the existing digital platform without adding product scope. COOPIA defaults to two server-enforced responses per session, commercial leads are journey-linked, public status comes from active Supabase alerts, and n8n delivery uses a persistent outbox. Production migrations have not been applied.

PR #2 remains Draft. COOPSAR staging is the isolated Supabase project `coopsar-staging` (`wwvqlbycwzxvjnexklwg`, `sa-east-1`). It contains only repository schema and explicit synthetic `TEST` fixtures. The earlier Supabase project remains classified as potential production and is never modified.

Phase 2A adds a reusable COOPIA action layer for complaints, ownership changes, new energy supply, digital invoice enrollment and phone requests. It does not implement a CRM or service-specific back-office workflow.

Environment configuration is documented in `docs/ENVIRONMENTS.md`. A visual staging label is shown only when `NEXT_PUBLIC_APP_ENV=staging`.
