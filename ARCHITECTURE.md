# Plataforma digital COOPSAR

## Flujos

- El asistente envía mensajes a `POST /api/chat`. La ruta valida el payload, aplica límite por IP y sesión, consulta una base oficial acotada y llama a OpenAI únicamente desde el servidor. Sin `OPENAI_API_KEY`, responde con orientación determinista y datos confirmados.
- Las solicitudes de internet llegan a `POST /api/internet-leads`, se validan en servidor, se deduplican y se guardan mediante una clave privada de Supabase. El navegador nunca recibe la clave secreta.
- Los webhooks para n8n son opcionales y solo contienen el tipo de evento y número de solicitud. No se configura ninguna automatización externa desde este repositorio.
- Las rutas `/admin/*` usan Google OAuth mediante Supabase Auth con flujo PKCE y cookies de servidor. Después del login, el correo se valida contra `news_admins`; una cuenta Google válida sin autorización explícita no puede ingresar. No existe contraseña fija.

## Google Auth

En Supabase se debe habilitar el proveedor Google con el Client ID y Client Secret creados en Google Cloud. La lista de URLs de redirección debe incluir `http://localhost:3000/api/admin/callback` para desarrollo y `https://<dominio>/api/admin/callback` para cada entorno autorizado de Vercel. El correo administrativo debe existir en `public.news_admins`.

## Datos

La migración en `supabase/migrations` agrega artículos de ayuda, preguntas frecuentes, servicios, planes, cobertura, alertas, eventos anónimos y solicitudes. Todas las tablas tienen RLS. Las solicitudes y métricas no están expuestas a `anon` ni `authenticated`; solo las consume el servidor.

La migración no se aplicó al proyecto conectado para evitar cambios sobre un entorno potencialmente productivo. Debe probarse primero en una rama de Supabase.

## Privacidad

- No se conservan conversaciones completas por defecto.
- El historial del chat vive temporalmente en `sessionStorage`.
- Los eventos analíticos previstos almacenan intención, resolución y derivación, no texto libre.
- DNI fue omitido porque no existe evidencia de que sea necesario para la primera consulta comercial.

## Variables

Consultar `.env.example`. `OPENAI_API_KEY`, `SUPABASE_SECRET_KEY` y `N8N_WEBHOOK_SECRET` deben ser privados en Vercel. Nunca deben usar el prefijo `NEXT_PUBLIC_`.
