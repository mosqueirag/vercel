# Plataforma digital COOPSAR

## Estado real de Supabase

El proyecto remoto contiene el CMS de noticias, el padrón privado de cobertura y la telemetría de recorridos. La historia local fue reconciliada con las cuatro versiones que figuran como aplicadas remotamente. Las migraciones de hardening y expansión de la plataforma están preparadas, pero **no fueron aplicadas** porque no existe una branch segura de Supabase.

La referencia operativa y el diagnóstico de drift están en `supabase/MIGRATION_RECONCILIATION.md`.

## Clasificación de datos

### PUBLIC READ

- `news_articles`: solo noticias publicadas y cuya fecha ya comenzó.
- `services`: solo servicios publicados.
- `help_articles`: solo artículos publicados.
- `faqs`: solo preguntas publicadas.
- `internet_plans`: solo planes publicados; precio y velocidad pueden quedar nulos hasta existir datos oficiales.
- `coverage_zones`: solo orientación general publicada, nunca domicilios.
- `service_alerts`: solo alertas publicadas, vigentes y dentro de sus fechas.
- `storage.objects` del bucket `news-images`: lectura pública de imágenes publicadas por el CMS.

### SERVER ONLY

- `service_address_coverage`: padrón exacto por calle y altura; el navegador no tiene grants.
- `internet_requests`: datos de contacto comercial; solo `service_role`.
- `user_journeys`: recorridos anónimos o asociados; solo servidor.
- `journey_events`: almacén canónico de eventos del asistente y navegación; solo servidor.

### ADMIN ONLY

- `news_admins`: lista de correos autorizados; lectura limitada a administradores autenticados.
- Borradores y escritura de `news_articles`.
- Escritura de `services`, `help_articles`, `faqs`, `internet_plans`, `coverage_zones` y `service_alerts`.
- Escritura de imágenes en `news-images`.

Las políticas administrativas usan `private.is_news_admin()`. El esquema `private` no está expuesto por PostgREST; `anon` no tiene `USAGE` ni `EXECUTE`, y la función anterior en `public` se elimina en la migración de hardening.

## Relaciones

- `help_articles.service_id`, `faqs.service_id` e `internet_plans.service_id` → `services.id` (`SET NULL`).
- `coverage_zones.service_id` → `services.id` (`CASCADE`), porque la zona pública carece de sentido sin el servicio.
- `service_alerts.service` → `services.slug` (`RESTRICT`). El nombre de la columna se conserva para compatibilidad con la API existente.
- `journey_events.journey_id` → `user_journeys.journey_id` (`CASCADE`).
- `internet_requests.journey_id` → `user_journeys.journey_id` (`SET NULL`).
- `user_journeys.user_id` → `auth.users.id` (`SET NULL`).

## Flujos vigentes

- El asistente envía mensajes a `POST /api/chat`. La ruta valida el payload, limita por IP y sesión, y llama a OpenAI únicamente desde el servidor. Sin `OPENAI_API_KEY`, responde con orientación determinista.
- Las solicitudes de internet llegan a `POST /api/internet-leads`, se validan y se guardan con `SUPABASE_SECRET_KEY`. El navegador nunca recibe la clave.
- Los webhooks de n8n son opcionales y contienen únicamente el tipo de evento y número de solicitud.
- `/admin/*` usa Google OAuth de Supabase con PKCE y cookies de servidor. El correo se valida contra `news_admins`; una cuenta Google válida no autorizada no ingresa.
- El CMS conserva el bucket público `news-images`, limitado a JPEG, PNG o WebP y 10 MB por archivo. Solo administradores pueden escribir.

## Controles de seguridad

- RLS está habilitado en todas las tablas expuestas.
- Las tablas privadas revocan grants a `anon` y `authenticated` y agregan políticas explícitas de denegación.
- `private.is_news_admin()` es `SECURITY DEFINER`, tiene `search_path = ''`, usa nombres calificados y no es RPC pública.
- `set_news_updated_at()` y `set_platform_updated_at()` fijan `search_path = ''` y no son ejecutables directamente por roles web.
- Las claves `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY` y `N8N_WEBHOOK_SECRET` permanecen exclusivamente en el servidor.
- No se almacenan conversaciones completas por defecto; `journey_events` registra eventos estructurados sin prompts ni PII.

## Validación de base

`supabase/tests/database/phase_1b_rls.sql` comprueba lectura pública, denegación de tablas privadas, inserción server-side, alertas, noticias y autorización administrativa. Debe ejecutarse con `supabase test db` en Docker/local o en una branch de desarrollo, nunca directamente sobre producción.

## Pendiente para Fase 2

- Aplicar y validar las dos migraciones nuevas en una branch Supabase.
- Cargar contenido oficial y administrar los nuevos catálogos.
- Conectar nuevas herramientas de COOPIA solo después de aprobar esta base.
- Integraciones CRM, Brevo y automatizaciones completas de n8n continúan fuera de alcance.
