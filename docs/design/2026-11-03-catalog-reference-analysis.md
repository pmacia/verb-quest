# Catálogo y ficha: análisis de la referencia del 3 de noviembre de 2026

Estado: estudio y propuesta para acordar el diseño; no es un plan de implementación aprobado. No se ha modificado código de la aplicación.

## Objetivo y alcance

Reorganizar la GUI del catálogo y la ficha individual tomando `Agent_documentation/src.zip` como referencia de intención, sin sustituir literalmente los archivos actuales. Conservar el diseño de VerbQuest, el catálogo, los filtros, las listas, las preferencias, la persistencia local y las reglas de aprendizaje. La única ampliación visual general solicitada es el acceso rápido al tema claro/oscuro en la barra superior.

La petición añade al prototipo dos requisitos para la ficha: etiquetas tras la traducción general y traducción bajo cada forma verbal. La referencia no resuelve todavía esos dos puntos.

## Material examinado

- Archivo ZIP extraído a un directorio temporal, sin ejecutar su código y sin sobrescribir `src/`.
- Comparación con los archivos actuales de catálogo, ficha, FamilyFilter, AppShell, AppProviders, configuración, ayuda IPA, progreso y generador de preguntas.
- Estilos actuales `global.css` y `tokens.css`; estilos de referencia `global.css` y `catalog-design.css`.
- Mapa de iconos por verbo, documento de diseño y captura `stitch_ref/screen.png` incluidos en la referencia.

El ZIP incluye más archivos modificados de los que requiere la GUI. Los cambios de configuración, ayuda, contexto, progreso y generación de preguntas se consideran contexto del prototipo, no instrucciones para reemplazar su comportamiento actual.

## Lectura funcional de la propuesta

| Zona | Intención identificada | Adaptación propuesta |
| --- | --- | --- |
| Cabecera del catálogo | Título, contador de resultados, selector Detallada/Compacta, interruptor de edición y alta | Contador real del resultado filtrado; vista detallada inicial como en la referencia; ambas vistas conservan búsqueda, selección y filtros |
| Búsqueda | Campo más visible y botón para vaciar | Mantener búsqueda por todas las formas y significados |
| Filtros | Panel plegable organizado por bloques; opciones rápidas mediante etiquetas pulsables | Conservar todos los criterios actuales y la relación entre formas y familias; estados seleccionados accesibles |
| Resumen de filtros | Etiquetas con eliminación individual, Todos y Añadir filtro | Incluir también sonido final y listas, omitidos en el resumen de referencia; distinguir vaciar filtros de borrar la búsqueda |
| Vista detallada | Tarjetas con lema, traducción, icono, etiquetas, tres columnas de conjugación, IPA y audio UK/US | Mostrar variantes y dialectos reales, sin quedarse solo con la primera variante |
| Vista compacta | Filas densas con lema, traducción, etiquetas, formas, IPA y audio conjunto | Mantener la comparación de las tres formas; evitar que desaparezcan variantes como was/were o got/gotten |
| Audio | Las tres formas seguidas y cada forma por dialecto | Un único control de reproducción que coordine secuencias, reproducción individual, detención y mensajes |
| Selección | Estado seleccionado visible y franja para guardar en lista o deseleccionar | Conservar selecciones al cambiar de vista y filtros; no crear un sistema de listas paralelo |
| Edición | Aviso descartable, lápiz, archivado/restauración y Nuevo verbo | Mantener confirmación, archivo reversible, referencias e historial |
| Ficha: cabecera | Lema, traducción y acceso al editor | Añadir etiquetas tras la traducción, con la misma denominación que el catálogo |
| Ficha: tres tarjetas | Contenido alineado a la izquierda, IPA con UK/US y audio abajo | Añadir traducciones por forma cuando se acuerde su contenido; usar maquetación flexible para que el audio no tape textos |
| Ficha: resto | Ejemplos, listas, pistas, notas, referencias y progreso | Conservar audio de ejemplos, IPA siempre visible, fuentes y calidad opcionales y progreso por habilidad |
| Barra superior | Botón de tema claro/oscuro | Integrar con Configuración y la preferencia Sistema, sin un segundo estado de tema independiente |

El botón Aplicar del prototipo solo cierra el panel: los filtros ya se aplican mientras se seleccionan. Propongo mantener la actualización inmediata con contador y un cierre claramente rotulado, sin añadir filtros provisionales pendientes de confirmar.

## Qué conservar del diseño visual

Tarjetas con jerarquía clara, superficies suaves, espacio entre grupos, tres áreas de conjugación y colores discretos por forma. Etiquetas para orientar y botones de audio próximos al dato que reproducen. Adaptación a móvil apilando las formas, manteniendo una vista compacta utilizable.

La referencia contiene otra paleta índigo/violeta, tipografías Plus Jakarta Sans/Inter y Material Symbols. La adaptación recomendada conserva los tokens claro/oscuro y los iconos SVG actuales, incorpora solo los acentos necesarios y evita nuevas dependencias remotas de fuentes o iconos. Los emoji del mapa son ayudas decorativas posibles, no sustitutos de las etiquetas. Conviene revisar casos polisémicos: el oso de bear o la puja de bid pueden representar un significado distinto del estudiado.

Las etiquetas propuestas se obtienen de datos existentes: curso recomendado, relación AAA/ABB/ABC/especial, familias, frecuencia, temas y dificultad cuando esté informada. En la lista se priorizan las etiquetas esenciales; la ficha puede mostrar la clasificación completa en grupos. No se equiparan cursos ESO y niveles CEFR.

## Problemas de la referencia que hay que resolver al integrar

1. `VerbDetailPage` invoca `playSingleForm` sin definirla o importarla; además pasa `v.lemma` en todas las tarjetas. En pasado de go podría pedir go en vez de went.
2. El catálogo llama directamente al sintetizador para audio individual y evita `spokenForm`: se perdería la distinción reed/red/red de read. Tampoco coordina completamente estos botones con la secuencia de tres formas.
3. Pasar UK/US al servicio no basta si se sigue enviando una voz fijada de otro dialecto: la elección explícita de voz tiene prioridad actualmente. El controlador deberá resolver esa combinación y comunicar cualquier alternativa.
4. `getFormIpa` toma solo la primera variante y puede usar IPA de otro dialecto sin identificar la sustitución. La vista compacta también reduce formas a la primera variante.
5. Falta el filtro actual de sonido final con forma y dialecto. El criterio de listas se conserva en la barra lateral, pero no tiene su propia etiqueta activa en el resumen nuevo. Los archivados solo se pueden activar desde edición en el prototipo.
6. La vista compacta deduce A1/A2/B1/B2 de ESO1/2/3/4; no existe esa correspondencia validada en los datos.
7. El ZIP elimina los ajustes de información avanzada y sus validaciones, vuelve a excluir read de Audio Detective y cambia las importaciones del contexto. Son regresiones ajenas al objetivo de GUI; no deben adoptarse.
8. La ayuda IPA propuesta pierde parte de la leyenda y la recuperación de foco que ya estaba corregida. Se conserva la ayuda actual, adaptando solo su presentación si hace falta.
9. El tema del prototipo escribe estado local y DOM por separado, trata Sistema como claro y silencia errores de guardado. Debe reutilizar la preferencia persistida y detectar el tema efectivo del sistema.
10. `catalog-design.css` tiene 2.831 líneas y 691 usos de `!important`, con reglas de botones, iconos y ficha. No se importará entero: se reconstruirán estilos acotados a componentes y basados en los tokens actuales.
11. Algunos controles del prototipo son de 16–34 px. Se mantendrá un área de interacción adecuada, foco visible, semántica de selección y soporte de movimiento reducido.
12. El posicionamiento absoluto del audio de ficha puede solapar variantes largas, botones de pausa y mensajes. Se alineará con flex/grid y crecimiento natural.

## Opciones de integración

**A. Recomendada: reconstrucción de la presentación con componentes compartidos.** Reutilizar consultas, filtros, persistencia y aprendizaje; separar las partes visuales y ampliar de forma controlada el controlador de audio. Permite acercarse a la referencia sin duplicar comportamientos.

**B. Cambio mínimo sobre los componentes grandes actuales.** Añadir condiciones de vista y nuevos estilos dentro de las páginas. Tiene menos cambios iniciales, pero mantiene monolitos y duplica el renderizado y los casos de audio.

La sustitución literal del ZIP se descarta por petición expresa del usuario y por las regresiones detectadas.

## Secuencia propuesta, pendiente de acordar

1. **Cerrar el contrato visual y los datos pendientes.** La traducción queda confirmada: significado general en cabecera y traducción específica en cada subficha. Cerrar distribución de etiquetas y criterios de ambas vistas. Definir con ejemplos go, read, be y get cómo se muestran variantes, IPA y dialectos. Usar la captura aportada como referencia; no generar otra maqueta salvo que ayude a resolver una decisión.
2. **Preparar componentes compartidos.** Presentadores de formas/variantes, etiquetas y pronunciación; control de audio individual y secuencial. Compartir datos y acciones, permitiendo distinta densidad de presentación.
3. **Reescribir la presentación del catálogo.** Cabecera, buscador, filtros y etiquetas activas; vistas detallada/compacta; selección, listas y acciones de edición. Mantener el motor de consulta y el significado de los filtros. Propuesta adicional: recordar la densidad elegida en el navegador.
4. **Reescribir la presentación de la ficha.** Cabecera con traducciones y etiquetas; tres tarjetas completas con IPA y audio por variante/dialecto; ejemplos escuchables; notas, familias, temas, curso, listas y progreso. Fuentes y revisión siguen sujetos al ajuste avanzado.
5. **Integrar el acceso rápido al tema.** Un botón accesible en AppShell, sincronizado con Configuración, modo Sistema y persistencia. Sin rediseñar navegación, inicio, juegos o progreso.
6. **Verificar y documentar.** Recorridos de búsqueda/filtros/selección/edición en ambas vistas, audio conjunto e individual, read, variantes de be/get, fuentes ocultas por defecto, tema claro/oscuro/Sistema, móvil y teclado. Mantener cobertura de copias, persistencia y aprendizaje. Actualizar pruebas que dependan del marcado y capturas/README relevantes.

La implementación puede hacerse en esos bloques sin esperar a cambiar todas las pantallas a la vez. El primer bloque de catálogo ya sería revisable visualmente, con la ficha a continuación.

## Decisión de contenido confirmada

El usuario confirma: traducción general en la cabecera y traducción específica de cada forma en su subficha. Ejemplo orientativo: cabecera go → ir; base go → ir; pasado went → fui/fue; participio gone → ido. La traducción de los ejemplos completos se mantiene.

El modelo actual guarda `meanings` a nivel de verbo, pero no traducciones por cada forma. `examples[].translation` pertenece a la frase y no debe reutilizarse como traducción de una forma aislada.

La implementación deberá añadir traducciones específicas por forma y, cuando corresponda, por variante, conservando `meanings` para el significado general. Se revisarán lingüísticamente los 120 verbos, incluidos auxiliares, modales, distintas acepciones y variantes como was/were. Los equivalentes españoles son orientativos y pueden depender de la persona o el contexto; no se presentará una conjugación arbitraria como equivalente único.

También deberán contemplarse edición, importación/exportación, validación y actualización compatible del catálogo. Las fichas personalizadas conservarán sus cambios. En contenido antiguo o importado que carezca de traducción específica no se inventará una: se permitirá incorporarla desde el editor. Esta ampliación editorial y de datos queda incluida en la propuesta, pendiente de aprobar el diseño completo antes de implementar.
