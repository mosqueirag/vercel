# Workflow privado — actualización de grupo familiar

1. La persona completa titular, integrantes y consentimiento en `/sepelio/actualizar-grupo-familiar`.
2. Antes de confirmar, carga frente y dorso del DNI del titular: el servidor abre una sesión breve y devuelve URLs firmadas de un único uso para el bucket privado. Los binarios nunca pasan por Vercel ni se agregan al JSON del formulario.
3. El POST final envía sólo `uploadId`; un RPC atómico comprueba ambos objetos, MIME y tamaño antes de crear el número `SEP-YYYY-XXXXXXXX`.
4. El registro, sus integrantes, metadata de documentos y auditoría quedan privados en Supabase; no hay PII, paths de Storage ni documentos en URL, logs ni analytics.
5. Un administrador autorizado revisa y cambia el estado en `/admin/sepelio/planillas`. La lectura de un documento crea una URL temporal de 90 segundos y una auditoría `document_viewed`.
6. El flujo no publica contenido, no modifica grupos automáticamente, no envía mensajes automáticos y no integra CRM/n8n/Brevo. La retención de documentos queda pendiente de una decisión humana antes de Production.
