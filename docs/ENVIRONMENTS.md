# Entornos

| Entorno | Rama/despliegue | Base de datos | Datos permitidos |
| --- | --- | --- | --- |
| Local | máquina del desarrollador | stack Supabase desechable | solo sintéticos |
| Staging | `platform-coopsar-ai` / Vercel Preview | `coopsar-staging` (`wwvqlbycwzxvjnexklwg`) | solo TEST o contenido expresamente aprobado |
| Producción | `main` / Vercel Production | proyecto productivo separado | datos oficiales |

`NEXT_PUBLIC_APP_ENV=staging` muestra el banner visible. Preview debe usar claves propias de staging; producción debe tener sus secretos aislados y jamás recibir fixtures o migraciones experimentales.

Variables server-only: `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `AI_SESSION_LIMIT`, `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET`. Ninguna puede usar prefijo `NEXT_PUBLIC_`.

Solo el stack local permite `supabase db reset`. Para staging se permite inspección, `migration list` y `db push --dry-run`; cambios reales requieren autorización explícita y verificación previa del project ref.
