# Portabilidad

JSON conserva las fichas completas y sus variantes, fuentes y ejemplos. CSV es una proyección con pérdidas: id,base,past_simple,past_participle,meanings_es,form_relation,frequency_band,recommended_courses,content_status,notes. Variantes separadas por /; significados y cursos por ;. No supone que variantes sean intercambiables en todas las frases.

CSV admite BOM, comillas, saltos de línea y delimitadores coma/punto y coma/tabulador. Se permite mapear columnas antes de confirmar. Límite catálogo: 5 MiB, 10.000 filas, 20.000 caracteres por campo. No se trunca silenciosamente; se muestran errores con fila/campo. Los duplicados exigen decisión; el guardado es atómico y no mezcla historiales.

Exportar una selección filtrada: guardar la selección como lista y elegirla al exportar. Los textos susceptibles de fórmula en CSV se escapan como texto. JSON de copia: format verbquest-backup, schemaVersion 1, hasta 25 MiB; incluye todo el perfil y catálogo local. Restaurar sustituye la instalación local con dos confirmaciones y ofrece exportar antes. No importa código, esquemas ni ejecutables. Una versión futura o referencias inválidas se rechazan sin modificar datos.
