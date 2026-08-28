# Workflow privado — actualización de grupo familiar

1. La persona completa titular, integrantes y consentimiento en `/sepelio/actualizar-grupo-familiar`.
2. La API valida la carga, aplica rate limit y crea un número `SEP-YYYY-XXXXXXXX` mediante un RPC atómico.
3. El registro, sus integrantes y auditoría quedan privados en Supabase; no hay PII en URL, logs ni analytics.
4. Un administrador autorizado revisa y cambia el estado en `/admin/sepelio/planillas`; cada cambio crea auditoría.
5. El flujo no publica contenido, no modifica grupos automáticamente, no envía mensajes automáticos y no integra CRM/n8n/Brevo.
