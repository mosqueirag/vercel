# Investigación — experiencia comercial de Internet

## Alcance y criterio de uso

Esta investigación orienta producto y UX de `/internet`. No es una fuente de verdad operativa: precios, velocidades, promociones, canales, condiciones técnicas y cobertura sólo provienen de datos publicados y de los resolvers server-side de COOPSAR. Los operadores mencionados en el relevamiento de producto (por ejemplo, Movistar, Personal, Telecentro, Claro o IPLAN) se consideran referencias de patrones comerciales; no se copian diseños, textos, precios ni afirmaciones.

## Diagnóstico

El recorrido técnico ya resolvía cobertura, tecnología, validación, solicitudes y lista de espera, pero la superficie pública no comunicaba con claridad el valor comercial: primero conocer una alternativa real para el domicilio y luego continuar con una oferta o atención humana.

## Oportunidades e hipótesis

- La cobertura es la principal puerta de entrada: reduce promesas comerciales no verificadas.
- Internet debe presentarse como una categoría única; FTTH y WIRELESS son tecnologías decididas por cobertura.
- Una oferta visible sólo tiene sentido con planes publicados y compatibles.
- Si no hay fibra confirmada, la lista de espera existente es una señal de demanda útil; no requiere otro formulario.
- El soporte de clientes actuales debe permanecer separado de la contratación y reutilizar COOPIA y canales oficiales.

## Decisiones adoptadas (4G.2.2)

- Hero comercial con activo local existente, CTA a `#contratar` y acceso contextual a la instancia global de COOPIA.
- Arquitectura pública: hero → cobertura → cómo funciona → tecnología → planes/alternativa → waitlist → soporte → FAQ → CTA final.
- Planes y FAQ se leen exclusivamente desde la capa server-side de contenido publicado.
- Sin planes publicados se presenta una alternativa operativa, sin precios o prestaciones inventadas.
- La waitlist sigue integrada al flujo existente de cobertura y `fiber_waitlist`.

## Roadmap

### P1

- Bloques comerciales administrables para hero, badges, vigencia y beneficios, sólo después de definir campos y aprobación editorial.

### P2

- Recomendador administrable: necesidad → perfil de uso → recomendación → cobertura → plan compatible. No debe recomendar Mbps sin reglas comerciales verificadas.

### P3

- Atribución de campañas mediante una taxonomía no sensible sobre `journey_events`, sin domicilio ni datos de contacto.

## No adoptado automáticamente

- Catálogo previo a cobertura.
- Recomendaciones numéricas de Mbps.
- Promociones, routers, Wi‑Fi 6, simetría o plazos de instalación sin fuente publicada.
- Nuevos chats, tickets, tablas de leads o formularios de waitlist paralelos.
