# Gobierno de la oferta comercial de Internet

## Fuente de verdad

`internet_plans` es la única fuente administrable de planes públicos. La web, COOPIA y el resolver de cobertura consultan únicamente filas con `status = published` y `published_at` vigente. Un borrador o un archivado no llega al navegador ni al contexto público de COOPIA.

## Flujo de publicación

1. Un administrador autorizado crea o edita un borrador.
2. Revisa nombre, segmento, tecnología, velocidades, precio cuando exista, beneficios, condiciones e instalación.
3. La publicación es una acción explícita distinta de guardar. Exige nombre, segmento y tecnología; el precio puede permanecer pendiente si no fue confirmado.
4. Un plan publicado no se modifica en vivo desde el editor: se archiva y se prepara un nuevo borrador para revisión. El versionado formal de ofertas es un P2 posterior.
5. Cada alta, cambio, publicación o archivo se registra en `internet_plan_admin_audit` con actor, acción y fecha. La migración es aditiva y requiere aplicación manual en Staging antes de usar este registro.

## Cobertura antes que oferta

La publicación de un plan no confirma cobertura. El recorrido es domicilio → cobertura oficial → tecnología → plan publicado compatible → contacto/instalación. Sin cobertura confirmada, el sitio no promete instalación; sin plan compatible, conserva el resultado técnico y ofrece validación comercial.

## Privacidad y permisos

Las rutas administrativas requieren Google OAuth y `news_admins`; usan el cliente server-side. `anon` y `authenticated` solo pueden leer planes publicados por RLS. No se registran direcciones, solicitudes ni PII en los eventos públicos de visualización/selección.
