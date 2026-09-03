# Batch 01 — revisión editorial humana

Entorno auditado: `coopsar-staging`. Fecha: 2026-08-31. Este documento no cambia contenido en la base de datos.

## Cierre Smoke 01 editorial — resultado posterior

**SMOKE 01 EDITORIAL = PASS.** La decisión humana para `Cómo estimar el consumo eléctrico de tu hogar` se completó mediante el workflow editorial autorizado: el artículo quedó `published`, con `published_at` definido y auditoría `published`; el copy final fue validado. No se publicó ningún otro elemento.

Los cuatro ítems restantes de este Batch continúan `draft` / `needs_validation`. **COOPIA CONSUMER = PASS**: el artículo publicado entra por la proyección `help_articles` published-only, mientras que borradores y propuestas privadas no entran al contexto público.

Dos pendientes quedan documentados sin cambio funcional: **WEB ARTICLE SURFACE = PENDING** (`/energia-estimar-consumo` devuelve 404 porque `[slug]` no sirve `help_articles`) y **PROPOSAL STATE CONSISTENCY = PENDING** *(fotografía histórica; resuelto posteriormente)* (el candidato está `published`, pero la propuesta permanece `applied`, estado que significa aplicada al borrador).

**Resolución actual: PASS.** El cierre posterior 4G.7.2 validó la matriz server-side y compare-and-set, el rechazo terminal y el ciclo `applied → published` para `site_page`; su publicación usa una RPC atómica y el smoke finalizó en PASS.

## Gate de revisión inicial — evidencia histórica

Al inicio del Gate, los cinco registros estaban `draft`; sus cinco propuestas vigentes estaban `generated`, eran de riesgo `low`, no tenían `validation_flags`, no tenían una validación abierta asociada por provenance y sus `source_hash` fueron recalculados contra el contenido de ese momento con resultado coincidente. Esta evidencia antecede al cierre Smoke 01 documentado arriba.

| # | Tipo | Título | Riesgo | Facts | Vigencia | Duplicado | Decisión |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | service | ADECOOP | low | ninguno detectado | revisar referencia institucional a Sarmiento | no equivalente; relacionado con FAQ/artículos ADECOOP | PENDIENTE HUMANO |
| 2 | service | Energía | low | ninguno detectado | revisar copy operativo antes de publicar | no equivalente; relacionado con artículo de atención ante falta de energía | PENDIENTE HUMANO |
| 3 | service | Institucional | low | ninguno detectado | historia de 1946 preservada; autoridades requieren vigencia si se amplían | no equivalente; relacionado con artículo de historia | PENDIENTE HUMANO |
| 4 | help_article | Actualizar tus datos de contacto | low | ninguno detectado | flujo no está confirmado como trámite público actual | no equivalente; distinto de actualización de grupo familiar | PENDIENTE HUMANO |
| 5 | help_article | Cómo estimar el consumo eléctrico de tu hogar | low | ninguno detectado | texto estimativo; no incorpora valores vigentes | no equivalente; relacionado con uso eficiente de energía | PENDIENTE HUMANO |

Las relaciones semánticas se mantienen como referencias, no se eliminan ni consolidan automáticamente. Antes de una eventual publicación, el revisor debe decidir si cada una sigue siendo una superficie complementaria.

## 1. ADECOOP

- Entity type / ID: `service` / `5e47dd08-6a0d-4462-bd37-cd5cc49dc9dd`
- Estado: `draft`; propuesta: `generated`; riesgo: `low`; validación pendiente: no.
- Provenance: 4 — `adecoop`, `conoce-adecoop`, `proyectosadecoop`, `talleres`.
- Hechos protegidos detectados: ninguno. Vigencia: la referencia institucional a Sarmiento debe confirmarse editorialmente, sin que el texto proponga datos nuevos.
- Posible duplicado: no equivalente. Relacionados: FAQ `f8e0bbfc-6605-4e0a-998b-0bca5ad30a9b` y artículos `96f46c74-5ee5-47d5-81e2-23742a42c1aa`, `c50490ff-db43-4ad3-9137-f9c0037cc0e8`.

### Original

> ADECOOP es el Área de Educación Cooperativa de COOPSAR. Creada para fortalecer el vínculo entre la cooperativa y la comunidad, impulsa formación, talleres, becas, articulación con instituciones y espacios abiertos orientados al desarrollo educativo y social de Sarmiento.

### Propuesta IA

- Título: **ADECOOP (Área de Educación Cooperativa)**
- Resumen: ADECOOP es el Área de Educación Cooperativa de COOPSAR, creada para fortalecer el vínculo entre la cooperativa y la comunidad. Impulsa formación, talleres, becas y articulación con instituciones, a través de espacios abiertos orientados al desarrollo educativo y social en Sarmiento.
- Contenido: ADECOOP es el Área de Educación Cooperativa de COOPSAR. Nace con el objetivo de fortalecer el vínculo entre la cooperativa y la comunidad, promoviendo formación y actividades que impacten en el desarrollo educativo y social. A través de talleres, becas y articulación con instituciones, ADECOOP sostiene espacios abiertos para acompañar distintas iniciativas orientadas a la educación y el trabajo comunitario en Sarmiento.
- CTAs sugeridos: Conocer más sobre ADECOOP; Ver actividades y espacios educativos; Sumarme a iniciativas de educación cooperativa.
- Intenciones COOPIA sugeridas: informar; generar interés en programas educativos cooperativos; promover participación comunitaria.
- Notas: declara no agregar precios, horarios, sedes, requisitos ni cobertura.

## 2. Energía

- Entity type / ID: `service` / `23d6f44a-1cb5-42e6-9b87-f77f453d3e9e`
- Estado: `draft`; propuesta: `generated`; riesgo: `low`; validación pendiente: no.
- Provenance: 1 — `home-3`.
- Hechos protegidos detectados: ninguno. Vigencia: revisar el copy de estado/guardia antes de publicar; la propuesta no incorpora teléfonos, horarios ni estado operativo.
- Posible duplicado: no equivalente. Relacionado: artículo `1eef5fe7-17cb-4427-8394-164d7cbd49d5`.

### Original

> COOPSAR presta el servicio de energía eléctrica y de alumbrado público en Sarmiento. El área trabaja en la operación y mantenimiento del servicio, con foco en continuidad, calidad y seguridad. Desde el portal, la experiencia debe priorizar el estado del servicio, los cortes informados, la guardia y los trámites relacionados.

### Propuesta IA

- Título: **Servicio de energía eléctrica y alumbrado público**
- Resumen: COOPSAR brinda el servicio de energía eléctrica y de alumbrado público en Sarmiento, enfocado en la operación y mantenimiento con criterios de continuidad, calidad y seguridad. Desde el portal, la prioridad está en el estado del servicio, los cortes informados, la guardia y los trámites relacionados.
- Contenido: COOPSAR presta el servicio de energía eléctrica y de alumbrado público en Sarmiento. El área trabaja en la operación y mantenimiento del servicio, con foco en continuidad, calidad y seguridad. La experiencia desde el portal debe priorizar el estado del servicio, los cortes informados, la guardia y los trámites relacionados. La información y la navegación se orientan a acceder rápidamente a la situación del servicio y a la gestión correspondiente.
- CTAs sugeridos: Ver estado del servicio; Consultar cortes informados; Acceder a la guardia; Iniciar trámites.
- Intenciones COOPIA sugeridas: consultar estado; informarse sobre cortes; contactar guardia; realizar trámites relacionados.
- Notas: no incorpora contacto, horario, cobertura, requisitos ni condiciones legales.

## 3. Institucional

- Entity type / ID: `service` / `bd3ca81a-97be-4801-8627-39c734474f36`
- Estado: `draft`; propuesta: `generated`; riesgo: `low`; validación pendiente: no.
- Provenance: 4 — `estatuto`, `historia`, `ley-de-cooperativas`, `r-s-e`.
- Hechos protegidos detectados: ninguno. Vigencia: la historia de 1946 se preserva; no publicar datos de autoridades sin evidencia vigente.
- Posible duplicado: no equivalente. Relacionado: artículo `9f93e433-ed7e-4819-9688-bbaaba4b2855`.

### Original

> COOPSAR es una cooperativa de servicios públicos de Sarmiento con una historia que se remonta a la organización vecinal de 1946. Esta área reúne historia, organización cooperativa, documentación institucional, autoridades, responsabilidad social y contenidos de participación comunitaria.

### Propuesta IA

- Título: **Institucional**
- Resumen: Conocé la historia de COOPSAR, su organización cooperativa y la documentación institucional, con un enfoque en la responsabilidad social y la participación comunitaria.
- Contenido: COOPSAR es una cooperativa de servicios públicos de Sarmiento cuya historia se remonta a la organización vecinal de 1946. En esta sección se reúne información institucional vinculada a historia, organización cooperativa, documentación institucional, autoridades, responsabilidad social y espacios de participación comunitaria.
- CTAs sugeridos: ninguno.
- Intenciones COOPIA sugeridas: conocer historia; ver documentación institucional; ver autoridades; conocer organización cooperativa.
- Notas: sin observaciones editoriales adicionales.

## 4. Actualizar tus datos de contacto

- Entity type / ID: `help_article` / `b4022fa0-f668-4d32-b6bb-36c48131e278`
- Estado: `draft`; propuesta: `generated`; riesgo: `low`; validación pendiente: no.
- Provenance: 2 — `actualizacion-de-datos`, `tramites`.
- Hechos protegidos detectados: ninguno. **Validación de vigencia requerida**: describe un flujo anterior y no confirma que exista hoy un trámite público operativo.
- Posible duplicado: no equivalente. Relacionado: artículo de grupo familiar `8e50867a-f2dd-40d0-99c8-5399c50c948a`.

### Original

> Mantener los datos actualizados permite mejorar la comunicación con los usuarios. La web anterior disponía de un formulario para actualizar datos de los usuarios y mejorar el contacto con COOPSAR. En la nueva plataforma, este flujo debe pedir solo la información necesaria, explicar su finalidad, proteger los datos personales y utilizar un mecanismo de validación adecuado antes de modificar información asociada a un servicio.

### Propuesta IA

- Título: **Cómo actualizar tus datos de contacto**
- Resumen: Actualizar tus datos de contacto ayuda a mejorar la comunicación. El nuevo flujo debe solicitar solo la información necesaria, explicar para qué se utiliza, proteger los datos y validar antes de aplicar cambios.
- Contenido: Mantener los datos actualizados permite mejorar la comunicación con los usuarios. En la plataforma anterior existía un formulario para que los usuarios puedan actualizar sus datos y así fortalecer el contacto con COOPSAR. En la nueva plataforma, el flujo de actualización debe pedir únicamente la información necesaria, explicar el propósito de cada dato solicitado, proteger los datos personales e incorporar un mecanismo de validación adecuado antes de modificar información asociada a un servicio.
- CTAs e intenciones COOPIA sugeridas: sin CTA; aprender cómo actualizar datos e iniciar un flujo de actualización de datos de contacto.
- Notas: no incorpora links, campos ni instrucciones operativas no presentes en la fuente.

## 5. Cómo estimar el consumo eléctrico de tu hogar

- Entity type / ID: `help_article` / `2b5b9a01-c048-44c3-9090-a8beb8ed4d71`
- Estado: `draft`; propuesta: `generated`; riesgo: `low`; validación pendiente: no.
- Provenance: 1 — `datos-de-consumo`.
- Hechos protegidos detectados: ninguno. Vigencia: contenido explícitamente estimativo; no incorpora tarifa, valor, fecha ni metodología numérica.
- Posible duplicado: no equivalente. Relacionado: artículo `4e621fc4-722e-4428-9b86-c4190a0d62bd`.

### Original

> Orientación para comprender cuánto pueden consumir los equipos eléctricos. La web anterior incluía una tabla para realizar un cálculo básico del consumo de una vivienda u oficina a partir de la cantidad de aparatos y su uso. En el nuevo portal conviene convertir ese contenido en un calculador simple, dejando claro que el resultado es estimativo y que el consumo facturado depende de las mediciones reales del suministro.

### Propuesta IA

- Título: **Cómo estimar el consumo eléctrico de tu hogar (estimativo)**
- Resumen: Guía para estimar, de forma básica, el consumo eléctrico según los equipos y su uso, aclarando que el valor real facturado depende de las mediciones del suministro.
- Contenido: Esta guía propone transformar una tabla de cálculo en un calculador simple: reunir la cantidad de aparatos, considerar su tiempo de uso y estimar el consumo resultante. El resultado es estimativo. El consumo facturado puede variar respecto del cálculo porque depende de las mediciones reales del suministro.
- CTAs e intenciones COOPIA sugeridas: sin CTA; leer cómo estimar consumo, usar estimador simple y entender la diferencia entre estimación y mediciones facturadas.
- Notas: no incluye tabla, metodología ni valores numéricos no presentes en la fuente.

## Próximo paso humano

Indicá una decisión por ítem: **APROBAR**, **NECESITA VALIDACIÓN** o **RECHAZAR**. Aprobar no aplica ni publica; cualquier aplicación posterior será individual y auditada. Una publicación controlada requerirá un segundo gate explícito con el título exacto.
