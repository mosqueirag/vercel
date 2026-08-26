# Validación humana de la oferta comercial de Internet

Fecha de auditoría: 2026-08-26  
Entorno auditado: `coopsar-staging` (`wwvqlbycwzxvjnexklwg`)  
Alcance: lectura exclusiva de `public.internet_plans`. No se modificaron filas, estados, precios, cobertura ni producción.

## Regla de operación

Esta matriz es un insumo de validación humana: **no confirma que ningún precio, tecnología, velocidad o condición continúe vigente**. Un plan sólo puede pasar a `published` después de la confirmación explícita de COOPSAR mediante el Centro de Gestión.

La capa pública y COOPIA leen únicamente planes `published` con `published_at` vigente. Al momento de esta auditoría hay **0 planes publicados**, por lo que no hay una oferta comercial pública activa.

## Inventario actual de staging

| Estado | Cantidad |
| --- | ---: |
| Total | 12 |
| Draft | 11 |
| Published | 0 |
| Archived | 1 |

| Plan / slug | Clasificación de auditoría | Segmento actual | Tecnología actual | Bajada / subida | Precio actual (referencial) | Instalación | Campos o decisiones pendientes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ADSL (`adsl`) | Archivado / histórico | Sin segmento | ADSL | Sin velocidad | ARS 18.984,90 | Sin dato | Confirmar si permanece sólo como histórico; ADSL no es publicable sin una confirmación comercial explícita. |
| FTTH COMERCIAL Y EDUCACIONAL 50 MB (`ftth-comercial-y-educacional-50-mb`) | Candidato comercial | Sin segmento | FTTH | 50 / sin dato | ARS 39.058,80 | Sin costo indicado | Confirmar segmento comercial o educativo, velocidad de subida, precio, condiciones y vigencia. |
| PLAN COMERCIAL 100 MB SIMETRICO (`plan-comercial-100-mb-simetrico`) | Incierto | Comercio | Sin tecnología | 100 / 100 | ARS 85.668,00 | Sin dato | Confirmar tecnología, vigencia, instalación, condiciones y precio. Sin tecnología comercial válida no puede publicarse. |
| PLAN HOGAR 50 MB (`plan-hogar-50-mb`) | Candidato comercial | Hogar | FTTH | 50 / sin dato | ARS 32.279,41 | Sin costo indicado | Confirmar precio, velocidad de subida, condiciones y relación con el registro histórico de 50 MB. |
| PLAN HOGAR 100 MB (`plan-hogar-100-mb`) | Incierto | Hogar | Sin tecnología | 100 / sin dato | ARS 70.799,52 | Sin dato | Confirmar tecnología, vigencia, instalación, condiciones y posible relación con el registro FTTH histórico de 100 MB. |
| INALAMBRICO 20 MB (`inalambrico-20-mb`) | Candidato comercial | Sin segmento | Internet inalámbrico | 20 / sin dato | ARS 27.480,55 | Sin dato | Confirmar segmento, tecnología normalizada, precio, instalación, condiciones y relación con el registro histórico de 20 MB. |
| INTERNET INALAMBRICO RURAL 1 MB (`internet-inalambrico-rural-1-mb`) | Candidato comercial | Sin segmento | Internet inalámbrico | 1 / sin dato | ARS 32.279,41 | Sin dato | Confirmar segmento, territorio/condiciones comerciales, precio, instalación y vigencia. |
| Plan Hogar 100 Megas (`hogar-100-megas-legacy`) | Histórico recuperado | Hogar | FTTH | 100 / sin dato | ARS 64.899,00 | Validar: fuente histórica indica instalación sin costo | Fuente anterior modificada el 09/07/2026. Confirmar oferta vigente; posible conflicto con `plan-hogar-100-mb`. |
| Plan Hogar 50 Megas (`hogar-50-megas-legacy`) | Histórico recuperado | Hogar | FTTH | 50 / sin dato | ARS 29.589,00 | Sin dato | Fuente anterior modificada el 09/07/2026. Confirmar oferta vigente; posible conflicto con `plan-hogar-50-mb`. |
| Plan Inalámbrico 20 Megas (`inalambrico-20-megas-legacy`) | Histórico recuperado | Hogar | Inalámbrico | 20 / sin dato | ARS 25.819,00 | Sin dato | Fuente anterior modificada el 09/07/2026. Confirmar oferta vigente; posible conflicto con `inalambrico-20-mb`. |
| Plan ADSL 5 Megas (`adsl-5-megas-legacy`) | Histórico / no publicable por ahora | Hogar | ADSL | 5 / sin dato | ARS 17.402,00 | Sin dato | Fuente anterior modificada el 09/07/2026. Confirmar si ADSL se comercializa todavía; no publicar hasta entonces. |
| Plan TEST sin precio (`plan-test-sin-precio`) | Fixture / test | Hogar | TEST | Sin velocidad | Sin precio | Sin dato | No publicable. Conservar fuera de la oferta comercial. |

## Duplicidades o conflictos a resolver

| Grupo potencial | Registros involucrados | Decisión humana requerida |
| --- | --- | --- |
| Hogar · FTTH · 50 Mbps | `plan-hogar-50-mb` y `hogar-50-megas-legacy` | Definir cuál es la oferta vigente, precio final, nombre comercial y si el registro histórico debe archivarse. |
| Hogar · 100 Mbps | `plan-hogar-100-mb` y `hogar-100-megas-legacy` | Confirmar tecnología del primero, precio vigente y si ambos representan la misma oferta. |
| Inalámbrico · 20 Mbps | `inalambrico-20-mb` y `inalambrico-20-megas-legacy` | Definir segmento, precio y plan vigente; el primer registro no tiene segmento. |
| ADSL | `adsl` y `adsl-5-megas-legacy` | Confirmar si existe una oferta ADSL vigente. Hasta entonces sólo se consideran registros históricos/no publicables. |
| Comercial / educacional 50 Mbps | `ftth-comercial-y-educacional-50-mb` | Confirmar si es comercio, educación o dos ofertas separadas. |

## Campos que COOPSAR debe confirmar

Para cada plan que se quiera publicar, COOPSAR debe confirmar explícitamente:

1. Nombre comercial final y `slug`.
2. Segmento: Hogar, Comercio, Empresa o Todos.
3. Tecnología comercial: sólo **FTTH** o **WIRELESS/Internet inalámbrico** son actualmente normalizables y publicables.
4. Velocidad de bajada y, si corresponde, subida.
5. Precio mensual vigente y moneda, o que el precio queda deliberadamente pendiente de publicación.
6. Precio/condiciones de instalación, si corresponden.
7. Beneficios, condiciones y restricciones territoriales o de elegibilidad.
8. Vigencia de la oferta y tratamiento del registro histórico reemplazado (archivar o conservar sólo como histórico).

Los campos de precio, instalación, beneficios y condiciones pueden permanecer vacíos en un borrador; no deben completarse por inferencia ni con valores históricos no confirmados. Si se publica un precio, moneda y precio deben ser consistentes entre sí.

## Taxonomía y controles existentes

- **FTTH** y **WIRELESS / Internet inalámbrico**: tecnologías que el control actual puede normalizar como candidatas a publicar, siempre que un humano confirme los datos comerciales.
- **ADSL**: etiqueta histórica; queda bloqueada para publicación hasta confirmación comercial explícita.
- **TEST**, fixture o tecnología desconocida: no publicable.
- El Centro de Gestión permite editar borradores, publicar de forma explícita y archivar. Los estados publicados/archivados no se editan en vivo.
- `internet_plan_admin_audit` existe como auditoría privada para las acciones `created`, `updated`, `published` y `archived`; no contiene solicitudes comerciales ni PII de clientes.

## Comportamiento público verificado en código

- La lectura pública consulta sólo `status = published` y `published_at` vigente mediante la capa server-side `lib/data/public-content.ts`.
- COOPIA usa esa misma lectura tipada y no ve borradores ni planes archivados.
- Con `price_amount = null`, la administración muestra “Precio pendiente de publicación”; no se debe inventar ni mostrar un importe público.
- La cobertura técnica y la oferta comercial son decisiones separadas: que un domicilio tenga cobertura no confirma por sí sola que exista un plan publicado compatible.

## Próximo paso humano

Un responsable comercial de COOPSAR debe completar esta matriz, resolver los grupos potencialmente duplicados y validar cada dato antes de cambiar un borrador a `published`. Hasta entonces, la oferta comercial permanece sin confirmar.
