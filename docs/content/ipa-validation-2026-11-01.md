# Validación IPA — 1 de noviembre de 2026

El catálogo `curated-1.2` contiene 120 verbos, 378 combinaciones de forma/variante y **756 transcripciones contrastadas: 378 UK y 378 US. No queda ninguna IPA pendiente en el catálogo incluido**. Se han completado 72 valores ausentes y ajustado 84 de los existentes; 600 conservan su texto anterior. Estos ajustes incluyen diferencias de notación y variantes aceptadas: no representan 84 errores lingüísticos.

## Fuentes y método

El PDF Cambridge face2face aportado en `Agent_documentation/Irregular-Verb-Chart.pdf` tiene tres páginas y 114 filas, de las que 106 verbos están en nuestro catálogo. Su información es británica; no se ha extrapolado a US. Se revisaron visualmente las páginas y se normalizó la codificación de su fuente antigua. Hay 300 coincidencias británicas exactas tras esa normalización. SHA-256 del original: `92ad777b202e81c216db34c41c423e8f376e0d20c1393bb57a75e96703fd335f`. El original se conserva sin modificar y no se incluye en la aplicación.

Las [listas Oxford](https://www.oxfordlearnersdictionaries.com/wordlists/) sirven para seleccionar vocabulario; las pronunciaciones de formas flexionadas se comprobaron en sus fichas individuales. El registro final utiliza 717 valores de Oxford English, 19 de Oxford American, 19 de Cambridge y uno de British Council. Cada entrada conserva URL, fecha, forma, dialecto y evidencia en [el registro completo](../../src/content/enrichment-review.json).

Se verificaron por separado el infinitivo, pasado y participio de cada variante. Las fichas homógrafas se distinguieron por sus formas: lie/lay/lain, ring/rang/rung y read con /riːd/ en base y /red/ en pasado y participio. Se conserva la condición dialectal de las variantes: disponer de una pronunciación UK de gotten no convierte gotten en la variante británica habitual.

## Discrepancias resueltas

- El PDF presenta una forma débil de be; se selecciona la forma fuerte /biː/, documentada en [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/be_1). No se considera la forma débil un error por sí misma.
- La lectura del PDF para swing termina en n; se usa /swɪŋ/, contrastada en [Oxford](https://www.oxfordlearnersdictionaries.com/definition/english/swing_1).
- Algunas transcripciones etiquetadas US en Oxford English conservan /əʊ/. Se contrastaron con Oxford American o Cambridge para seleccionar /oʊ/ estadounidense, sin convertir símbolos automáticamente. Ejemplo: [go en Oxford American](https://www.oxfordlearnersdictionaries.com/definition/american_english/go_1).
- [Gone](https://www.oxfordlearnersdictionaries.com/definition/english/go_1) se representa como /ɡɒn/ UK y /ɡɔːn/ US según la ficha elegida; otras realizaciones regionales pueden ser válidas.
- Showed US /ʃoʊd/ dispone de evidencia explícita en la columna estadounidense de [British Council](https://www.britishcouncil.org.mx/blog/irregular-verbs).

## Aplicación y conservación de datos

Una capa de revisión independiente aplica únicamente coincidencias exactas de verbo, forma, variante y dialecto; conserva metadatos de audio y no modifica formas, ejemplos ni evidencia de aprendizaje. Una fuente solo se muestra si coincide con la IPA validada que realmente tiene la ficha.

Las fichas sin cambios locales se actualizan con la nueva base. Las personalizadas mantienen sus cambios y ofrecen, en su editor con modo IPA activo, **Actualizar solo IPA y conservar mi ficha**. Esta acción actualiza las formas coincidentes, conserva las demás y protege contra guardados obsoletos de otro editor. Si ninguna forma coincide, no elimina la actualización pendiente ni comunica éxito.

La ayuda **Cómo leer los sonidos** adapta la leyenda del PDF y la [guía Oxford](https://www.oxfordlearnersdictionaries.com/about/pronunciation_english.html): vocales, consonantes, diptongos, acentos, duración, separación silábica, consonantes silábicas y r británica de enlace. El filtro interpreta la r opcional de Oxford. El modo normal sigue ocultando IPA y sus avisos en las fichas. Capturas reales de la ayuda: [móvil](../screenshots/ipa-help-mobile.png) y [escritorio](../screenshots/ipa-help-desktop.png).

## Alcance y comprobaciones

Se ofrece una pronunciación representativa por forma y dialecto, con alternativas documentadas cuando aparecen en la fuente. No se pretende recoger todas las realizaciones regionales. La revisión asistida de fuentes no constituye una certificación institucional de VerbQuest, ni valida las voces sintéticas del navegador o la pronunciación del estudiante.

`npm run content:ipa` comprueba offline cobertura y correspondencia de evidencias; no vuelve a consultar los diccionarios en cada ejecución. Resultado: 756/756, sin incidencias. Las transcripciones personales/importadas ajenas a estas coincidencias siguen necesitando su propia fuente; no se marcan automáticamente como validadas.

Validación técnica: tipos, 120 pruebas unitarias/integración, 99 pruebas E2E en Chromium/Firefox/WebKit, comprobación de contenido y regresión de recarga en caliente. Incluye guía móvil, teclado, accesibilidad automática, actualización selectiva y protección de datos locales. Una revisión independiente detectó la necesidad de renovar la versión al aceptar IPA; se corrigió con una prueba de guardado obsoleto.

**Pendientes del catálogo incluido: ninguno.** Quedan fuera de esta afirmación las formas personalizadas del usuario y los verbos adicionales que todavía no forman parte de los 120 publicados.
