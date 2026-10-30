# Verificación de accesibilidad

Rutas principales: Inicio, Biblioteca, Ficha, Planes, Juegos, Progreso y Configuración. Axe ejecuta reglas WCAG 2 A/AA, 2.1 AA y 2.2 AA en Playwright; los resultados finales se registran en acceptance-report.md.

Revisión de interacción: navegación mediante enlaces/botones semánticos; skip-link, foco de ruta y controles con foco visible; modales nativos con Escape y retorno del foco; matching sin arrastrar; campos con etiqueta; feedback con texto/estado; audio con nombre y alternativa visual; ninguna cuenta atrás obliga a responder. Los estados no dependen solo del color.

Capturas revisadas en escritorio 1440×1024 y móvil 360×800. Se comprueba ausencia de desplazamiento horizontal; navegación inferior persistente en móvil y salida al teclado mediante controles nativos. Preferencias de tema y movimiento se conservan. Las animaciones respetan prefers-reduced-motion.

Límites: no se ha realizado una certificación formal ni una sesión completa con VoiceOver/NVDA y personas usuarias. Las comprobaciones automáticas no equivalen a garantizar AA; las pruebas manuales pendientes con lectores de pantalla y dispositivos físicos quedan explícitas.
