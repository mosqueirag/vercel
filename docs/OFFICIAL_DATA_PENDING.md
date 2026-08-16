# OFFICIAL_DATA_PENDING

No se cargaron planes, precios, contactos ni cobertura como contenido oficial porque COOPSAR todavía no entregó valores aprobados para esta fase.

## Entregables requeridos

- Planes: nombre, slug, segmento, tecnología, bajada/subida, beneficios, condiciones, precio/vigencia o confirmación de “Consultar precio”, instalación, orden, responsable y fecha de publicación.
- Contactos: WhatsApp comercial, soporte y horario de Internet/Fibra; Oficina Virtual; atención general, domicilio/horario; guardias de energía y sepelio. Cada valor requiere responsable y fecha de aprobación.
- Cobertura: calle, altura, estado, tecnología, `plan_id` si aplica, origen permitido y fecha de verificación. No incluir topología, nodos, puertos, IP, coordenadas ni datos SCADA.

Clasificación actual: `TEST` en fixtures; `PENDING_CONFIRMATION` para todo valor histórico/hardcodeado. Sólo `CONFIRMED` puede quedar `published` en staging.
