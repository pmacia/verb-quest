# Repaso de verbos: interfaz aprobada

Integrar la maqueta «Reto de voz» refinada con el usuario el 17 de noviembre.
Pregunta destacada con altavoz, tres tarjetas con colores propios, campos integrados
y controles circulares. En móvil las respuestas son filas compactas y el dock
inferior permanece accesible sin cubrir contenido; en escritorio son tres columnas.

El micrófono azul pasa a rojo únicamente al escuchar, con halo palpitante; preparar
y procesar tienen estados diferenciados. Soltar termina el dictado, sin otro botón
de detener. Tras capturar se puede comprobar, descartar el último dictado o repetir.
Conservar comprobación automática/manual, teclado, dialecto, sugerencias, audio,
persistencia y cola de repaso. Descartar restaura el borrador anterior al dictado.

Hover sutil en todos los controles y tarjetas; ficha pulsable enfoca su campo.
Foco redondeado integrado en la tarjeta, con foco de teclado visible. Soportar
claro/oscuro, movimiento reducido, teclado móvil y botones táctiles accesibles.
Mantener el diseño común de la app y aislar las reglas CSS al repaso.

Alternativas consideradas: mesa de estudio discreta o reto de voz protagonista.
El usuario eligió y aprobó reto de voz y autorizó su integración. No se añaden
dependencias, APIs de pago, ni cambios en la evaluación.
