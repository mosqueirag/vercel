# COOPSAR project context

The current branch hardens the existing digital platform without adding product scope. COOPIA defaults to two server-enforced responses per session, commercial leads are journey-linked, public status comes from active Supabase alerts, and n8n delivery uses a persistent outbox. Production migrations have not been applied.

PR #2 remains Draft until both GitHub Actions jobs and the Vercel preview succeed. No authenticated Supabase staging project is connected; all database verification is local and disposable.

Phase 2A adds a reusable COOPIA action layer for complaints, ownership changes, new energy supply, digital invoice enrollment and phone requests. It does not implement a CRM or service-specific back-office workflow.
