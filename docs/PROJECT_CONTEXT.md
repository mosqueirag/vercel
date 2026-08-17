# COOPSAR — estado del proyecto

PR #2 (`platform-coopsar-ai`) está abierto y Ready for Review contra `main`. PR #3 (`data-internet-fibra`) permanece Draft y está apilado sobre PR #2. El único entorno remoto autorizado para estas ramas es **coopsar-staging** (`wwvqlbycwzxvjnexklwg`, `sa-east-1`). El proyecto Supabase histórico se trata como posible producción y permanece fuera de alcance.

La plataforma valida en staging: navegación y asistencia COOPIA, consulta de cobertura por domicilio, planes publicados cuando estén aprobados, solicitudes de Internet/lista de espera, outbox persistente y CMS de noticias con rol editorial. No hay CRM, n8n productivo ni flujos operativos internos nuevos.

Las trece migraciones canónicas de `supabase/migrations/` reproducen el esquema actual y están aplicadas en staging. El contenido semilla y las solicitudes usadas para validación están etiquetados explícitamente como `TEST`; nunca son información institucional ni comercial.

Antes de producción se requiere información oficial validada, canales operativos aprobados, revisión de privacidad, observabilidad y la lista de `docs/PRODUCTION_READINESS.md` completa.

## Cierre de Fase 2 (staging)

PR #3 (`data-internet-fibra`) permanece en borrador contra `platform-coopsar-ai`. El Lote Oficial 1 fue cargado exclusivamente en `coopsar-staging` (`wwvqlbycwzxvjnexklwg`): 7 planes en `draft`, 10 contactos publicados, 2.126 coberturas oficiales y 20 FAQ en `draft`. Las 85 coberturas pendientes de revisión no se importaron y la idempotencia fue validada. La UI pública, COOPIA y las páginas de servicio consumen contactos publicados desde `public_contact_channels` mediante `lib/data/public-content.ts` o `/api/public/contacts`; los fallbacks históricos sólo operan ante ausencia del dato oficial y no lo sobrescriben. Producción permanece fuera de alcance.

## Fase 3A — enrutamiento de reclamos

COOPIA no mantiene tickets ni almacena reclamos. Detecta el servicio, resuelve de manera determinística el horario Argentina y deriva por WhatsApp al canal publicado correspondiente. Durante la recepción (lunes a viernes, 08:00–14:00) usa el canal general; fuera de ese horario usa la guardia oficial de energía, comunicaciones o sepelio. La trazabilidad es anónima y no incluye el texto del reclamo ni datos personales.
