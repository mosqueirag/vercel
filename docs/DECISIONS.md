# Decisiones técnicas

- Staging (`wwvqlbycwzxvjnexklwg`) es el único remoto autorizado para PR #2; ningún test ni reparación toca producción.
- El historial de nueve migraciones es canónico y el esquema se modifica solo mediante migraciones aditivas revisadas.
- Los límites distribuidos usan `consume_rate_limit` y huellas con hash/sal; no se persiste IP cruda. Si falla la protección, los endpoints protegidos fallan cerrados.
- El tracking de journeys es best-effort: errores analíticos no bloquean una solicitud comercial válida. Guarda identificadores, intención, acción, resultados agregados y duración; nunca conversación completa ni PII de contacto.
- El consentimiento operativo y el opt-in comercial son campos distintos en `internet_requests`; solo el primero es obligatorio para solicitar contacto.
- El outbox guarda tipo de evento y número de solicitud, no datos de contacto, y deja reintentos exponenciales para una futura integración autorizada.
- Las tarjetas/constantes en `lib/coopsar-data.ts` son una compatibilidad limitada, no una fuente comercial confirmada. La migración se detalla en `AI_KNOWLEDGE.md`.
