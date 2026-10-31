# Modo IPA opcional y filtro representativo

Petición: filtro fonético útil para la mayoría de verbos; ajuste opcional que active restricciones y avisos IPA, ocultos por defecto. Causa reproducida: el filtro exigía validated y comenzaba en base; solo hay 27 transcripciones contrastadas entre formas/dialectos. Sin esta restricción, t/d/n cubren 98 de 120 participios UK del catálogo actual.

Decisión: modo normal usa transcripciones disponibles solo para filtrar, sin afirmar validación ni modificar datos, audio o aprendizaje. Fichas ocultan IPA/avisos/fuentes específicas; se conserva información editorial y de uso ajena a IPA. Modo estricto optativo y persistente exige IPA validada y muestra sus transcripciones, estados y fuentes. Campo opcional en preferencias: ausencia equivale a false, compatible con almacenamiento y copias anteriores. Filtro comienza en participio, conserva selección explícita del usuario. La misma política se propaga a consultas de planes.

- [x] Prueba RED→GREEN de filtro normal/estricto y guardado de preferencia.
- [x] Integrar preferencia, filtro y visualización condicional; actualizar regresiones y README.
- [x] Verificar cobertura, persistencia, activación/desactivación, suite, compilación y revisión independiente.

Límite: no se inventan transcripciones para verbos sin datos ni se convierten propuestas en IPA validada. En modo normal son agrupaciones orientativas. El modo estricto mantiene las restricciones editoriales existentes sobre IPA; los criterios de ejercicios revisados y evaluación no dependen de este ajuste.

## Cierre · 31/10/2026

Verificado: 111 pruebas unitarias/integración; 93 E2E en Chromium/Firefox/WebKit; compilación con comprobación de tipos y auditoría de contenido sin errores. Regresiones de modo normal/estricto, resultados representativos, preferencia persistente, copias antiguas y restauración de preferencias actuales, y coherencia en planes filtrados. Inspección visual de ajuste y ficha sin IPA a 360 px. README y texto del auditor actualizados.

La revisión independiente detectó la necesidad de ampliar el esquema estricto de preferencias en las copias: corregido con propiedad booleana opcional y prueba de ida/vuelta más aceptación de copias antiguas. Sin incidencias pendientes tras la revisión. Se conserva la validación original de cada transcripción; no se reetiquetan propuestas como revisadas. Las fichas mantienen notas de uso y procedencia editorial generales al ocultar IPA.
