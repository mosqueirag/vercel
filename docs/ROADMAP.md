# Roadmap

1. Create or connect an unmistakably named Supabase development/staging project and record its project ref and URL.
2. Apply the already locally verified migrations only to that isolated environment and compare it for drift.
3. Require the `quality` and `supabase-tests` GitHub checks on `main`.
4. Validate Vercel Preview against staging, then move the draft PR to review. Production promotion and merge require explicit authorization.
5. After staging validation, connect `service_requests` to an authorized internal operations view and define status lookup without exposing private rows to browser roles.
