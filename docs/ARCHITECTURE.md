# Arquitectura

Next.js App Router entrega la UI y las rutas servidoras; Supabase staging es el sistema de registro. El navegador usa exclusivamente URL y clave pública. `SUPABASE_SECRET_KEY`/service role se usa solo en rutas servidoras y utilidades `lib/`.

## Flujos actuales

- **COOPIA 2.0:** es una capa transversal sólo del portal público, nunca del Centro de Gestión. Un `CoopiaProvider` mantiene una sola conversación temporal por pestaña, `journeyId`, `sessionId`, intención, servicio, resultado, acciones y contexto seguro de página mientras el usuario navega. La home usa el centro amplio; las demás páginas ofrecen el panel global bajo demanda. `lib/coopia/intents.ts` traduce primero reglas determinísticas a una necesidad canónica; después el adaptador existente selecciona herramientas server-side y devuelve acciones tipadas. La IA sólo redacta una orientación basada en conocimiento publicado para mensajes ambiguos: nunca confirma cobertura, planes, precios, cortes ni requisitos.
- **Cobertura:** `/api/coverage-check` consulta primero `service_address_coverage` exacto desde servidor. Si no existe coincidencia exacta, intenta Georef y, sólo si Georef no entrega coordenadas válidas, Geoapify server-side. Las coordenadas validadas se resuelven únicamente contra `coverage_zones` mediante PostGIS. La prioridad final es `exact_address > geographic_zone > nearby_address > unknown`; sólo expone un resultado comercial agregado, no infraestructura ni padrón.
- **Internet/fibra:** `/api/internet-leads` valida, exige consentimiento operativo y usa `create_internet_request_v2_with_outbox` para crear solicitud y evento outbox en una transacción. La entrega a n8n permanece desactivada sin variables configuradas. Cuando COOPIA resuelve cobertura desde cualquier página pública, transfiere sólo el resultado público tipado y la calle/altura temporalmente por `sessionStorage`, con TTL de 20 minutos y consumo único. El Centro de Internet reutiliza ese resultado sin repetir `/api/coverage-check`; el domicilio nunca viaja en URL ni analytics.
- **Noticias:** Google OAuth identifica al usuario, pero el acceso editorial exige además presencia en `news_admins`. Imágenes se cargan con URL firmada para administradores.
- **Canales públicos:** `public_contact_channels` es la fuente oficial administrable. Las rutas server-side leen mediante `lib/data/public-content.ts`; los componentes cliente leen la proyección permitida de `/api/public/contacts`. Los fallbacks de compatibilidad no reemplazan un canal publicado.
- **Contenido curado histórico:** `services`, `help_articles`, `faqs` y `internet_plans` sólo participan de respuestas públicas y COOPIA si están publicados. `lib/data/curated-content.ts` construye la proyección tipada server-side; los registros WordPress importados permanecen en borrador hasta revisión humana. `content_import_source_pages` y `content_import_provenance` guardan evidencia privada y no son una fuente de runtime.
- **Curaduría editorial IA:** `/admin/contenidos` usa rutas server-side protegidas por `requireNewsAdmin()`. Las propuestas se guardan en `content_editorial_proposals`, con huella del contenido, versión de prompt, hechos protegidos y estado de revisión. La IA sólo propone: no publica, no reemplaza registros publicados y no es una fuente de verdad para precios, contactos, cobertura, horarios o condiciones legales.
- **Reclamos:** el router `lib/complaints/router.ts` decide en `America/Argentina/Buenos_Aires` y recibe canales oficiales ya publicados. No crea `service_requests`: la interacción continúa en WhatsApp sin PII en el enlace ni en analytics.
- **Bandeja comercial:** `/admin/comercial` usa Google OAuth + `news_admins` y una API server-side para leer `internet_requests`. Reutiliza `request_type='fiber_waitlist'`; los contactos se abren manualmente y la demanda de fibra se agrega sin PII.

## Datos y acceso

| Clase | Tablas |
| --- | --- |
| Public read publicado | `services`, `help_articles`, `faqs`, `internet_plans`, `coverage_zones`, `service_alerts`, noticias publicadas |
| Server only | `internet_requests`, `service_requests`, `service_address_coverage`, `user_journeys`, `journey_events`, `integration_outbox`, `content_import_source_pages`, `content_import_provenance`, `content_import_validation_queue`, `content_editorial_proposals` |
| Admin only | `news_admins` y operaciones editoriales/de alertas/base de conocimiento |

Las tablas privadas tienen RLS y no otorgan lectura a `anon` ni a `authenticated`. Las funciones SECURITY DEFINER relevantes tienen `search_path=''` y ejecución limitada a `service_role`.

## Fase 3C — cobertura geográfica

La migración `20260817203507_geographic_coverage_zones` y cuatro zonas oficiales privadas están aplicadas exclusivamente en `coopsar-staging`. Las geometrías son `MultiPolygon` con SRID 4326 y la función PostGIS usa `ST_Covers`, incluyendo bordes. `Geoapify` es un proveedor server-side de dirección a coordenadas: no se expone al navegador, no decide cobertura, no recibe acceso a geometrías y no reemplaza PostGIS ni los datos oficiales de COOPSAR. El caso de aceptación España 450 resolvió `geographic_zone`, `FTTH`, `zoneMatch=true` y `coverage_validation`.

## CI

`quality` ejecuta instalación limpia, typecheck, lint, tests y build. `supabase-tests` inicia un stack efímero, reconstruye las migraciones, ejecuta pgTAP/RLS y `db lint`. Ninguno usa credenciales remotas o productivas.

## Trazabilidad de COOPIA

La persistencia temporal vive sólo en `sessionStorage` y se limita al historial necesario de la pestaña; no se replica como analytics. Los eventos best-effort no contienen texto de la conversación ni PII. Los eventos de la capa global incluyen contexto de página, envío, intención, servicio, acción mostrada, resultado, error, feedback, handoff y consulta no resuelta; el fallo de telemetría nunca impide una gestión real. `/admin/coopia` lee únicamente estas métricas agregadas desde servidor con `requireNewsAdmin()`. Una futura evolución multiagente puede delegar desde el resolver por dominio, pero el usuario siempre interactúa con COOPIA.

La presentación de una respuesta estructurada usa su `assistantResultKey` temporal para solicitar un único scroll suave del mensaje dentro de `.chat-log`, tras dos frames de render. Esto evita scrolls por feedback, analytics, resize, navegación pasiva o re-renders y permite que las tarjetas altas continúen con desplazamiento manual.

Fase 4F.1 quedó **CERRADA / validada en Preview** en el HEAD funcional `411403b36faa93b2557863b400296b13dad0035c`. No requirió migraciones ni cambios remotos; el siguiente alcance autorizado es Fase 4F.2, todavía sin implementación.

## Fase 4F.2 — interacción continua de COOPIA

COOPIA no equivale a un LLM: el modelo generativo es una capacidad opcional dentro de la asistencia. Cada turno conserva protección técnica por IP y sesión; las necesidades operativas claras siguen el resolver determinístico y las herramientas server-side sin consumir presupuesto LLM. Sólo una consulta ambigua solicita el modelo. Si ese presupuesto o proveedor no está disponible, COOPIA conserva el input, las acciones rápidas, formularios, cobertura, navegación y handoff humano mediante una respuesta funcional de degradación.

## Fase 4F.3 — superficie guiada por intención

`CoopiaConversation` conserva una única sesión temporal y usa el resolver existente como fuente canónica. La UI sólo presenta necesidades humanas, un paso estructurado activo, acciones visibles limitadas y un historial plegable. La clasificación, cobertura y enlaces continúan siendo decididos server-side; la presentación no crea una segunda detección ni persiste el texto de la conversación en analytics.

## Fase 4G.1 — consolidación de superficies públicas

La IA de información pública usa superficies reducidas, no una réplica de las 63 páginas WordPress históricas. `/internet` es canónica para contratación, cobertura, FTTH y otras tecnologías; los conceptos de fibra quedan en backend y la futura compatibilidad de `/fibra-optica` será un redirect permanente. `site_pages` aporta un hero y cards editables para los slugs de sistema y `/[slug]` resuelve primero una versión publicada, conservando `lib/service-pages.ts` como fallback con contactos dinámicos. La evolución de bloques tipados se documenta antes de modificar esquema en `docs/PUBLIC_CONTENT_ARCHITECTURE.md`.

## Fase 4G.2 — funnel de Internet

La ruta explícita `/internet` usa `getPublishedSitePage("internet")` solamente para contenido editorial de hero; el funnel sigue en componentes tipados. `InternetCenter` se reutiliza entre Home y página dedicada, `coverage-handoff` conserva resultados temporales para COOPIA y `/api/coverage-check` mantiene toda decisión de cobertura server-side. Los eventos comerciales generales se clasifican como servicio `internet`; los eventos técnicos continúan registrando su tecnología de fibra/FTTH. Ningún domicilio ni dato de contacto entra en URL o analytics.

## Fase 4G.2.2 — capa comercial sin duplicación

`InternetCommercialSections` es una composición server-rendered de `/internet`: recibe `getPublishedInternetPlans()` y `getPublishedInternetFaqs()` desde `lib/data/public-content.ts`, y no consulta desde componentes cliente. Sólo renderiza campos realmente publicados de cada plan; si no hay planes publicados, mantiene el CTA de cobertura/validación. `InternetCoopiaAction` continúa abriendo el único `CoopiaProvider` global, preservando sesión, journey y contexto de página.

## Estado del release candidate de Fase 2

El esquema reproducible consta de 13 migraciones canónicas, sincronizadas con `coopsar-staging`. El Lote Oficial 1 existe sólo en staging: 7 planes y 20 FAQ permanecen en `draft`, 10 contactos están publicados y 2.126 coberturas oficiales fueron importadas; 85 filas pendientes de revisión quedaron excluidas. Estos datos no se versionan en migraciones ni se trasladarán a producción sólo por integrar código.
