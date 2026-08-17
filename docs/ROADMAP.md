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
