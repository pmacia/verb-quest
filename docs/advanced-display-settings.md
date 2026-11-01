# Información avanzada — 1 de noviembre de 2026

La experiencia predeterminada de estudio oculta la procedencia editorial de los ejemplos y los metadatos técnicos del audio. Se mantienen las frases, traducciones y explicaciones gramaticales. Se agrupan tres interruptores independientes en Configuración → Información avanzada:

| Ajuste | Predeterminado | Efecto |
| --- | --- | --- |
| Modo IPA estricto | Desactivado; conserva la elección anterior | Transcripciones, revisión IPA y filtro validado |
| Mostrar fuentes y revisión | Desactivado | Fuentes bajo ejemplos y referencias editoriales; fuentes IPA si también está activado IPA |
| Mostrar detalles técnicos del audio | Desactivado | Nombre de voz, idioma y procedencia local/remota tras reproducir |

La ficha y la biblioteca muestran confirmaciones breves de reproducción en el modo predeterminado. Los controles de juegos que reutilizan AudioControls siguen la misma preferencia. La alternativa de dialecto y los errores se comunican aunque los detalles estén ocultos. No se ocultan mensajes necesarios para recuperar errores, confirmar borrados, resolver importaciones ni editar el contenido en el editor.

Los ajustes opcionales showSources y showTechnicalDetails admiten preferencias y copias antiguas sin esos campos (se interpretan como false). Se conservan y validan como booleanos en guardado y restauración, sin cambiar el esquema de IndexedDB ni borrar o reescribir el catálogo. Activar fuentes no activa IPA ni altera qué contenido es evaluable.

Pruebas: 122 unitarias/integración, incluyendo persistencia, validación y compatibilidad de copias. 39 E2E de fuentes, accesibilidad, ajustes, IPA, read y transferencia más tres E2E específicos de detalles del audio en Chromium/Firefox/WebKit. Tipos/compilación y regresión de HMR verificados. Las fuentes se conservan en el catálogo: cambia su presentación, no la trazabilidad.
