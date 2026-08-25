# COOPSAR — estado del proyecto

PR #2 (`platform-coopsar-ai`) está abierto y Ready for Review contra `main`. PR #3 (`data-internet-fibra`) permanece Draft y está apilado sobre PR #2. El único entorno remoto autorizado para estas ramas es **coopsar-staging** (`wwvqlbycwzxvjnexklwg`, `sa-east-1`). El proyecto Supabase histórico se trata como posible producción y permanece fuera de alcance.

La plataforma valida en staging: navegación y asistencia COOPIA, consulta de cobertura por domicilio, planes publicados cuando estén aprobados, solicitudes de Internet/lista de espera, outbox persistente y CMS de noticias con rol editorial. No hay CRM, n8n productivo ni flujos operativos internos nuevos.

Las trece migraciones canónicas de `supabase/migrations/` reproducen el esquema actual y están aplicadas en staging. El contenido semilla y las solicitudes usadas para validación están etiquetados explícitamente como `TEST`; nunca son información institucional ni comercial.

Antes de producción se requiere información oficial validada, canales operativos aprobados, revisión de privacidad, observabilidad y la lista de `docs/PRODUCTION_READINESS.md` completa.

## Cierre de Fase 2 (staging)

PR #3 (`data-internet-fibra`) permanece en borrador contra `platform-coopsar-ai`. El Lote Oficial 1 fue cargado exclusivamente en `coopsar-staging` (`wwvqlbycwzxvjnexklwg`): 7 planes en `draft`, 10 contactos publicados, 2.126 coberturas oficiales y 20 FAQ en `draft`. Las 85 coberturas pendientes de revisión no se importaron y la idempotencia fue validada. La UI pública, COOPIA y las páginas de servicio consumen contactos publicados desde `public_contact_channels` mediante `lib/data/public-content.ts` o `/api/public/contacts`; los fallbacks históricos sólo operan ante ausencia del dato oficial y no lo sobrescriben. Producción permanece fuera de alcance.

## Fase 3A — enrutamiento de reclamos

COOPIA no mantiene tickets ni almacena reclamos. Detecta el servicio, resuelve de manera determinística el horario Argentina y deriva por WhatsApp al canal publicado correspondiente. Durante la recepción (lunes a viernes, 08:00–14:00) usa el canal general; fuera de ese horario usa la guardia oficial de energía, comunicaciones o sepelio. La trazabilidad es anónima y no incluye el texto del reclamo ni datos personales.
# Fase 3B — operación comercial interna

`internet_requests` es el registro privado único de solicitudes de Internet/Fibra. La bandeja `/admin/comercial` está disponible sólo para administradores autorizados y separa solicitudes de instalación de `fiber_waitlist`. La lectura y los cambios de estado ocurren server-side; la demanda se muestra sólo agregada y los contactos se abren manualmente.

## Fase 4B — COOPIA global

COOPIA es una capa transversal de las páginas públicas. La home mantiene el centro de atención protagonista y el resto del portal ofrece un panel compacto bajo demanda, ambos sobre una única sesión temporal. La conversación, intención y acciones sobreviven a la navegación de la pestaña; no se muestra el asistente dentro de `/admin`. La analítica es mínima y best-effort, sin texto completo del chat ni datos personales.

## Fase 4D — contenido histórico curado de WordPress

El sitio WordPress anterior es exclusivamente una **fuente histórica de migración**: nunca se consulta en runtime ni reemplaza los datos oficiales administrables. El importador controlado `scripts/import-curated-wordpress-content.ps1` acepta solamente el paquete privado curado, exige staging y crea contenido en `draft` con `published_at = null`. La evidencia de las páginas fuente y sus relaciones de procedencia se conserva en tablas privadas, inaccesibles a `anon` y `authenticated`; los componentes públicos y COOPIA leen únicamente la proyección publicada mediante una capa server-side tipada.

## Fase 4E.2 — curaduría y publicación humana

El lote histórico de curaduría tiene 44 contenidos permitidos (9 servicios, 24 artículos de ayuda y 11 FAQ). La IA sólo genera propuestas privadas; la revisión masiva se limita al corpus editorial, conserva los gates de riesgo y excluye planes y contactos. Un administrador debe aprobar, aplicar al borrador y publicar explícitamente en staging. COOPIA no recibe borradores. El smoke de “¿Qué es ADECOOP?” confirmó la transición completa sin modificar producción.

## Fase 4F.1 — CERRADA / validada en Preview

COOPIA conserva su sesión temporal global y añade una capa canónica de necesidades: pago, corte de energía, problema/interés de Internet, interés/cobertura de Fibra, sepelio, atención humana y `unknown`. Las reglas determinísticas resuelven los casos claros; la IA sólo redacta la orientación de una consulta ambigua usando conocimiento publicado. La respuesta estructurada reutiliza el resolver, el motor de cobertura, la bandeja comercial y los contactos publicados existentes; no crea tickets, CRM ni solicitudes sin confirmación.

El smoke real validó `payment`, `energy_outage`, `internet_issue`, `internet_interest`, `fiber_interest`, `fiber_coverage`, `funeral_service`, `human_handoff` y `unknown`. Cada resultado estructurado nuevo desplaza una única vez el contenedor de conversación hasta el mensaje y el inicio de su tarjeta, sin guardar posición ni producir eventos analíticos. PGRST303 queda como P2 monitorizado: el fallback de contactos sigue operativo y los logs conservan sólo código y clasificación segura.

El HEAD funcional validado es `411403b36faa93b2557863b400296b13dad0035c`; la validación final de Preview y CI registró 232 pruebas. La siguiente fase autorizada es **4F.2**, sin implementación iniciada. Producción permanece fuera de alcance.

## Fase 4F.2 — interacción continua

COOPIA mantiene asistencia operativa aun cuando la capacidad generativa esté limitada: las gestiones claras usan resolución determinística y herramientas server-side; sólo las consultas ambiguas consumen presupuesto LLM. El límite técnico contra abuso sigue activo y el navegador nunca recibe secretos ni queda bloqueado por el agotamiento de IA.

## Fase 4F.3 — interacción guiada

La capa global prioriza necesidades expresadas por personas, un paso estructurado activo y una única acción principal. La conversación queda plegable como contexto secundario; se conserva temporalmente durante la pestaña y el usuario puede cambiar de necesidad o acceder a atención humana en cualquier momento.

## Fase 4G.2 — Internet público unificado

`/internet` es la única superficie pública de conectividad y reutiliza el motor tipado de cobertura, planes y solicitudes. `/fibra-optica` conserva compatibilidad mediante redirect permanente. FTTH y fibra siguen siendo tecnología y semántica operativa interna; los eventos técnicos no se eliminan. La página no muestra datos comerciales no publicados y, sin planes compatibles publicados, ofrece validación técnica o contacto comercial sin inventar una oferta.

## Fase 4G.1 — arquitectura pública de contenido

La arquitectura pública consolida el material histórico curado sin reproducir el WordPress previo. **Internet** es la única categoría pública de conectividad con URL canónica `/internet`; Fibra Óptica es una tecnología dentro de su journey y `/fibra-optica` queda planificada como redirect futuro, sin retirar conceptos backend de FTTH/fibra. El inventario, decisiones de fuente y evolución de `site_pages` están en `docs/PUBLIC_CONTENT_ARCHITECTURE.md`. No se publicó contenido ni se modificó producción.
