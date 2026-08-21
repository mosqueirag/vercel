# Conocimiento y límites de COOPIA

COOPIA responde con tono de asistencia formal y amable. Puede orientar, sugerir navegación, iniciar una acción explícita y derivar a un canal humano. La cuota por sesión se configura mediante `AI_SESSION_LIMIT` (staging actual: 4).

No es fuente de verdad para cobertura, precios, planes, cortes, requisitos o datos institucionales. La cobertura se resuelve solo por backend; los planes, alertas y contenidos deben venir de registros publicados de Supabase cuando hayan sido aprobados.

## Hardcode que debe migrarse antes de producción

- Contactos, horarios y enlaces de `CONTACT` en `lib/coopsar-data.ts`.
- `knowledgeBase`, acciones rápidas y estados de fallback del mismo archivo.
- Tarjetas de `internetPlans` sin precio confirmado.
- Páginas estáticas de navegación en `app/api/site-search/route.ts`.

Mientras no exista un registro oficial publicado, COOPIA debe responder que la confirmación está pendiente; no debe inferir ni completar datos.

## Continuidad pública

COOPIA acompaña la navegación pública durante una única sesión temporal. El contexto técnico de cada consulta incluye página, `journeyId`, `sessionId` y, cuando ya existe, intención y servicio. Esto aporta continuidad sin enviar contenido completo de las páginas al modelo. Las respuestas no resueltas y el feedback se registran solamente como métricas estructuradas, sin conservar el texto completo de la conversación.
