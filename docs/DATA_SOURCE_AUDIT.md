# Data source audit — Internet/Fibra

| Dato | Fuente actual | Fallback | Administración |
| --- | --- | --- | --- |
| Planes, tecnología, velocidad y precio | `internet_plans` publicados | ninguno comercial; “Consultar precio”/pendiente | `/admin/internet/planes` |
| Contactos públicos | `public_contact_channels` mediante DAL server-side | mensaje de indisponibilidad, nunca un número viejo | `/admin/configuracion/contactos` |
| Cobertura exacta | `service_address_coverage`, solo backend | `unknown` y lista de espera | importador + administración posterior |
| Cobertura zonal | `coverage_zones` publicados | sin confirmación | administración futura |
| FAQ y ayuda | `faqs`, `help_articles`, `services` publicados | respuesta de información no disponible | administración de conocimiento futura |
| Alertas operativas | `service_alerts` publicados | `unknown` | administración de alertas |

## Hardcode identificado

`lib/coopsar-data.ts` contiene candidatos históricos: teléfonos, WhatsApp, Oficina Virtual, horario, domicilio, tarjetas de planes y texto de conocimiento. Ninguno se considera oficial por el solo hecho de estar en código. Esta fase evita usarlo como fuente comercial en COOPIA y sus tools; componentes de presentación restantes deben migrarse después de que COOPSAR publique los canales correspondientes.

## TEST vs oficial

`supabase/seed.sql` contiene únicamente filas sintéticas visibles como `TEST`, `Plan TEST sin precio` o similar. No son datos institucionales ni se deben copiar a producción. Contenido oficial requiere `status='published'`, `published_at <= now()` y aprobación interna fuera del repositorio. Los borradores y archivados no tienen lectura pública.

## Acceso de contactos públicos

`anon` y `authenticated` no tienen `SELECT` directo sobre `public_contact_channels`: RLS filtra filas, pero no columnas. Las rutas públicas usan `lib/data/public-content.ts`, que corre con rol de servidor y devuelve una proyección allowlist sin `value`, `updated_by_email` ni timestamps internos. Los endpoints administrativos requieren `requireNewsAdmin()` y operan server-side.

## Cobertura

La dirección y altura solo se consultan por `/api/coverage-check`; nunca se otorga lectura directa de `service_address_coverage`. Una coincidencia exacta conserva su estado; una altura cercana siempre devuelve `nearby`, nunca `available`. La metadata `source` y `verified_at` permite auditar el origen sin registrar topología de red.
