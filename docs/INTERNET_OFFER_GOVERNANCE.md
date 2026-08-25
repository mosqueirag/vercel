# Gobierno de la oferta comercial de Internet

## Fuente de verdad

`internet_plans` es la única fuente administrable de planes públicos. La web, COOPIA y el resolver de cobertura consultan únicamente filas con `status = published` y `published_at` vigente. Un borrador o un archivado no llega al navegador ni al contexto público de COOPIA.

## Flujo de publicación

1. Un administrador autorizado crea o edita un borrador.
2. Revisa nombre, segmento, tecnología, velocidades, precio cuando exista, beneficios, condiciones e instalación.
3. La publicación es una acción explícita distinta de guardar. Exige nombre, segmento y tecnología comercial válida. La normalización canónica de cobertura reconoce `FTTH`, `ADSL` y `WIRELESS`; para una nueva oferta pública sólo se habilitan `FTTH` e `Internet inalámbrico`/`WIRELESS`. `ADSL` es un dato técnico legado y requiere confirmación comercial humana. Valores de fixture o prueba, como `TEST`, nunca son publicables. El precio puede permanecer pendiente si no fue confirmado.
4. Un plan publicado no se modifica en vivo desde el editor: se archiva y se prepara un nuevo borrador para revisión. El versionado formal de ofertas es un P2 posterior.
5. Cada alta, cambio, publicación o archivo se registra en `internet_plan_admin_audit` con actor, acción y fecha. `actor_email` es una medida privada de rendición de cuentas, sólo disponible server-side para administradores; no alimenta analítica pública y su retención queda pendiente de una política operativa. La migración aditiva `20260825221215_add_internet_plan_admin_audit.sql` sigue sin aplicar y requiere autorización manual para Staging.

## Cobertura antes que oferta

La publicación de un plan no confirma cobertura. El recorrido es domicilio → cobertura oficial → tecnología → plan publicado compatible → contacto/instalación. Sin cobertura confirmada, el sitio no promete instalación; sin plan compatible, conserva el resultado técnico y ofrece validación comercial.

## Privacidad y permisos

Las rutas administrativas requieren Google OAuth y `news_admins`; usan el cliente server-side. `anon` y `authenticated` solo pueden leer planes publicados por RLS. No se registran direcciones, solicitudes ni PII en los eventos públicos de visualización/selección.

## Auditoría de borradores de Staging

Los 11 borradores auditados quedan fuera del catálogo público hasta una decisión humana:

- 6 candidatos comerciales: requieren confirmación comercial.
- 4 planes históricos WordPress `contrata`, modificados el 09/07/2026 y con `migration_decision = validate`: requieren confirmación comercial.
- 1 fixture `TEST`: bloqueado permanentemente de publicación.

No se resolvieron conflictos de precio ni se modificaron datos: `Hogar 50` actual frente a legado, `Hogar 100` actual frente a legado e `Inalámbrico 20` actual frente a legado requieren confirmación comercial. La cola editorial mantiene como P0 la validación de planes y precios de Internet/Fibra.
