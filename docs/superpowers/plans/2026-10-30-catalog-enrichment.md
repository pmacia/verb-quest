# Integración selectiva del catálogo aportado

Objetivo autorizado: estudiar el JSON e incorporar sus características cuando sean adecuadas. Se mantiene React/TypeScript/IndexedDB y el checkout actual. No se sustituye el catálogo completo.

Decisión: enriquecimiento aditivo sobre los 120 verbos revisados, conservando ejemplos, acepciones, variantes, fuentes, cursos y evidencias. El reemplazo total introduciría ejemplos incorrectos y formas combinadas; ampliar a 167 requiere revisar los 47 nuevos. Una capa de metadatos separada permite regenerar el catálogo base sin perder el enriquecimiento.

- [x] Auditar estructura, diferencias, procedencia e IPA; registrar omisiones y huella del archivo. No confiar en validated:true sin contraste.
- [x] Escribir regresiones del enriquecimiento: unión sin duplicados, variantes exactas, protección de datos originales, patrones compatibles y fonética pendiente frente a contrastada. Ejecutar rojo y después implementar la capa aditiva y versión de dataset nueva.
- [x] Integrar etiquetas comprensibles de patrones/temas, IPA por variante y dialecto con estado explícito, filtro fonético por forma/dialecto. Probar que propuestas no son evidencia validada.
- [x] Verificar actualización de instalaciones existentes sin perder modificaciones locales ni progreso; typecheck, pruebas, contenido, build y E2E pertinentes. Registrar resultados y límites en docs/content/catalog-enrichment-review.md.

El usuario delegó expresamente el juicio de adecuación. No se añaden campos duplicados de clasificación ni dependencias nuevas. La transcripción IPA es independiente de la voz sintética; no se certifica el audio del navegador. La versión del dataset cambia por metadatos; la versión lingüística de formas/ejemplos y sus objetivos de cobertura permanece estable.

Cierre: 93 pruebas unitarias/integración y 72 E2E pasan; typecheck, contenido y build correctos. Revisión independiente sin hallazgos críticos/importantes; detalle menor del filtro corregido con regresión. Evidencia y límites en [revisión del catálogo](../../content/catalog-enrichment-review.md).
