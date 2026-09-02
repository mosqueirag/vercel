# Conocimiento y límites de COOPIA

COOPIA responde con tono de asistencia formal y amable. Puede orientar, sugerir navegación, iniciar una acción explícita y derivar a un canal humano. La cuota por sesión se configura mediante `AI_SESSION_LIMIT` (staging actual: 4).

No es fuente de verdad para cobertura, precios, planes, cortes, requisitos o datos institucionales. La cobertura se resuelve solo por backend; los planes, alertas y contenidos deben venir de registros publicados de Supabase cuando hayan sido aprobados.

## Hardcode que debe migrarse antes de producción

- Contactos, horarios y enlaces de `CONTACT` en `lib/coopsar-data.ts`.
- `knowledgeBase`, acciones rápidas y estados de fallback del mismo archivo.
- Tarjetas de `internetPlans` sin precio confirmado.
- Páginas estáticas de navegación en `app/api/site-search/route.ts`.

Mientras no exista un registro oficial publicado, COOPIA debe responder que la confirmación está pendiente; no debe inferir ni completar datos.

## Contenido histórico curado

El WordPress anterior y su XML son evidencia de migración histórica, nunca una fuente de verdad consultada en runtime. El paquete curado se importa a tablas tipadas como borrador; `lib/data/curated-content.ts` consulta explícitamente sólo registros publicados. El manifiesto de conocimiento sirve para mapear intenciones a contenido tipado, pero los datos vivos —planes, contactos, alertas y cobertura— continúan en sus fuentes administrables y publicadas.

## Activación curada 4G.7.1

COOPIA pública consume exclusivamente `services`, `help_articles` y `faqs` con estado `published`; planes, contactos y alertas se resuelven por sus capas tipadas publicadas. Nunca recibe borradores, propuestas editoriales, provenance ni la cola de validación. La IA puede proponer mejoras para revisión humana, pero no aprueba, aplica ni publica. Los hechos protegidos (teléfonos, precios, URL, horarios, domicilios, velocidades y requisitos) conservan su validación explícita.

## Smoke 01 editorial — staging

- **SMOKE 01 EDITORIAL = PASS.** El artículo `Cómo estimar el consumo eléctrico de tu hogar` fue publicado mediante el workflow humano: tiene `published_at` definido y auditoría `published`.
- **COOPIA CONSUMER = PASS.** `getPublishedCuratedKnowledge()` incorpora los `help_articles` publicados y `getAssistantKnowledge()` los integra a la base oficial. Los otros cuatro elementos de Batch 01 continúan `draft` / `needs_validation` y no se consumen.
- **WEB ARTICLE SURFACE = PASS.** La ruta canónica published-only es `/centro-de-ayuda/[slug]`. No reutiliza `[slug]` ni expone borradores, fechas futuras, propuestas ni provenance.
- **PROPOSAL STATE CONSISTENCY = PASS.** La publicación se deriva de `target.status` y de la auditoría `published`; `content_editorial_proposals.status` conserva `applied` para significar “aplicada al borrador”. No existe un segundo estado persistido `published`.

## Cierre 4G.7.1 — limpieza de conocimiento público

El fixture sintético `articulo-test-staging` se archiva exclusivamente mediante una migración de datos idempotente y deja de cumplir las lecturas `published` de Web y COOPIA. No se elimina físicamente ni se modifica su `published_at` histórico. Al no tener `content_editorial_proposals` asociada, su housekeeping no usa la auditoría editorial; la trazabilidad es la migración, el commit y el historial de migraciones. **PUBLIC KNOWLEDGE CLEAN = PASS.**

## 4G.7.2A — páginas, sin conocimiento nuevo

Los `site_pages` draft no entran en COOPIA ni en `getAssistantKnowledge()`. El bridge editorial sólo prepara copy para revisión humana; no habilita generación IA, aplicación ni publicación en esta subfase.

## Continuidad pública

COOPIA acompaña la navegación pública durante una única sesión temporal. El contexto técnico de cada consulta incluye página, `journeyId`, `sessionId` y, cuando ya existe, intención y servicio. Esto aporta continuidad sin enviar contenido completo de las páginas al modelo. Las respuestas no resueltas y el feedback se registran solamente como métricas estructuradas, sin conservar el texto completo de la conversación.

## Fase 4F.3 — interfaz de resolución

COOPIA es una interfaz guiada por intención: una necesidad, un paso y una acción principal a la vez. La presentación no replica detección ni decide cobertura; las fuentes tipadas server-side continúan resolviendo datos vivos y COOPIA sólo usa contenido publicado.
## 4G.7.2B — smoke de copy top-level para `site_pages`

La primera propuesta de página se limita a `eyebrow`, `title` e `intro` de `centro-de-ayuda`. Los items y sus teléfonos, URLs, horarios, domicilio u otros hechos operativos no viajan al prompt, no pueden volver en el esquema estricto y no son editables desde Curaduría IA. `site_pages` draft y propuestas editoriales siguen fuera de COOPIA; sólo una página publicada podría integrarse a las superficies públicas existentes.
