# COOPSAR — estado del proyecto

PR #2 (`platform-coopsar-ai`) continúa en borrador. El único entorno remoto autorizado para esta rama es **coopsar-staging** (`wwvqlbycwzxvjnexklwg`, `sa-east-1`). El proyecto Supabase histórico se trata como posible producción y permanece fuera de alcance.

La plataforma valida en staging: navegación y asistencia COOPIA, consulta de cobertura por domicilio, planes publicados, solicitudes de Internet/lista de espera, outbox persistente y CMS de noticias con rol editorial. No hay CRM, n8n productivo ni flujos operativos internos nuevos.

Los nueve archivos de `supabase/migrations/` reproducen el esquema actual y están aplicados en staging. El contenido semilla y las solicitudes usadas para validación están etiquetados explícitamente como `TEST`; nunca son información institucional ni comercial.

Antes de producción se requiere información oficial validada, canales operativos aprobados, revisión de privacidad, observabilidad y la lista de `docs/PRODUCTION_READINESS.md` completa.
