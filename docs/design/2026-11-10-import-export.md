# Importación, exportación y publicación del catálogo

Estado: propuesta aprobada por el usuario; implementada como paquete completo del catálogo.

## Auditoría

- JSON de catálogo serializa el registro completo. El esquema actual admite `icon`; las traducciones por forma, variantes, pronunciación y metadatos viajan dentro del registro.
- La importación JSON valida esos registros. Al actualizar, conserva el ID de destino y genera una nueva versión local; no es una restauración literal de versiones.
- La copia completa guarda entradas del catálogo y datos del perfil, y los restaura de forma atómica. Debe comprobarse expresamente la conservación de los campos recientes.
- CSV es un intercambio simplificado: omite iconos, traducciones por forma, ejemplos, pronunciación, audio, fuentes y otros metadatos. No sirve como copia completa ni como publicación.
- La base actual se compone en `src/content/dataset.ts` mediante verbos, enriquecimiento, revisión fonética y traducciones. Reemplazar únicamente `verbs.curated.json` puede provocar sobrescrituras por las capas posteriores.
- La sincronización protege modificaciones locales con `pendingBase`. No elimina registros ausentes de una nueva base.

## Propuesta recomendada

Exportación avanzada de un paquete completo, sin perfil, listas, sesiones ni progreso. Incluye catálogo consolidado JSON, módulo TypeScript de carga y guía de incorporación con rutas exactas, versión y comandos de comprobación. Una descarga ZIP evita múltiples descargas y conserva las rutas.

El catálogo exportado incluye todos los verbos, también los archivados. No depende del selector de listas usado para el intercambio normal. Conserva los iconos explícitos y resuelve los iconos predeterminados para que el contenido visual sea transportable.

El módulo generado carga el catálogo consolidado directamente: no vuelve a aplicar las capas editoriales anteriores. Esto se limita a la base distribuida; no modifica los datos del navegador ni publica automáticamente en GitHub.

Se solicita una versión nueva, distinta de la base en uso. Los metadatos de revisión existentes se conservan; la exportación no convierte propuestas en contenido validado ni inventa evidencia. Un informe distingue validez estructural de revisión editorial. Las comprobaciones de publicación actuales dependen de manifiestos y evidencias: deben mantenerse y documentarse, nunca eludirse para conseguir un resultado verde.

Las instalaciones nuevas reciben la nueva base. Las existentes reciben la actualización al cargar la nueva versión de la aplicación; las modificaciones locales permanecen protegidas. Para retirar un verbo de instalaciones existentes debe exportarse archivado, no simplemente omitirse.

Alternativa: repartir los cambios entre las capas actuales. Mantiene el modelo de autoría actual, pero exige resolver precedencias, separar manualmente campos y actualizar varios archivos por cada cambio; se desaconseja para este flujo.

## Interfaz

Página con título y punto, iconos y colores coherentes con catálogo/editor, tarjetas compactas y adaptación móvil:

1. Intercambiar catálogo: importar con vista previa, conflictos y confirmación; exportar JSON completo o CSV simplificado, con selección de catálogo/lista.
2. Copia de seguridad: exportación completa y restauración, con alcance y sustitución claramente explicados.
3. Publicar catálogo base: sección avanzada desplegable, resumen de versión y cantidades, validación, descarga del paquete y pasos posteriores.

Mensajes de error próximos a su operación, progreso durante lecturas/descargas y prevención de dobles envíos. Mantener las confirmaciones de importación y restauración y el cierre compartido de diálogos.

## Verificación prevista

- Ida y vuelta JSON e importación efectiva con icono y todos los campos recientes.
- Copia y restauración conservan esos mismos campos y los datos vinculados.
- Paquete sin datos personales, rutas válidas y catálogo idéntico al exportado; carga sin sobrescrituras de las capas anteriores.
- Versionado, archivos inválidos, conflictos y conservación de modificaciones locales.
- Interfaz en móvil/escritorio, claro/oscuro, navegación por teclado y descarga real en Chromium, Firefox y WebKit.
- README con formatos, limitaciones y publicación paso a paso.

## Decisiones de implementación

- Se mantiene la lógica de intercambio, copia y publicación en módulos separados. La página principal coordina la importación; los otros dos bloques tienen estado y errores propios.
- Se distingue la composición editorial histórica (`curated-dataset.ts`) del cargador público reemplazable (`dataset.ts`); las pruebas históricas no imponen una versión fija a una nueva publicación.
- El informe señala el contenido nuevo/modificado frente a la base distribuida para revisión humana, aunque exista una entrada antigua en el manifiesto. Icono, archivo y fechas/versiones no se consideran cambios lingüísticos.
- Se comprueba la incorporación real del ZIP en una copia temporal del proyecto, sin alterar los archivos fuente de trabajo.
