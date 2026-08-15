# Fase 1B — reconciliación de Supabase

Fecha del inventario: 2026-08-15. Proyecto remoto inspeccionado en modo lectura: `hfmasofcekigldbysryg`.

## Drift confirmado

| Estado remoto | Estado anterior en el repositorio | Reconciliación local |
| --- | --- | --- |
| `20260814002713 create_news_cms` aplicada | faltaba | reconstruida desde catálogo remoto |
| `20260815012755 service_address_coverage` aplicada | mismo SQL con versión `20260814214750` | versión alineada con el historial remoto |
| `20260815123657 journey_tracking_phase_a` aplicada | mismo SQL con versión `20260815123300` | versión alineada |
| `20260815124049 harden_journey_tracking` aplicada | mismo SQL con versión `20260815124023` | versión alineada |
| sin migración de plataforma aplicada | existía un borrador local temprano y no aplicado | reemplazado por una migración nueva, aditiva y posterior |

No existe una branch de desarrollo de Supabase. Ningún archivo de esta fase fue aplicado al proyecto remoto.

## Orden reproducible propuesto

```text
supabase/migrations/
├── 20260814002713_create_news_cms.sql
├── 20260815012755_service_address_coverage.sql
├── 20260815123657_journey_tracking_phase_a.sql
├── 20260815124049_harden_journey_tracking.sql
├── 20260815143917_secure_news_helpers.sql
└── 20260815143921_extend_digital_platform.sql
```

Las primeras cuatro versiones coinciden con `supabase_migrations.schema_migrations` remoto. Las dos últimas deben probarse en una base vacía y luego en una branch de desarrollo antes de autorizar su aplicación.

## Decisión sobre duplicaciones

No se crea `assistant_events`: `journey_events` ya representa eventos anónimos del asistente y navegación, incluye intención, agente, herramienta, resultado, metadata y duración, y está aislada del navegador. Crear otra tabla dividiría el historial operativo. La migración agrega un comentario de catálogo que formaliza `journey_events` como almacén canónico.

`coverage_zones` no sustituye ni duplica el padrón privado: contiene únicamente zonas generales publicables. `service_address_coverage` conserva las direcciones exactas y sigue siendo `SERVER ONLY`.

## Aplicación manual segura

1. Crear una branch de Supabase o un proyecto temporal vacío con PostgreSQL 17.
2. Vincular el CLI exclusivamente a ese entorno.
3. Ejecutar `supabase db reset` localmente o `supabase migration up` en la branch.
4. Ejecutar `supabase test db`.
5. Comparar el esquema resultante con el remoto mediante `supabase db diff --linked --schema public,private,storage` sin aplicar el resultado automáticamente.
6. Validar Google OAuth, administración de noticias, imágenes y APIs server-side.
7. Recién con autorización expresa, ejecutar las dos migraciones nuevas sobre producción. No usar `migration repair` ni modificar el historial remoto antes de confirmar que las cuatro versiones reconciliadas corresponden byte/semánticamente al esquema aplicado.
