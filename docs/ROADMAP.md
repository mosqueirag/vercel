# Roadmap

1. Create `coopsar-staging` as a separate Supabase project in the `guille` organization after explicit cost confirmation; prefer `sa-east-1`.
2. Apply the already locally verified migrations only to that isolated environment and compare it for drift.
3. Scope Vercel Preview variables for `platform-coopsar-ai` to the staging project, set `NEXT_PUBLIC_APP_ENV=staging`, and do not alter Production variables.
4. Validate Vercel Preview against staging, then move the draft PR to review. Production promotion and merge require explicit authorization.
5. After staging validation, connect `service_requests` to an authorized internal operations view and define status lookup without exposing private rows to browser roles.
6. In the isolated staging project, load only confirmed services and contacts through versioned seeds, add the `contact_channels` model, and transition COOPIA reads to the shared server data access layer. Prices, speeds, coverage and administrative requirements remain draft until COOPSAR validates them.
