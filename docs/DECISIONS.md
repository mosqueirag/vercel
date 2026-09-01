# Decisiones técnicas

## 4G.7.1 — Activación de contenido curado

- El corpus histórico se mantiene separado de las fuentes vivas: WordPress/XML es únicamente evidencia de migración, no una consulta de runtime.
- La IA propone; la revisión humana aplica y publica. Ningún lote puede publicar, reescribir `published` ni decidir hechos protegidos.
- Web pública y COOPIA consumen las mismas proyecciones tipadas `published`; `provenance`, `validation_queue` y propuestas son privados.
- `site_pages` es una fuente pública administrable pero aún no participa del pipeline editorial ni del contexto público de COOPIA. Es el gap explícito de 4G.7.2.
- El Smoke 01 confirma que COOPIA consume un `help_article` publicado desde la proyección tipada. La publicación está auditada, no habilita publicación masiva y no cambia los otros cuatro registros del Batch 01, que permanecen en revisión.
- La superficie web de artículos y el ciclo de vida de propuestas se mantienen separados: la ruta genérica `[slug]` no debe asumir `help_articles`, y `applied` hoy significa “aplicada al borrador”, no “publicada”. Antes de introducir un estado `published` en propuestas se deberá decidir si es estado persistido o una proyección derivada de candidato + auditoría.

## 4G.6 — Estado operativo de Energía

- `unknown` nunca se presenta como servicio operativo: significa “Sin información operativa confirmada”.
- El estado operativo se lee exclusivamente de `service_alerts` publicados; el render público no emite analítica de herramientas de COOPIA.
- La guardia es una capacidad opcional resuelta desde contactos publicados; no existe fallback telefónico hardcodeado.
- Un corte programado (mantenimiento publicado) no se confunde con una interrupción imprevista.
- Un error de lectura nunca se presenta como ausencia de alertas. `maintenance` no equivale por sí mismo a corte programado: `service_alerts` no dispone de tipo, categoría ni discriminador de programación. Evaluar un discriminador explícito queda como P2.

## 4G.5 — Centro inteligente de trámites

`/tramites` es una superficie pública dedicada de decisión, no un catálogo genérico de enlaces ni un CMS paralelo. Su registro tipado sólo enumera capacidades ya implementadas: cada gestión abre la única conversación global de COOPIA, utiliza una ruta interna real o resuelve un canal publicado dinámicamente. Pagos consulta `billing/virtual_office` publicado y conserva `/medios-de-pago` como fallback seguro; Sepelio usa sus rutas específicas. No se ofrece reconexión como trámite online hasta contar con un flujo operativo confirmado. El evento best-effort `procedure_selected` conserva únicamente procedimiento, intención, tipo de resolución y origen, sin texto libre ni PII.

## 4G.4.1 — Quick Actions por necesidad

Los accesos de la Home representan necesidades cotidianas y tienen destinos canónicos tipados, no una taxonomía interna. El pago resuelve el canal `billing/virtual_office` publicado y conserva `/medios-de-pago` como fallback seguro. Las cuatro prioridades son pago, energía, Internet y Sepelio; Internet absorbe la entrada de cobertura/fibra para evitar duplicidad. No incluyen teléfonos ni datos personales; el tracking `quick_access_click` es best-effort y sólo registra identificadores agregados de acción y destino cuando ya existe una sesión de navegación.

## 4G.4.1.6 — Canal digital COOP Online

La URL oficial de Google Play de COOP Online se conserva en una única configuración pública tipada. Su promoción pertenece exclusivamente a superficies públicas: Home la presenta como tarjeta destacada dentro del grid de acciones y como canal complementario de Atención, sin bloque autónomo ni promoción en Footer. Cada clic registra solamente plataforma, origen y destino en `app_download_click`; no transporta información personal, contenido conversacional ni parámetros de URL.

## 4G.4.2 — Sin personalización persistente de Home

La adaptación de Home se deriva solamente del `intent` y `service` temporales de `NavigationProvider`, ya existentes en `sessionStorage`. No hay cookies nuevas, perfil, historial cross-session, fingerprinting, endpoints de personalización ni otra llamada IA. El orden DOM se recalcula antes del render para coincidir con el orden visual; `home_priority_applied` es un evento agregado, sin PII y deduplicado por combinación de journey, intención y prioridad durante la sesión.

## 4G.4.2.2 — Quality Gate adaptativo

Las necesidades claras se resuelven primero mediante el resultado estructurado tipado; el LLM es enriquecimiento opcional y nunca una dependencia para Energía, soporte de Internet, contratación, cobertura, pago o Sepelio. El estado operativo de un servicio es válido aunque no exista un canal de WhatsApp publicado: el canal humano es opcional y no se reemplaza por uno genérico. La trazabilidad agregada existente permite medir `intent_detected → home_priority_applied → quick_access_click → navigation_executed` sin texto libre ni PII. No se amplía la personalización ni se mueven secciones completas de Home sin evidencia de ese funnel.

## 4G.3 — Atención de Sepelio publicada y contextual

La atención urgente del servicio de sepelio se resuelve primero mediante el canal publicado `funeral/emergency`; la página no duplica teléfonos ni condiciones contractuales. Las consultas no urgentes abren la única instancia global de COOPIA con contexto de Sepelio, y las FAQ se muestran únicamente cuando existen registros publicados y relevantes.

- Staging (`wwvqlbycwzxvjnexklwg`) es el único remoto autorizado para PR #2 y PR #3; ningún test ni reparación toca producción.
- El historial de trece migraciones es canónico y el esquema se modifica solo mediante migraciones aditivas revisadas.
- Los límites distribuidos usan `consume_rate_limit` y huellas con hash/sal; no se persiste IP cruda. Si falla la protección, los endpoints protegidos fallan cerrados.
- El tracking de journeys es best-effort: errores analíticos no bloquean una solicitud comercial válida. Guarda identificadores, intención, acción, resultados agregados y duración; nunca conversación completa ni PII de contacto.
- El consentimiento operativo y el opt-in comercial son campos distintos en `internet_requests`; solo el primero es obligatorio para solicitar contacto.
- El outbox guarda tipo de evento y número de solicitud, no datos de contacto, y deja reintentos exponenciales para una futura integración autorizada.
- Las tarjetas/constantes en `lib/coopsar-data.ts` son una compatibilidad limitada, no una fuente comercial confirmada. La migración se detalla en `AI_KNOWLEDGE.md`.
- P2 de roles: la autorización de contenidos reutiliza `news_admins`/`requireNewsAdmin()`. En una fase posterior se reemplazará por roles explícitos como `platform_admin` y `content_admin`; mientras tanto, las rutas administrativas usan un cliente server-side y no hay grants directos para `authenticated`.
- La bandeja comercial reutiliza `internet_requests` y sus estados existentes. No crea un CRM ni una tabla paralela de lista de espera: `fiber_waitlist` es un `request_type` privado. Las acciones de contacto sólo abren WhatsApp o email y nunca envían mensajes desde backend.

- `public_contact_channels` es la fuente administrable de canales públicos. Los componentes cliente la consumen por `/api/public/contacts` y las rutas server-side mediante `lib/data/public-content.ts`; los valores de compatibilidad sólo aplican si falta el dato oficial. El horario del Footer no conserva el fallback histórico.
- El Lote Oficial 1 se importa con dry-run y upsert idempotente, sin PII ni topología de red. La cobertura se identifica por `street_normalized + street_number + technology` y puede no tener un plan comercial confirmado.
- La tecnología de cobertura y la de oferta pública comparten la normalización canónica. Sólo `FTTH` y `WIRELESS` pueden habilitar una publicación nueva; `ADSL` permanece como etiqueta técnica legado hasta confirmación comercial humana. Ningún fixture como `TEST` puede pasar el guard de publicación.
- El cierre de Fase 2 se valida sobre el release candidate combinado PR #2 + PR #3. PR #3 continúa Draft hasta revisión humana; ninguna condición de staging autoriza merge ni promoción productiva.
- COOPIA no mantiene un sistema propio de reclamos. La intención de reclamo usa una herramienta read-only para clasificación, routing y derivación a WhatsApp; `service_requests.complaint` se conserva sólo como compatibilidad de backend y no se selecciona desde COOPIA.
- El horario de recepción de reclamos se evalúa con `America/Argentina/Buenos_Aires`: lunes a viernes desde 08:00 inclusive hasta 14:00 exclusivo. Las guardias publicadas pueden estar clasificadas como `phone`; su propósito oficial determina que son canales aptos para la derivación por WhatsApp.
- La cobertura geográfica usa la cadena `exact_address > Georef > Geoapify server-side si no hay coordenadas > PostGIS/coverage_zones > nearby_address > unknown`. Geoapify se limita a geocodificar y se acepta sólo con país Argentina, provincia Chubut, evidencia de Sarmiento y coordenadas válidas; nunca decide cobertura ni recibe datos de cobertura.
- La migración `20260817234002_ensure_one_active_geographic_zone_version` queda como P2 no bloqueante hasta una aplicación posterior explícitamente autorizada. No altera el cierre funcional de Fase 3C en staging.
- COOPIA mantiene una única conversación temporal por pestaña mediante `CoopiaProvider`; la home y el panel global comparten estado, `journeyId`, `sessionId`, intención y acciones. `sessionStorage` se usa sólo para continuidad de la pestaña, no como fuente analítica.
- La navegación contextual fija anterior no se monta junto al asistente global: sus acciones estructuradas están disponibles dentro de COOPIA para evitar controles flotantes duplicados. `GlobalJourneyNavigation` se conserva como componente de compatibilidad hasta retirar consumidores restantes.
- Los eventos `coopia_*` contienen únicamente contexto agregado (intención, servicio, acción, resultado y metadata controlada). Nunca incluyen texto completo de conversación, domicilio, teléfono, correo ni credenciales.
- COOPIA se monta exclusivamente fuera de `/admin`. El contexto de pantalla se deriva de rutas permitidas y se registra de forma agregada; el navegador no es fuente de verdad para decisiones de cobertura, acciones o datos oficiales.
- El panel `/admin/coopia` utiliza `journey_events` y `internet_requests` server-side para métricas agregadas. Si una fuente no está disponible, muestra un estado explícito en lugar de un cero artificial.
- El contenido recuperado del WordPress histórico entra sólo mediante un paquete curado privado y un importador idempotente de staging. Nunca se usa XML/WordPress en runtime, nunca se publica automáticamente y nunca puede reemplazar un registro ya publicado. La procedencia se almacena fuera de los campos públicos para revisión y auditoría.
- La curaduría editorial de IA persiste propuestas privadas e idempotentes por entidad, huella y versión de prompt. Las propuestas clasifican cambios de hechos protegidos y contenido sensible para validación humana; nunca publican ni alteran automáticamente un registro publicado.
- Fase 4E.2 limita la revisión por lote a los 44 contenidos históricos editoriales (servicios, artículos y FAQ); planes y contactos permanecen fuera de publicación asistida. La publicación requiere una propuesta aplicada, de bajo riesgo, sin flags ni validaciones pendientes. COOPIA consulta sólo proyecciones `published`.
- Las generaciones revalidan estado `draft` y la huella de origen inmediatamente antes de persistir. Las transiciones simples de revisión son idempotentes y no duplican auditoría; aplicar, publicar y marcar contenido stale conservan sus gates específicos.
- Fase 4F.1 mantiene un único orquestador COOPIA: los identificadores canónicos de necesidad no contienen URLs, teléfonos, precios ni datos de cobertura. Se adaptan a herramientas y acciones ya verificadas; los especialistas futuros podrán agregarse detrás de esta capa sin mostrar agentes separados al usuario.
- El auto-scroll de COOPIA es exclusivamente de experiencia: se activa una vez por `assistantResultKey` nuevo, después del montaje de la tarjeta estructurada, y no registra ni conserva posición de scroll. PGRST303 se mantiene como P2 observado con fallback de lectura de contactos y logging seguro sin contenido, headers ni credenciales.
- Fase 4F.1 queda **CERRADA / validada en Preview** en el HEAD funcional `411403b36faa93b2557863b400296b13dad0035c`, con CI final de 232 pruebas. PGRST303 continúa como P2 no bloqueante monitorizado; la próxima fase autorizada es 4F.2, sin implementación iniciada.
- COOPIA no equivale a un LLM. La protección técnica limita abuso de requests por IP/sesión, mientras que `AI_SESSION_LIMIT` limita sólo llamadas generativas ambiguas. Los resultados determinísticos, acciones, cobertura, formularios y handoff continúan disponibles si el presupuesto LLM se agota.
- Fase 4F.3 presenta sólo acciones realmente renderizadas y limita cada paso a una acción primaria y, como máximo, una secundaria. La trazabilidad reutiliza eventos existentes sin incluir texto, PII ni clasificaciones técnicas visibles.
- El handoff de cobertura de COOPIA al Centro de Internet usa un contrato tipado, versionado y temporal en `sessionStorage`. El resultado oficial ya resuelto define el destino (`planes`, `lista de espera` o `validación`) y se consume una sola vez; no se reconsulta cobertura ni se incluye domicilio en URL o analytics. La cobertura y la oferta comercial siguen siendo decisiones del backend.
- Fase 4G.1: Internet y Fibra Óptica son una sola experiencia pública. `/internet` es la URL canónica; `/fibra-optica` queda planificada como redirect permanente en una fase posterior. Los eventos, tablas y conceptos de fibra/FTTH continúan siendo necesarios internamente para cobertura, operaciones, analítica y COOPIA.
- Fase 4G.2: `/fibra-optica` redirige de forma permanente a `/internet`. Los journeys comerciales generales registran servicio `internet`; la semántica técnica de FTTH/fibra queda en el resolver, cobertura y eventos técnicos. La ausencia de planes `published` no cambia una cobertura confirmada ni habilita datos comerciales ficticios.
- Fase 4G.2.2: la experiencia comercial de `/internet` prioriza confirmar la alternativa real del domicilio antes de mostrar una oferta. Hero, beneficios y CTA no sustituyen `coverage-check`, `InternetCenter`, `fiber_waitlist` ni COOPIA; los planes y FAQ se renderizan sólo desde datos publicados mediante la DAL server-side. La investigación de mercado queda documentada como benchmark no operativo.
- Fase 4G.2.5: la propuesta comercial de `/internet` sigue `DESEO → OFERTA → COBERTURA → CONTRATACIÓN`; la cobertura es una herramienta de conversión y no la propuesta de valor de toda la landing. Una selección desde la oferta sólo se conserva como preferencia hasta que el resolver server-side confirme compatibilidad. `fiber_waitlist` permanece condicionado al resultado oficial y no a la ausencia de un plan publicado.
- El contenido histórico se consolida por necesidad en un número reducido de superficies. `content_import_*` y propuestas editoriales son evidencia privada; web pública y COOPIA sólo leen contenido `published` desde sus capas server-side tipadas. Ningún precio, contacto, horario, cobertura, requisito, autoridad o condición contractual se publica por importación o IA sin revisión humana.
- Fase 4G.2.6: la landing de Internet puede comunicar categoría, segmentos funcionales y alternativas de conectividad aunque no existan planes `published`. Los segmentos Hogar/Comercio/Empresa sólo se muestran porque precargan el `customerType` del flujo y emiten un evento agregado sin PII. Oferta, precios, velocidades y beneficios continúan siendo exclusivos de `internet_plans` publicados; cobertura y waitlist no cambian.
- Fase 4G.2.6.1: el relato anterior a cobertura evita referencias repetidas a domicilio, disponibilidad o resolver. No se introduce una propuesta de valor comercial sin fuentes explícitas; la disponibilidad concreta se comunica sólo desde el flujo server-side de cobertura.
- Fase 4G.2.8: ADSL forma parte de la taxonomía comercial administrable junto a FTTH e Internet inalámbrico, pero sigue requiriendo validación y publicación humana explícitas. El retiro de un plan es un soft delete privado y auditado; nunca elimina historial ni aparece en lecturas públicas o demos de staging.
- Fase 4G.2.8.1 corrige de forma aditiva una reconciliación invertida en Staging: `plan-hogar-50-mb` e `inalambrico-20-mb` son los canónicos restaurados; sus registros legacy se retiran mediante soft delete. La auditoría conserva el historial anterior y registra `restored` para la corrección. Hogar 100 queda fuera de este alcance.
- Fase 4G.2.8.4 separa la audiencia comercial del tipo de conectividad: Hogar filtra `home`, Comercio filtra `business` y Empresa inicia una consulta comercial sin catálogo enterprise ni promesas no verificadas. El contacto de soporte de Internet nunca se reutiliza para ventas; la referencia a un borrador de staging sólo comunica una opción comercial a validar, no disponibilidad publicada.
- Fase 4G.4.1.3: la Home mantiene un panel adaptativo sólo cuando agrega un siguiente paso distinto al resultado estructurado de COOPIA. Para `pay_invoice`, COOPIA conserva las acciones oficiales y la Home no repite Oficina Virtual ni medios de pago; los accesos directos continúan siendo navegación general y la sección Internet combina entrada comercial hacia `/internet` con una única herramienta de cobertura.
# 2026-08-25 — 4G.2.3: publicación de planes explícita

Se mantiene `internet_plans` como fuente comercial única. No se publica por guardar ni se permite editar en vivo una oferta publicada. La migración aditiva de auditoría queda preparada, sin aplicarse a Staging ni Producción desde esta rama.
## 4G.2.7 — Catálogo demo aislado de la oferta oficial

Los planes y FAQ draft pueden utilizarse para una simulación comercial sólo en staging, con una etiqueta visible y allowlist explícita. No ingresan al resolver de cobertura, a COOPIA pública ni a Production; la cobertura sigue siendo la autoridad técnica y los valores no constituyen una oferta publicada.

## 4G.3.1 — Gestión familiar con revisión humana

La solicitud de actualización familiar se modela como un trámite privado y no como una afirmación de cobertura, asociación o elegibilidad. Un contacto `funeral/emergency` sólo se utiliza si está publicado en `public_contact_channels`; nunca se recupera un número histórico como fallback. Las referencias recuperadas del WordPress anterior se etiquetan como candidatas de staging y no se consultan en runtime productivo.

## 4G.3.2 — DNI privado, obligatorio y sin tránsito por Vercel

El titular debe cargar frente y dorso del DNI para completar la actualización familiar. Los binarios no viajan por el route handler final ni se codifican como base64: el backend emite URLs firmadas de carga para paths opacos de un bucket Storage privado y después valida ambos objetos en una transacción antes de persistir la solicitud. El navegador no puede listar ni leer documentos, y el personal autorizado sólo recibe una URL temporal con auditoría `document_viewed`. No hay OCR, IA documental, enlaces públicos ni retención automática; la política de retención se decide antes de Production.
