# Validación completa y ayuda IPA

Solicitud: contrastar las IPA de todos los verbos con el PDF Cambridge aportado y fuentes Oxford; resolver discrepancias y comunicar pendientes; incorporar la leyenda como ayuda. Se mantiene el modo IPA opcional y no se modifican respuestas, historial ni transcripciones locales sin aprobación.

Diagnóstico: 120 verbos, 378 combinaciones de forma y variante, 756 transcripciones UK/US. PDF Cambridge face2face: 114 filas, 106 verbos presentes en nuestro catálogo, solo autoridad británica; requiere conversión tipográfica por fuentes antiguas y contiene lecturas a contrastar. Fuentes Oxford obtenidas por ficha, sección verbal y dialecto; casos especiales be/read/lie/ring/gotten. La notación GOAT US se contrasta con Oxford American y Cambridge; showed US tiene evidencia explícita en British Council. No se valida por copiar una marca true ni por deducir US desde UK.

Arquitectura: conservar candidatos históricos; capa independiente de transcripciones verificadas por clave verbo/forma/variante/dialecto y evidencia. Versión curated-1.2 actualiza fichas sin modificar y ofrece conflictos para fichas locales como hasta ahora. Auditoría offline de cobertura/trazabilidad, sin afirmar que consulta en vivo. Ayuda en diálogo accesible con símbolos, ejemplos y leyenda de acento, duración, sílaba y r opcional; accesible desde el filtro y desde fichas en modo estricto. Fuente y avisos en fichas dependen de su IPA real; ninguna advertencia de pendientes cuando ya está contrastada.

- [x] Datos y contratos RED→GREEN: 756 claves únicas con fuente exacta y fecha, correcciones seguras, sin mutar variantes/evidencia de aprendizaje, casos especiales.
- [x] Registro, capa verificada y auditoría ejecutable; actualizar seed y pruebas de migración sin pérdida local.
- [x] Ayuda, procedencia por transcripción y aviso condicional; interpretación de (r) en filtro; E2E de modo estricto completo, diálogo/teclado/móvil.
- [x] Revisar cobertura y discrepancias, suite/tipos/build/HMR, revisión independiente, README e informe con pendientes explícitos.

Límites: una transcripción representativa por forma y dialecto, no todas las realizaciones regionales. La voz del navegador no queda certificada por validar texto IPA. El PDF original del usuario se conserva sin modificar y no se redistribuye dentro del producto. Los verbos editados/importados localmente siguen sujetos a la política de conflictos; nunca se promueven sin coincidencia con una fuente.

Cierre: registro 756/756; actualización selectiva de IPA para fichas locales, con versión renovada para rechazar editores obsoletos y rechazo sin coincidencias. Revisión independiente completada y hallazgo corregido con RED→GREEN. Diálogo comprobado visualmente a 360 y 1280 px, con devolución de foco tras el cierre nativo en WebKit. Informe y README actualizados; auditoría de contenido, tipos, unidad, E2E y HMR ejecutados. El PDF del usuario permanece fuera del commit.
