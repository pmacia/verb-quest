# Portabilidad

JSON conserva las fichas completas y sus variantes, fuentes y ejemplos. CSV es una proyección con pérdidas: id,base,past_simple,past_participle,meanings_es,form_relation,frequency_band,recommended_courses,content_status,notes. Variantes separadas por /; significados y cursos por ;. No supone que variantes sean intercambiables en todas las frases.

CSV admite BOM, comillas, saltos de línea y delimitadores coma/punto y coma/tabulador. Se permite mapear columnas antes de confirmar. Límite catálogo: 5 MiB, 10.000 filas, 20.000 caracteres por campo. No se trunca silenciosamente; se muestran errores con fila/campo. Los duplicados exigen decisión; el guardado es atómico y no mezcla historiales.

Exportar una selección filtrada: guardar la selección como lista y elegirla al exportar. Los textos susceptibles de fórmula en CSV se escapan como texto. JSON de copia: format verbquest-backup, schemaVersion 1, hasta 25 MiB; incluye todo el perfil y catálogo local. Restaurar sustituye la instalación local con dos confirmaciones y ofrece exportar antes. No importa código, esquemas ni ejecutables. Una versión futura o referencias inválidas se rechazan sin modificar datos.


## Paquete de publicación de la base

La sección avanzada de importación/exportación descarga un ZIP con `src/content/catalog.release.json`, `src/content/dataset.ts`, `PUBLICATION_REPORT.json` y `README-PUBLICAR.md`. El JSON contiene un `Dataset` con `version`, `kind` y `verbs`; puede reutilizarse como importación local. La versión debe ser nueva y única.

El paquete conserva el catálogo completo, sus archivados y los iconos resueltos, sin las tablas personales de IndexedDB. Las URL de audio son referencias, no grabaciones incluidas. La validez estructural no acredita revisión editorial: el informe identifica las diferencias de contenido respecto a la base distribuida y contrasta la IPA con la evidencia disponible. Consulta el [README](../README.md#publicar-una-nueva-base-para-todos-los-usuarios) para incorporarlo al código fuente.


## Definiciones del verbo

El campo opcional `definitions` contiene registros con `text` (inglés), `dialects` (lista no vacía de `uk`/`us`), `sources` (descripción, URL, licencia y fecha opcionales) y `reviewStatus` (`draft`, `needs_review` o `validated`). Las fichas antiguas sin el campo siguen siendo válidas. La ficha agrupa textos idénticos y combina sus dialectos, procedencias y revisión sin modificar los registros guardados. Las definiciones viajan en JSON, copias completas y ZIP de publicación; no en el CSV simplificado.
