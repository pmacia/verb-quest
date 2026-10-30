# Informe de aceptación · 30/10/2026

VerbQuest 0.1.0 queda operativo como aplicación local para navegador, en la rama `feat/verbquest`. No se ha publicado ni enviado a un repositorio remoto. El catálogo de producción sustituye a los ejemplos del paquete; estos se conservan como fixtures de pruebas.

## Evidencia final

Entorno: macOS arm64, Apple M4, Node 24.12.0, npm 11.6.2. Dependencias fijadas en package-lock.json. Código verificado guardado en el commit `911220b`; la documentación de cierre se guarda a continuación.

| Comprobación ejecutada            | Resultado                                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `npm run typecheck`               | Sin errores                                                                                        |
| `npm test`                        | 86 pruebas, 18 archivos, todas pasan                                                               |
| `npm run content:check`           | `publishable: true`, 0 errores, 120 verbos y 362 ejemplos                                          |
| `npm run build`                   | Correcto; service worker y 19 recursos precacheados                                                |
| `npm run test:e2e`                | 66/66; 22 en Chromium, 22 en Firefox y 22 en WebKit, 57,3 s                                        |
| Axe sobre siete rutas principales | Sin infracciones en las reglas configuradas, en los tres motores                                   |
| `npm run benchmark:catalog`       | 10.000 entradas, 20 consultas tras calentamiento; mediana 3,08 ms, p95 7,06 ms; referencia <300 ms |
| `npm audit --omit=dev`            | 0 avisos                                                                                           |
| `npm audit` completo              | 4 avisos bajos de herramientas de desarrollo, véase decisión abajo                                 |
| `git diff --check`                | Sin errores de espacios                                                                            |

El benchmark mide el motor de consulta en Node sobre este equipo; no representa un tiempo garantizado de renderizado en cualquier dispositivo. `publishable` es el control técnico/editorial del repositorio, no una certificación docente ni una publicación efectiva.

## Cobertura de aceptación

Las pruebas E2E trabajan contra build/preview, sin servidor de datos. IndexedDB conserva los datos y cada contexto de prueba es independiente.

| Escenario normativo (§14)                | Evidencia y alcance                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Buscar went y abrir go                | E2E catálogo/ficha; síntesis y eventos probados mediante puerto de voz; no se certifica pronunciación real                            |
| 2. Combinar relación de formas y ESO2    | E2E aceptación y pruebas de consultas combinadas                                                                                      |
| 3. Lista de cinco y selección compartida | E2E aceptación con Flashcards; servicio común para los cinco juegos; selección por lista, plan o manual                               |
| 4. Escucha separada de escritura         | Motor por habilidad y sesión; alternativa visual probada en E2E, sin acreditar escucha                                                |
| 5. Error y repaso                        | Motor y sesión transaccional: explicación, un reintento, reinicio del ciclo y fecha de mañana                                         |
| 6. Sesiones separadas                    | Cuatro sesiones escritas en fechas controladas por interfaz; cobertura base/pasado/participio y ninguna mejora de otras habilidades   |
| 7. Crear, exportar e importar duplicados | E2E editor e importador; round trip CSV/JSON y copia completa en integración                                                          |
| 8. Archivar conservando referencias      | E2E impacto, archivo/restauración y recuperación; integración conserva intentos y referencias                                         |
| 9. Recargar y conservar progreso         | E2E sesiones, planes, editor y ajustes; rollback e idempotencia en integración                                                        |
| 10. Pantalla estrecha y teclado          | E2E 360 px y parejas con teclado; revisión visual de móvil/escritorio sin desbordamiento horizontal. Teclado virtual físico pendiente |
| 11. Falta de audio                       | E2E alternativa visual y pruebas de fallo/cancelación/timeout del servicio de voz                                                     |
| 12. Ajustes                              | E2E persistencia y dos confirmaciones; recordatorios desactivados en esta versión                                                     |

También se comprueban fechas de calendario y DST, cobertura was/were por separado, variantes por dialecto, rechazo de contenido incompleto, edición JSON inválida, versiones futuras de IndexedDB, restauración validada y atómica, errores de cuota recuperables y doble envío de respuestas. Una prueba de actualización comprueba que disponer de una versión nueva no la activa automáticamente y vuelve a comprobar la sesión antes de recargar. No se ha simulado un despliegue real entre dos versiones alojadas.

## Revisión independiente y correcciones

Una revisión independiente de código identificó seis problemas importantes, sin problemas críticos ni observaciones menores. Todos se corrigieron con regresiones:

1. Exigir presencia de las tres formas principales para dominar, aunque existan tres objetivos de otras variantes.
2. Vincular la evidencia a una revisión semántica: las instantáneas antiguas no acreditan formas editadas. Se conserva el historial, se reinicia el ciclo afectado y no se concede XP por la instantánea obsoleta; una traducción por sí sola no invalida las formas.
3. Reconocer was/were por el contenido del verbo, también al importar/copiar con otra identidad.
4. Sustituir el falso emparejamiento de una opción por un tablero real de varias asociaciones, accesible con botones y teclado.
5. Permitir juegos con un plan guardado o selección manual, además de biblioteca/listas.
6. Mostrar errores al pausar, finalizar o reanudar y permitir reintentarlos sin anunciar un guardado fallido como exitoso.

La primera instancia de revisión no pudo ejecutarse por límite de uso del modelo; una instancia disponible completó la revisión. Hubo una sola pasada de correcciones posterior; no se atribuye una segunda aprobación independiente que no ocurrió. Observaciones menores diferidas: ninguna.

Durante aceptación se corrigieron además esperas de las propias pruebas: guardar un plan y finalizar una sesión son acciones asíncronas; la prueba espera ahora su confirmación visible antes de navegar. La última batería completa es la que figura arriba. Una demora de apertura observada anteriormente en Firefox no se reprodujo en cinco repeticiones aisladas ni en las dos últimas pasadas completas; no se conoce su causa y no se presenta como una avería corregida. Se mantienen marcas de arranque para diagnosticarla si reaparece.

## Inspección visual y límites humanos

Capturas reales en `docs/screenshots`: Inicio, Biblioteca, Ficha, Estudiar, Juegos, Progreso y Editor a 1440×1024; Biblioteca a 360×800 y tablero de parejas móvil. Se esperó a la interfaz preparada antes de capturar. Se revisaron distribución, foco, navegación, etiquetas y ausencia de desbordamiento. Se comprobaron teclado y zoom 200%; no hubo una sesión extensa con VoiceOver/NVDA ni una certificación formal AA.

El intento de síntesis del navegador disponible no proporcionó una voz UK utilizable en esa comprobación. Los eventos de audio tienen pruebas con un puerto controlado y la alternativa está probada en navegadores; no se afirma haber validado auditivamente una voz real. La revisión de contenido es asistida, sin validación docente independiente; IPA es parcial. Los cursos son recomendaciones acumulativas editables, no listas oficiales. Véanse `content/review-log.md`, `accessibility-checklist.md` y `known-limitations.md`.

## Decisiones de ejecución conservadas

- Se reutilizó el checkout inicial en `feat/verbquest`, según la ejecución autorizada aquí. Coste: no hubo aislamiento adicional mediante otro worktree.
- El plan está en español y los scripts auxiliares solo reconocían encabezados ingleses; se registraron manualmente tareas y evidencias. Coste: seguimiento manual.
- Los esquemas de validación se componen con Ajv a partir de los suministrados, evitando duplicar definiciones generadas. Coste: no se entrega un export separado del esquema compuesto.
- Las tareas integradas 5–14 comparten contratos y rutas y se guardan como integración coherente. Coste: menor granularidad para git bisect.
- La revisión final examinó el árbol completo antes del commit de integración. Se conserva su alcance y sus correcciones en este informe, sin declarar una revisión del hash posterior.
- Se mantiene la rama local y el directorio de trabajo: no hay una rama base previa de aplicación ni se solicitó merge, push o despliegue.
- Los avisos bajos de `deepmerge` a través de Workbox y vite-plugin-pwa se difieren: afectan a configuración de compilación controlada y no a dependencias de ejecución. npm propone degradar vite-plugin-pwa de 2.0.0 a 0.2.1; no se fuerza ese cambio incompatible. Revisar una actualización compatible antes de distribuir herramientas de compilación con entradas no confiables. Referencia del informe npm: GHSA-gcqx-w48m-w2h4.

Las limitaciones humanas y las observaciones anteriores son explícitas; no se convierten en una garantía general de ausencia de defectos.
