# Diseño: Repaso de verbos

Estado: aprobado por el usuario e implementado el 14 de noviembre de 2026. Comprobación del micrófono en dispositivos físicos pendiente; véanse el plan de implementación y el README.

## Objetivo y acuerdos

Añadir un juego en el que se pregunta por un verbo y el estudiante responde con infinitivo, pasado y participio, por escrito o con voz. La aplicación conserva su estilo compacto, colores accesibles, iconos y controles utilizables en móvil.

Acuerdos de esta conversación:

- Sin API de IA de pago ni claves externas; lectura y dictado mediante servicios del navegador.
- Biblioteca completa, lista guardada o selección manual, igual que los demás juegos.
- Pista en castellano o inglés y respuestas siempre en inglés.
- Dialecto UK/US según la preferencia existente.
- Dos modalidades de comprobación de voz disponibles en Configuración y guardadas en el navegador: automática con ayuda (predeterminada) y revisión manual.
- La escritura se comprueba con un botón en ambas modalidades.
- Repetir durante la partida los verbos fallados hasta resolverlos o terminar voluntariamente.

## Enfoques considerados

1. Corregir toda transcripción inmediatamente: rápido, pero convierte problemas del micrófono en fallos educativos.
2. Confirmar toda transcripción: predecible, pero obliga a pulsar después de cada respuesta.
3. Automático con ayuda y revisión manual configurable: opción elegida en la conversación. Automatizar los casos claros y conservar la posibilidad de revisar y editar.

Decisión propuesta para proteger al alumno: en automático, una respuesta claramente válida se comprueba sin otro clic. Una respuesta de voz discrepante, incompleta o ambigua permanece editable y pide repetir o comprobar antes de registrar un fallo. No se utiliza un porcentaje de confianza como garantía de exactitud. Esta protección se mantiene aunque el reconocedor devuelva tres palabras.

Criterio concreto de ambigüedad: un resultado se puede aceptar automáticamente si las alternativas plausibles recibidas coinciden en las mismas tres formas tras aplicar equivalencias controladas. Si hay alternativas incompatibles que contienen formas válidas distintas (por ejemplo, come frente a came), pedir revisión; no elegir una alternativa solo porque coincide con la solución esperada. Una equivalencia de homófonos inequívoca sí puede dar lugar a acierto automático de memoria. Si el motor solo ofrece una alternativa, no inventar otras ni sustituirla por la respuesta del catálogo.

## Preparación y pantalla de juego

En Juegos aparece «Repaso de verbos», con las fuentes de verbos existentes. El idioma de la pista se puede elegir al preparar la partida; parte de la preferencia guardada. El dialecto procede de Configuración.

La pregunta muestra el significado elegido del catálogo o la forma base inglesa, junto al control de lectura. Las traducciones ambiguas deben llevar una aclaración útil basada en el catálogo; no deben ampliarse automáticamente a verbos distintos por compartir una traducción.

La respuesta se distribuye en tres campos editables, identificados como Infinitivo, Pasado y Participio. En anchos pequeños pueden apilarse conservando sus etiquetas. Se puede escribir en ellos, dictar las tres formas juntas o dictar un campo concreto.

Controles: micrófono, alternativa de teclado, Comprobar, pausa y terminar. Tras la corrección, Siguiente permite avanzar sin una transición cronometrada que impida leer o escuchar.

La corrección distingue cada columna mediante color, icono y texto. Conserva la respuesta del alumno, señala el error y muestra la solución de esa columna. Si hay un fallo, lee las tres formas correctas y permite repetir o detener el audio. Antes de volver a escuchar al alumno, cancela la voz del dispositivo.

## Micrófono: comportamiento y estados

Estados: disponible, preparando permiso, escuchando, procesando, listo para revisar y no disponible. Siempre se conserva el borrador al pasar entre voz y teclado.

- Solicitar reconocimiento exclusivamente tras una interacción del alumno.
- Usar mantener pulsado para el dictado, con alternativa accesible mediante teclado y controles por campo. No prometer que mantener pulsado evita los cortes del motor de Safari.
- Solicitar varias alternativas de transcripción cuando el navegador las ofrezca; los resultados provisionales se muestran pero nunca se califican.
- Procesar únicamente resultados finales. Guardar los fragmentos de una captura ya recibidos si el navegador termina la escucha antes de tiempo.
- Si faltan formas, permitir continuar dictando en la siguiente casilla o editar. No reiniciar automáticamente el micrófono en bucle.
- Resolver la liberación del botón mientras se pide permiso: una autorización tardía no debe dejar una escucha activa cuando el alumno ya soltó el botón.
- Al terminar, pausar, cambiar de pregunta, perder la captura del puntero o salir de la página, detener la escucha y anular eventos antiguos.
- Proteger contra resultados tardíos, doble envío y repetición del mismo resultado. Una captura pertenece a una pregunta concreta.
- Permiso denegado, ausencia de reconocimiento, problemas de red, silencio y motor detenido son incidencias de entrada; no registran intentos ni errores de aprendizaje.
- Ante una denegación, ofrecer teclado inmediatamente. No volver a pedir permiso automáticamente.
- Si el teclado del dispositivo ofrece dictado, se puede usar como alternativa; no garantizar que todos los teclados tengan micrófono.

La aplicación no guardará grabaciones. El servicio de reconocimiento del navegador puede necesitar conexión y enviar audio a su proveedor. Se explicará una vez, de forma breve, junto al acceso a la voz. Las pruebas de compatibilidad no pueden basarse solo en la presencia del constructor de la API.

## Comprobación y variantes

Las formas aceptadas se toman del registro del verbo y se congelan en la pregunta. Una edición posterior del catálogo no cambia retroactivamente una respuesta pendiente.

- Comparación por columnas y en orden; nunca tratar las tres palabras como un conjunto sin posición.
- Normalizar mayúsculas, espacios y puntuación no significativa.
- Teclado: aceptar únicamente formas y variantes válidas; no aplicar aproximación ortográfica.
- Voz: considerar alternativas completas del reconocedor y una tabla pequeña y probada de homófonos, por columna. Ejemplo: by → buy; reed para la base de read y red para su pasado/participio.
- Las sugerencias de Levenshtein (máximo una edición, palabras de cuatro letras o más) solo ayudan a revisar una transcripción de voz. No producen un acierto objetivo automático y no sustituyen otra forma verbal válida. Come nunca debe corregirse a came de forma silenciosa.
- Eliminar repeticiones del motor únicamente cuando se demuestra que son actualizaciones de un resultado anterior; no eliminar las dos apariciones legítimas de bought en buy/bought/bought.
- Aceptar variantes del dialecto seleccionado, las marcadas all y las que no tengan marca. Neutral pertenece actualmente a los ejemplos del catálogo, no al enum de variantes; no ampliar ese enum solo por crear este juego.
- Para be, aceptar was o were en la columna de pasado, o ambas formas. Dar cobertura únicamente a las variantes efectivamente respondidas, sin acreditar automáticamente la que no se ha producido.

## Progreso y cola de repaso

El juego practica memoria de las formas. La voz no acredita pronunciación ni ortografía. Una respuesta de voz clara y válida puede aportar evidencia de memoria mediante una regla específica de este modo; los juegos existentes conservan sus reglas.

Con pista inglesa, la forma base ya se ha proporcionado: no acreditar su recuerdo. Con pista castellana, las tres formas pueden aportar cobertura. La cobertura de variantes especiales debe proceder de las respuestas producidas.

Una respuesta completa correcta se registra una sola vez. Las correcciones aproximadas o con ayuda se identifican como práctica asistida. Se conserva el máximo de un avance apto por verbo/habilidad y día, los intervalos y la protección frente a contenido modificado.

Elegibilidad de la evidencia, como decisión de diseño propuesta:

| Procedencia o ayuda | Memoria objetiva si la respuesta es correcta | Asistencia |
| --- | --- | --- |
| Teclado, sin pistas ni solución mostrada | Sí, con las reglas de cobertura y calendario | No |
| Voz final inequívoca, coincidencia exacta o homófono controlado | Sí, mediante la excepción exclusiva de este modo | No |
| Transcripción revisada o editada por el alumno, sin pistas del programa | Sí; procedencia mixta, sin acreditar ortografía | No |
| Aceptación de una sugerencia aproximada, menú de posibles respuestas o solución ofrecida por el programa | Solo práctica; no avance objetivo | Sí |
| Repetición después de mostrar la solución | Solo práctica; no avance objetivo | Sí |
| Captura incompleta, conflicto de alternativas o incidencia del micrófono sin confirmación | No hay intento todavía | No aplica |

Cambiar espontáneamente una transcripción sin recibir la respuesta del programa no se considera ayuda externa. Una sugerencia del programa que revele una forma correcta marca el intento como asistido aunque después se edite el campo. La procedencia mixta nunca acredita ortografía. La señal isWritten debe describir la procedencia real; no fingir escritura para satisfacer las reglas antiguas.

Una discrepancia de voz no confirmada no genera un fallo. Un error escrito o confirmado sí muestra la solución y reintroduce el verbo tras hasta tres preguntas pendientes; si quedan menos, va al final. Cada repetición tiene un identificador nuevo y conserva la referencia a la pregunta original. No se altera el límite de reintentos de los otros juegos.

Las repeticiones posteriores a una solución mostrada se consideran práctica asistida para que acertar por repetición inmediata no acredite nuevo dominio. Se puede terminar la sesión en cualquier momento conservando lo registrado y los repasos programados. No se obliga al alumno a permanecer en un bucle.

Pausar mantiene exactamente la cola y permite reanudarla. Terminar cierra la sesión definitivamente, como en los juegos actuales: conserva intentos, progreso y fechas de refuerzo registradas, pero no traslada preguntas de la cola a una nueva sesión. Las preguntas aún no respondidas no se convierten en errores. Una sesión futura genera sus preguntas a partir de la selección y del progreso guardado. La interfaz debe distinguir «Pausar para seguir después» de «Terminar y guardar lo hecho».

En el juego libre, generar una pregunta inicial por verbo seleccionado, sin el recorte diario de nuevos que aplican los planes. La pantalla informa del número real de verbos y permite terminar libremente; la duración configurada es orientativa. Los futuros usos dentro de planes mantendrán los límites propios del plan. El contador diferencia verbos pendientes y refuerzo; no simula progreso creciente sobre una cola de tamaño fijo.

## Configuración y persistencia

Añadir preferencias opcionales con valores por defecto para instalaciones antiguas:

- Comprobación de respuestas dictadas: automática con ayuda / revisión manual.
- Idioma preferido de la pista: castellano / inglés.

No cambiar la configuración de comprobación escrita. Mantener el dialecto, velocidad y volumen existentes. Una pregunta conserva idioma y dialecto de su creación; cambiar ajustes no debe modificar sus respuestas aceptadas a mitad de un intento. La comprobación automática/manual puede cambiar sin borrar la partida, aplicándose a la próxima captura y sin enviar retroactivamente un borrador.

Persistir la cola, preguntas, intentos y procedencia de entrada (teclado, voz o mixta). No guardar resultados provisionales ni audio. Las copias completas conservan los nuevos campos y siguen admitiendo sesiones y ajustes antiguos. La exportación de catálogo base no incorpora preferencias personales.

## Integración y archivos

Se apoya en React, Vite, IndexedDB/Dexie y los servicios existentes; no necesita Next.js ni nuevas dependencias de IA.

- GamesPage: tarjeta y preparación del nuevo modo, utilizando el diálogo existente para conflictos de sesión.
- Nuevo componente de juego: tres campos, dictado, revisión y corrección por columna; CSS propio con tokens existentes.
- Nuevo adaptador de reconocimiento: interfaz inyectable que encapsule SpeechRecognition/webkitSpeechRecognition y su ciclo de vida.
- Servicio de síntesis: permitir lectura castellana para la pista y mantener la selección inglesa UK/US para respuestas y pistas inglesas. Si no existe una voz adecuada, conservar el texto.
- Motor de preguntas y evaluación: snapshot de tres columnas, variantes, dialecto e idioma; normalización explícita según la procedencia.
- Servicio de sesión y progreso: reintentos y evidencia de memoria propios de este modo, sin modificar el comportamiento de los demás.
- Tipos y esquemas, ajustes, bootstrap y copias: campos opcionales y valores por defecto compatibles.
- Documentación: funcionamiento, límites de reconocimiento, permisos y acceso HTTPS desde otros dispositivos.

Los nombres concretos de campos se fijarán en el plan de implementación; los datos de evaluación pertenecerán al snapshot y no se deducirán de etiquetas de interfaz.

## Comprobaciones de aceptación

Automatizadas:

- Escritura correcta, incorrecta y variantes UK/US; orden de columnas; was/were; read; homófonos controlados; came/come y repeticiones legítimas.
- Alternativas finales, resultados provisionales, captura parcial y revisión de una discrepancia sin registrar un fallo.
- Alternativas incompatibles come/came requieren revisión aunque una coincida con la solución; homófonos controlados inequívocos sí permiten automático.
- Edición propia de la transcripción, sugerencias aproximadas y repeticiones aplican la tabla de elegibilidad.
- Pausar reanuda la cola; terminar no la reabre y conserva solo el historial y los repasos registrados.
- Automático y manual persistentes; cambio de preferencia sin enviar el borrador.
- Permiso denegado, red caída, silencio, stop/end, navegación, liberación durante permiso y eventos antiguos.
- Un único intento por envío, cola persistente, repetición más adelante y salida voluntaria.
- Ningún cambio de pronunciación/ortografía por dictado; cobertura base limitada con pista inglesa; intervalos intactos.
- Copia y restauración actuales y antiguas; sesión previa conservada si falla el inicio de la nueva.
- Móvil desde 320 px, teclado, lectores de pantalla, temas claro/oscuro y movimiento reducido.

En dispositivos reales: Safari de iPhone e instalación PWA; Chrome de Android e instalación PWA. Probar permisos iniciales, pausas al hablar, bloqueo del teléfono y vuelta a la aplicación. Las pruebas con un reconocedor simulado no garantizan el comportamiento del micrófono real; si no se dispone de un dispositivo, declarar esa comprobación pendiente.

## Referencias técnicas

Consultadas el 13 de noviembre de 2026:

- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/maxAlternatives
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/continuous
- https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionErrorEvent/error
- https://webkit.org/blog/11648/new-webkit-features-in-safari-14-1/

## Revisión previa a la implementación

Una revisión independiente ha identificado tres puntos que se han concretado en este documento: alternativas incompatibles del reconocedor, elegibilidad de transcripciones editadas y diferencia entre pausar y terminar. Sus resoluciones son decisiones propuestas del diseño; la aprobación incluye estas reglas.
