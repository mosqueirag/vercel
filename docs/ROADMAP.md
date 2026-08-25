# Roadmap posterior al cierre de Fase 2

1. Revisar humanamente el release candidate apilado: PR #2 está Ready for Review y PR #3 permanece Draft; no hacer merge automático.
2. Aprobar o mantener en borrador los 7 planes y 20 FAQ oficiales cargados sólo en staging; revisar las 85 coberturas excluidas antes de un lote posterior.
3. Completar vistas internas autorizadas para solicitudes, alertas y consultas antes de operar comercialmente.
4. Definir propietario, contrato, autenticación y monitoreo de n8n antes de habilitar cualquier webhook.
5. Completar checklist de producción, backup/rollback y validación legal de privacidad/consentimientos.

Quedan fuera de esta rama: CRM, Brevo, campañas, OneSignal, nuevos trámites, reclamos y despliegue productivo.

## Cierre Fase 2C

Antes de avanzar se requiere revisión humana de PR #3, sin convertirla automáticamente a Ready ni hacer merge. Los próximos datos a aprobar son los 7 planes y 20 FAQ en `draft`; las 85 coberturas excluidas requieren revisión oficial previa a cualquier carga posterior.

## Fase 3A — reclamos

La primera etapa operativa de reclamos es routing a WhatsApp, no ticketing. Quedan fuera de esta etapa: autenticación de socios, persistencia de reclamos, números de caso, CRM y seguimiento de resolución. Cualquier evolución posterior requiere una decisión de privacidad, responsables operativos y una fuente oficial para feriados.
# Fase 3B — Bandeja comercial interna

La fase incorpora una vista administrativa mínima para solicitudes de Internet y lista de espera de Fibra, con estados ya existentes, contacto manual y demanda agregada sin PII. CRM, n8n, Brevo y automatizaciones quedan explícitamente fuera de alcance.

# Fase 3C — Cobertura geográfica inteligente

**COMPLETADA en staging.** Cuatro zonas oficiales privadas se resuelven mediante PostGIS, con prioridad de domicilio exacto sobre zona y de zona sobre registros cercanos. El fallback Geoapify server-side permite geocodificar cuando Georef no entrega coordenadas, sin convertirlo en fuente de cobertura. España 450 validó zona FTTH y derivación a validación técnica. P2 pendiente no bloqueante: aplicar, sólo con autorización expresa, `20260817234002_ensure_one_active_geographic_zone_version` para evitar dos versiones activas de una misma capa.

# Fase 4C — COOPIA 2.0

La capa global pública comparte una sesión temporal, contexto seguro de página y acciones estructuradas entre la home y el panel. El panel privado `/admin/coopia` convierte eventos anónimos agregados en indicadores operativos. Pendiente de validación en Preview: contrastar métricas reales con el equipo antes de usar cualquier resumen asistido por IA. No habilitar CRM, Brevo, n8n ni automatizaciones hasta que exista una decisión operativa y de privacidad explícita.

# Fase 4D — curación histórica de contenido

Preparar la importación idempotente de servicios, artículos, FAQ, planes históricos y candidatos de contacto para **staging**. Todo el lote debe permanecer en `draft` y requerir aprobación humana. La cobertura no se importa desde WordPress. Los canales contradictorios se conservan como candidatos privados hasta validación; no se elige ni publica uno automáticamente.

# Fase 4E.1 — Curaduría editorial IA

El Centro de contenidos privado permite generar propuestas de mejora sólo para borradores, con provenance, detección de hechos protegidos y estados de revisión. COOPIA continúa leyendo exclusivamente contenido `published`; cualquier aplicación o publicación futura exige revisión humana explícita.

# Fase 4E.2 — revisión y publicación curada

El corpus histórico administrable contiene 44 entradas: 9 servicios, 24 artículos de ayuda y 11 FAQ. El Centro de contenidos permite revisión individual y en lote, con gates de riesgo, hechos protegidos y validación humana. La publicación es una acción humana explícita y sólo habilita contenido `published` para COOPIA. El smoke real de la FAQ “¿Qué es ADECOOP?” validó `generated → approved → applied → draft invisible → published → visible` exclusivamente en staging. La siguiente etapa autorizada es **Fase 4F — COOPIA Orquestador de Intenciones y Acciones**; producción continúa fuera de alcance.

# Fase 4F.1 — COOPIA orquestador de intenciones y acciones — CERRADA

**CERRADA / validada en Preview** en el HEAD funcional `411403b36faa93b2557863b400296b13dad0035c`, con CI final de 232 pruebas. La primera entrega consolida reglas tipadas para necesidades principales y reutiliza acciones estructuradas existentes para pago, reclamos por WhatsApp, cobertura, planes, solicitud de Internet, sepelio y atención humana. `unknown` es explícito y seguro. El smoke real de las nueve intenciones pasó en Preview y las tarjetas estructuradas realizan auto-scroll único y no intrusivo. PGRST303 continúa como P2 de monitoreo con fallback seguro; no autoriza cambios remotos ni producción. La próxima etapa autorizada es **Fase 4F.2**, aún no iniciada.

# Fase 4F.2 — COOPIA continuous interaction

Separar límite técnico de requests y presupuesto de LLM. Las respuestas determinísticas, herramientas, formularios y navegación deben continuar operativas cuando no haya capacidad generativa; las consultas ambiguas degradan a acciones oficiales y handoff humano, sin bloquear el input ni debilitar la protección contra abuso.

# Fase 4F.3 — COOPIA interactive UX

COOPIA evoluciona de un historial de chat a una interfaz de resolución guiada por intención: una necesidad, un paso actual y una acción principal a la vez. La conversación queda disponible como contexto secundario, mientras cobertura, pagos, reclamos y atención humana reutilizan el mismo resolver y las mismas acciones tipadas. No se agregan integraciones externas ni se altera la fuente de verdad server-side.

# Fase 4G.1 — arquitectura y consolidación de contenido público

**COMPLETADA como auditoría y decisión de arquitectura.** El siguiente trabajo es 4G.2: unificar la experiencia pública de Internet en `/internet`, evolucionar `site_pages` de forma aditiva si los bloques tipados resultan necesarios y recién entonces implementar el redirect permanente de `/fibra-optica`. La prioridad previa sigue siendo resolver las validaciones humanas de contenido sensible; no se publican borradores automáticamente.
