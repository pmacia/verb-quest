# VerbQuest — propuesta de producto y experiencia

**Versión:** 0.1 · **Estado:** concepto inicial para orientar el desarrollo · **Fecha:** 29 de octubre de 2026

## 1. Idea central

VerbQuest será una aplicación web educativa y gamificada que ayude a estudiantes de ESO a aprender los verbos irregulares en inglés a través de un catálogo único, planes personales y modos de práctica variados. El catálogo será el núcleo de conocimiento; las fichas, juegos, misiones, colecciones y estadísticas se construirán sobre esa misma información.

La promesa no es «hacer muchos ejercicios», sino ayudar a que el estudiante recuerde las formas después de varios días y sepa utilizarlas en una frase.

## 2. Público y tono

El foco inicial son estudiantes de 12–14 años, con diseño ampliable a 1.º–4.º de ESO. La experiencia debe ser visual, ágil, positiva y suficientemente madura para no parecer una aplicación exclusivamente infantil.

Las sesiones deben poder durar 5, 10 o 15 minutos. El usuario podrá estudiar siguiendo un plan o entrar directamente en la biblioteca y elegir un juego.

## 3. Biblioteca como base del producto

Cada verbo tendrá una ficha con:

- Forma base, pasado simple y participio pasado, incluidas variantes y notas de uso.
- Traducción principal y significados frecuentes.
- Transcripción fonética IPA, preferiblemente británica y americana cuando exista una fuente validada.
- Audio independiente para cada forma y para ejemplos.
- Frases cortas que ilustren los usos en presente, pasado simple y participio en contextos adecuados.
- Familia morfológica, relación entre formas, terminaciones escritas y sonidos finales.
- Frecuencia, curso recomendado y etiquetas temáticas configurables.
- Ayudas de memoria, notas y progreso por habilidad.

La biblioteca puede crecer hasta incluir varios cientos de verbos y variantes, pero las plantillas por curso deben mostrar una selección adecuada para estudiar. Las asignaciones de curso y frecuencia deben poder adaptarse a los libros y programas de cada centro.

## 4. Navegación propuesta

La barra superior del catálogo concentra el buscador global, filtros, ordenación, filtros activos y acciones de edición. La barra inferior contiene cinco áreas:

1. **Inicio:** misión del día, continuación del plan y recomendaciones.
2. **Verbos:** catálogo, filtros, listas y fichas.
3. **Estudiar:** plan activo, repasos y contenido nuevo.
4. **Juegos:** selección del modo de práctica.
5. **Progreso:** dominios por habilidad, logros y próximos repasos.

La configuración general estará accesible desde Inicio. El modo de edición se distingue claramente del modo de estudio.

## 5. Las cinco dimensiones que deben entrenarse

1. **Reconocimiento:** identificar las formas al verlas.
2. **Memoria activa:** recordar las formas sin tener la respuesta delante.
3. **Escucha y pronunciación:** reconocer las formas al escucharlas y ensayar su producción oral.
4. **Escritura:** escribir las formas correctamente.
5. **Uso en contexto:** elegir la forma adecuada y utilizarla en una frase.

El progreso se mantendrá por habilidad. Consultar una ficha, escuchar un audio o acertar una pregunta de selección múltiple no debe desbloquear automáticamente el dominio total del verbo.

## 6. Modos de práctica

### Imprescindibles para el MVP

- **Flashcards:** ver una pista, intentar recordar y revelar la solución.
- **Emparejar formas:** asociar infinitivo, pasado, participio y significado.
- **Audio Detective:** identificar una forma escuchada sin verla escrita.
- **Quiz:** seleccionar la respuesta correcta entre opciones plausibles.
- **Completa la frase:** escoger o escribir la forma que exige el contexto.

### Ampliaciones

- **Construye la palabra:** ordenar letras o fragmentos y luego escribir sin ayudas.
- **Error Hunter:** corregir errores típicos como *goed* o *buyed*.
- **Pronunciation Lab:** escuchar, grabarse y comparar con un modelo, sin penalizar el acento.
- **Desafío final:** mezclar memoria, escucha, escritura y contexto en una prueba de repaso.

Todas las modalidades deben utilizar la selección de verbos del plan activo y compartir el mismo motor de datos/preguntas.

## 7. Gamificación propuesta

### Sellos por verbo

- **Explorador:** consulta la ficha.
- **Oído atento:** escucha las formas disponibles.
- **Buena memoria:** recupera las formas correctamente en sesiones separadas.
- **Buena ortografía:** escribe correctamente las formas.
- **En contexto:** responde correctamente a ejercicios contextualizados.
- **Coleccionista:** completa objetivos de una colección.

Los sellos de actividad y los sellos de dominio deben ser diferentes. Escuchar una grabación no equivale a saber pronunciarla.

### Mundos y misiones

- Valle de los esenciales: primeros verbos de alta utilidad.
- Bosque de las familias: patrones morfológicos y grupos de verbos.
- Cueva del sonido: escucha y pronunciación.
- Ciudad de las frases: aplicación gramatical.
- Desafío final: ejercicios mixtos y repaso acumulado.

Las recompensas pueden incluir puntos de experiencia, insignias, avatares y objetos coleccionables. Las rachas son opcionales; el descanso no debe eliminar logros. Las clasificaciones públicas se excluyen del MVP.

## 8. Plan de estudio adaptativo

Plantillas sugeridas:

- Empiezo desde cero.
- 1.º ESO — básicos.
- 2.º ESO — consolidación.
- 3.º ESO — ampliación.
- 4.º ESO — repaso general.
- Preparación de examen/lista del profesor.
- Entrenamiento auditivo.
- Patrones y terminaciones.
- Mis verbos difíciles.

El constructor de planes combina origen de los verbos, habilidades objetivo, duración de sesión, cantidad de verbos nuevos y modalidades. El algoritmo prioriza repasos vencidos, errores recientes y habilidades débiles antes de introducir nuevos contenidos.

Como primera aproximación, se pueden probar intervalos crecientes —por ejemplo, 1, 3, 7 y 14 días— y reducirlos cuando haya errores. Deben tratarse como valores configurables y calibrarse con el uso, no como una regla infalible.

## 9. Edición y administración

El catálogo debe poder crear, editar, archivar/restaurar, importar y exportar verbos sin tocar el código. La importación CSV/JSON contará con previsualización, validación y reporte de errores. Las listas personales o docentes no deben alterar el catálogo base. En un futuro multiusuario, la autorización se validará en el servidor.

## 10. Ruta de implementación

**Iteración 1 — Catálogo:** estructura PWA, catálogo, ficha, búsqueda, filtros, listas y diseño responsive.

**Iteración 2 — Gestión:** editor, persistencia, importación/exportación, validación de datos.

**Iteración 3 — Aprendizaje:** planes, cola de repaso, progreso por habilidades, Flashcards, emparejar y Quiz.

**Iteración 4 — Audio y contexto:** Audio Detective, ejercicios de frase, fallos de audio tolerantes.

**Iteración 5 — Gamificación y calidad:** sellos, misiones, métricas, accesibilidad y pruebas end-to-end.

## 11. Criterio de éxito

La app debe conseguir que el estudiante complete sesiones voluntariamente, vuelva al material pendiente y mejore en pruebas de recuerdo a varios días de distancia. Se debe observar el acierto sin pistas, los errores por forma, la comprensión auditiva, la ortografía y el uso correcto en frases; el tiempo en la aplicación, por sí solo, no es una medida suficiente.

Para detalles normativos, alcance P0/P1/P2 y pruebas de aceptación, consultar `REQUISITOS_FUNCIONALES.md`.
