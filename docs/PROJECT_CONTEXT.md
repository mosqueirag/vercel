# COOPSAR — estado del proyecto

PR #2 (`platform-coopsar-ai`) continúa en borrador. El único entorno remoto autorizado para esta rama es **coopsar-staging** (`wwvqlbycwzxvjnexklwg`, `sa-east-1`). El proyecto Supabase histórico se trata como posible producción y permanece fuera de alcance.

La plataforma valida en staging: navegación y asistencia COOPIA, consulta de cobertura por domicilio, planes publicados, solicitudes de Internet/lista de espera, outbox persistente y CMS de noticias con rol editorial. No hay CRM, n8n productivo ni flujos operativos internos nuevos.

Los nueve archivos de `supabase/migrations/` reproducen el esquema actual y están aplicados en staging. El contenido semilla y las solicitudes usadas para validación están etiquetados explícitamente como `TEST`; nunca son información institucional ni comercial.

Antes de producción se requiere información oficial validada, canales operativos aprobados, revisión de privacidad, observabilidad y la lista de `docs/PRODUCTION_READINESS.md` completa.

## Actualización Fase 2C (staging)

PR #3 (`data-internet-fibra`) permanece en borrador contra `platform-coopsar-ai`. El Lote Oficial 1 fue cargado exclusivamente en `coopsar-staging` (`wwvqlbycwzxvjnexklwg`): 7 planes en `draft`, 10 contactos publicados, 2.126 coberturas oficiales y 20 FAQ en `draft`. Las 85 coberturas pendientes de revisión no se importaron y la idempotencia fue validada. La UI pública y COOPIA obtienen los contactos publicados desde `public_contact_channels` mediante `lib/data/public-content.ts`; el Footer no permite que un fallback histórico sobrescriba el horario oficial. Producción permanece fuera de alcance.
