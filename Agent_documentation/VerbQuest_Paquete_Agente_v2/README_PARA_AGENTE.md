# Guía de trabajo para el agente — VerbQuest

## Lectura obligatoria

1. `REQUISITOS_FUNCIONALES.md` (raíz del ZIP): fuente normativa para alcance, requisitos FR/RNF y criterios de aceptación.
2. `DIRECCION_VISUAL.md`: dirección visual elegida y cómo combinar las ideas de otras exploraciones.
3. `design/BRAND_GUIDE.md`: colores, componentes y estilo.
4. `schemas/verb.schema.json` y `schemas/study-plan.schema.json`: modelos de datos iniciales.
5. `examples/`: fixtures para probar el sistema.

## Principios de implementación

- Implementa un MVP funcional y comprobable, no todas las funciones futuras de una vez.
- Mantén una única fuente de datos de verbos compartida por catálogo, fichas, planificador y juegos.
- Representa variantes válidas explícitamente; evita codificar una única respuesta textual si hay alternativas lingüísticas aceptadas.
- Separa módulos de contenido, motor de aprendizaje, generador de preguntas, juegos, progreso, gamificación y persistencia.
- No declares un verbo dominado porque se abrió la ficha o se acertó una sola pregunta de selección múltiple.
- Los contenidos de ejemplo son fixtures, no un catálogo definitivo. Las asignaciones de curso, frecuencia, IPA y frases requieren validación lingüística.
- Las imágenes son referencias visuales; no copies como definitivos los textos pequeños que contienen.
- Mantén la aplicación utilizable si el audio está ausente o sin conexión.
- Si incorporas audio externo, registra procedencia, licencia y dialecto.
- Evita rankings públicos y notificaciones obligatorias en el MVP.

## Iteraciones recomendadas

1. Estructura responsive/PWA, catálogo, búsqueda, filtros, ordenación, listas y ficha.
2. Edición, persistencia, importación/exportación y validación de datos.
3. Planes, repaso por habilidad, progreso, Flashcards, emparejar y Quiz.
4. Audio Detective y ejercicios de frases con alternativas si falla el audio.
5. Sellos, misiones, accesibilidad, pruebas end-to-end y documentación.

## Criterio de terminado

Una pantalla está terminada cuando funciona con datos reales de ejemplo, persiste los cambios, gestiona errores y estados vacíos, tiene navegación usable en móvil y escritorio y cumple los criterios de aceptación pertinentes. Un prototipo visual estático no satisface por sí solo un requisito funcional.
