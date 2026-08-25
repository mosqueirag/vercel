# Arquitectura de contenido público

## Alcance y decisión de producto

Esta arquitectura consolida el contenido histórico curado de COOPSAR sin reproducir el WordPress anterior. WordPress y `content_import_*` son evidencia de migración privada; no son una fuente de runtime. El contenido público y COOPIA sólo pueden consumir proyecciones tipadas con estado `published`.

**Decisión 4G.2:** Internet y Fibra Óptica forman una única experiencia pública: **Internet**, con URL canónica `/internet`. `/fibra-optica` redirige permanentemente a `/internet` para conservar compatibilidad de URLs. Los conceptos `fiber`, `FTTH`, `fiber_coverage_check`, `fiber_coverage_result` y `fiber_waitlist` se conservan en backend, cobertura, analítica y operación comercial.

La experiencia pública responde a `necesidad → respuesta → acción`, no a un archivo de páginas históricas.

## Auditoría de staging (solo lectura, 2026-08-24)

| Fuente | Total | Estado / resultado |
| --- | ---: | --- |
| `content_import_source_pages` | 63 | 18 archive, 6 discard, 13 merge, 12 rewrite, 14 validate |
| `content_import_provenance` | 156 | 156 unchanged; privada |
| `content_import_validation_queue` | 10 | 5 P0, 4 P1, 1 P2 abiertos |
| `services` | 11 | 9 draft, 2 published |
| `help_articles` | 25 | 24 draft, 1 published |
| `faqs` | 32 | 30 draft, 2 published |
| `internet_plans` | 12 | 11 draft, 1 archived |
| `public_contact_channels` | 23 | 13 draft, 10 published |
| `content_editorial_proposals` | 57 | propuestas privadas con estados de revisión; no son contenido público |
| `content_editorial_proposal_audit` | 9 | auditoría privada |
| `site_pages` | 12 | 12 draft, 0 published |

No se detectaron claves `import_key` duplicadas en FAQ ni contactos. Las 28 fuentes sin relación de provenance son coherentes con decisiones `archive` o `discard`: se preservan como registro histórico y no se convierten en contenido público. Las validaciones P0/P1/P2 bloquean cualquier promoción automática de hechos sensibles.

## Arquitectura pública objetivo

| Superficie | Necesidad principal | Fuente de verdad / acción | Decisión |
| --- | --- | --- | --- |
| `/internet` | Contratar, consultar cobertura o soporte | resolver de cobertura, planes `published`, solicitudes, contactos publicados | Superficie comercial única; incorpora FTTH como tecnología |
| `/energia` | Suministro, consumo, cortes y conexión | alertas publicadas, contactos publicados, ayuda publicada | Mantener página |
| `/telefonia` | Soporte y gestiones | contactos publicados, ayuda publicada | Mantener página liviana |
| `/sepelio` | Acompañamiento y guardia | canal publicado, contenido revisado | Mantener, con tono sobrio y operativo; no comercial |
| `/tramites` | Elegir procedimiento | acciones COOPIA, ayuda publicada | Mantener como selector de acciones; no duplicar procedimientos |
| `/medios-de-pago` | Pagar, deuda o factura | Oficina Virtual y canales publicados | Mantener como acción operativa |
| `/cortes-programados` | Ver estado/alertas | `service_alerts` publicados | Mantener; sin alertas se informa estado verificable |
| `/centro-de-ayuda` | Buscar orientación | help articles/FAQ publicados + COOPIA | Mantener como descubrimiento, no duplicar páginas históricas |
| `/institucional` | Conocer cooperativa | contenido institucional revisado | Mantener; separar hechos históricos de autoridades actuales |
| `/contacto` | Elegir canal | `public_contact_channels` publicados | Mantener como proyección dinámica |
| `/privacidad` | Comprender uso de datos | texto legal aprobado | Mantener |

Noticias, comunicados, multimedia, ofertas, planos y documentos legales históricos no agregan rutas públicas por defecto. Se conservan como archivo/provenance o se incorporan a Noticias/Institucional únicamente después de revisión humana y vigencia confirmada.

## Diseño futuro de `/internet`

1. Hero con una única acción primaria: **Consultar cobertura**.
2. Beneficios de conectividad con afirmaciones revisadas.
3. Consulta de domicilio y resultado técnico: FTTH, otra tecnología o validación requerida.
4. Planes compatibles, exclusivamente `published` y compatibles con el resultado server-side.
5. Contratación o solicitud comercial; sin oferta publicada, contacto comercial/validación, nunca una promesa inventada.
6. Sin fibra disponible: `fiber_waitlist` como interés futuro, sólo cuando la resolución lo indique.
7. Soporte para clientes existentes, FAQ publicada y COOPIA contextual.

La composición reutilizará el resolver de cobertura y los eventos existentes: `fiber_coverage_check`, `fiber_coverage_result`, `internet_plans_viewed`, `plan_view`, `lead_started`, `lead_created`, `fiber_waitlist_started` y `fiber_waitlist_created`. Para 4G.2 se podrá añadir `internet_page_view` y `whatsapp_click` sólo si no duplican la trazabilidad actual.

## Matriz de fuentes históricas

| Fuentes / decisión de migración | Clase | Destino público propuesto | Uso COOPIA | Validación humana |
| --- | --- | --- | --- | --- |
| `homeftth`, `contrata`, `soporte-tecnico`, `alta`, `bajaservicios`, `solicitud-del-servicio` | Comercial / ayuda | `/internet`: cobertura, contratación, soporte y FAQ | cobertura, interés Internet/Fibra, soporte | Sí: precios, velocidades, condiciones, cobertura |
| `factura-electronica-2`, `mas-formas-de-pago`, `mercadopago`, `pagardeuda`, `debito-automatico`, `baja-debito-automatico` | Operativo | `/medios-de-pago` + acciones COOPIA | pago/facturas | Sí: URLs, medios, condiciones |
| `actualizacion-de-datos`, `tramites`, `requisitos`, `instructivo` | Operativo / ayuda | `/tramites` y `/centro-de-ayuda` | procedimientos | Sí: requisitos y documentación |
| `actualiza-planilla-de-sepelio` | Operativo sensible | `/sepelio`: qué hacer y guardia | servicio de sepelio/handoff | Sí: cobertura, requisitos y canales |
| `ahorro-de-energia`, `datos-de-consumo`, `electrodependientes`, `tarifa-social`, `reglamento-energia` | Ayuda / operativo sensible | `/energia`, simulador y ayuda | energía/consumo | Sí: tarifa, elegibilidad y reglamentos |
| `adecoop`, `conoce-adecoop`, `proyectosadecoop`, `r-s-e`, `talleres` | Institucional | `/institucional`, sección cooperativismo | consulta institucional | Sí: vigencia, autoridades e hitos |
| `historia`, `consejo-de-administracion`, `estatuto`, `ley-de-cooperativas`, `reglamento` | Institucional / legal | `/institucional` o archivo documental | solo referencias aprobadas | Sí, obligatoria |
| `canales`, `contacto`, `guia-telefonica-2` | Operativo sensible | `/contacto` | handoff/contacto | Sí: teléfonos, horarios, dirección |
| `cortes-*`, `comunicados`, `blog`, `columna-radial` | Operativo / archivo | `service_alerts` o `/noticias`, no páginas duplicadas | alertas/noticias publicadas | Sí: vigencia y fecha |
| `faqs*`, `lectura-de-factura` | Ayuda | `/centro-de-ayuda` | FAQ publicada | Sí cuando contengan hechos protegidos |
| `cuadro-tarifario`, `cambiodetarifa`, `ofertas`, `planos`, `protocolo-sss` | Sensible / archivo | Sin destino público automático | no usar hasta aprobación | Sí, obligatoria |
| `asamblea25`, `multimedia`, `trabaja-con-nosotros`, `modelo-creativo`, `informacion*`, `sitio24` | Archivo / descarte | Sin destino público actual | no usar | Sí si se recupera |

Las 63 fuentes quedan cubiertas por su decisión de migración (`archive`, `discard`, `merge`, `rewrite` o `validate`) y por esta matriz de destino. Una fuente archivada o descartada no debe convertirse en una página pública sólo por existir en el histórico.

## Contenido por clase y reglas de publicación

- **Operativo:** guardias, cortes, pagos y trámites. Se resuelve desde alertas, Oficina Virtual y contactos `published`; nunca desde texto histórico congelado.
- **Comercial:** Internet, planes, cobertura, contratación y waitlist. Cobertura y compatibilidad se deciden server-side; planes requieren publicación humana.
- **Institucional:** historia, cooperativismo, autoridades y comunidad. Historia puede conservarse con fecha; autoridades y cargos requieren fecha/vigencia.
- **Ayuda:** FAQ, requisitos y explicaciones. Se publica únicamente tras curaduría.
- **Sensible / validación:** precio, teléfono, URL, horario, domicilio, velocidad, requisito, autoridad, cobertura y condiciones contractuales. No se promociona por IA ni por importación histórica.

COOPIA recibe la misma proyección publicada que la web mediante la capa server-side tipada. No consulta `content_import_*`, borradores, propuestas editoriales, planes draft ni contactos draft.

## `site_pages`: capacidad y evolución propuesta

El modelo actual contiene `slug`, `eyebrow`, `title`, `intro`, `image_url`, `items`, `status` y `sort_order`. El administrador puede editar las 12 páginas de sistema, sus cards y el estado draft/published. `/[slug]` usa primero una fila publicada y conserva `lib/service-pages.ts` como fallback; `withPublicContacts()` mantiene contactos dinámicos desde `public_contact_channels`.

Es suficiente para hero + introducción + accesos. No representa una página comercial rica por bloques, CTA tipadas, SEO específico, FAQ asociada, formulario de cobertura, datos de vigencia o secciones con distinta procedencia. En 4G.2 la evolución recomendada es **aditiva**: bloques tipados versionados (`hero`, `coverage`, `plans`, `faq`, `contact`, `notice`) y metadata editorial, manteniendo el fallback actual hasta publicación humana. No se crea migración en 4G.1.

Hardcodes a retirar gradualmente, sin perder fallback hasta reemplazo publicado: contenido de `lib/service-pages.ts`, imágenes de `app/[slug]/page.tsx`, y valores de compatibilidad de `lib/coopsar-data.ts`. Los canales publicados ya ganan sobre los fallbacks.

## Implementación 4G.2

`app/internet/page.tsx` compone un hero comercial sobrio, soporte mediante COOPIA y el mismo `InternetCenter` que usa la Home. El motor de domicilio, cobertura y solicitud no se duplica: `/api/coverage-check` continúa decidiendo cobertura server-side y `/api/internet-leads` registra solicitudes con consentimiento operativo separado del opt-in de marketing.

Los planes sólo se muestran si el resolver devuelve planes compatibles `published`. Sin planes publicados, la experiencia informa la ausencia de oferta online y conserva una acción de validación o contacto comercial sin inventar precio, velocidad ni disponibilidad. El handoff de COOPIA usa el contrato temporal existente en `sessionStorage`, sin dirección en URL ni analítica.

## Prioridades posteriores a 4G.2

1. Evolucionar el contenido editorial de `/internet` con bloques tipados sólo si hace falta, manteniendo cobertura y planes server-side.
2. Convertir las fuentes de ayuda/institucional validadas en bloques publicados, empezando por baja sensibilidad.
3. Diseñar `/sepelio` como flujo operativo respetuoso y no comercial.
4. Sustituir los fallback hardcodeados sólo cuando una proyección publicada equivalente esté validada.
5. Resolver las 10 validaciones abiertas antes de publicar datos sensibles.

## No objetivos de 4G.1

No se publican drafts, no se alteran tablas ni RLS, no se crea un CMS paralelo, no se ejecutan redirects, no se rediseña `/internet` y no se modifica producción.
# Fase 4G.2.2 — experiencia comercial de Internet

`/internet` añade una capa comercial alrededor de los contratos públicos existentes, sin crear una segunda fuente de datos. El hero dirige al módulo `#contratar`; la cobertura, las tecnologías, los planes compatibles y la waitlist conservan sus resolvers y flujos tipados. Las FAQ y los planes mostrados se obtienen server-side y exclusivamente con `status='published'`. La investigación de producto y sus decisiones están en `docs/RESEARCH_INTERNET_COMMERCIAL_EXPERIENCE.md`.
