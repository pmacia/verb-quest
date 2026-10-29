---
title: "VerbQuest — Documento de requisitos funcionales"
subtitle: "Aplicación web gamificada para aprender verbos irregulares en inglés"
author: "Documento de trabajo para diseño y desarrollo"
date: "29 de octubre de 2026"
lang: es-ES
---

**Marca de trabajo:** ![VerbQuest](../design/assets/verbquest-logo.png){width=4.5in}

**Pequeños pasos, grandes progresos.**

Versión 0.1 · 29 de octubre de 2026 · Borrador funcional listo para prototipado.

# 1. Resumen ejecutivo

VerbQuest será una aplicación web educativa que ayude al alumnado a aprender, recordar, escuchar, pronunciar, escribir y utilizar correctamente los verbos irregulares del inglés. El núcleo será un catálogo estructurado y editable. A partir de ese catálogo se generarán fichas de estudio, planes, ejercicios, juegos, colecciones de logros y métricas de progreso.

No se considerará que un estudiante domina un verbo por haber abierto su ficha o por acertar una pregunta de selección múltiple. El sistema medirá el progreso por habilidades: reconocimiento, recuperación de memoria, escucha, escritura, pronunciación y uso en contexto.

La experiencia se organizará en cinco áreas de navegación principales: **Inicio**, **Verbos**, **Estudiar**, **Juegos** y **Progreso**. La configuración y la edición del catálogo estarán accesibles desde Inicio o el área de configuración; la edición de contenido debe distinguirse claramente del uso diario del estudiante.

El producto debe resultar lúdico sin convertir la competición en una obligación. Se priorizarán las misiones breves, la retroalimentación inmediata, la variedad de ejercicios, las recompensas por esfuerzo útil y el repaso distribuido. No se aplicarán castigos severos por descansar ni se publicarán clasificaciones personales por defecto.

**Nota sobre los materiales visuales:** este documento y los esquemas JSON son la especificación normativa. Los posters de `design/visual-explorations/` son referencias conceptuales; su texto pequeño puede contener errores. El nombre de trabajo recomendado para el producto es VerbQuest.

# 2. Objetivos del producto

## 2.1 Objetivos principales

1. Ofrecer una referencia extensa, consistente y mantenible de verbos irregulares del inglés.
2. Permitir buscar, filtrar, ordenar, comparar y estudiar los verbos por múltiples criterios lingüísticos y educativos.
3. Ayudar a memorizar las formas base, pasado simple y participio pasado.
4. Practicar la discriminación auditiva, la pronunciación, la ortografía y la aplicación gramatical.
5. Generar planes de estudio configurables por curso, frecuencia, dificultad, tipo de verbo, listas docentes u objetivos individuales.
6. Ajustar la repetición a las respuestas y errores de cada estudiante.
7. Promover una experiencia motivadora mediante misiones, sellos, colecciones y progresión visual.
8. Permitir añadir, editar, retirar, importar y exportar verbos y listas sin modificar el código de la aplicación.
9. Diseñar una arquitectura ampliable a varios estudiantes, perfiles familiares y listas de profesores.

## 2.2 No objetivos de la primera versión

- No sustituir un curso completo de inglés ni evaluar toda la competencia comunicativa.
- No prometer que una lista cubre literalmente todos los usos históricos o dialectales del inglés; se mantendrá una biblioteca curada y ampliable.
- No generar automáticamente ejemplos lingüísticos sin validación.
- No exigir reconocimiento de voz para completar el plan.
- No incorporar chat social abierto, anuncios conductuales ni clasificaciones públicas.
- No requerir un backend, cuenta o conexión permanente para el uso básico individual.

# 3. Principios de diseño didáctico

1. **Recuperación activa:** con frecuencia, el estudiante debe recordar una forma antes de verla.
2. **Repaso distribuido:** los verbos aprendidos reaparecen tras intervalos configurables; los errores reducen el intervalo.
3. **Variedad de contextos:** el mismo verbo puede practicarse mediante texto, audio, escritura y frases.
4. **Habilidades separadas:** escuchar una forma no demuestra automáticamente que el estudiante sepa escribirla o utilizarla.
5. **Retroalimentación inmediata:** toda respuesta informa de si es correcta y, cuando corresponda, explica brevemente por qué.
6. **Dificultad gradual:** comenzar con pistas y opciones y, progresivamente, retirar ayudas.
7. **Gamificación con propósito:** sellos y puntos reflejan acciones útiles y progreso; no sustituyen una evidencia de aprendizaje.
8. **Errores como datos:** los fallos sirven para decidir qué practicar después, no para avergonzar al estudiante.
9. **Sesiones breves y flexibles:** permitir misiones de 5, 10 y 15 minutos, además de estudio libre.
10. **Contenido fiable:** marcar variantes dialectales, usos, pronunciaciones y niveles de confianza; no presentar hipótesis como reglas absolutas.

# 4. Usuarios y permisos

## 4.1 Estudiante

- Explora el catálogo y consulta fichas.
- Ejecuta planes de estudio y juegos.
- Marca su autoevaluación en actividades guiadas.
- Revisa su progreso, logros, errores frecuentes y próximos repasos.
- Puede crear listas personales si la configuración se lo permite.

## 4.2 Familia o profesor (editor autorizado)

- Crea y modifica verbos, ejemplos, pronunciaciones y etiquetas.
- Importa y exporta datos y listas.
- Construye listas de clase o de examen.
- Configura plantillas por curso y planes recomendados.
- Consulta estadísticas del estudiante cuando dicho acceso esté habilitado.

## 4.3 Administrador del catálogo (opcional en versión futura)

- Gestiona el catálogo común publicado para múltiples usuarios.
- Revisa variantes y cambios de contenido.
- Administra permisos y versiones.

**Regla de permisos:** el acceso al modo edición no se debe simular como una seguridad real si toda la aplicación se ejecuta localmente. En una futura versión multiusuario, las operaciones de escritura deben autorizarse también en servidor.

# 5. Arquitectura de información y navegación

## 5.1 Navegación principal

Barra inferior persistente en móvil y tablet, con equivalentes accesibles en escritorio:

1. **Inicio:** misión del día, resumen de progreso, acceso rápido a continuar, lista o juego recomendado.
2. **Verbos:** catálogo completo, búsqueda, filtros, ordenación y fichas.
3. **Estudiar:** plan activo, tarjetas de repaso, contenido nuevo y sesión guiada.
4. **Juegos:** catálogo de modos de práctica y retos.
5. **Progreso:** habilidades, sellos, rachas flexibles, estadísticas y verbos que requieren refuerzo.

Configuración accesible desde Inicio/avatar o menú superior. El modo de edición se habilita mediante una acción explícita en Verbos y solo si el perfil tiene permisos.

## 5.2 Barra superior del catálogo

Debe incluir:

- Campo de búsqueda global.
- Botón de filtros que abre panel lateral o modal.
- Control de ordenación.
- Filtros activos representados como chips extraíbles.
- Contador de resultados.
- Acción para crear o importar una lista, si está permitida.
- Acción «Editar catálogo» con indicador visual inequívoco.

## 5.3 Pantallas y rutas recomendadas

- `/` Inicio
- `/verbs` Catálogo
- `/verbs/:id` Ficha del verbo
- `/study` Sesión de estudio
- `/plans` Planes de estudio
- `/plans/:id` Detalle y edición de un plan
- `/games` Selección de juegos
- `/games/:mode` Juego seleccionado
- `/progress` Progreso y logros
- `/settings` Configuración
- `/editor/verbs/new` Alta de verbo
- `/editor/verbs/:id` Edición de verbo
- `/editor/import-export` Importación y exportación

Las rutas son orientativas. Se puede utilizar otra estrategia de navegación siempre que se mantengan la estructura, la capacidad de enlace directo y los estados recuperables.

# 6. Requisitos funcionales

Prioridades: **P0** imprescindible para una primera versión útil; **P1** importante para ampliar; **P2** futuro o deseable.

## 6.1 Catálogo de verbos

### FR-CAT-01 — Catálogo central (P0)
La aplicación mantendrá una única fuente de datos de verbos reutilizada por fichas, filtros, juegos, planes y progreso.

**Criterios de aceptación**

- Un verbo creado aparece en búsqueda y puede seleccionarse en un plan.
- Los juegos consultan el catálogo; no mantienen listas de verbos duplicadas.
- El progreso se relaciona con un identificador estable, no con la traducción o el texto de la palabra.

### FR-CAT-02 — Cobertura escalable (P0)
El catálogo inicial contendrá un conjunto curado de aproximadamente 100–150 verbos frecuentes. El modelo admitirá cientos o miles de entradas sin cambiar la interfaz.

La expresión «todos los verbos irregulares» se interpretará como una biblioteca de referencia ampliable, que puede incluir variantes y formas compuestas. El producto debe diferenciar los verbos recomendados para estudiar de los verbos disponibles solo como consulta.

### FR-CAT-03 — Búsqueda global (P0)
La búsqueda encontrará coincidencias en:

- Forma base, pasado y participio.
- Variantes de cada forma.
- Traducciones y significados alternativos.
- Etiquetas temáticas y notas, si se habilita búsqueda avanzada.

Debe ignorar mayúsculas y permitir búsqueda parcial. Se recomienda búsqueda con normalización de acentos en campos en español.

### FR-CAT-04 — Filtros combinables (P0)
Filtros mínimos:

- Curso recomendado: 1.º, 2.º, 3.º, 4.º de ESO o todos.
- Frecuencia: esencial/muy frecuente, frecuente, menos frecuente, avanzado; valores de catálogo revisables.
- Estado de aprendizaje: nuevo, en aprendizaje, necesita refuerzo, en consolidación, dominado.
- Relación de formas: tres iguales, pasado y participio iguales, tres diferentes, variantes especiales.
- Patrón morfológico o familia.
- Tipo de terminación escrita.
- Sonido final/pronunciación (cuando exista IPA validada).
- Categoría temática.
- Lista o colección.

Las clasificaciones de curso y frecuencia serán configurables y no se presentarán como universales.

### FR-CAT-05 — Ordenación (P0)
Orden alfabético, frecuencia, nivel recomendado, estado de dominio, dificultad estimada y prioridad de repaso. El orden por prioridad sitúa primero los verbos cuyo repaso está vencido o que presentan errores recientes.

### FR-CAT-06 — Vistas de catálogo (P1)
Permitir alternar entre vista de tabla y tarjetas. La tabla mostrará, como mínimo, forma base, pasado, participio, traducción, nivel, frecuencia e indicadores de progreso. En móvil, la tabla debe adaptarse a tarjetas sin perder las acciones básicas.

### FR-CAT-07 — Listas guardadas (P0)
Guardar selecciones como «Examen unidad 3», «Terminaciones -ought» o «Mis verbos difíciles». Las listas deben poder combinarse con cualquier modo de juego.

## 6.2 Ficha del verbo

### FR-FIC-01 — Formas y significado (P0)
Mostrar forma base, pasado simple, participio pasado, variantes y traducciones. Las formas con variantes dependientes del sujeto o del uso, como *was/were*, deben incorporar notas explicativas.

### FR-FIC-02 — Pronunciación (P0)
Mostrar IPA cuando esté validada, con selección de inglés británico y americano si existe información para ambas variantes. Cada forma debe tener su propio control de audio.

El audio puede ser una grabación licenciada o una voz sintética. Los derechos, la fuente, el dialecto y el estado de validación deben almacenarse. No se reutilizarán audios sin licencia adecuada.

### FR-FIC-03 — Ejemplos (P0)
Incluir ejemplos cortos y apropiados para ESO. Cuando aplique, mostrar:

- Presente o forma base en uso.
- Pasado simple.
- Participio en una construcción compuesta o pasiva.

Cada ejemplo tendrá frase en inglés, traducción, objetivo gramatical, forma del verbo usada y fuente/estado de revisión.

### FR-FIC-04 — Patrones y características (P0)
Mostrar etiquetas relevantes: relación entre las formas, familia de cambio, terminación escrita, sonido final, frecuencia y curso sugerido. No forzar una única categoría cuando un verbo encaje en varias.

### FR-FIC-05 — Ayudas de memoria (P1)
Permitir notas mnemotécnicas, familias similares, imagen asociada, nota del profesor y advertencias sobre falsas reglas.

### FR-FIC-06 — Progreso por habilidad (P0)
Mostrar en la ficha el estado de reconocimiento, memoria, escucha, escritura, pronunciación y uso en contexto. Un acierto no debe marcar automáticamente todas las habilidades como dominadas.

### FR-FIC-07 — Marcar para estudiar (P0)
Permitir añadir o retirar el verbo de una lista personal de repaso.

## 6.3 Planes de estudio

### FR-PLAN-01 — Plantillas predefinidas (P0)
Incluir como mínimo:

- Empiezo desde cero.
- 1.º ESO — básicos (plantilla editable).
- 2.º ESO — consolidación.
- 3.º ESO — ampliación.
- 4.º ESO — repaso general.
- Preparación de examen/lista del profesor.
- Entrenamiento auditivo.
- Patrones y terminaciones.
- Mis verbos difíciles.

La cantidad de verbos y la distribución por curso serán datos configurables, no constantes en el código.

### FR-PLAN-02 — Constructor personalizado (P0)
El usuario podrá escoger:

- Origen: curso, filtros, lista guardada, selección manual o importación.
- Objetivo: aprender, repasar, escuchar, escribir, practicar frases o combinación.
- Duración objetivo por sesión: 5, 10 o 15 minutos como opciones iniciales.
- Cantidad de verbos nuevos por sesión.
- Días previstos o recordatorios opcionales.
- Orden de aprendizaje y dificultad.

### FR-PLAN-03 — Sesiones mixtas (P0)
Una sesión podrá combinar verbos nuevos, repasos vencidos y preguntas de transferencia a frases. Los errores deben poder reprogramarse sin obligar al alumno a reiniciar toda la sesión.

### FR-PLAN-04 — Recomendación adaptativa (P0)
Al iniciar una sesión, priorizar:

1. Repasos vencidos.
2. Verbos con errores recientes.
3. Habilidades con dominio insuficiente.
4. Contenido nuevo, dentro del límite fijado por el plan.

### FR-PLAN-05 — Replanificación transparente (P1)
El estudiante debe entender por qué se recomienda un verbo: «toca repasar», «fallaste el participio», «hoy practicamos escucha» o equivalente.

### FR-PLAN-06 — Compartir/exportar plan (P1)
Permitir exportar una lista o plan en JSON/CSV y, posteriormente, compartirlo mediante un código o enlace seguro.

## 6.4 Modos de juego y estudio

Todos los juegos recibirán una selección común de verbos y registrarán el tipo de habilidad ejercitada.

### FR-GAME-01 — Flashcards (P0)
Presentar una forma, significado o frase incompleta. El alumno intenta responder antes de revelar la solución. Opciones de autoevaluación: «Lo sabía», «Dudé», «No lo sabía». Los resultados declarados se almacenan como autoevaluación, no como prueba objetiva equivalente a una respuesta escrita.

### FR-GAME-02 — Emparejar formas (P0)
Relacionar base, pasado, participio y, opcionalmente, significado. Debe evitar colocar juntas por defecto las tres formas si el objetivo es recordar asociaciones. Permitir rondas con dificultad progresiva.

### FR-GAME-03 — Audio Detective (P0)
Reproducir una forma sin mostrarla escrita. El estudiante identifica el verbo, elige su forma o escribe lo escuchado. Incluir repetición, control de volumen y una opción para revelar la respuesta.

### FR-GAME-04 — Quiz de selección múltiple (P0)
Preguntas por significado, forma requerida, patrón o contexto. Las opciones distractoras deben ser plausibles y no incluir dos respuestas válidas no marcadas como variantes.

### FR-GAME-05 — Construye la palabra (P1)
El estudiante compone una forma con letras, fragmentos o teclado. Debe poder alternar entre modo con ayudas y modo sin ayudas.

### FR-GAME-06 — Completa la frase (P0)
Elegir o escribir la forma correcta en una frase contextualizada. La pregunta debe identificar la forma objetivo y, si procede, explicar el uso de pasado simple o participio.

### FR-GAME-07 — Error Hunter (P1)
Detectar y corregir errores típicos (por ejemplo, *goed* o *buyed*), con explicación breve y respetuosa.

### FR-GAME-08 — Pronunciation Lab (P2)
Permitir escuchar, grabar y comparar la propia producción con un modelo. El reconocimiento automático, si se implementa, será orientativo; no se penalizará un acento por sí mismo ni se hará obligatorio para completar planes.

### FR-GAME-09 — Desafío final (P1)
Prueba mixta con memoria, escucha, escritura y contexto. Debe ponderar las habilidades por separado y generar una lista de repaso posterior.

### FR-GAME-10 — Motor de selección de preguntas (P0)
Generar preguntas a partir de datos y plantillas validadas. No generar ejemplos gramaticales arbitrarios sin revisión. Cada pregunta tendrá respuesta válida, variantes aceptadas, habilidad objetivo, dificultad y explicación opcional.

## 6.5 Progreso, logros y gamificación

### FR-GAM-01 — Colección de sellos (P0)
Cada verbo puede desbloquear sellos independientes, por ejemplo:

- Explorador: consultó la ficha.
- Oído atento: escuchó las grabaciones disponibles.
- Buena memoria: recuperó las formas correctamente en sesiones separadas.
- Buena ortografía: escribió las formas correctamente.
- En contexto: respondió correctamente a ejercicios contextualizados.

Debe distinguirse la visita/escucha del dominio demostrado.

### FR-GAM-02 — Experiencia y niveles (P0)
Otorgar puntos por acciones de aprendizaje definidas: completar rondas, revisar errores, practicar habilidades o mejorar estabilidad de recuerdo. Evitar inflar puntos por repetir una acción vacía.

### FR-GAM-03 — Mundos/misiones (P1)
Progresión temática por familias de verbos, audio, frases y retos mixtos. Los caminos pueden desbloquearse por progreso, pero debe existir acceso al repaso cuando el usuario lo necesite.

### FR-GAM-04 — Racha flexible (P1)
Las rachas serán opcionales y no deberán borrar logros ni generar penalizaciones severas tras descansos.

### FR-GAM-05 — Clasificaciones (P2)
Desactivadas por defecto. Si se añaden, serán privadas o cooperativas y no mostrarán públicamente resultados personales sin consentimiento.

### FR-GAM-06 — Recompensa no intrusiva (P0)
Los elementos lúdicos no deben bloquear el estudio, saturar la pantalla ni obligar a ver animaciones. Incluir opción para reducir movimiento/sonido.

## 6.6 Edición y mantenimiento del catálogo

### FR-EDIT-01 — Alta y modificación (P0)
Editor autorizado podrá crear y modificar los campos de un verbo, sus variantes, traducciones, IPA, audio, ejemplos, etiquetas, niveles recomendados y notas.

### FR-EDIT-02 — Eliminación reversible (P0)
Antes de retirar un verbo se mostrará confirmación y el impacto sobre listas y planes. Se recomienda archivado lógico o papelera y opción de restaurar. El historial de progreso no debe corromperse.

### FR-EDIT-03 — Validación (P0)
Comprobar campos requeridos, identificadores únicos, duplicados probables, formato de URLs, integridad de ejemplos y compatibilidad de variantes. Advertir, no corregir silenciosamente, discrepancias lingüísticas.

### FR-EDIT-04 — Importación CSV/JSON (P0)
Permitir importar archivos con vista previa, mapeo de columnas y reporte de errores por fila. Nunca sobrescribir datos existentes sin una decisión explícita.

### FR-EDIT-05 — Exportación (P0)
Exportar catálogo completo, selección filtrada o listas en CSV y JSON. Exportar solo los campos autorizados y preservar tildes/Unicode.

### FR-EDIT-06 — Modo de edición seguro (P0)
Separar visualmente el modo de edición del modo de estudio. Mostrar cambios sin guardar, permitir cancelar y confirmar al abandonar con cambios pendientes.

### FR-EDIT-07 — Duplicar y etiquetar (P1)
Duplicar una ficha para crear una variante controlada, aplicar etiquetas en bloque y editar varios verbos seleccionados.

### FR-EDIT-08 — Historial de cambios (P2)
Registrar quién cambió qué y cuándo, especialmente para catálogos compartidos.

## 6.7 Configuración y perfil

### FR-SET-01 — Ajustes de experiencia (P0)
Permitir configurar volumen, voz/dialecto preferido, duración de sesión, sonidos, notificaciones, tema claro/oscuro y movimiento reducido.

### FR-SET-02 — Preferencia lingüística (P0)
Interfaz en español al inicio. El idioma de los ejemplos es inglés. El modelo debe permitir incorporar otras traducciones en el futuro.

### FR-SET-03 — Recordatorios (P1)
Optativos y configurables; nunca necesarios para aprender. Respetar permisos del navegador y permitir desactivación sencilla.

### FR-SET-04 — Múltiples perfiles (P1)
Preparar el modelo de datos para varios estudiantes. La primera versión puede utilizar un perfil local único, pero no debe mezclar el progreso de perfiles distintos.

### FR-SET-05 — Reinicio/exportación de datos (P0)
Permitir exportar el progreso, reiniciar el progreso con doble confirmación y borrar datos locales de forma comprensible.

# 7. Flujo de una sesión de estudio

1. El estudiante abre Inicio y ve una misión breve y el motivo de la recomendación.
2. El sistema recoge los repasos vencidos y los errores prioritarios.
3. Introduce una cantidad pequeña de verbos nuevos según el plan.
4. Alterna modalidades: recordar, seleccionar, escuchar, escribir y aplicar en frase.
5. Tras cada respuesta, muestra resultado y explicación corta.
6. Los errores se añaden a la cola de refuerzo; un error no finaliza toda la misión.
7. Al terminar, ofrece un resumen de qué habilidades practicó, logros desbloqueados y fecha orientativa de repaso.
8. El estudiante puede continuar, detenerse o elegir otro juego sin perder el progreso.

# 8. Modelo de dominio y datos

Los esquemas JSON de `../schemas/` son referencias iniciales. El modelo definitivo debe conservar identificadores estables y contemplar variantes de forma, dialecto y uso.

## 8.1 Entidades principales

- **Verb:** entrada lingüística con formas, traducciones, características, pronunciaciones y ejemplos.
- **VerbList:** lista nombrada y ordenada de identificadores de verbos.
- **StudyPlan:** configuración del objetivo, selección de verbos, rutina y modalidades.
- **Attempt:** respuesta o autoevaluación de una actividad.
- **SkillProgress:** estimación de dominio por verbo y habilidad.
- **Achievement:** definición de un logro.
- **UserAchievement:** logros obtenidos por perfil.
- **AppSettings:** preferencias del usuario.

## 8.2 Habilidades de aprendizaje

Códigos mínimos sugeridos:

- `recognition`: reconocer formas.
- `recall`: recuperar formas sin ayuda.
- `listening`: reconocer forma escuchada.
- `spelling`: escribir formas correctamente.
- `pronunciation`: producción oral orientativa.
- `context`: usar la forma en una frase.

No se debe mezclar la autoevaluación de flashcards con la puntuación objetiva de una pregunta escrita sin conservar el tipo de evidencia.

## 8.3 Clasificación lingüística

Las categorías son múltiples, no mutuamente excluyentes:

- Relación entre formas: `all_same`, `past_participle_same`, `all_different`, `special`.
- Frecuencia: `essential`, `common`, `less_common`, `advanced`.
- Familia de patrón: texto libre controlado por catálogo, por ejemplo `i-a-u`, `ought`, `ew-own`, `suppletive`.
- Terminación ortográfica: por forma concreta.
- Terminación fonética: por forma y dialecto, derivada de IPA validada.
- Curso recomendado: conjunto editable de niveles; no asumir que todos los centros usan la misma secuencia.

# 9. Reglas de adaptación del aprendizaje (versión inicial)

La primera versión utilizará un algoritmo sencillo, explicable y ajustable, no un modelo opaco.

## 9.1 Estados por verbo y habilidad

- `new`: sin evidencia.
- `learning`: se está practicando.
- `needs_review`: errores recientes o repaso vencido.
- `consolidating`: respuestas correctas en más de una sesión.
- `mastered`: rendimiento estable en sesiones separadas y al menos una tarea de recuperación sin opciones o de aplicación, según la habilidad.

## 9.2 Regla base de repaso

Como punto de partida orientativo, los intervalos pueden crecer (por ejemplo, 1, 3, 7 y 14 días) cuando se demuestra recuerdo correcto en sesiones separadas. Un error reduce el intervalo y aumenta la prioridad de esa habilidad. Los intervalos no son una ley fija: se calibrarán con uso real y deberán poder configurarse.

## 9.3 Señales que se guardan

- Correcta/incorrecta y respuesta dada.
- Habilidad objetivo y modo de juego.
- Si había pistas, opciones o ayuda.
- Tiempo de respuesta cuando resulte útil, sin convertirlo en criterio único.
- Fecha/hora y sesión.
- Fuente de la pregunta y versión de contenido.

## 9.4 Criterio para «dominado»

Un verbo no será globalmente «dominado» solo por una tasa alta en un único modo. La pantalla puede mostrar dominio por habilidades y un resumen global conservador. La definición exacta se debe centralizar en configuración, documentar y probar.

# 10. Accesibilidad, privacidad y seguridad

## 10.1 Accesibilidad y usabilidad

- Diseño responsive para móvil, tablet y escritorio.
- Objetivos táctiles cómodos y jerarquía visual clara.
- Navegación por teclado y foco visible.
- Etiquetas accesibles para controles de audio y botones solo con icono.
- Contraste adecuado y no depender únicamente del color para comunicar estado.
- Preferencia para reducir animaciones y sonidos.
- No usar temporizadores rápidos como único modo de respuesta; las carreras son opcionales.
- Textos breves, tono positivo y adecuado a 12–16 años.

## 10.2 Privacidad

- Recoger solo datos necesarios para personalizar el aprendizaje.
- En la versión local, explicar dónde se guarda el progreso.
- No incorporar publicidad personalizada ni perfiles comerciales.
- No publicar puntuaciones o nombres de estudiantes por defecto.
- Si se añade sincronización o cuenta, definir exportación y borrado de datos, permisos de familia/profesor y requisitos legales aplicables antes de desplegar.

## 10.3 Audio

- Control de reproducir, pausar y repetir.
- Volumen y velocidad si el recurso lo permite.
- Mostrar dialecto/variante cuando proceda.
- Identificar licencia y procedencia.
- Si falla el audio, mantener un ejercicio alternativo visual; no bloquear la sesión.

# 11. Requisitos no funcionales

**RNF-01 — Responsive.** Uso completo desde 360 px de ancho hasta escritorio.

**RNF-02 — Rendimiento.** Búsqueda y filtros locales perceptiblemente inmediatos para miles de verbos en dispositivos modernos; objetivo de referencia inferior a 300 ms.

**RNF-03 — Persistencia.** El progreso sobrevive a recargas y cierre del navegador.

**RNF-04 — Resiliencia.** Las funciones principales siguen disponibles sin conexión después de cargar la PWA; las funciones que requieran red se identifican.

**RNF-05 — Integridad.** Los intentos se asocian a identificadores estables y no desaparecen al editar una traducción.

**RNF-06 — Mantenibilidad.** Tipos y validadores compartidos, separación entre contenido, interfaz, juegos y algoritmo de repaso.

**RNF-07 — Pruebas.** Pruebas unitarias del esquema, filtros, intervalos de repaso y respuestas aceptadas.

**RNF-08 — Accesibilidad.** Objetivo inicial WCAG 2.2 AA en los flujos principales; verificar manualmente.

**RNF-09 — Portabilidad.** Importación y exportación en formatos abiertos CSV/JSON.

**RNF-10 — Seguridad.** Sanitizar texto importado, validar URLs y no ejecutar contenido de archivos importados.

**RNF-11 — Licencias.** Todos los audios e imágenes externos deben tener licencia o fuente documentada.

**RNF-12 — Evolución.** Preparar migraciones de datos y futura sincronización sin imponer backend en el MVP.

# 12. Propuesta técnica de referencia

La elección tecnológica final puede hacerla el agente implementador, pero se recomienda una arquitectura web moderna, tipada y modular.

## 12.1 MVP local-first recomendado

- Frontend: React + TypeScript + Vite, o alternativa equivalente con componentes accesibles.
- Distribución: PWA con service worker para shell y recursos estáticos.
- Persistencia: IndexedDB para progreso, perfiles locales, listas y cambios del catálogo; JSON versionado para la semilla inicial.
- Validación: esquemas tipados, por ejemplo JSON Schema/Zod o equivalente.
- Audio: recursos con licencia en almacenamiento estático; alternativa TTS del navegador cuando esté disponible y sea adecuada.
- Pruebas: unitarias para filtros, adaptación, importación y motor de preguntas; pruebas de interfaz de flujos críticos.

La primera versión no necesita cuentas ni backend obligatorio. Si se requiere sincronización, compartir clases o administración multiusuario, añadir un backend/API con autenticación y autorización; no confiar en el rol del frontend como mecanismo de seguridad.

## 12.2 Separación de módulos

- `catalog`: repositorio, búsqueda, filtros, edición e importación/exportación.
- `verb-detail`: presentación de formas, ejemplos y audio.
- `study-plans`: plantillas y constructor.
- `learning-engine`: selección de contenidos y planificación de repaso.
- `question-engine`: plantillas de ejercicios y evaluación.
- `games`: modos de juego visuales conectados al motor común.
- `gamification`: puntos, logros y colecciones.
- `progress`: informes y estados por habilidad.
- `persistence`: repositorios y versionado local.
- `settings`: preferencias y permisos.

# 13. Alcance de la primera entrega (MVP)

## Incluido en MVP

- Catálogo inicial curado y ampliable.
- Búsqueda, filtros combinables, ordenación y listas guardadas.
- Ficha de verbo con formas, traducción, IPA, audio disponible y ejemplos validados.
- Editor CRUD, confirmación/archivado de borrado e importación/exportación CSV/JSON con previsualización.
- Plantillas de planes y constructor simple.
- Perfil local único, persistencia de progreso y métricas por habilidad.
- Algoritmo adaptativo básico, explicable y configurable.
- Flashcards, emparejamiento, Audio Detective, quiz y completar frases.
- Sellos iniciales y resumen de misión.
- Diseño responsive, instalación PWA y recursos principales disponibles offline cuando sea posible.

## Fuera del MVP

- Sincronización multiusuario y panel web para docentes.
- Reconocimiento de pronunciación automático.
- Chat, funciones sociales abiertas o ranking público.
- Generación libre de ejemplos mediante IA en producción.
- Sistema complejo de mundos 3D o animación intensiva.

# 14. Pruebas de aceptación de extremo a extremo

1. El usuario busca `went` y encuentra `go`; abre la ficha y escucha las formas disponibles.
2. Filtra los verbos cuyo pasado y participio son iguales y combina ese filtro con 2.º ESO. Los filtros y el contador coinciden con la consulta.
3. Crea una lista de examen con cinco verbos; abre Flashcards y Audio Detective con esa misma lista.
4. Responde una pregunta de escucha correctamente. Solo mejora la habilidad correspondiente; la escritura no se marca automáticamente como dominada.
5. Falla el participio de un verbo. El sistema registra la respuesta, muestra explicación y prioriza su repaso futuro.
6. Completa dos sesiones separadas correctamente y el estado se mueve según la regla documentada, sin alcanzar dominio global solo por abrir fichas.
7. Crea un verbo, lo exporta a JSON, lo vuelve a importar y la validación detecta duplicado o propone cómo reconciliarlo.
8. Elimina o archiva un verbo utilizado en una lista. La aplicación informa del impacto y mantiene el historial de intentos sin errores.
9. Recarga la página y el progreso se conserva.
10. En una pantalla móvil estrecha, los controles básicos no requieren desplazamiento horizontal y el teclado no tapa el botón de envío de las respuestas.
11. Sin audio disponible, el alumno puede continuar con ejercicio alternativo; el fallo de carga no rompe la sesión.
12. El usuario puede desactivar sonido, animaciones y recordatorios desde configuración.

# 15. Entregables esperados del agente de desarrollo

1. Aplicación ejecutable y código fuente organizado por módulos.
2. Instrucciones claras de instalación, ejecución, pruebas y compilación.
3. Esquema de datos y migraciones versionadas.
4. Catálogo inicial de verbos con fuente, nivel de confianza y revisión de contenido documentados.
5. Datos de ejemplo incluidos en este paquete integrados como fixtures, no presentados como catálogo final.
6. Pruebas automatizadas de filtros, aprendizaje, editor, importación/exportación y juegos.
7. Capturas o vídeo breve de las pantallas clave.
8. Lista de limitaciones conocidas y decisiones que requieren validación humana.
9. Inventario de licencias de audios, tipografías, imágenes y librerías.

# 16. Riesgos y decisiones pendientes

- **Asignación por curso:** los verbos concretos cambian según libro, comunidad y centro; debe haber plantillas configurables.
- **Exhaustividad del catálogo:** las fuentes no siempre coinciden en variantes y en qué consideran irregular; mantener procedencia y estado de revisión.
- **Pronunciación:** IPA, dialecto y audio deben corresponder a la forma concreta y estar revisados.
- **Calidad de ejemplos:** las frases deben revisarse lingüísticamente y ser adecuadas a la edad.
- **Reconocimiento de voz:** resultados imperfectos pueden frustrar; es una ayuda optativa y posterior.
- **Gamificación excesiva:** medir aprendizaje y satisfacción, no solo clics o tiempo en la app.
- **Sincronización:** decidir cuándo merece la pena añadir cuentas y backend; el MVP local reduce complejidad.
- **Nombre comercial:** VerbQuest es el nombre de trabajo de este paquete; comprobar disponibilidad de marca y dominio antes de publicación.

**Fin del documento de requisitos funcionales.**
