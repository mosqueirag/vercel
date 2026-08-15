# Architecture

Next.js App Router runs the public UI and server endpoints on Vercel. Supabase is the system of record. Browser code uses only the public URL/key; privileged writes and private reads use a server-only service credential.

Public status follows `service_alerts -> server selector -> Home and COOPIA`. Missing or failed data resolves to `unknown`.

Endpoint protection uses hashed identifiers and the atomic `consume_rate_limit` RPC. Raw IP addresses are not persisted. Private lead creation uses `create_internet_request_with_outbox`, which atomically stores the request and a minimal integration event. A worker invocation claims events using `FOR UPDATE SKIP LOCKED`, records delivery, and schedules exponential retry after failure.

## Continuous integration

GitHub Actions runs two mandatory gates. `quality` uses `npm ci` and validates TypeScript, ESLint, unit tests and the production build. `supabase-tests` starts a disposable Postgres 17 Supabase stack, reconstructs all migrations, runs pgTAP/RLS tests and lints the generated schema. Neither job receives production credentials.

## Proceso seguro de cambios de base de datos

`desarrollo -> CI -> Supabase local -> tests RLS -> staging -> validación -> aprobación -> producción`

Database changes must never move directly from new code to production. A remote migration is permitted only after the project reference, name and URL unequivocally identify a development or staging environment.
