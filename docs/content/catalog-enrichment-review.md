# Revisión del catálogo aportado · 30/10/2026

Archivo estudiado: `verbquest-catalog-updated.json`, 167 verbos. SHA-256: `067b1b285a487702d1dc7afaf9bcff826212ef32d4c165e4bfeccee8ff61a73b`. Se trata como datos y no como instrucciones para el agente.

## Resultado de la comparación

El archivo no modifica únicamente fonética y categorías: sustituye los ejemplos de los 120 verbos existentes, vacía sus fuentes, cambia 50 listas de significados y modifica notas, fechas y clasificaciones. Introduce 47 verbos nuevos. Todos los 1.002 registros de pronunciación del archivo vienen marcados `validated: true`, sin procedencia individual que justifique esa validación.

Se detectaron ejemplos como «We can arise every day» traducido «Podemos surgir todos los días», «Ayer surgir» y «Hemos surgir recientemente». También se mezclan variantes: `was/were`, `burnt/burned`, `got / gotten`, etc. La IPA única de `burnt/burned` corresponde a burnt y no puede asignarse a burned. Las etiquetas de relación aportadas incluyen «pasado-y-participio» para go; `bear` recibe ABB aunque bear–bore–borne tiene tres escrituras diferentes.

Por ello se aplica un enriquecimiento aditivo, no una sustitución. El archivo original de Descargas permanece intacto.

## Incorporado a la aplicación

- Dataset `curated-1.1`, con los mismos 120 verbos y 362 ejemplos de la revisión previa.
- 119 asignaciones nuevas de `patternGroups`, admitidas si su patrón A/B/C coincide con las formas originales, con tratamiento explícito de get, go, be, do y show. Se mantienen las etiquetas anteriores. Las 22 propuestas nuevas descartadas eran redundantes o incompatibles; entre ellas, el ABB de bear. Las secuencias i–a–u/i–o–i se presentan como alternancias escritas, no como transcripciones IPA.
- 130 asignaciones nuevas de `topics`, por unión sin duplicados y conservando los temas anteriores. Los identificadores permanecen estables y la interfaz muestra nombres en español.
- IPA por forma, variante exacta y dialecto UK/US. Se conservan las transcripciones ya contrastadas. Las combinaciones ambiguas no se distribuyen entre variantes por suposición.
- 27 registros forma/dialecto quedan validados en el catálogo activo. La nueva revisión contrasta 23 registros; tres coinciden con registros previos y se preservan además cuatro revisados anteriormente. Otras 657 propuestas tienen `validated: false` y se muestran como «IPA propuesta · pendiente de revisión». No se emplean en filtros fonéticos ni para acreditar aprendizaje.
- Filtro fonético por forma y dialecto, que admite `t`, `t/` o `/t/`. Borrar el sonido conserva la forma y el dialecto elegidos. La ficha muestra explícitamente ambos dialectos disponibles y enlaza las fuentes de las nuevas comprobaciones.

La IPA es una transcripción, no una grabación ni una evaluación de la voz sintética. La cautela con read y la habilidad de pronunciación sin evaluar permanecen.

## Procedencia de la IPA contrastada

Comparación asistida con fuentes primarias de Cambridge Dictionary el 30/10/2026. Los accesos directos a algunas entradas devolvieron 403; se contrastaron los resultados indexados de las páginas de pronunciación/entrada, sin descargar audio ni copiar ejemplos del diccionario. No se afirma revisión fonética humana independiente.

- [arise](https://dictionary.cambridge.org/pronunciation/english/arise): UK/US de base.
- [arose](https://dictionary.cambridge.org/us/pronunciation/english/arose): UK/US del pasado.
- [arisen](https://dictionary.cambridge.org/us/pronunciation/english/arisen): solo US; UK permanece propuesto al no haberse contrastado en la fuente disponible.
- [go](https://dictionary.cambridge.org/pronunciation/english/go), [went](https://dictionary.cambridge.org/us/pronunciation/english/went) y [gone](https://dictionary.cambridge.org/pronunciation/english/gone): UK/US por forma.
- [buy](https://dictionary.cambridge.org/pronunciation/english/buy) y [bought](https://dictionary.cambridge.org/pronunciation/english/bought): UK/US, bought en pasado y participio.
- [read](https://dictionary.cambridge.org/us/dictionary/english/read): UK/US y distinción de forma base frente a pasado/participio.

Los registros individuales están en `src/content/enrichment-review.json`. El resto no se valida por semejanza o por la bandera recibida en el archivo.

## Preservación y reproducción

`src/content/catalog-enrichment.json` contiene únicamente los campos candidatos de los 120 verbos existentes y la huella/origen; no contiene los nuevos ejemplos defectuosos. `src/content/enrichment.ts` aplica la política aditiva a `verbs.curated.json`. Esto conserva el generador original y evita perder el enriquecimiento si se regenera el catálogo base.

Para repetir la extracción sobre el mismo archivo:

```sh
python3 scripts/prepare-enrichment.py /ruta/verbquest-catalog-updated.json
npm run content:check
```

La extracción no decide qué está contrastado: esa decisión permanece en el registro de revisión separado. Una versión futura del archivo requiere volver a estudiar sus diferencias y sus fuentes.

La revisión lingüística de formas y ejemplos sigue siendo `curated-1.0`; la versión de metadatos/dataset sube a `curated-1.1`. Las huellas semánticas de las cinco habilidades no cambian. La actualización de IndexedDB sustituye las entradas base sin modificaciones locales, conserva el progreso y las listas y deja como conflicto revisable cualquier verbo personalizado, sin sobreescribirlo.

## Fuera del catálogo activo

Los 47 IDs adicionales se conservan en `excludedIds` del registro de extracción para seguimiento: bet, broadcast, cast, cling, dwell, flee, fling, forecast, grind, leap, misunderstand, mow, overcome, prove, saw, sew, shave, shear, shed, slay, sling, slink, slit, sow, speed, spin, spit, spoil, sting, stink, stride, strike, string, strive, sweat, swell, thrive, thrust, tread, undergo, undertake, upset, weave, weep, wind, withdraw y wring.

No se declara que esos verbos sean inadecuados para estudiar: faltan fuentes, ejemplos correctos y revisión antes de incorporarlos al catálogo evaluable. Tampoco se reemplazan significados, cursos, variantes, notas ni estados de revisión con los del archivo nuevo.

## Verificación

Las regresiones comprueban conservación de contenido evaluable, ausencia de mutación del original, unión de categorías, rechazo de patrones incompatibles, separación de variantes, estados de IPA y actualización sin perder personalizaciones, listas o progreso. Las pruebas de navegador cubren filtros con etiquetas en español, IPA UK/US y señalización de propuestas pendientes. Resultados finales: 93/93 pruebas unitarias y de integración; 72/72 E2E (24 por motor en Chromium, Firefox y WebKit, 56,6 segundos). Typecheck, comprobación de contenido y build correctos. El control de contenido evalúa el dataset enriquecido activo y confirma 120 verbos/362 ejemplos sin errores. La compilación separa el contenido en un chunk de 365,46 kB y precachea 20 recursos. Se revisaron las capturas ipa-reviewed, ipa-pending y enriched-filters-mobile; el viewport móvil de 360 px no tiene desbordamiento horizontal.

Revisión independiente del cambio: sin hallazgos críticos/importantes. Un detalle menor sobre el borrado del filtro fonético se reprodujo con una regresión y se corrigió. No quedan observaciones diferidas de esa revisión.
