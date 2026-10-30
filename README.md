# VerbQuest

PWA educativa para practicar verbos irregulares en inglés, con interfaz en español, catálogo editable, planes y repaso espaciado por habilidad. Primera versión local: no hay cuentas, backend obligatorio ni sincronización entre dispositivos.

## Ejecutar

Node **24.x** y npm. Desde esta carpeta:

```sh
npm ci
npm run dev
```

Abrir la URL que muestre Vite (por defecto http://127.0.0.1:3000). Los cambios de desarrollo conservan los datos de ese origen del navegador.

## Verificar y compilar

```sh
npm run typecheck
npm test
npm run content:check
npm run build
npx playwright install chromium firefox webkit
npm run test:e2e
npm run benchmark:catalog
```

Playwright construye y prueba la versión de producción en el puerto 4173; debe estar libre. `npm run preview` permite revisar el resultado de `dist`. La PWA/service worker se prueban en build/preview, no en el servidor de desarrollo.

## Qué incluye

- 120 verbos y 362 ejemplos originales, con fuentes y revisión asistida documentadas. Recomendaciones por curso editables, sin atribuirlas a una lista oficial.
- Biblioteca, búsqueda por formas/significados, filtros, listas y fichas.
- Editor, archivo reversible, importación CSV/JSON con vista previa y decisiones de duplicados, exportación y copia completa restaurable.
- Nueve plantillas, planes configurables, sesiones recuperables y repaso 1/3/7/14 días.
- Flashcards, Emparejar, Quiz, Audio Detective y Completa la frase; práctica escrita dentro del estudio.
- Habilidades separadas, cobertura de formas, sellos/XP, temas y movimiento reducido.

Los avances objetivos se confirman atómicamente con la respuesta. Repetir en el mismo día, usar pistas o autoevaluar no demuestra dominio. Pronunciación aparece sin evaluar.

## Datos y audio

Los datos viven en IndexedDB en **ese navegador y origen**. Exporta una copia JSON completa desde Configuración antes de borrar datos del navegador o cambiar de dispositivo. Restaurar reemplaza la instalación local tras dos confirmaciones; no hay mezcla automática de perfiles. El navegador puede retirar almacenamiento; la PWA no sustituye a una copia externa.

La voz proviene del navegador/sistema. Puede no estar disponible sin conexión o usar un servicio remoto. Existe alternativa visual sin acreditar escucha. No se redistribuyen audios de terceros ni se usa micrófono. `read` aislado se excluye de síntesis evaluable por ambigüedad de pronunciación. IPA solo se muestra en campos contrastados; no se ha inventado para completar fichas.

## Estructura

`src/features` separa catálogo, aprendizaje, preguntas, juegos, progreso, ajustes, audio y persistencia. `src/shared/domain` define tipos y validadores. `src/content` conserva contenido fijo, cobertura y manifiesto editorial; los ejemplos originales del paquete están en `tests/fixtures/original`, separados de producción.

## Documentación

- [Diseño aprobado](docs/superpowers/specs/2026-10-29-verbquest-design.md)
- [Plan](docs/superpowers/plans/2026-10-29-verbquest.md)
- [Reglas de aprendizaje](docs/learning-rules.md)
- [Formatos y copias](docs/data-formats.md)
- [Almacenamiento/offline](docs/offline-and-storage.md)
- [Selección de contenido](docs/content/selection-policy.md) y [revisión](docs/content/review-log.md)
- [Informe de aceptación](docs/acceptance-report.md)
- [Limitaciones](docs/known-limitations.md), [accesibilidad](docs/accessibility-checklist.md) y [capturas](docs/screenshots)

## Publicación

Compilación estática en `dist`, con HTTPS y fallback de rutas SPA a `index.html`. Se requiere revisar proveedor, marca/dominio y condiciones de distribución antes de publicar. Esta ejecución no despliega el producto.
