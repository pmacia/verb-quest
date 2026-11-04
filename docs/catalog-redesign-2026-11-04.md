# Catálogo y ficha renovados — 4 de noviembre de 2026

La interfaz se ha reconstruido a partir de la intención de `Agent_documentation/src.zip`, conservando el motor de consultas, listas, aprendizaje y almacenamiento de VerbQuest. No se ha instalado otra biblioteca de interfaz ni copiado la hoja de estilos del prototipo.

## Resultado

- Catálogo con densidad detallada/compacta, preferencia local recordada, buscador, contador y filtros visuales.
- Selección conservada al alternar vistas; franja para guardar en lista o deseleccionar.
- Todas las formas y variantes con IPA y audio por dialecto; secuencias y reproducciones individuales coordinadas.
- Etiquetas coherentes entre lista y ficha; cursos ESO orientativos, sin inventar equivalencias CEFR.
- Ficha con significado general en cabecera, traducción específica en cada forma, clasificación completa y ejemplos con altavoz.
- Acceso rápido a claro/oscuro, compatible con Sistema y sincronizado con Configuración.
- Fuentes y calidad siguen ocultas por defecto; la IPA siempre es visible.

## Contenido y compatibilidad

`curated-1.3` añade `translation?: string` a base y variantes, con cobertura de las 378 formas existentes de los 120 verbos. Las traducciones son equivalentes pedagógicos originales de revisión asistida, no una conjugación española exhaustiva ni una certificación docente. El pasado presenta personas representativas y puede requerir otra equivalencia según contexto (incluido imperfecto). Los participios se traducen con atención a las acepciones originales.

Las formas inglesas y la IPA no cambian. Los significados generales y traducciones de frases se conservan. Se verificó que los nuevos campos no alteran las revisiones de las cinco habilidades evaluables. La versión editorial cambia para impedir que un editor obsoleto sobrescriba la actualización. Las fichas modificadas localmente conservan sus cambios y reciben la nueva base como actualización pendiente.

Las traducciones se editan por variante y se conservan en JSON/copias completas. Los campos nuevos son opcionales, por lo que el contenido antiguo sigue siendo válido. El CSV básico mantiene su alcance previo y no conserva todos los metadatos.

Referencias lingüísticas de apoyo: [formas verbales, Cambridge](https://dictionary.cambridge.org/grammar/british-grammar/basic), [pasado simple, Cambridge](https://dictionary.cambridge.org/grammar/british-grammar/past-simple) y [ortografía de crie/guie, Academia Dominicana de la Lengua](https://academia.org.do/2019/05/14/temas-idiomaticos-11/). Las fuentes de pronunciación continúan en el registro de IPA existente; no se atribuyen a ellas las traducciones originales.

## Integración técnica

`VerbForms`, `VerbBadges`, `CatalogVerbItem` y `FilterChoices` comparten la presentación. `CatalogPage` conserva los estados de consulta/selección y servicios existentes. El controlador de audio atiende un verbo completo, una forma o una variante; los botones UK/US fuerzan la selección del dialecto y comunican sustituciones.

Los estilos usan los tokens claro/oscuro e iconos SVG existentes. Los controles nativos mantienen teclado y nombres accesibles. Una regla antigua de campos de texto se corrigió para no afectar a los radios: en Safari los hacía colapsar a ancho cero. El estado activo de densidad utiliza colores que mantienen contraste incluso durante transiciones.

La revisión independiente detectó y se corrigieron con regresiones dos problemas: guardar un borrador de Configuración podía revertir el tema rápido, y corregir momentáneamente una letra podía eliminar los metadatos de una variante. También se comprobó la información de reproducción y detención accesible, los callbacks tardíos y los detalles de voz local/remota.

## Verificación

- 127 pruebas unitarias/integración (`npm test -- --maxWorkers=2`, para limitar procesos en este equipo).
- 135 pruebas E2E, incluyendo filtros y familias, selección, archivo/restauración, traducciones, read, UK/US, edición y copia de datos.
- Accesibilidad automática de recorridos principales y catálogo compacto móvil en tema oscuro.
- Tipos, compilación, auditoría de contenido e IPA y regresión de HMR.
- Inspección visual de catálogo/ficha en escritorio y móvil, claro/oscuro.

La comprobación de voz valida el texto y dialecto enviados al motor; no certifica acústicamente cada voz del sistema. La aplicación sigue sin evaluar la pronunciación del estudiante.

## Decisiones y límites

Se reutilizó el checkout autorizado para conservar el servidor de desarrollo existente; no se añadió aislamiento de archivos. Se ejecutó el trabajo inline con una revisión independiente final. Las observaciones de audio se trataron en la misma pasada porque afectaban a los controles accesibles solicitados. Los juicios visuales que el revisor dejó fuera de su revisión de código se cubrieron con pruebas de navegador y capturas; la variación de voces queda como límite del dispositivo.

No se han incorporado los cambios del ZIP que eliminaban ajustes avanzados, recuperaban la exclusión de read, omitían filtros o reducían las variantes a su primera entrada. Los archivos de referencia del usuario se conservan.

Capturas: [catálogo detallado](screenshots/catalog-redesign-desktop.png), [catálogo compacto](screenshots/catalog-redesign-compact.png), [ficha](screenshots/verb-detail-redesign-desktop.png) y [ficha oscura](screenshots/verb-detail-redesign-dark.png). No quedan hallazgos menores diferidos de la revisión.
