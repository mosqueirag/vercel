# Arquitectura

Next.js App Router entrega la UI y las rutas servidoras; Supabase staging es el sistema de registro. El navegador usa exclusivamente URL y clave pública. `SUPABASE_SECRET_KEY`/service role se usa solo en rutas servidoras y utilidades `lib/`.

## Flujos actuales

- **COOPIA:** consulta → detección de intención → respuesta OpenAI con fallback oficial → acción estructurada → tracking mínimo. OpenAI no confirma cobertura, planes, precios, cortes ni requisitos.
- **Cobertura:** `/api/coverage-check` consulta `service_address_coverage` desde servidor; solo expone un resultado comercial agregado, no infraestructura ni padrón.
- **Internet/fibra:** `/api/internet-leads` valida, exige consentimiento operativo y usa `create_internet_request_v2_with_outbox` para crear solicitud y evento outbox en una transacción. La entrega a n8n permanece desactivada sin variables configuradas.
- **Noticias:** Google OAuth identifica al usuario, pero el acceso editorial exige además presencia en `news_admins`. Imágenes se cargan con URL firmada para administradores.
- **Canales públicos:** `public_contact_channels` es la fuente oficial administrable. Las rutas server-side leen mediante `lib/data/public-content.ts`; los componentes cliente leen la proyección permitida de `/api/public/contacts`. Los fallbacks de compatibilidad no reemplazan un canal publicado.

## Datos y acceso

| Clase | Tablas |
| --- | --- |
| Public read publicado | `services`, `help_articles`, `faqs`, `internet_plans`, `coverage_zones`, `service_alerts`, noticias publicadas |
| Server only | `internet_requests`, `service_requests`, `service_address_coverage`, `user_journeys`, `journey_events`, `integration_outbox` |
| Admin only | `news_admins` y operaciones editoriales/de alertas/base de conocimiento |

Las tablas privadas tienen RLS y no otorgan lectura a `anon` ni a `authenticated`. Las funciones SECURITY DEFINER relevantes tienen `search_path=''` y ejecución limitada a `service_role`.

## CI

`quality` ejecuta instalación limpia, typecheck, lint, tests y build. `supabase-tests` inicia un stack efímero, reconstruye las migraciones, ejecuta pgTAP/RLS y `db lint`. Ninguno usa credenciales remotas o productivas.

## Estado del release candidate de Fase 2

El esquema reproducible consta de 13 migraciones canónicas, sincronizadas con `coopsar-staging`. El Lote Oficial 1 existe sólo en staging: 7 planes y 20 FAQ permanecen en `draft`, 10 contactos están publicados y 2.126 coberturas oficiales fueron importadas; 85 filas pendientes de revisión quedaron excluidas. Estos datos no se versionan en migraciones ni se trasladarán a producción sólo por integrar código.
