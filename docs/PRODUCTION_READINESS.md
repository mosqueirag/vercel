# Checklist de preparación para producción

> Este documento es una lista de control. No autoriza promoción ni cambios productivos.

## Base y seguridad

- [ ] **PENDIENTE** Confirmar proyecto Supabase productivo, backup, recuperación y responsables.
- [ ] **PENDIENTE** Ejecutar las migraciones canónicas en una copia validada; revisar `migration list` y `db push --dry-run`.
- [ ] **LISTO en staging / PENDIENTE en producción** Verificar RLS, grants, funciones SECURITY DEFINER y `search_path` con roles anon/authenticated.
- [ ] **PENDIENTE** Rotar y separar claves de staging/producción; confirmar que service role no llega al navegador.
- [ ] **PENDIENTE** Revisar retención, acceso y eliminación de PII de solicitudes; validar textos legales y consentimientos.

## Datos y operación

- [ ] **PENDIENTE** Eliminar o aislar inequívocamente fixtures y solicitudes `TEST`; no migrarlos a producción.
- [ ] **PENDIENTE** Cargar y aprobar servicios, planes, cobertura, alertas, FAQ, contactos, requisitos y noticias oficiales.
- [ ] **PENDIENTE** Definir responsables editoriales en `news_admins`, Google OAuth y recuperación de acceso.
- [ ] **PENDIENTE** Aprobar WhatsApp, Oficina Virtual y demás canales operativos que se publiquen.
- [ ] **NO APLICA hasta autorizar automatizaciones** Definir contrato, secreto, reintentos, alertas y responsable de n8n antes de activarlo.

## Aplicación y entrega

- [ ] **PENDIENTE** Configurar variables Vercel Production y dominio/certificados; remover banner STAGING.
- [ ] **LISTO en staging / PENDIENTE revisión y producción** Confirmar CI obligatorio (`quality`, `supabase-tests`) y revisión de PR aprobada.
- [ ] **LISTO en staging / PENDIENTE repetición en candidato de producción** Ejecutar typecheck, lint, tests, build, pgTAP/RLS y `db lint` sobre el commit candidato.
- [ ] **PENDIENTE** Probar móvil, teclado, foco, formularios, login admin, COOPIA, cobertura y solicitudes con datos no reales.
- [ ] **PENDIENTE** Habilitar monitoreo, logs sanitizados, analítica aprobada, alertas y procedimiento de rollback.
- [ ] **PENDIENTE** Registrar fecha, responsable y autorización explícita de promoción.

## Evidencia de staging (no autoriza producción)

- [x] **LISTO** Lote Oficial 1 e idempotencia validados en `coopsar-staging`: 7 planes en `draft`, 10 contactos publicados, 2.126 coberturas oficiales y 20 FAQ en `draft`.
- [x] **LISTO** 85 coberturas pendientes de revisión excluidas de la importación.
- [x] **LISTO** Smoke tests de COOPIA, contactos, cobertura exacta/cercana/desconocida y UI pública completados contra staging.
- [x] **LISTO** Footer, accesos rápidos y rutas de asistencia consumen contactos oficiales administrables desde Supabase.
- [x] **LISTO** Producción no fue modificada.
