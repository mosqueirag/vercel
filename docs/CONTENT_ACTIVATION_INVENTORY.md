# Inventario de activación de contenido — Fase 4G.7.1

Fecha de auditoría: 2026-08-31. Entorno consultado: `coopsar-staging` (`wwvqlbycwzxvjnexklwg`).

El contenido histórico importado es evidencia curada para revisión editorial. WordPress y su XML no participan en runtime. La publicación siempre requiere una decisión humana; ningún lote de IA publica ni altera registros `published`.

## Inventario real de staging

| Tipo | Total | Draft | Published | Archived | Con provenance |
| --- | ---: | ---: | ---: | ---: | ---: |
| Servicios | 11 | 9 | 2 | 0 | 9 |
| Artículos de ayuda | 25 | 24 | 1 | 0 | 24 |
| FAQ | 32 | 30 | 2 | 0 | 11 |
| Planes Internet | 12 | 8 | 0 | 4 | 4 |
| Canales públicos | 23 | 13 | 10 | 0 | 13 |
| Páginas CMS | 12 | 12 | 0 | 0 | 0 |
| Noticias | 0 | 0 | 0 | 0 | 0 |

Hay 156 relaciones de provenance y 10 validaciones abiertas. Esas validaciones son de origen/importación; no se asume una relación uno a uno con cada entidad sin revisión humana.

El inventario de borradores de las tres tablas editoriales es **63** (`9 services + 24 help_articles + 30 faqs`). El selector histórico existente utiliza solamente los 44 que tienen provenance histórico apto para ese flujo (`9 + 24 + 11`). Los 19 FAQ draft restantes permanecen fuera del lote hasta tener provenance histórico explícito; no se los fuerza ni se inventa procedencia.

## Estado de curaduría IA existente

Existen 57 propuestas privadas: 15 de riesgo bajo, 30 medio, 10 alto y 2 restringidas. Por estado: 2 aplicadas, 1 aprobada, 13 generadas, 40 con validación requerida y 1 rechazada. No se usa este inventario como autorización para publicar.

El batch editorial autorizado tiene un máximo de cinco candidatos y sólo usa `help_article`, `faq` y `service` históricos en `draft`. Planes y contactos quedan excluidos. El endpoint administrativo revalida la huella y el estado `draft` antes de persistir; se reutiliza una propuesta vigente y no se duplica.

## Mapa de fuentes públicas

| Fuente | Web pública | COOPIA pública | Pipeline editorial |
| --- | --- | --- | --- |
| `services` | Páginas de servicio | Sí, sólo `published` | Sí |
| `help_articles` | Centro de ayuda | Sí, sólo `published` | Sí |
| `faqs` | FAQ | Sí, sólo `published` | Sí |
| `internet_plans` | `/internet` | Sí, sólo `published` | No, requiere gobernanza comercial |
| `public_contact_channels` | CTAs públicos | Sí, sólo `published` | No, requiere validación de hechos protegidos |
| `service_alerts` | Estado operativo | Sí, sólo `published` | No |
| `site_pages` | Cuerpo de páginas | No | No — gap explícito para 4G.7.2 |
| `news_articles` | Noticias | No | No |

## Priorización humana

P1: revisar primero propuestas `generated` de artículos/FAQ/servicios sin flags, verificando título, resumen, CTA y provenance.  
P2: resolver las diez validaciones abiertas y cualquier hecho protegido (teléfono, precio, URL, horario, domicilio, velocidad o requisito).  
P3: definir la integración editorial de `site_pages` en 4G.7.2 sin crear un CMS paralelo.

No hay eliminación automática ni consolidación de duplicados durante esta fase. Las diferencias históricas se agrupan por revisión humana y permanecen auditables.

## Primer lote para revisión humana

`READY_FOR_HUMAN_REVIEW` se calcula como: candidato histórico `draft`, propuesta vigente `generated` de riesgo `low`, sin validación abierta vinculada por provenance y sin estado `stale`. El resultado real es 12. `READY_TO_PUBLISH` es 0: publicar además exige propuesta `applied`, riesgo bajo, ausencia de flags y validaciones, y candidato aún `draft`.

Se reutilizan las siguientes cinco propuestas vigentes; no se genera IA ni se escribe en staging.

| Entity type | Title | Proposal status | Risk | Validation pending | Provenance count | Source slugs | AI call needed | Review priority |
| --- | --- | --- | --- | --- | ---: | --- | --- | --- |
| `service` | ADECOOP | generated | low | no | 4 | `adecoop`, `conoce-adecoop`, `proyectosadecoop`, `talleres` | no | P1 |
| `service` | Energía | generated | low | no | 1 | `home-3` | no | P1 |
| `service` | Institucional | generated | low | no | 4 | `estatuto`, `historia`, `ley-de-cooperativas`, `r-s-e` | no | P2 |
| `help_article` | Actualizar tus datos de contacto | generated | low | no | 2 | `actualizacion-de-datos`, `tramites` | no | P1 |
| `help_article` | Cómo estimar el consumo eléctrico de tu hogar | generated | low | no | 1 | `datos-de-consumo` | no | P1 |

El lote termina en `generated`: no se aprueba, aplica ni publica desde esta fase. Las cuatro propuestas restantes fuera de los estados `generated`/`needs_validation` son 2 `applied`, 1 `approved` y 1 `rejected`; no existen propuestas `published` ni `stale`.
