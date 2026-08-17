# Decisiones técnicas

- Staging (`wwvqlbycwzxvjnexklwg`) es el único remoto autorizado para PR #2 y PR #3; ningún test ni reparación toca producción.
- El historial de trece migraciones es canónico y el esquema se modifica solo mediante migraciones aditivas revisadas.
- Los límites distribuidos usan `consume_rate_limit` y huellas con hash/sal; no se persiste IP cruda. Si falla la protección, los endpoints protegidos fallan cerrados.
- El tracking de journeys es best-effort: errores analíticos no bloquean una solicitud comercial válida. Guarda identificadores, intención, acción, resultados agregados y duración; nunca conversación completa ni PII de contacto.
- El consentimiento operativo y el opt-in comercial son campos distintos en `internet_requests`; solo el primero es obligatorio para solicitar contacto.
- El outbox guarda tipo de evento y número de solicitud, no datos de contacto, y deja reintentos exponenciales para una futura integración autorizada.
- Las tarjetas/constantes en `lib/coopsar-data.ts` son una compatibilidad limitada, no una fuente comercial confirmada. La migración se detalla en `AI_KNOWLEDGE.md`.
- P2 de roles: la autorización de contenidos reutiliza `news_admins`/`requireNewsAdmin()`. En una fase posterior se reemplazará por roles explícitos como `platform_admin` y `content_admin`; mientras tanto, las rutas administrativas usan un cliente server-side y no hay grants directos para `authenticated`.

- `public_contact_channels` es la fuente administrable de canales públicos. Los componentes cliente la consumen por `/api/public/contacts` y las rutas server-side mediante `lib/data/public-content.ts`; los valores de compatibilidad sólo aplican si falta el dato oficial. El horario del Footer no conserva el fallback histórico.
- El Lote Oficial 1 se importa con dry-run y upsert idempotente, sin PII ni topología de red. La cobertura se identifica por `street_normalized + street_number + technology` y puede no tener un plan comercial confirmado.
- El cierre de Fase 2 se valida sobre el release candidate combinado PR #2 + PR #3. PR #3 continúa Draft hasta revisión humana; ninguna condición de staging autoriza merge ni promoción productiva.
