# COOPSAR environments

## Development

Local machine and disposable Supabase CLI stack. Use `.env.local`, which is ignored by Git. The local stack is the only environment where `supabase db reset` is allowed during development. It uses synthetic data only.

Required public configuration:

```env
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Server-only variables are `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_SESSION_LIMIT`, `N8N_WEBHOOK_URL`, and `N8N_WEBHOOK_SECRET`. Never place a server-only variable behind a `NEXT_PUBLIC_` prefix.

## Staging

Git branch: `platform-coopsar-ai`.

Vercel target: Preview deployment scoped to that branch.

Supabase target: a separate project named `coopsar-staging`, not a repurposed production project. Prefer the `sa-east-1` region when available. Its project reference and credentials must be distinct from Production.

Configure Preview values in Vercel for this branch:

```env
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_SITE_URL=https://<preview-or-staging-domain>
NEXT_PUBLIC_SUPABASE_URL=https://<coopsar-staging-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<staging publishable key>
SUPABASE_SECRET_KEY=<staging server-only key>
OPENAI_API_KEY=<staging server-only key>
OPENAI_MODEL=gpt-5.4-nano
AI_SESSION_LIMIT=4
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
```

The value `NEXT_PUBLIC_APP_ENV=staging` renders a visible `Entorno de prueba · STAGING` banner. It is an explicit configuration marker, not hostname inference.

Before applying migrations: rebuild and test the local database, identify the remote project by name/ref/URL, confirm its isolation, then apply only the repository migrations in order. Do not copy personal data from production; use only clearly labelled synthetic fixtures such as `TEST`.

## Production

Git branch: `main`.

Vercel target: Production deployment.

Supabase target: production project only. Production variables are scoped only to Vercel Production. `NEXT_PUBLIC_APP_ENV` must not equal `staging`.

**Never execute test migrations, `db reset`, fixtures, or experimental data operations in production.** Production promotion and database changes require explicit authorization after staging validation.

## Verification checklist

1. Confirm Vercel Preview points to the staging Supabase URL, never the production URL.
2. Confirm server keys exist only in the Vercel server environment and local ignored files.
3. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
4. Run `supabase db reset`, `supabase test db`, and `supabase db lint` only against the disposable local stack before staging migration.
5. Keep PR #2 as a draft until staging verification completes.
