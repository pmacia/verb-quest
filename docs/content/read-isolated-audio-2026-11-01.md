# Read: misma escritura, pronunciación por forma

El usuario solicita tratar read como los demás verbos: AAA por escritura, con /riːd/ en base y /red/ en pasado y participio. La solución contextual anterior queda sustituida. No se modifican las formas escritas, IPA, clasificación, ejemplos ni respuestas aceptadas.

La ficha utiliza los mismos botones que los demás verbos, sin frases añadidas. El altavoz de la biblioteca reproduce las tres palabras aisladas. Audio Detective incorpora read con la pronunciación correspondiente a cada objetivo y mantiene `read` como respuesta escrita.

La selección del sonido se centraliza en `spokenForm`. Para el verbo con base read, cuando el valor de la forma también es read, envía al sintetizador el homófono reed en base y red en pasado/participio. Las variantes locales con otra escritura se conservan sin sustituir. No se deduce la pronunciación del contexto, no se envía IPA literal a un sintetizador de texto y no se altera la preferencia de mostrar u ocultar IPA.

Fuentes: [Oxford read](https://www.oxfordlearnersdictionaries.com/definition/english/read_1), [Oxford reed](https://www.oxfordlearnersdictionaries.com/definition/english/reed) y [Oxford red](https://www.oxfordlearnersdictionaries.com/definition/english/red_1). El diccionario de read documenta explícitamente la homofonía con reed; las transcripciones por forma ya estaban contrastadas en el catálogo.

El texto visible, la respuesta y el texto interno de síntesis tienen propósitos distintos. El navegador pronuncia el homófono inglés con la voz elegida: es síntesis de voz, no una grabación certificada. No se descargan audios de diccionarios. La selección funciona sin depender del modo IPA, como el resto del audio. [Web Speech](https://dvcs.w3.org/hg/speech-api/raw-file/tip/webspeechapi) permite que los motores ignoren etiquetas SSML que no soporten; por ello no se depende de soporte de fonemas SSML en todos los navegadores.

Comprobaciones: pruebas RED→GREEN de las tres formas sin ejemplos (UK/US), misma escritura y respuestas aceptadas, ficha y biblioteca con audio aislado, reproducción ordinaria de go y regresiones de sesiones. Suite unitaria: 121 correctas. E2E pertinentes: 21 correctas en Chromium, Firefox y WebKit. Estas pruebas verifican los textos enviados al puerto de voz y la interfaz; no certifican acústicamente cada voz instalada.
