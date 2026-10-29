# VerbQuest — análisis inicial y hoja de ruta propuesta

Fecha: 29 de octubre de 2026.
Estado: análisis inicial histórico. Las decisiones posteriores quedan consolidadas en `docs/superpowers/specs/2026-10-29-verbquest-design.md`, aprobado por el usuario, y el plan de implementación está en `docs/superpowers/plans/2026-10-29-verbquest.md`. Las preguntas abiertas de este análisis se interpretan a la luz de esos documentos posteriores.

## Decisiones confirmadas en la conversación

- Primera versión en el navegador, con persistencia local. Sin cuentas ni sincronización inicial; enfoque A.
- El usuario no aporta lista ni material docente: crearemos el catálogo tomando como referencia los contenidos de la ESO.
- Audio inicial aprobado: síntesis de voz del navegador. Seleccionar voz británica/americana cuando esté disponible, identificar la voz realmente usada y ofrecer alternativa visual ante ausencia o fallo. No garantizar audio offline si la voz requiere red. La alternativa visual no aumenta escucha ni pronunciación. La síntesis no valida por sí sola la pronunciación del contenido.

### Reglas de aprendizaje — aprobadas por el usuario

- Progreso independiente por verbo y por las seis habilidades normativas. Cada intento conserva tipo de evidencia, pistas, opciones y sesión.
- Intervalos iniciales configurables: 1, 3, 7 y 14 días. Un acierto objetivo sin ayudas avanza como máximo un paso por habilidad y día local; los demás aciertos se guardan sin acelerar la consolidación. Fechas de intentos en UTC; días y vencimientos interpretados con la zona del perfil.
- Primer acierto apto: siguiente repaso al día siguiente. Segundo: a 3 días; tercero: a 7; cuarto: a 14. Para avanzar, los aciertos posteriores deben ocurrir cuando venza el repaso. Practicar anticipadamente no adelanta el escalón ni pospone un vencimiento pendiente.
- Error: estado necesita refuerzo, reinicio del escalón y repaso al día siguiente; puede reaparecer al final de la sesión actual sin contar como evidencia espaciada. La repetición inmediata se limita para no crear bucles.
- Autoevaluaciones y respuestas con pistas se registran como práctica; no bastan para declarar dominio. «No lo sabía» o «Dudé» priorizan repaso sin interpretarse como fallos objetivos de una respuesta escrita.
- Estados: nuevo sin actividad; en aprendizaje tras empezar; en consolidación tras dos aciertos aptos en días distintos; dominado tras cuatro aciertos aptos espaciados. Un error o vencimiento da prioridad al estado necesita refuerzo, conservando el historial de consolidación.
- Cada pregunta tiene una habilidad principal: seleccionar opciones y emparejar entrenan reconocimiento; escribir una forma puede entrenar escritura; la recuperación sin opciones, memoria; escuchar e identificar, escucha; resolver una frase, contexto. No duplicar mejoras automáticamente entre habilidades.
- El dominio de reconocimiento y escucha puede basarse en selección objetiva adecuada a esa habilidad. Memoria y escritura requieren respuesta sin opciones; contexto requiere al menos una respuesta escrita sin ayudas. Los requisitos de evidencia se centralizan por habilidad.
- Pronunciación permanece «sin evaluar» en el MVP: escuchar o reproducir una voz no demuestra producción oral.
- Resumen global conservador: mostrar cuántas de las cinco habilidades evaluables están dominadas. Solo usar «dominado en las habilidades evaluadas» cuando lo estén las cinco; indicar aparte pronunciación sin evaluar. Las metas particulares de un plan no rebajan ese criterio global.
- Puntos y sellos no alteran el dominio. Abrir una ficha puede conceder Explorador una vez; escuchar puede conceder un sello de actividad, nunca de producción oral. Las recompensas por respuestas se deduplican por intento persistido y la repetición de una misma tarea en una sesión no genera puntos ilimitados.

Estos umbrales son una propuesta de producto configurable, no una regla curricular ni una garantía científica. Se verificarán con pruebas de reloj controlado, ayudas, errores, sesiones repetidas y cambio de día.

### Propuesta de elaboración del catálogo

Referencia curricular inicial: enseñanzas mínimas estatales de Lengua Extranjera del [Real Decreto 217/2022, anexo II](https://www.boe.es/buscar/act.php?id=BOE-A-2022-4975), consultadas el 29 de octubre de 2026. Describen competencias, funciones comunicativas y ámbitos de léxico, con bloques de primero/segundo y tercero/cuarto; no proporcionan una lista cerrada de verbos irregulares por curso.

Propuesta pendiente de diseño final: seleccionar aproximadamente 120 verbos, dentro del rango normativo de 100–150, por utilidad para vida cotidiana, escuela, relaciones, ocio, viajes y narración de experiencias. Crear selecciones acumulativas configurables para 1.º–4.º. Su asignación será una recomendación editorial de VerbQuest, no una lista oficial del currículo ni una equivalencia certificada de nivel.

Separar la justificación curricular de la comprobación lingüística: contrastar formas, restricciones, variantes e IPA con fuentes lexicográficas identificadas; redactar ejemplos originales adecuados a la edad y revisar cada uno. Registrar fuentes consultadas y condiciones de reutilización sin copiar definiciones ni ejemplos de terceros automáticamente. Mantener revisión por campo/recurso cuando corresponda; una consulta automática no equivale a revisión docente independiente.

Usar los ocho fixtures para pruebas técnicas, no como catálogo publicado. La revisión de contenido y procedencia forma parte del trabajo, no una aportación que se presupone del usuario. Cualquier revisión humana externa que no esté disponible se registrará como limitación explícita antes del lanzamiento.

## 1. Fuentes y situación actual

- Fuente normativa: `Agent_documentation/VerbQuest_Paquete_Agente_v2/REQUISITOS_FUNCIONALES.md`.
- Instrucciones: `README_PARA_AGENTE.md`; contexto complementario: `docs/PROPUESTA_DE_PRODUCTO.md`.
- Diseño: `DIRECCION_VISUAL.md`, `design/BRAND_GUIDE.md`, tokens, SVG y tablero `00-DIRECCION-VISUAL-PREFERIDA.png`.
- Datos: dos JSON Schema y ejemplos de verbos, preguntas, plan y CSV.
- El paquete de recursos visuales coincide con el paquete completo en los archivos compartidos. La copia de requisitos bajo `docs/` también coincide con la de su raíz.
- Solo hay documentación: no hay aplicación, dependencias, pruebas ni repositorio Git en esta carpeta. No se han creado durante el análisis.
- Se ha inspeccionado la referencia visual principal: conservar azul, turquesa, tarjetas y tono adolescente; los nombres y textos antiguos de las láminas no son normativos.

## 2. Producto que debe construirse

Aplicación educativa en español para alumnado de ESO, con ejemplos en inglés, sesiones de 5/10/15 minutos y seis habilidades independientes: reconocimiento, recuperación, escucha, escritura, pronunciación y contexto.

Cinco áreas: Inicio, Verbos, Estudiar, Juegos y Progreso. Catálogo único, identificadores estables y reutilización del contenido por fichas, listas, planes y juegos. Modo edición explícito; un interruptor local no representa autorización real.

MVP completo: catálogo curado de aproximadamente 100–150 verbos, filtros combinables, listas, fichas, edición y archivado, importación/exportación CSV/JSON con previsualización, nueve plantillas de planes, constructor, adaptación por habilidad, cinco juegos, sellos y experiencia, preferencias, persistencia local y PWA.

Fuera del MVP: cuentas y sincronización obligatorias, panel docente multiusuario, reconocimiento automático de voz, clasificaciones públicas, chat, generación libre de frases en producción y mundos complejos.

## 3. Límites y discrepancias que deben resolverse

1. **Contenido:** solo hay ocho verbos ilustrativos, todos pendientes de revisión, y tres preguntas de ejemplo. No alcanzan el catálogo curado exigido. Definir responsable, fuentes, permiso de reutilización y criterio de revisión para formas, variantes, cursos, frecuencia, IPA y frases. Podemos desarrollar con fixtures identificados, pero la publicación debe tener una puerta de revisión separada.
2. **Audio:** no hay grabaciones. La especificación permite TTS, pero su disponibilidad offline y dialecto dependen del dispositivo. Definir si la primera entrega usa TTS con alternativa visual o necesita grabaciones revisadas. Nunca registrar un ejercicio visual alternativo como evidencia auditiva.
3. **Dominio:** los estados están definidos, pero no sus umbrales ni la combinación global. Especificar evidencias admitidas, separación temporal mínima, efecto de pistas y errores, intervalos y agregación por verbo. No avanzar por repetir respuestas en una misma sesión.
4. **Ejemplo de quiz:** `questions.example.json` etiqueta una selección múltiple como `recall`. Conservar el fixture como referencia original; en el modelo de ejecución distinguir reconocimiento con opciones de recuperación sin opciones, conforme a los principios normativos.
5. **Pronunciación:** existe como habilidad P0 en el progreso, pero el laboratorio es P2. Mostrar «sin evaluar» cuando no haya evidencia de producción oral; escuchar no equivale a pronunciar. Evitar que una habilidad no evaluable bloquee para siempre un resumen de aprendizaje útil.
6. **Esquemas iniciales:** faltan listas, perfiles, intentos, sesiones, progreso, logros, ajustes y copias de seguridad. El esquema de planes no condiciona los campos requeridos al tipo de origen; tampoco define filtros estructurados ni orden/dificultad. Completar contratos antes de persistir datos reales.
7. **Contenido y archivo:** `contentStatus` mezcla revisión y archivado. Propuesta: separar estado editorial y archivado en una migración explícita, conservando el estado previo para restaurar.
8. **Variantes y contexto:** `was/were` no son intercambiables en una frase. Las notas libres no bastan para evaluar automáticamente restricciones; usar respuestas revisadas por pregunta/contexto y omitir preguntas ambiguas. El CSV simplificado no conserva todos los metadatos: JSON debe ser el formato sin pérdidas, con advertencia al exportar CSV.
9. **P0/P1:** mundos, misiones temáticas, rachas y multiperfil son P1. El cierre de una sesión y sellos P0 no deben depender de implementarlos. Tabla/tarjetas es P1; la adaptación móvil es obligatoria desde el primer hito.
10. **Recuperación:** se exige exportar progreso, pero no se concreta restaurarlo. Propuesta pendiente: copia JSON versionada del perfil y restauración validada con previsualización, sin sobrescritura silenciosa.
11. **Actualización local:** definir migraciones, conflictos entre semilla y cambios del usuario, errores/cuota de almacenamiento y recuperación de una sesión interrumpida. Actualizar la PWA no debe borrar datos ni interrumpir una respuesta.
12. **Destino de entrega:** confirmar si primero se usará en un dispositivo o se necesita compartir progreso entre dispositivos. Esto cambia la arquitectura. Alojamiento y publicación se decidirán antes de desplegar.

## 4. Enfoques que quedan por elegir

### A. MVP local-first por hitos — recomendado en la documentación

Una aplicación PWA con un perfil local inicial, contenido versionado y almacenamiento en IndexedDB. Cada hito deja una capacidad completa comprobable. Las revisiones de contenido avanzan junto al desarrollo; el lanzamiento completo exige catálogo validado y todos los P0.

Ventajas: respeta el alcance, permite uso offline y evita introducir cuentas antes de necesitarlas. Coste: el progreso permanece en ese navegador/dispositivo salvo copia manual; no hay sincronización automática.

### B. Servicio con cuentas y sincronización desde el principio

Interfaz más API, autenticación, autorización y almacenamiento remoto, con estrategia offline adicional.

Ventajas: continuidad entre dispositivos y base para docentes. Coste: amplía el alcance inicial y exige resolver permisos, operación y tratamiento de datos antes del despliegue. Solo elegir si compartir progreso es imprescindible desde el inicio.

No se propone un prototipo visual como entrega funcional: la documentación exige persistencia, errores, navegación y criterios de aceptación.

## 5. Arquitectura candidata, pendiente de confirmar A/B

La documentación recomienda React + TypeScript + Vite, PWA e IndexedDB. Para A, conservar ese enfoque; versiones y dependencias concretas se verificarán al cerrar el diseño técnico. Sin instalaciones durante esta fase.

Separaciones propuestas: catálogo, ficha/audio, planes, motor de aprendizaje, motor de preguntas, juegos, progreso, gamificación, persistencia y ajustes. Repositorios como frontera de almacenamiento; tipos y validación compartidos; componentes visuales sin reglas de dominio incrustadas.

Todo intento debe conservar perfil, sesión, verbo, forma objetivo, habilidad, modalidad, respuesta, corrección, ayudas, tipo de evidencia, fecha y versión de pregunta/contenido. Actualización del intento y sus efectos persistidos de forma atómica e idempotente. El archivo de un verbo preserva referencias e historial.

El contenido pendiente de revisión puede usarse en desarrollo con identificación explícita. Los ejercicios publicados requieren plantillas y respuestas revisadas; las alternativas aceptadas se limitan por contexto y dialecto. No renderizar importaciones como HTML ni ejecutar su contenido.

## 6. Hoja de ruta para convertir en plan de implementación

| Hito | Resultado comprobable | Cobertura principal |
|---|---|---|
| 0. Definición | Diseño acordado, contratos completos, reglas de evidencia/dominio y estrategia de contenido/audio | §§8–9, 12, 16; preparación RNF-05/06/12 |
| 1. Biblioteca persistente | Navegación responsive, catálogo, búsqueda, todos los filtros P0, orden, listas y ficha; datos sobreviven a recarga | FR-CAT-01–05/07; FR-FIC-01–04/06/07; FR-SET-02; RNF-01–03/05/06 |
| 2. Gestión y portabilidad | Editor, archivado/restauración, validación, importación con mapeo/errores y decisiones de conflictos, exportación | FR-EDIT-01–06; RNF-09/10/12 |
| 3. Aprendizaje | Nueve plantillas, constructor, cola adaptativa, intentos y progreso por habilidad; Flashcards, Emparejar y Quiz | FR-PLAN-01–04; FR-GAME-01/02/04/10; §9; RNF-07 |
| 4. Escucha y contexto | Audio por forma, Audio Detective, Completa la frase, alternativas ante fallo, evaluación contextual de variantes | FR-FIC-02/03; FR-GAME-03/06; §10.3; RNF-11 |
| 5. MVP completo | Inicio útil, resumen, sellos/XP sin abuso, progreso, ajustes completos, exportación/reinicio de datos y PWA offline verificada | FR-GAM-01/02/06; FR-SET-01/05; RNF-04/08; §13 |
| 6. Publicación | Catálogo 100–150 revisado, licencias, accesibilidad manual, aceptación completa y documentación de límites | FR-CAT-02; §§14–16; todos los RNF |

Accesibilidad, errores, estados vacíos, pruebas y persistencia se trabajan en cada hito. El hito 5 verifica su integración; no los pospone. Hito 1 con fixtures es una entrega técnica parcial, no el cumplimiento del catálogo final.

## 7. Evidencia de aceptación requerida

- Automatizar los doce escenarios de §14 donde sea viable; comprobar manualmente teclado, lector de pantalla, contraste, movimiento reducido y teclado móvil.
- Unitarias de validadores, filtros, respuestas/variantes, aprendizaje con reloj controlado, separación de habilidades, pistas y autoevaluación.
- Integración de repositorios, migraciones, importación transaccional, conflictos, archivado y restauración sin pérdida de historial.
- E2E de lista → juego → respuesta → progreso → recarga; sesión interrumpida y envío duplicado; archivo sin ejecución; modo sin audio; navegación directa offline tras primera carga.
- Verificar 360 px sin desbordamientos, temas claro/oscuro y consultas con miles de entradas frente al objetivo de 300 ms en un entorno documentado.
- Cada hito documentará cómo ejecutar, probar y compilar; el cierre añadirá capturas y registro de licencias y limitaciones.

## 8. Orden para cerrar el plan

Primero decidir local-first frente a sincronización inicial. Después fijar contenido/audio y reglas de evidencia, recuperación y dominio; redactar el diseño completo con propuestas claramente diferenciadas de decisiones del usuario. Revisar el diseño antes de convertirlo en tareas con archivos, interfaces y pruebas concretas. El desarrollo comienza cuando el plan quede definido y aceptado, como ha solicitado el usuario.
