# VerbQuest — diseño de la primera versión

Fecha: 29 de octubre de 2026. Estado: aprobado por el usuario, incluida la condición de cobertura de formas; no se ha iniciado la implementación.

## 1. Intención y fuentes

Ayudar a alumnado de ESO a recordar y utilizar verbos irregulares en inglés mediante sesiones breves, práctica variada y repaso distribuido. El éxito es mejorar recuerdo y uso a lo largo de días; tiempo de pantalla, puntos y visitas no demuestran aprendizaje.

Fuente normativa: `Agent_documentation/VerbQuest_Paquete_Agente_v2/REQUISITOS_FUNCIONALES.md`. Este diseño concreta sus decisiones abiertas. Las exploraciones gráficas orientan el estilo; no aportan datos lingüísticos fiables. El análisis previo se conserva en `docs/planificacion/2026-10-29-analisis-inicial.md`.

## 2. Decisiones y enfoques

**Confirmado por el usuario:** uso inicial en navegador con datos locales, catálogo elaborado por nosotros tomando como referencia ESO, audio mediante síntesis del navegador y reglas de aprendizaje del apartado 7.

Se consideraron dos enfoques:

- **PWA local-first, elegido:** sin cuentas ni backend obligatorio, persistencia en el navegador y recursos principales offline. Reduce operación inicial; los datos no se sincronizan entre dispositivos y pueden perderse si se elimina el almacenamiento del navegador.
- **Cuentas y backend desde el inicio, descartado para esta versión:** facilita sincronización y docentes, pero amplía alcance, permisos y operación. Se podrá añadir posteriormente mediante repositorios y migraciones.

**Propuestas técnicas del agente, sujetas a aprobación de este diseño:** React, TypeScript y Vite según la propuesta del paquete; IndexedDB para datos, JSON versionado para contenido inicial, validadores de JSON Schema compartidos y pruebas unitarias/de integración/E2E. Versiones y bibliotecas auxiliares se verificarán al redactar el plan técnico; no se presupone una versión concreta.

## 3. Alcance y exclusiones

El MVP cubre todos los P0 de la especificación: catálogo curado de 100–150 verbos; búsqueda por todas las formas y significados; filtros combinables y ordenación; listas; ficha; editor y archivado reversible; importación/exportación CSV/JSON; nueve plantillas y constructor de planes; cinco juegos; adaptación; seis indicadores de habilidad; sellos y experiencia; ajustes; perfil local; PWA.

Los cinco juegos son Flashcards, Emparejar, Quiz, Audio Detective y Completa la frase. Habrá respuesta escrita sin opciones en práctica guiada y en las modalidades que lo requieran para obtener evidencia objetiva de memoria y escritura; no se añade como sexto juego independiente.

No se incluyen cuentas, sincronización, aulas compartidas, chat, ranking público, evaluación automática de pronunciación, generación libre de frases por IA, mundos complejos ni los juegos P1/P2. Los perfiles múltiples se preparan en el modelo; la interfaz inicial usa un único perfil. Una misión inicial es una sesión breve con resumen, no un sistema de mundos.

No presentar fixtures como contenido definitivo, autoevaluación como prueba objetiva, síntesis como pronunciación validada ni un interruptor local como seguridad real.

## 4. Experiencia y presentación

Cinco áreas accesibles: Inicio, Verbos, Estudiar, Juegos y Progreso. Configuración desde Inicio/avatar; edición desde una acción explícita en Verbos. Conservar rutas propuestas en §5.3 de los requisitos y enlaces directos recuperables; un identificador ausente o archivado muestra una explicación y salida útil.

Inicio muestra continuación, repasos pendientes y recomendación. Verbos reúne búsqueda, filtros activos extraíbles, contador, ordenación y listas. La ficha muestra formas y variantes, traducciones, ejemplos, información lingüística disponible y progreso por habilidad. Estudiar permite elegir/editar plan y comenzar/continuar sesión. Juegos admite selección de lista, plan o verbos sin crear copias del catálogo. Progreso muestra evidencias, próximos repasos y logros sin equiparar actividad a dominio.

Diseño azul y turquesa, tarjetas redondeadas y tono adolescente según dirección visual elegida. Nombre único VerbQuest. Usar SVG y tokens como base; no usar pósteres como pantallas. Propuesta del agente: fuente del sistema en la primera implementación para reducir dependencias y necesidades de red.

Soporte desde 360 px, navegación por teclado, foco visible, estados con texto además de color, temas claro/oscuro y movimiento reducido. Las tablas no obligan a desplazamiento horizontal en móvil. La vista alternativa tabla/tarjetas completa sigue siendo P1. Verificar contraste de cada combinación; los tokens de concepto no garantizan AA.

Estados obligatorios en cada flujo: cargando, vacío, error recuperable, datos pendientes de guardar, ausencia de contenido apto y ausencia de audio. La duración de sesión es una meta flexible de 5/10/15 minutos, sin expulsar al alumno al agotarla ni temporizadores obligatorios por respuesta.

## 5. Contenido y revisión

Propuesta del agente: objetivo inicial de 120 verbos, dentro del rango normativo. Elaborar selecciones acumulativas y editables para 1.º–4.º por utilidad comunicativa, frecuencia y dificultad. La distribución exacta se documentará en el catálogo, no se codificará en componentes.

Referencia curricular: [enseñanzas mínimas estatales, Lengua Extranjera, anexo II del RD 217/2022](https://www.boe.es/buscar/act.php?id=BOE-A-2022-4975), consultadas el 29 de octubre de 2026. No contiene una lista cerrada por curso; la asignación de VerbQuest será editorial, sin afirmar validez universal ni adaptación a una comunidad autónoma concreta.

Contrastar formas, dialectos, restricciones e IPA con fuentes identificadas; redactar ejemplos originales adecuados a ESO y comprobar gramática/traducción. Registrar procedencia, fecha, estado de revisión y condiciones de uso. No copiar automáticamente definiciones, audios o ejemplos de terceros. Cada verbo tendrá ejemplos de base/presente, pasado y participio cuando correspondan.

Los ocho verbos originales y las preguntas de ejemplo permanecen como fixtures. Se pueden mostrar en entornos de desarrollo con aviso, pero la entrega publicada exige contenido revisado y registro de limitaciones. La creación y comprobación documentada del catálogo forman parte del trabajo; no se presupone que el usuario facilite un docente revisor. No declarar revisión humana independiente si no ha ocurrido. Si la verificación de algún dato no puede completarse, mantenerlo pendiente y excluirlo de actividades que dependan de su validez.

Mostrar IPA y habilitar filtros fonéticos solo con datos validados por forma/dialecto. El audio sintetizado puede estar disponible aunque no exista IPA validada, identificándolo como voz sintética. Las respuestas aceptadas en frases se definen por pregunta y contexto: was/were no son intercambiables. Omitir preguntas ambiguas y distractores que también sean respuestas válidas.

## 6. Datos, módulos y almacenamiento

Separar módulos de catálogo, ficha/audio, planes, motor de aprendizaje, motor de preguntas, juegos, progreso, gamificación, persistencia y ajustes. La interfaz consume servicios/repositorios; los motores son funciones comprobables sin dependencias de interfaz ni reloj global implícito.

Entidades y responsabilidades:

| Entidad | Contrato de dominio |
|---|---|
| Verb | ID estable, formas/variantes, significados, clasificaciones, pronunciaciones y ejemplos con revisión; versión de contenido |
| Profile | ID local estable, zona horaria inicial del navegador; nunca usar el nombre como clave |
| VerbList | ID, nombre y verbIds ordenados sin duplicados; perfil propietario |
| StudyPlan | ID, perfil, origen tipado, objetivos, modalidades, horario, límite nuevo, orden y dificultad |
| StudySession | ID, perfil, plan/selección, cola y posición, pendientes, estado activa/finalizada y fecha |
| Attempt | ID único, sesión/perfil/verbo, forma y pregunta, respuesta, corrección, habilidad, modo, evidencia, ayudas, fecha UTC, versiones de pregunta/contenido |
| SkillProgress | Clave perfil/verbo/habilidad, estado, escalón, próximo repaso y evidencias de avance; derivable del historial |
| Achievement/UserAchievement | Definición versionada y concesión por perfil/verbo cuando proceda, sin duplicados |
| AppSettings | Preferencias de experiencia, voz/dialecto, duración, temas, zona y configuración de aprendizaje |

Completar los esquemas iniciales con uniones condicionadas de origen del plan y filtros tipados. Validar referencias, identificadores, fechas y contenido. Mantener IDs inmutables al editar una palabra; reconciliar explícitamente cualquier importación que pretenda cambiar identidad.

Separar revisión editorial de `archivedAt` en el modelo de ejecución, con adaptación explícita del esquema original. Archivar conserva historial, listas y planes; excluye de nuevas preguntas y muestra referencias no disponibles. Restaurar recupera el estado editorial previo. Si una selección queda vacía se explica y permite editarla, sin iniciar una ronda vacía.

La selección del plan se resuelve al iniciar sesión; los filtros pueden reflejar cambios entre sesiones. La cola iniciada conserva IDs y versión/snapshot de preguntas para no cambiar una respuesta a mitad de actividad. Una revisión del catálogo puede afectar próximas sesiones; no reescribe intentos anteriores. Archivar durante una sesión elimina de la cola sus preguntas aún no respondidas con explicación.

Semilla y cambios locales se concilian por ID/versión: actualizar contenido base sin sobrescribir una edición local. Un conflicto se conserva para resolución explícita. Toda migración deja los datos utilizables o aborta sin destrucción silenciosa. Un error de almacenamiento se muestra antes de afirmar que el avance se guardó.

Guardar intento, progreso, recompensas y posición de sesión de forma atómica e idempotente; doble envío no duplica efectos. Recuperar al recargar la última pregunta no respondida. Pausar o abandonar conserva respuestas confirmadas. El reloj se inyecta para pruebas; fechas UTC y vencimientos de calendario en la zona persistida del perfil, incluidos cambios de horario estacional.

## 7. Aprendizaje — reglas aprobadas

Seis habilidades: recognition, recall, listening, spelling, pronunciation y context. Cada pregunta actualiza una sola habilidad principal; otra evidencia exige otra tarea. Las Flashcards conservan Lo sabía/Dudé/No lo sabía como autoevaluación, sin equipararla a acierto objetivo. La pregunta multiple_choice del fixture que dice recall se adaptará a recognition al ejecutarla.

Intervalos configurables iniciales: 1, 3, 7 y 14 días. Primer acierto apto programa mañana; segundo programa a 3 días, tercero a 7 y cuarto a 14. A partir del cuarto, un nuevo acierto apto mantiene intervalo de 14 días. No más de un avance por habilidad/verbo/día local. Tras el primero, solo avanza una respuesta dada cuando el repaso ha vencido; la práctica anticipada no cambia ese vencimiento.

Nuevo significa sin actividad; en aprendizaje, actividad iniciada; en consolidación, dos aciertos aptos espaciados; dominado, cuatro. Un error objetivo reinicia escalón y programa mañana. Necesita refuerzo prima como estado visible al haber error reciente o vencimiento; conservar el historial. El siguiente acierto apto resuelve la marca de error y aplica su nuevo escalón. Una respuesta posterior errónea en el mismo día sí puede reducir el progreso, aunque no se permita un segundo avance ese día.

Las respuestas con ayudas no avanzan escalón ni posponen repasos. Dudé/No lo sabía dan prioridad de refuerzo sin convertirse en fallos objetivos ni reiniciar por sí solos el historial objetivo. Un Lo sabía no elimina esa prioridad: se elimina con el siguiente acierto objetivo apto. La ficha o una Flashcard puede mover nuevo a en aprendizaje, nunca consolidar.

Reconocimiento y escucha admiten selección objetiva apropiada. Recuperación y escritura requieren respuesta sin opciones. Contexto puede practicarse con opciones, pero exige al menos una respuesta escrita sin ayudas entre sus cuatro evidencias de dominio. Normalizar espacios externos, Unicode y mayúsculas; no corregir faltas silenciosamente ni eliminar diferencias internas relevantes. Pronunciación queda sin evaluar en este MVP.

**Condición adicional aprobada tras la revisión:** los cuatro aciertos son un mínimo; para dominar una habilidad también deben cubrir las tres formas principales disponibles (base, pasado y participio), con tareas apropiadas a esa habilidad. Una respuesta correcta repetida sobre `went` no cubre `gone`. En contexto, base incluye sus usos de presente correspondientes. Las variantes dialectales intercambiables no obligan a aprender todas las alternativas: basta una válida para la preferencia elegida. Las formas no intercambiables por sujeto/uso, como was/were, requieren evidencia de ambas en contextos adecuados. La cobertura se conserva por forma/variante objetivo y habilidad, junto a los aciertos aptos del ciclo actual; un error reinicia ese ciclo. Puede necesitarse más de cuatro aciertos si falta cobertura. La interfaz explica qué forma queda pendiente. Cuando falte contenido validado para cubrir un objetivo, se muestra cobertura incompleta y no se declara dominio de esa habilidad.

Resumen global: contar habilidades dominadas entre las cinco evaluables y usar «dominado en las habilidades evaluadas» solo al completar las cinco. Mostrar pronunciación sin evaluar aparte. Completar un objetivo auditivo no implica dominar globalmente el verbo.

Prioridad al construir sesión: vencidos, errores/refuerzo, habilidades débiles y nuevos dentro del límite. Empates por vencimiento más antiguo y después ID estable. Ofrecer razones legibles. Reinsertar errores al final una sola vez por pregunta en esa sesión; nunca bucle de repetición obligatoria. No reiniciar una misión completa por un error.

La selección de modalidad debe permitir practicar las habilidades elegidas. Si un plan pide escritura pero desactiva todos los ejercicios escritos, explicar incompatibilidad y pedir ajustar antes de empezar. Si no existe contenido apto para una habilidad, mostrarlo y permitir otra selección, sin fabricar preguntas no revisadas.

## 8. Audio

Usar síntesis del navegador: voces cargadas de forma asíncrona, selección UK/US cuando exista y etiqueta de voz/dialecto real. No sustituir una voz solicitada por otra sin indicarlo. Sin reproducción automática; detener audio al cambiar de pregunta/pantalla. Ajustes de volumen y sonidos; pausa/repetición y velocidad cuando el navegador lo permita.

No garantizar funcionamiento offline de voces que requieran red. Ante fallo, ausencia o bloqueo, ofrecer reintento y actividad visual. En Audio Detective no mostrar la respuesta escrita antes de escuchar; revelar marca la actividad como asistida. Al pasar a visual se genera otra pregunta con su habilidad real: no sumar escucha ni pronunciación.

Datos sintetizados se identifican como tales y no como grabación validada. No se añaden audios externos sin fuente, dialecto y licencia registrados.

## 9. Edición, portabilidad y preferencias

CRUD de todos los campos normativos; campos avanzados agrupados sin ocultar capacidad de edición. Aviso de cambios pendientes, cancelar y confirmación al salir. Archivado con impacto en listas/planes y restauración; no borrado físico de historial.

Importar CSV/JSON con límite de tamaño y filas documentado al cerrar el plan, validación por fila/campo, mapeo CSV y vista previa. No aplicar nada antes de confirmar; conflictos por ID o duplicado probable requieren elegir omitir, actualizar o crear identidad nueva. La opción de crear identidad nueva no debe duplicar accidentalmente historial. Confirmación final transaccional, con reporte de aplicados/omitidos/errores. No ejecutar contenido importado ni renderizarlo como HTML; validar URLs y protocolos, rechazar referencias ejecutables. Proteger exportación CSV frente a fórmulas interpretables por hojas de cálculo.

JSON es el formato completo sin pérdidas. CSV es una proyección documentada con aviso de metadatos omitidos; soportar BOM, Unicode, comillas, separadores y saltos de línea según contrato del importador. Exportar catálogo, selección o listas, además de progreso. Propuesta del agente: copia JSON versionada y restauración con validación/previsualización de perfil, ajustes, listas, catálogo local, planes e historial para recuperar datos en otro navegador sin sincronización.

Ajustes: volumen, voz/dialecto, duración, sonidos, tema y movimiento reducido. Recordatorios desactivados; su programación es P1 y no se solicita permiso de notificación en MVP. Reinicio de progreso con doble confirmación, separado de borrar todo el almacenamiento. Explicar qué se elimina y ofrecer exportación previamente.

## 10. Gamificación

Sellos independientes: Explorador por abrir ficha; Oído atento por escuchar formas disponibles; Buena memoria, Buena ortografía y En contexto por dominar su habilidad según §7. El sello de escucha representa actividad. No otorgarlo si no se pudo reproducir el audio. Los logros históricos no se borran al vencer un repaso; el indicador de habilidad sí refleja necesidad de refuerzo.

Propuesta inicial del agente, configurable: 10 XP por respuesta objetiva correcta sin ayuda, 5 con ayuda y 0 por revelar/abrir ficha o autoevaluar. Puntuar como máximo una vez por perfil, verbo, forma objetivo y habilidad en una misma sesión; reintentos y cambios de modalidad no multiplican esa recompensa. Bono de 20 XP al finalizar una sesión que contenga al menos una respuesta objetiva; una sola concesión por sesión. Nivel = 1 + parte entera de XP/100. Estos valores motivan, no determinan dominio. Las pruebas cubrirán deduplicación y reanudación.

Resumen de sesión con habilidades practicadas, respuestas, refuerzo, logros y fechas de repaso. Animaciones breves y omitibles; sonidos respetan ajustes. Rachas y mundos se posponen.

## 11. Offline, privacidad y publicación

Service worker para shell, rutas y recursos estáticos; IndexedDB para contenido y datos. Tras una primera carga completa, catálogo, edición, planes, preguntas textuales y progreso funcionan sin red. Mostrar dependencia de red del audio si existe. Actualizaciones de aplicación se aplican fuera de sesiones activas, con migración controlada. La primera visita offline puede no funcionar y debe indicarse en instrucciones.

No telemetría remota, publicidad ni publicación de datos personales en MVP. Explicar almacenamiento local, exportación y borrado. Reproducción TTS dependiente de servicio remoto puede enviar texto al proveedor de la voz; identificar disponibilidad y no afirmar privacidad offline de voces remotas. No solicitar micrófono.

El alojamiento concreto se elegirá antes de publicar; debe permitir HTTPS, service worker y fallback de rutas SPA. Preparar compilación estática sin comprometer proveedor ahora. Registrar licencias de recursos/dependencias y mantener nombre provisional VerbQuest; disponibilidad comercial de marca no se presume comprobada.

## 12. Hitos y aceptación

1. Biblioteca persistente y responsive: catálogo, ficha, búsqueda, filtros, listas, navegación y contratos/migraciones necesarios.
2. Gestión: editor, archivado/restauración, validación, importación/exportación y copia de seguridad.
3. Aprendizaje: nueve plantillas, constructor, adaptación, progreso, respuestas escritas, Flashcards, Emparejar y Quiz.
4. Audio y contexto: síntesis, Audio Detective, Completa la frase y degradación correcta.
5. Integración MVP: Inicio, resumen, sellos/XP, ajustes, PWA offline, accesibilidad y documentación.
6. Catálogo/publicación: contenido curado de 100–150 verbos, trazabilidad, licencias y aceptación completa.

El contenido se trabaja desde el primer hito; el sexto verifica su cierre, no retrasa su elaboración. Persistencia, accesibilidad, errores y pruebas pertenecen a todos los hitos. Un hito con fixtures es una entrega técnica parcial, no el MVP publicado.

Cubrir los doce escenarios E2E de §14 de requisitos y unitarias de validación, filtros, respuestas, intervalos y separación de habilidades. Añadir integración de migraciones, importación, conflictos y archivo; reloj controlado para días separados/horario estacional; sesiones interrumpidas y envíos duplicados; falta de voz y audio fallido; navegación directa/offline. Verificar 360 px y búsqueda/filtros inferior a 300 ms como referencia con miles de verbos en un entorno medido. Objetivo WCAG 2.2 AA, con comprobación manual en flujos principales.

Entrega: fuente modular ejecutable, instrucciones de desarrollo/pruebas/compilación, esquema y migraciones, catálogo y fuentes/revisión, pruebas, capturas, limitaciones y licencias. Ningún requisito se declara cumplido solo porque exista una pantalla.

## 13. Decisiones delegadas y puerta de desarrollo

El agente resolverá nombres de archivos/componentes, dependencias auxiliares, detalles de composición responsive, límites concretos de importación y pruebas por tarea en el plan, respetando este diseño. No cambiará alcance, reglas aprobadas ni presentará asignaciones por curso como oficiales.

Antes de implementar: revisión del diseño completo por el usuario y posterior plan de tareas con archivos, contratos, pruebas y verificaciones. No se han instalado dependencias, generado scaffolding ni escrito código de producto. No se ha creado Git durante esta fase documental; se preparará al iniciar el desarrollo en esta carpeta.

Revisión independiente realizada: identificó únicamente la falta de cobertura de formas en el criterio de dominio. Se incorporó como propuesta explícita y el usuario aprobó el diseño incluyendo esta condición.
