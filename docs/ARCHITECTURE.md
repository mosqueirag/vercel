# Architecture

Next.js App Router runs the public UI and server endpoints on Vercel. Supabase is the system of record. Browser code uses only the public URL/key; privileged writes and private reads use a server-only service credential.

Public status follows `service_alerts -> server selector -> Home and COOPIA`. Missing or failed data resolves to `unknown`.

Endpoint protection uses hashed identifiers and the atomic `consume_rate_limit` RPC. Raw IP addresses are not persisted. Private lead creation uses `create_internet_request_with_outbox`, which atomically stores the request and a minimal integration event. A worker invocation claims events using `FOR UPDATE SKIP LOCKED`, records delivery, and schedules exponential retry after failure.
