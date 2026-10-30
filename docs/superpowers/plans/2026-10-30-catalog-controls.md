# Controles de biblioteca: audio y edición

Solicitud: altavoz en cada fila para escuchar base, pasado y participio; interruptor normal/edición; lápiz y papelera por fila en edición; botón + junto al interruptor para crear un verbo.

Decisiones: se usa el servicio de voz y los ajustes existentes. Tres reproducciones secuenciales, con variantes dentro de su forma; nunca se solapan dos filas y se puede detener. Para read se usan los tres ejemplos revisados en contexto, sin prometer validación fonética. La papelera archiva de forma reversible, muestra el impacto y conserva historial/listas. El modo de edición es un estado de interfaz, no un permiso. El icono para abrir la ficha se conserva.

- [x] Audio: pruebas RED→GREEN de orden, espera real de finalización, cancelación, cambio de fila, fallo y read contextual. Un controlador por biblioteca; limpieza al salir o retirar la fila visible; actividad de audio solo por formas completadas, sin evidencia objetiva ni XP.
- [x] Interfaz: interruptor accesible; + solo en edición; altavoz en todas las filas; editar y archivar/restaurar por fila. Confirmación, errores recuperables y acciones separadas de selección/navegación.
- [x] Verificación: regresiones de navegador, voz controlada, teclado/360 px, cancelación y archivo reversible; suite, tipos, contenido/build y revisión independiente del cambio. Actualizar README y capturas.

Se reutiliza el checkout existente limpio. No se añade una biblioteca de iconos ni dependencias. Se conserva el esquema de almacenamiento. El estado normal/edición solo afecta a los controles de la biblioteca y vuelve a normal al salir de ella.

## Cierre · 31/10/2026

Implementado sin nuevas dependencias ni cambios de esquema. Audio: seis contratos RED→GREEN; interfaz: tres recorridos E2E inicialmente fallidos y después correctos. Se conserva el archivado reversible para proteger historial y referencias; read emplea frases revisadas por la ambigüedad de la voz aislada. Se reutilizó el checkout limpio existente.

Verificación: 103 pruebas unitarias/integración, 84 E2E en Chromium/Firefox/WebKit, comprobación de contenido (120 verbos, 362 ejemplos), tipos y compilación. Inspección visual a 360 y 1440 px. README actualizado. La revisión independiente encontró dos P2: cancelación nativa del diálogo durante operaciones y distinto breakpoint de las filas móviles. Ambos corregidos, con regresión del evento cancel y del diseño a 600 px; recorridos afectados repetidos tras los cambios. No hay problemas importantes pendientes en la revisión.

Límite: las voces dependen del navegador/sistema y no garantizan pronunciación por contexto. Solo se registra escucha al completar cada forma; no aumenta XP ni dominio.
