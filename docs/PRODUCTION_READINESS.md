# Checklist de preparación para producción

> Este documento es una lista de control. No autoriza promoción ni cambios productivos.

## Base y seguridad

- [ ] Confirmar proyecto Supabase productivo, backup, recuperación y responsables.
- [ ] Ejecutar las migraciones canónicas en una copia validada; revisar `migration list` y `db push --dry-run`.
- [ ] Verificar RLS, grants, funciones SECURITY DEFINER y `search_path` con roles anon/authenticated.
- [ ] Rotar y separar claves de staging/producción; confirmar que service role no llega al navegador.
- [ ] Revisar retención, acceso y eliminación de PII de solicitudes; validar textos legales y consentimientos.

## Datos y operación

- [ ] Eliminar o aislar inequívocamente fixtures y solicitudes `TEST`; no migrarlos a producción.
- [ ] Cargar y aprobar servicios, planes, cobertura, alertas, FAQ, contactos, requisitos y noticias oficiales.
- [ ] Definir responsables editoriales en `news_admins`, Google OAuth y recuperación de acceso.
- [ ] Aprobar WhatsApp, Oficina Virtual y demás canales operativos que se publiquen.
- [ ] Definir contrato, secreto, reintentos, alertas y responsable de n8n antes de activarlo.

## Aplicación y entrega

- [ ] Configurar variables Vercel Production y dominio/certificados; remover banner STAGING.
- [ ] Confirmar CI obligatorio (`quality`, `supabase-tests`) y revisión de PR aprobada.
- [ ] Ejecutar typecheck, lint, tests, build, pgTAP/RLS y `db lint` sobre el commit candidato.
- [ ] Probar móvil, teclado, foco, formularios, login admin, COOPIA, cobertura y solicitudes con datos no reales.
- [ ] Habilitar monitoreo, logs sanitizados, analítica aprobada, alertas y procedimiento de rollback.
- [ ] Registrar fecha, responsable y autorización explícita de promoción.

## Evidencia de staging (no autoriza producción)

- [x] Lote Oficial 1 e idempotencia validados en `coopsar-staging`: 7 planes en `draft`, 10 contactos publicados, 2.126 coberturas oficiales y 20 FAQ en `draft`.
- [x] 85 coberturas pendientes de revisión excluidas de la importación.
- [x] Smoke tests de COOPIA, contactos, cobertura exacta/cercana/desconocida y UI pública completados contra staging.
- [x] Footer y rutas de asistencia consumen contactos oficiales administrables desde Supabase.
- [x] Producción no fue modificada.
