# Validación de contenido — Servicio de Sepelio

La experiencia pública de `/sepelio` prioriza la atención urgente y no publica beneficios, condiciones, coberturas ni requisitos que no estén confirmados. Esta auditoría no crea ni modifica datos remotos.

| Contenido | Fuente de verdad | Estado para la web | Acción |
| --- | --- | --- | --- |
| Guardia de sepelio | `public_contact_channels`, canal `funeral/emergency` publicado | Disponible en staging | Enlace `tel:` generado desde el contacto publicado; el fallback existente sólo cubre ausencia temporal de la fuente. |
| Título e introducción | `site_pages` publicada; fallback vigente `lib/service-pages.ts` | Disponible | No se inventó contenido nuevo. |
| Grupo familiar y cobertura | Contenido institucional vigente, sin detalle contractual confirmado | Orientación únicamente | COOPIA deriva al canal correcto; no se muestran condiciones ni beneficios no validados. |
| FAQ de sepelio | `faqs` con `status=published` | Sin FAQ relevante publicada detectada en la auditoría pública | La sección se omite hasta que exista contenido publicado. |
| Imagen principal | Activo institucional existente | Provisoria | Validar una imagen propia y sobria del servicio antes de su publicación definitiva. |

## Reglas de publicación

- COOPIA y la página pública leen sólo registros `published` desde la capa server-side tipada.
- Drafts, propuestas editoriales, contactos no publicados y datos internos no se exponen en `/sepelio`.
- El flujo urgente no solicita DNI, domicilio, teléfono, correo ni descripción sensible; abre el canal oficial de atención.
- La aprobación humana sigue siendo obligatoria para publicar nuevos datos del servicio.
