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
# 4G.2.6 — contenido de producto antes de la oferta publicada

- **0 planes publicados no significa 0 contenido comercial.** `/internet` mantiene una narrativa de categoría, alternativas de conectividad y una consulta guiada sin mostrar catálogo vacío ni datos históricos.
- La landing vende la categoría Internet antes de disponer de precios publicados: la oferta concreta sólo aparece cuando `internet_plans` tiene registros `published` vigentes.
- Las elecciones Hogar, Comercio y Empresa tienen efecto funcional: precargan `customerType` en el flujo existente y registran `internet_audience_selected` con sesión, journey y audiencia únicamente; no se registran datos de domicilio o contacto.
- Fibra óptica e Internet inalámbrico se presentan como alternativas de producto en lenguaje humano. La cobertura, la tecnología concreta y la compatibilidad comercial continúan resolviéndose server-side.
- El activo existente `coopsar-connectivity.png` se conserva como hero reutilizable. La fotografía futura recomendada es una escena cotidiana y local de conectividad en Sarmiento, con permiso de uso verificable y sin apariencia de banco de imágenes multinacional.

## 4G.2.6.1 — limpieza de relato comercial

- Antes de `InternetCenter`, el copy se limita a producto, necesidad y tecnologías. La disponibilidad por dirección aparece una sola vez como aclaración general y se desarrolla únicamente dentro del flujo de cobertura.
- Se retiró el bloque narrativo que repetía consulta, domicilio y CTA antes del formulario. La página conserva producto → segmento → tecnología → planes publicados cuando existan → cobertura → resultado.
- No se implementó un bloque “Por qué COOPSAR”: la documentación disponible no aporta dos o tres claims comerciales verificables independientes. Mantenerlo fuera evita convertir datos operativos o históricos en promesas públicas.

# Operación administrable (4G.2.3)

La oferta pública se gobierna desde `/admin/internet/planes`, reutilizando el Centro de Gestión. Se amplió el editor existente con beneficios ordenables, campos comerciales y una vista previa privada. Guardar siempre conserva el estado `draft`; publicar es una acción explícita y validada. La implementación no introduce precios o velocidades hardcodeados.

La auditoría de los borradores de Staging debe realizarse contra el proyecto vinculado antes de una validación humana. Esta rama no modifica Staging: el entorno de trabajo no dispone de la CLI vinculada, por lo que deja la matriz lista para completar con el panel administrativo autorizado.
