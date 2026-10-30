# VerbQuest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para ejecución nativa o superpowers:subagent-driven-development si el usuario elige ese método. Ejecutar tarea a tarea; las casillas registran avance, no aprobación implícita.

**Goal:** Entregar una PWA educativa local con catálogo curado, edición, planes adaptativos y cinco juegos, conforme al diseño aprobado.

**Architecture:** Una SPA organizada por funcionalidades, repositorios sobre IndexedDB y motores de aprendizaje/preguntas sin dependencias de React. El intento, sus efectos y el avance de sesión se confirman en una transacción; contenido y reglas tienen versiones independientes. Sin backend ni sincronización inicial.

**Tech Stack:** React + TypeScript + Vite; React Router; Dexie; Ajv2020 + ajv-formats; Papa Parse; Temporal polyfill para calendario zonificado; Vitest + Testing Library + fake-indexeddb; Playwright; vite-plugin-pwa. CSS propio y fuente del sistema.

**Spec:** `docs/superpowers/specs/2026-10-29-verbquest-design.md`, aprobado el 29 de octubre de 2026, y requisitos normativos en `Agent_documentation/VerbQuest_Paquete_Agente_v2/REQUISITOS_FUNCIONALES.md`.

## Global Constraints

- Nombre único VerbQuest; interfaz español y ejemplos inglés.
- Primera versión local, un perfil; no cuentas, sincronización, telemetría remota ni micrófono.
- Catálogo único e IDs estables; fixtures no son catálogo publicado.
- Catálogo publicado: 100–150 verbos; objetivo editorial: 120.
- Seis habilidades independientes; pronunciación sin evaluar en MVP.
- Intervalos iniciales 1, 3, 7 y 14 días; dominio con mínimo cuatro aciertos aptos espaciados y cobertura de formas.
- No más de un avance por habilidad/verbo/día local; ayudas y autoevaluación no demuestran dominio.
- Sesiones de 5/10/15 minutos como meta flexible; máximo 30 nuevos por sesión según esquema original.
- No fabricar ejemplos sin revisión ni presentar recomendaciones por curso como listas oficiales.
- Audio TTS del navegador con alternativa visual; esta alternativa no mejora escucha.
- Desde 360 px; objetivo WCAG 2.2 AA en flujos principales, verificación manual incluida.
- Búsqueda/filtros: referencia inferior a 300 ms con miles de entradas en entorno documentado.
- Persistencia, errores, accesibilidad y pruebas pertenecen a cada entrega.
- No publicar ni desplegar automáticamente como parte de ejecutar este plan.

## Review Focus

1. Fallo/cuota de IndexedDB o doble envío: conservar estado anterior y no anunciar progreso no guardado — tareas 2 y 9.
2. Medianoche y cambio de horario en Europe/Madrid: intervalos de días de calendario, no sumas de 24 horas — tarea 7.
3. Variantes no intercambiables y cobertura incompleta: no aceptar was por were ni dominar go solo con went — tareas 6 y 7.
4. Catálogo editado/archivado con sesión abierta y semilla nueva: preservar evidencia histórica y no sobrescribir cambios locales — tareas 2, 4 y 9.
5. Voz tardía, remota o fallida, y recarga offline: continuar sin otorgar evidencia auditiva falsa — tareas 11 y 13.

---

## Entorno, dependencias y comandos comunes

Carpeta actual: `/Users/pmacia/Desarrollo/node/verb-quest`. Solo existen documentación y los documentos de planificación; no hay Git ni aplicación. Al ejecutar, usar esta carpeta: el usuario no ha solicitado otro worktree. Leer instrucciones locales nuevas si aparecen antes de modificar código. Inicializar Git únicamente al comenzar la implementación y comprobar identidad antes de commits; no modificar configuración global.

Entorno observado: Node 24.12.0 y npm 11.6.2. Usar Node 24 (`.nvmrc`); `engines.node >=24.0.0 <25`. Versiones candidatas consultadas mediante `npm view` el 29/10/2026: react/react-dom 19.3.1, TypeScript 7.0.2, Vite 8.3.5, plugin-react 6.1.2, React Router DOM 7.18.5, Dexie 4.4.7, Ajv 8.20.0, ajv-formats 3.0.1, Papa Parse 5.7.0, Temporal polyfill 0.5.1, Vitest 5.0.5, Testing Library React 16.3.3, fake-indexeddb 6.2.6, Playwright 1.64.1 y vite-plugin-pwa 2.0.0. Los peers consultados de Vitest 5, plugin-react 6 y vite-plugin-pwa 2 admiten Vite 8. Son resultados de registro, no una instalación probada. Confirmar peers y opcionales al ejecutar; fijar versiones compatibles exactas y `package-lock.json`, sin `--force` ni ignorar conflictos. Si una combinación falla, escoger versiones publicadas compatibles sin cambiar arquitectura y registrar el ajuste.

Scripts previstos: `dev` (Vite), `typecheck` (tsc --noEmit con referencias correctas), `test` (vitest run), `test:watch`, `test:e2e` (playwright test), `build` (typecheck + vite build), `preview`, `content:check` (tsx scripts/check-content.ts). Añadir tsx, tipos React/Papa Parse/Node y entorno DOM compatible como herramientas de desarrollo, con versiones exactas resueltas al instalar.

Pruebas colocadas junto al módulo (`*.test.ts` / `*.test.tsx`); E2E en `e2e/`. Los comandos `npm run test -- <archivo>` filtran por archivo. Una verificación pasa con código 0 y sin casos fallidos; un fallo inicial debe ser la ausencia del comportamiento esperado, no un error incidental del entorno. Si una tarea tiene varios comportamientos, repetir el ciclo rojo/verde por bloque, no escribir toda la implementación antes de comprobar.

Commits por tarea tras sus verificaciones, con rutas explícitas; no incluir `.DS_Store`, datos del navegador, secretos, dependencias instaladas ni informes temporales. Los commits son locales; no push/PR/despliegue implícitos.

### Fuentes técnicas comprobadas

- [Guía Vite](https://vite.dev/guide/): requisitos y construcción de SPA.
- [Ajv y versiones de JSON Schema](https://ajv.js.org/json-schema): usar export de draft 2020-12, no el export predeterminado draft-07.
- [Transacciones Dexie](https://dexie.org/docs/Dexie/Dexie.transaction()): resolver solo tras commit; rechazar si falla.
- [SpeechSynthesis.getVoices](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices): enumeración de voces del dispositivo; manejar cambios asíncronos.

## Estructura y contratos compartidos

`src/app/` compone rutas, proveedores, navegación y estilos; `src/shared/domain/` contiene tipos/esquemas; `src/shared/ui/` controles accesibles; `src/shared/time/` reloj/calendario. `src/features/{catalog,verb-detail,study-plans,learning-engine,question-engine,games,progress,gamification,persistence,settings,audio}/` conserva tipos operativos, servicios y UI de su responsabilidad. `src/content/` tiene catálogo, plantillas, fuentes y manifiesto de revisión; los fixtures originales se copian sin alterarlos a `tests/fixtures/original/`. No añadir un estado global duplicado de IndexedDB: suscripciones de repositorio + estado de pantalla.

Contratos que fija la tarea 1 en `src/shared/domain/types.ts` (dividir en archivos vecinos si crece):

- `ProfileId`, `VerbId`, `PlanId`, `SessionId`, `AttemptId`: alias de string; generados mediante UUID salvo IDs editoriales de verbo. `ISOInstant`, `LocalDate` y `TimeZone`: strings validados en bordes.
- `Skill = 'recognition'|'recall'|'listening'|'spelling'|'pronunciation'|'context'`; `EvaluatedSkill = Exclude<Skill,'pronunciation'>`.
- `FormKey = 'base'|'pastSimple'|'pastParticiple'`; `LearningState = 'new'|'learning'|'needs_review'|'consolidating'|'mastered'`.
- `Verb`: modelo original compatible más `contentVersion:string`, `archivedAt:ISOInstant|null`, `editorialStatus:'draft'|'needs_review'|'validated'`. Importación legacy adapta `contentStatus`; no añadir propiedades al JSON original y luego validarlo contra su esquema cerrado.
- `CoverageTarget`: `{id:string; form:FormKey; variantValue:string; contextKey:string|null}`. Variantes intercambiables comparten objetivo por forma; was y were mantienen objetivos distintos. Cada verbo tiene objetivos de cobertura revisados por habilidad/dialecto; guardar esos objetivos en contenido, no inferir semántica de notas libres.
- `Question`: `{id,version,verbId,contentVersion,mode,skill,target,coverageTargetIds,prompt,acceptedAnswers,options,explanation,audioText?,evidenceKind}`. `mode` es uno de los cinco juegos o `written_recall`; `evidenceKind = 'objective'|'self_report'`. Respuesta por objetivo/contexto, nunca todas las variantes del verbo indiscriminadamente.
- `AnswerInput`: `{attemptId,sessionId,questionId,answer:string|string[],selfRating?:'known'|'unsure'|'unknown',hintsUsed:boolean,revealed:boolean,at:ISOInstant}`. El servicio toma habilidad y respuestas válidas de la pregunta persistida, no del cliente.
- `Attempt`: entrada más `profileId,verbId,questionVersion,contentVersion,skill,target,coverageTargetIds,mode,evidenceKind,correct:boolean|null,hasOptions:boolean,isWritten:boolean,assisted:boolean,localDate` y snapshot de pregunta/solución para interpretación histórica.
- `SkillProgress`: `{profileId,verbId,skill,state,stage:0|1|2|3|4,dueDate:LocalDate|null,lastAdvanceDate:LocalDate|null,eligibleDates:LocalDate[],coverage:string[],hasWrittenContextEvidence:boolean,objectiveError:boolean,selfReportReview:boolean,started:boolean}`. `stage=4` puede permanecer consolidating si falta cobertura. Pronunciación se representa aparte como no evaluada.
- `LearningConfig`: `{version,intervalDays:[1,3,7,14],masteryMinAdvances:4,maxAdvancePerDay:1,maxRetryPerQuestion:1}`. Configuración avanzada validada, con valores por defecto aprobados. `Clock = {now():ISOInstant}`.
- `CatalogFilter`: arrays AND entre campos/OR dentro de campo: cursos, frecuencia, estados, relación, familias, terminaciones escritas por forma, terminaciones fonéticas por forma/dialecto, temas, listas. Ausencia de campo no restringe. `CatalogQuery={text,filter,sort,direction}` con sort `alphabetical|frequency|course|mastery|difficulty|review`; progreso y listas corresponden al perfil activo.
- `StudyPlan`: origen discriminado course/saved_list/manual/filter/imported, con su campo requerido; conserva objetivos, minutos 5/10/15, nuevos 0–30, días, modos, orden/dificultad y `selectionPolicy:'resolve_at_start'`. `PlanGoal` usa valores del esquema original. `ResolvedSelection={verbIds,excludedIds,reasons}`.
- `StudySession`: `{id,profileId,planId:null|string,selection,queue:Question[],cursor,attemptIds,retriedQuestionIds,status:'active'|'paused'|'completed',createdAt,completedAt:null|string}`; solo una sesión activa/pausada inicial por perfil. Cada cola contiene snapshots inmutables. Los juegos libres también usan sesión.
- `AppSettings`: volumen 0–1, rate 0.5–2, preferencia UK/US y voiceURI nullable, sonidos, tema light/dark/system, movimiento reducido, minutos, zona horaria persistida, recordatorios false y LearningConfig. Nunca pedir permiso de notificación en MVP.
- `BackupV1`: `{format:'verbquest-backup',schemaVersion:1,exportedAt,profile,settings,baseDatasetVersion,verbs,lists,plans,sessions,attempts,progress,awards,xpLedger}`; sin blobs de audio ni código ejecutable.
- `AppRepositories`: acceso tipado a catálogo/listas/planes/sesiones/intentos/progreso/ajustes/premios con `get`, `list`, `put` y `subscribe(listener):()=>void` según entidad; `runAtomic<T>(work:()=>Promise<T>):Promise<T>` solo para operaciones IndexedDB del mismo ámbito. Servicios de dominio, no componentes, coordinan escrituras cruzadas.

## Hito 1 — Biblioteca persistente

### Tarea 1: Contratos validados y estructura ejecutable

**Files:** crear `package.json`, `package-lock.json`, `.gitignore`, `.nvmrc`, `index.html`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `src/main.tsx`, `src/app/App.tsx`, `src/shared/domain/types.ts`, `src/shared/domain/schemas/{verb,plan,attempt,session,settings,backup}.schema.json`, `src/shared/domain/validation.ts`, `src/shared/domain/validation.test.ts`, `tests/setup.ts`, `tests/fixtures/original/`, `README.md`.

**Interfaces:** produce tipos anteriores y `validate<T>(kind:SchemaKind,input:unknown):ValidationResult<T>`; resultado discriminado `{ok:true,value:T}|{ok:false,issues:ValidationIssue[]}` con `{path,code,message}`; `adaptLegacyVerb(input:unknown):ValidationResult<Verb>`.

- [ ] Crear Git local y configuración mínima de Vite/TypeScript/Vitest, sin scaffolding ajeno a esta aplicación; instalar versiones compatibles y bloquearlas. Copiar fixtures originales y referencia de esquemas manteniendo procedencia. Añadir primer test `rejects_plan_with_missing_source_reference`, `accepts_original_eight_verbs_via_adapter`, `rejects_javascript_url`, `rejects_unknown_backup_version`: esperan issues con ruta, ocho entradas válidas adaptadas, rechazo de protocolo ejecutable y versión desconocida.
- [ ] Ejecutar `npm run test -- src/shared/domain/validation.test.ts`; observar fallo por comportamiento ausente.
- [ ] Implementar tipos y esquemas 2020-12/Ajv2020, ajv-formats y validación semántica. URLs https/http para fuentes; audio https o ruta propia resoluble, nunca javascript/data arbitrario; campos texto se conservan como texto. La app mínima muestra nombre y estado de preparación.
- [ ] Ejecutar test anterior, `npm run typecheck` y `npm run build`; deben pasar. Documentar comandos e identidad de dependencias efectivamente usadas en README.
- [ ] Commit local: `chore: establish typed app and validated domain contracts` con archivos de esta tarea.

### Tarea 2: Repositorios, perfil y arranque con datos versionados

**Files:** crear `src/features/persistence/{db,repositories,bootstrap,migrations,seed-sync}.ts`, `src/features/persistence/persistence.test.ts`, `src/content/fixtures.seed.json`, `src/shared/time/clock.ts`, `src/app/AppProviders.tsx`; modificar `src/main.tsx`.

**Interfaces:** consume Verb/AppRepositories; produce `openAppDatabase(name?:string):Promise<AppRepositories>`, `bootstrap(repos:AppRepositories,seed:Dataset,clock:Clock):Promise<Profile>`, `reconcileSeed(existing:CatalogEntry[],incoming:Dataset):SeedMergeResult`. `CatalogEntry={verb:Verb,baseVersion:string|null,locallyModified:boolean,pendingBase:Verb|null}`; `Dataset={version:string,kind:'fixture'|'curated',verbs:Verb[]}`; `SeedMergeResult={entries:CatalogEntry[],conflicts:VerbId[]}`. `Clock.now` usa UTC; nunca borrar DB para resolver un error de apertura.

- [ ] Escribir tests `bootstrap_twice_does_not_duplicate_profile_or_seed`, `reopen_preserves_lists_and_settings`, `new_seed_keeps_local_edits_as_conflict`, `failed_transaction_keeps_all_tables_unchanged`, `unsupported_migration_does_not_reset_database`; afirmar perfil único, IDs conservados, pendingBase y rollback total.
- [ ] Ejecutar `npm run test -- src/features/persistence/persistence.test.ts` con fake-indexeddb; confirmar rojo del comportamiento.
- [ ] Implementar tablas/indexación por perfil y claves compuestas, migraciones versionadas y semilla inicial de desarrollo con aviso visible. Detectar errores/cuota y exponer reintento/exportación posible, sin prometer guardado. Persistir zona inicial y defaults; almacenamiento no disponible bloquea escritura con explicación, no falsa persistencia en memoria.
- [ ] Verificar tests y `npm run typecheck`; comprobar abrir, recargar y cerrar/reabrir navegador conserva ID del perfil. Registrar procedimiento de migración.
- [ ] Commit: `feat: persist local profile and versioned catalog safely`.

### Tarea 3: Catálogo, listas y ficha utilizables

**Files:** crear `src/app/{router,AppShell}.tsx`, `src/app/styles/{tokens,global}.css`, `src/shared/ui/{Button,Dialog,Field,StatusPanel}.tsx`, `src/features/catalog/{query.ts,query.test.ts,CatalogPage.tsx,FilterPanel.tsx,VerbListEditor.tsx,list-service.ts}`, `src/features/verb-detail/VerbDetailPage.tsx`, `src/features/catalog/catalog-flow.test.tsx`, `e2e/catalog.spec.ts`; modificar App/Providers. Copiar icono/logo SVG del paquete a `public/brand/` con origen documentado.

**Interfaces:** `queryCatalog(verbs:Verb[],query:CatalogQuery,context:CatalogContext):CatalogResult` donde contexto contiene perfil, listas, progreso y fecha; resultado `{items:Verb[],total:number}`. `saveList(repos,profileId,input:{id?:string,name:string,verbIds:VerbId[]}):Promise<VerbList>` y `toggleListVerb(repos,profileId,listId,verbId):Promise<VerbList>`.

- [ ] Escribir tests: buscar went encuentra go; búsqueda española normaliza tildes; filtro past_participle_same AND eso2 más lista devuelve solo intersección; quitar chip recalcula contador; orden review vencidos primero con desempate ID; nota IPA no validada no habilita filtro fonético; guardar lista de cinco mantiene orden sin duplicados tras recarga. E2E a 360 px espera ancho scroll <= viewport, foco visible y enlace directo `/verbs/go` recuperable.
- [ ] Ejecutar `npm run test -- src/features/catalog/query.test.ts src/features/catalog/catalog-flow.test.tsx`; confirmar rojo.
- [ ] Implementar navegación de cinco áreas y rutas completas con estados temporales explícitos en áreas futuras. Construir filtros P0, ordenaciones, listas y ficha de tres formas, variantes, notas, ejemplos revisados/pendientes identificados y seis indicadores. Audio muestra no disponible hasta tarea 11. No afirmar aprendizaje persistido al solo visitar; evento Explorador se conectará en tarea 12.
- [ ] Verificar tests, `npm run test:e2e -- e2e/catalog.spec.ts`, typecheck y build; inspeccionar móvil/escritorio y teclado.
- [ ] Commit: `feat: add searchable verb library lists and details`.

## Hito 2 — Gestión y portabilidad

### Tarea 4: Edición y archivo con integridad de referencias

**Files:** crear `src/features/catalog/{editor-service.ts,editor-service.test.ts,VerbEditorPage.tsx,ArchiveDialog.tsx}`, `e2e/editor.spec.ts`; modificar router, ficha, catálogo y seed-sync.

**Interfaces:** `saveVerb(repos,input:Verb,expectedVersion:string|null):Promise<SaveVerbResult>` con `{status:'saved',verb}|{status:'conflict',current}|{status:'invalid',issues}`; `getArchiveImpact(repos,verbId):Promise<{listIds,planIds,sessionIds}>`; `archiveVerb(repos,verbId,clock):Promise<void>`; `restoreVerb(repos,verbId):Promise<void>`; `resolveSeedConflict(repos,verbId,choice:'keep_local'|'accept_base'):Promise<void>`.

- [ ] Escribir tests: crear aparece en catálogo y plan seleccionable; edición de traducción conserva ID e intentos; duplicado probable genera advertencia explícita; archivar conserva IDs en listas y evidencia; restaurar recupera estado editorial; guardar con versión antigua genera conflicto sin sobrescribir. E2E cancelar formulario conserva anterior y navegar con cambios exige confirmación.
- [ ] Ejecutar `npm run test -- src/features/catalog/editor-service.test.ts`; confirmar rojo.
- [ ] Implementar editor de campos incluidos en FR-EDIT-01 y todos los del esquema, con agrupación avanzada, errores de campo, cancelar, confirmación de salida, archivo/restauración y revisión de conflictos de semilla. No ofrecer control de roles como seguridad real. Archivo debe invalidar selección futura y permitir que tarea 9 depure cola activa.
- [ ] Verificar unitarias/E2E editor, typecheck; inspeccionar diálogo con teclado y retorno del foco.
- [ ] Commit: `feat: edit and archive verbs without losing history`.

### Tarea 5: Importación, exportación y copia restaurable

**Files:** crear `src/features/catalog/transfer/{parse,preview,apply,csv-export}.ts`, `src/features/catalog/transfer/transfer.test.ts`, `src/features/catalog/ImportExportPage.tsx`, `src/features/persistence/{backup.ts,backup.test.ts}`, `e2e/transfer.spec.ts`, `docs/data-formats.md`; modificar router y ajustes cuando exista.

**Interfaces:** `parseCatalogFile(text:string,format:'csv'|'json',mapping?:ColumnMapping):ImportPreview`; `ImportPreview={rows:ImportRow[],issues:ValidationIssue[],conflicts:ImportConflict[]}` con índice de fila desde 1, campo e ID; `previewImport(repos,parsed):Promise<ImportPreview>`; `applyImport(repos,preview,decisions:ImportDecision[]):Promise<ImportReport>`; decisiones por fila skip/update/create, con nuevo ID explícito para create en conflicto. `exportCatalog(verbs:Verb[],format):string`; `exportBackup(repos,profileId,clock):Promise<BackupV1>`; `previewRestore(input:unknown):ValidationResult<BackupV1>`; `restoreBackup(repos,backup:BackupV1,mode:'replace_local_profile'):Promise<void>`.

- [ ] Escribir tests: CSV BOM/Unicode/celdas entrecomilladas con salto de línea conserva texto; was / were del CSV legacy adapta sin convertirlos en respuestas contextuales intercambiables; ID duplicado requiere decisión; sin confirmación no hay writes; fila inválida reporta fila/campo; error a mitad de apply revierte lote; fórmula CSV empieza como texto seguro al abrir en hoja; JSON conserva variantes y procedencia; backup-restauración reproduce perfil/intentos y referencias; versión futura y referencia rota se rechazan sin escritura.
- [ ] Ejecutar tests de transfer y backup; confirmar rojo.
- [ ] Implementar límites: 5 MiB por archivo de catálogo, 10.000 filas, 20.000 caracteres por celda; backup 25 MiB. Rechazo explícito antes de aplicar, nunca truncado. CSV delimitador detectado coma/punto y coma/tab, cabeceras mapeadas; documentar CSV como proyección con pérdidas y JSON como formato completo. No importar esquemas ejecutables. Para backup reemplazo, mostrar recuentos/impacto, exportación previa y doble confirmación; restaurar todas las tablas en una transacción, incluido perfil/zona, sin fusionar historiales distintos.
- [ ] Verificar tests, E2E crear→exportar→reimportar duplicado y restaurar recarga; typecheck/build. Documentar columnas, límites y protección CSV.
- [ ] Commit: `feat: add validated catalog transfer and local backups`.

## Hito 3 — Aprendizaje y progreso

### Tarea 6: Preguntas, respuestas aceptadas y cobertura

**Files:** crear `src/features/question-engine/{types,generate,evaluate,coverage}.ts`, `src/features/question-engine/question-engine.test.ts`, `src/content/question-templates.json`, `tests/fixtures/questions.ts`.

**Interfaces:** consume Question/CoverageTarget; produce `generateQuestions(input:{verbs:Verb[],skills:EvaluatedSkill[],modes:QuestionMode[],dialect:'uk'|'us',allowFixtures:boolean},rng:()=>number):QuestionGenerationResult` con `{questions:Question[],unavailable:UnavailableReason[]}`; `evaluateAnswer(question:Question,input:AnswerInput):AnswerEvaluation` con `{correct:boolean|null,assisted:boolean,evidenceKind,acceptedAnswers:string[]}`; `getCoverageTargets(verb:Verb,skill:EvaluatedSkill,dialect):CoverageTarget[]`.

- [ ] Escribir tests `was_is_not_accepted_for_they_were`, `dialect_variant_accepted_only_when_valid_for_context`, `options_never_contain_unmarked_second_correct_answer`, `recognition_is_not_recall`, `normalizes_case_nfc_outer_spaces_but_not_spelling_errors`, `unreviewed_sentence_not_used_in_production`, `revealed_answer_is_assisted`, `missing_coverage_content_is_reported`. Afirmar que autoevaluación tiene correct=null y una pregunta solo posee una habilidad principal.
- [ ] Ejecutar `npm run test -- src/features/question-engine/question-engine.test.ts`; confirmar rojo.
- [ ] Implementar plantillas versionadas por forma/contexto, cobertura editorial explícita y generación con RNG inyectado. Los distractores no contienen respuestas semánticamente válidas sin marcar. Matching se evalúa por objetivos de cada asociación, sin dar dominio por completar un tablero repetido. Generar preguntas escritas de memoria/escritura, incluyendo sentido→base, base→pasado y base→participio. No aplicar una corrección de ortografía automática. Permitir fixtures solo con bandera de desarrollo visible.
- [ ] Verificar tests, typecheck; verificar snapshots de preguntas mantienen versión y forma objetivo al editar el verbo.
- [ ] Commit: `feat: generate and evaluate skill-specific questions`.

### Tarea 7: Calendario y reglas de progreso aprobadas

**Files:** crear `src/shared/time/{calendar.ts,calendar.test.ts}`, `src/features/learning-engine/{progress,priority,config}.ts`, `src/features/learning-engine/learning-engine.test.ts`, `src/features/progress/{selectors.ts,selectors.test.ts}`.

**Interfaces:** `toLocalDate(at:ISOInstant,zone:TimeZone):LocalDate`; `addCalendarDays(day:LocalDate,count:number):LocalDate`; `applyAttempt(previous:SkillProgress,attempt:Attempt,required:CoverageTarget[],config:LearningConfig):SkillProgress`; `deriveVisibleState(progress:SkillProgress,today:LocalDate):LearningState`; `rankPracticeTargets(input:PracticeTarget[],today:LocalDate):PracticeTarget[]` donde target contiene verbo/habilidad/dueDate/error/debilidad/new; `summarizeVerb(progress:SkillProgress[],today):VerbProgressSummary` con número dominado/5 y pronunciación no evaluada.

- [ ] Escribir tests con fechas explícitas: aciertos de go el 29/10, 30/10, 02/11 y 09/11 programan 30/10, 02/11, 09/11 y 23/11 respectivamente; la cobertura base/pasado/participio y al menos cuatro avances alcanza dominio; cuatro went no. Segundo acierto mismo día y práctica anticipada no avanzan ni posponen. Error reinicia etapa/cobertura y programa mañana. was y were requieren evidencias separadas; variantes UK/US intercambiables comparten objetivo. Contexto necesita evidencia escrita. Opciones admitidas en listening/recognition, nunca para dominar recall/spelling. Flashcards conocidas no consolidan; dudé prioriza sin reset objetivo. Fallo en mismo día puede reducir estado tras acierto. Vencimiento cambia presentación a needs_review sin borrar historial/logros. Perfil B no hereda progreso de A.
- [ ] Añadir test calendario: 24/10/2026 + 1 día = 25/10 y + 2 = 26/10 en Europe/Madrid; dos instantes del cambio estacional que caen en la misma fecha no cuentan como dos días; un instante próximo a medianoche usa fecha del perfil. Cubrir avance tras stage4 mantiene 14 días y falta de cobertura permanece consolidating.
- [ ] Ejecutar tests learning-engine/calendar/selectors; confirmar rojo.
- [ ] Implementar reglas exactamente como diseño §7. Contabilizar cobertura solo de aciertos aptos que avanzan y a partir de contenido validado; al no avanzar no llenar cobertura por repetición intensiva. Para planes con datos fixture, calcular progreso de desarrollo pero identificarlo y no mezclar automáticamente con perfil publicado. Al llegar a stage4 sin cobertura, futuros repasos aptos mantienen 14 días y completan cobertura pendiente. No cambiar zona automáticamente al viajar; ajuste explícito recalcula presentación desde instantes y conserva evidencia histórica con su fecha original.
- [ ] Verificar tests, typecheck y tabla manual de cuatro fechas. Documentar regla y parámetros en `docs/learning-rules.md`.
- [ ] Commit: `feat: implement spaced skill progress with form coverage`.

### Tarea 8: Planes y selección de sesiones

**Files:** crear `src/features/study-plans/{plan-service.ts,plan-service.test.ts,PlansPage.tsx,PlanEditorPage.tsx}`, `src/features/learning-engine/{build-session.ts,build-session.test.ts}`, `src/content/plan-templates.json`; modificar router.

**Interfaces:** `resolvePlanSelection(plan:StudyPlan,context:SelectionContext):ResolvedSelection`; `validatePlanCompatibility(plan:StudyPlan,available:QuestionGenerationResult):ValidationIssue[]`; `buildSession(input:{profileId,plan,selection,questions,progress,today},clock:Clock,rng:()=>number):StudySession`; `savePlan(repos,plan:StudyPlan):Promise<void>`. SelectionContext contiene catálogo, listas y progreso, no UI.

- [ ] Escribir tests de nueve plantillas presentes y editables; cada origen exige campo correspondiente; archivados excluidos con razón; conjunto vacío impide inicio; vencidos→errores→débiles→nuevos con desempate estable; límite de nuevos 0 respeta solo repaso; todos los juegos toman la misma lista de cinco; plan spelling sin modo escrito es incompatible; falta de audio no fabrica cobertura listening. Dos sesiones resuelven filtros con catálogo actual, pero la cola iniciada no cambia por una edición posterior.
- [ ] Ejecutar tests plan-service y build-session; confirmar rojo.
- [ ] Implementar plantillas cero, eso1/2/3/4, examen/lista, audio, patrones y difíciles. Orígenes course/filter/list/manual/imported; importado es selección validada del flujo de catálogo, no parser duplicado. Builder permite metas, 5/10/15, nuevos 0–30, días, modalidades y orden/dificultad. Recordatorios visibles como no disponibles/desactivados. Sesión guiada mezcla formatos aptos y prioriza cobertura pendiente; mostrar explicación de selección. Duración es estimación y permite terminar al acabar la pregunta, nunca corte forzado.
- [ ] Verificar tests, typecheck y E2E `e2e/plans.spec.ts`: lista→plan→selección idéntica, editar plantilla sin mutar original.
- [ ] Commit: `feat: configure study plans and adaptive session queues`.

### Tarea 9: Intentos atómicos y sesiones recuperables

**Files:** crear `src/features/learning-engine/{session-service.ts,session-service.test.ts}`, `src/features/games/{StudyPage.tsx,SessionShell.tsx}`, `src/features/progress/ProgressPage.tsx`, `e2e/session.spec.ts`; modificar archivo de verbos y rutas.

**Interfaces:** `startSession(repos,input:SessionRequest,clock,rng):Promise<StudySession>`; SessionRequest discrimina `{kind:'plan',planId}` / `{kind:'free',verbIds,modes,skills}`. `submitAnswer(repos,input:AnswerInput,clock):Promise<SubmissionResult>` con `{attempt,progress,session,alreadyApplied:boolean,feedback}`; `pauseSession(repos,sessionId):Promise<void>`; `resumeSession(repos,profileId):Promise<StudySession|null>`; `completeSession(repos,sessionId,clock):Promise<SessionSummary>`; `pruneArchivedQuestions(session:StudySession,archived:VerbId[]):StudySession`.

- [ ] Escribir tests doble envío mismo attemptId no duplica intento/avance; segundo attemptId para pregunta ya confirmada tampoco; fallo transaccional no mueve cursor ni progreso; recarga retoma pregunta pendiente; edición preserva snapshot histórico; archivo salta preguntas pendientes sin borrar respondidas; mismo perfil con segunda pestaña observa commit y no envía sobre cursor antiguo; error se reinserta una sola vez; pausa conserva todo; finalizar dos veces es idempotente. Afirmar snapshot usado para evaluación, no acceptedAnswers enviado por UI.
- [ ] Ejecutar `npm run test -- src/features/learning-engine/session-service.test.ts`; confirmar rojo.
- [ ] Implementar coordinador transaccional con restricción única perfil/sesión/posición de cola y attemptId. El retry es otra posición/ID de pregunta derivada del original; conserva referencia original para límite. Calcular efectos dentro de la transacción con estado actual y sin await de red/voz. Los fallos dejan respuesta editable y ofrecen reintento con mismo ID. Reconectar tras recarga y depurar archivo antes de presentar siguiente pregunta. Progreso muestra por habilidad/forma, vencimiento, sin mezclar perfiles.
- [ ] Verificar unitarias, `npm run test:e2e -- e2e/session.spec.ts` con recarga y doble click, typecheck/build. La sesión termina y ofrece resumen aunque haya fallos.
- [ ] Commit: `feat: save answers and session progress atomically`.

### Tarea 10: Flashcards, Emparejar y Quiz

**Files:** crear `src/features/games/{GamesPage,FlashcardsGame,MatchingGame,QuizGame,WrittenRecallExercise}.tsx`, `src/features/games/games.test.tsx`, `e2e/games.spec.ts`; modificar SessionShell/StudyPage.

**Interfaces:** `GameProps={question:Question,onSubmit:(input:GameResponse)=>Promise<void>,disabled:boolean}`; `GameResponse=Pick<AnswerInput,'answer'|'selfRating'|'hintsUsed'|'revealed'>`. SessionShell asigna attemptId/sessionId/fecha; los componentes no escriben repositorios ni calculan dominio.

- [ ] Escribir tests revelar Flashcard y autoevaluar conserva self_report; quiz muestra feedback/explicación y no incrementa spelling; matching permite selección con teclado sin depender de arrastrar ni emparejar por posición; respuesta de memoria no presenta opciones; envío mientras pendiente queda deshabilitado; error de almacenamiento permite reintento; cada juego respeta misma lista activa. E2E recorre catálogo→lista→cada modo→progreso.
- [ ] Ejecutar `npm run test -- src/features/games/games.test.tsx`; confirmar rojo.
- [ ] Implementar tres juegos y ejercicio escrito integrado en estudio. Matching mezcla mediante RNG y evita mostrar juntas las respuestas asociadas; alternativas indistinguibles se agrupan sin castigar una asociación válida. Flashcards ofrecen Lo sabía/Dudé/No lo sabía después de revelar. La navegación no desecha sesión sin avisar y pausar guarda posición. Feedback no revela respuesta siguiente ni usa solo color.
- [ ] Verificar tests y E2E games, teclado y viewport 360 con teclado móvil mediante comprobación manual; typecheck/build.
- [ ] Commit: `feat: add recall cards matching and quiz practice`.

## Hito 4 — Audio y contexto

### Tarea 11: Voz, Audio Detective y Completa la frase

**Files:** crear `src/features/audio/{speech-service.ts,speech-service.test.ts,AudioControls.tsx}`, `src/features/games/{AudioDetectiveGame,SentenceGapGame}.tsx`, `src/features/games/audio-context.test.tsx`, `e2e/audio-context.spec.ts`; modificar ficha, shell y selector de preguntas.

**Interfaces:** `SpeechPort` inyectable encapsula APIs del navegador; `createSpeechService(port:SpeechPort):SpeechService` con `listVoices():VoiceInfo[]`, `subscribeVoices(fn):()=>void`, `play(request:SpeechRequest):Promise<SpeechResult>`, `pause()`, `resume()`, `cancel()`; `VoiceInfo={uri,lang,name,localService}`; resultado `played|unavailable|failed|cancelled` con voz/dialecto real y aviso de fallback. `SpeechRequest={text,voiceURI,preferredDialect,volume,rate}`. `makeVisualFallback(question:Question):Question` produce ID nuevo, versión y habilidad real no auditiva.

- [ ] Escribir tests voces inicialmente vacías luego voiceschanged; voz UK ausente no se sustituye silenciosamente por US; error/no API ofrece alternativa; cancelar al navegar impide premio Oído atento; revelar marca assisted; una voz remota se identifica sin garantizar offline; alternativa no actualiza listening; frase requiere went y rechaza gone según contexto; pistas no consolidan; ausencia de frase revisada muestra estado vacío útil.
- [ ] Ejecutar tests speech-service y audio-context; confirmar rojo.
- [ ] Implementar controles por forma/variante y ejemplo disponible, reproducir/pausar/repetir/volumen/velocidad soportada y elección de voz. Resolver éxito solo al evento de reproducción completada; tolerar navegación y timeout de 15 s sin inicio con error recuperable. No usar texto visible de audio como pista inadvertida antes de respuesta. Audio Detective con seleccionar o escribir; modo escrito sigue siendo listening, no mejora spelling de forma automática. Completa la frase con selección y escritura; conservar evidence de cada uno.
- [ ] Verificar pruebas con SpeechPort falso en CI y prueba manual de voz real al menos en navegador disponible; documentar resultados del dispositivo sin generalizarlos. E2E ausencia/fallo/alternativa, typecheck/build.
- [ ] Commit: `feat: add browser speech listening and context practice`.

## Hito 5 — Integración del MVP

### Tarea 12: Inicio, recompensas y ajustes completos

**Files:** crear `src/features/gamification/{awards.ts,xp.ts,gamification.test.ts,SessionSummaryPage.tsx}`, `src/features/settings/{settings-service.ts,SettingsPage.tsx,settings.test.ts}`, `src/app/HomePage.tsx`, `e2e/settings-progress.spec.ts`; modificar session-service, ficha y ProgressPage.

**Interfaces:** `computeAwards(input:{previous:SkillProgress[],next:SkillProgress[],activity:ActivityEvent[],existing:UserAchievement[]}):UserAchievement[]`; `ActivityEvent` discrimina ficha abierta/audio completado con perfil/verbo/forma/fecha; `computeXp(input:{attempt:Attempt,session:StudySession,ledger:XpEntry[]}):XpEntry[]`; `finishSessionXp(session,ledger):XpEntry|null`; `updateSettings(repos,profileId,patch:Partial<AppSettings>):Promise<AppSettings>`; `resetProgress(repos,profileId):Promise<void>`; `deleteAllLocalData(repos):Promise<void>`.

- [ ] Escribir tests abrir ficha solo concede Explorador una vez; audio fallido no concede escucha; dominio concede sello correspondiente; repaso vencido no borra sello; acierto objetivo 10 XP, asistido 5, reveal/self-report 0; deduplicación por perfil/verbo/forma/habilidad/sesión y attemptId; bono 20 solo con respuesta objetiva y una vez; nivel 1+floor(XP/100). Ajustes persisten y afectan voz, tema, movimiento/sonido; reset exige dos pasos UI y conserva catálogo/listas; borrar todo tiene explicación distinta y no se ejecuta al cancelar.
- [ ] Ejecutar tests gamification/settings; confirmar rojo.
- [ ] Implementar XP/premios dentro de la misma transacción de respuesta; eventos de actividad idempotentes aparte. Inicio muestra motivo, continuar y misión corta; resumen de sesión habilidades/logros/repasos con opción detenerse o continuar. Ajustes de volumen, velocidad, voz/dialecto, duración, tema, sonido y movimiento; notificaciones desactivadas sin prompt. Conectar backup/restauración y doble confirmación de reset. Reset elimina intentos, sesiones, progreso, XP y premios de ese perfil; conserva contenido, listas, planes y preferencias. Borrado completo recrea instalación solo tras confirmación final.
- [ ] Verificar unitarias, E2E ajustes/progreso, typecheck/build; inspección visual móvil/escritorio claro/oscuro y reducción de movimiento.
- [ ] Commit: `feat: complete home rewards progress and preferences`.

### Tarea 13: PWA, actualización segura y accesibilidad

**Files:** crear `src/app/{pwa.ts,UpdateNotice.tsx}`, `public/manifest.webmanifest`, `public/icons/{icon-192.png,icon-512.png,maskable-512.png}`, `e2e/{offline,accessibility}.spec.ts`, `docs/{offline-and-storage,accessibility-checklist}.md`; modificar vite config, estilos y componentes que fallen QA.

**Interfaces:** `registerAppUpdates(input:{hasActiveSession:()=>Promise<boolean>,onUpdateReady:()=>void}):()=>void`; `activateUpdate():Promise<void>` solo tras guardar/pausar sesión y acción explícita, con migración probada por bootstrap. SVG existente es fuente para iconos; no generar marca alternativa.

- [ ] Escribir E2E sobre build/preview: primera carga completa→offline→recarga de `/verbs/go` y sesión textual funciona; edición/progreso persisten; sin voz offline muestra alternativa; actualización disponible no recarga sesión activa; ruta inexistente ofrece salida; foco de modales vuelve al disparador, navegación y matching funcionan por teclado, contraste y 360 px sin desbordamiento. Añadir comprobación automatizada de accesibilidad con axe mediante dependencia de desarrollo fijada.
- [ ] Ejecutar E2E offline antes de service worker: esperar fallo específico de recarga offline.
- [ ] Configurar precache de shell, todos los chunks de rutas, catálogo, plantillas y recursos propios; navegación fallback SPA. No cachear datos privados en una caché remota ni recursos arbitrarios del importador. Registro tipo prompt, nunca recarga forzada en sesión. Incluir manifest/iconos y limpiar solo caches antiguas propias. Pedir persistencia de almacenamiento solo con explicación/acción útil si se añade; no prometer que el navegador no borrará datos.
- [ ] Ejecutar `npm run test:e2e -- e2e/offline.spec.ts e2e/accessibility.spec.ts`, unitarias relevantes y build. Completar checklist manual de lector de pantalla, teclado, zoom 200%, temas, reducción de movimiento y controles de audio; registrar navegador/dispositivo, hallazgos y correcciones. PWA instalable en navegadores compatibles no equivale a soporte uniforme de voces.
- [ ] Commit: `feat: support offline study and accessible PWA updates`.

## Hito 6 — Contenido y aceptación de entrega

### Tarea 14: Catálogo curado y plantillas por curso

**Files:** crear `src/content/{verbs.curated.json,coverage-targets.json,review-manifest.json,sources.json}`, `scripts/check-content.ts`, `src/content/content.test.ts`, `docs/content/{selection-policy,review-log,licenses}.md`; modificar plantillas, bootstrap y manifiesto activo.

**Interfaces:** `checkContent(dataset:Dataset,coverage:CoverageCatalog,manifest:ReviewManifest):ContentReport` en `scripts/lib/content-audit.ts`; `ContentReport={publishable:boolean,errors:ContentIssue[],warnings:ContentIssue[],counts}`. CoverageCatalog indexa verbo/habilidad/dialecto; ReviewManifest registra cada campo/recurso revisado, fuente, fecha, método y responsable real, sin atribuir revisión humana inexistente. `content:check` devuelve código distinto de 0 si publishable=false.

- [ ] Iniciar esta tarea editorial durante el hito 1: seleccionar 120 candidatos y registrar criterio por verbo; preparar lotes de 20 con formas, significados, variantes, objetivos y tres ejemplos cuando apliquen. No detener el catálogo hasta después de la app. Referencia curricular nacional, selecciones recomendadas acumulativas configurables por curso; contrastar formas/IPA con fuentes primarias identificadas y documentar condiciones de uso. Los ejemplos serán originales, apropiados a ESO y comprobados individualmente.
- [ ] Escribir tests/auditor: entre 100 y 150 IDs únicos; fixtures conservados aparte; objetivo 120; fuentes/revisión por entrada; ningún campo pendiente se presenta como validado; cada verbo publicado tiene cobertura y ejemplos suficientes para las habilidades ofertadas; contexto was/were no ambiguo; tres formas requeridas; listas de curso solo referencian verbos presentes; distribución no se etiqueta oficial. IPA faltante no se inventa ni bloquea todo el verbo si las actividades no dependen de ella; marca capacidad reducida explícita.
- [ ] Ejecutar `npm run test -- src/content/content.test.ts` y `npm run content:check` contra conjunto incompleto; esperar errores de cobertura/revisión concretos.
- [ ] Completar lotes, revisar cada uno contra fuentes, registrar limitaciones y resolver errores; incorporar cobertura por forma/variante y banco de preguntas revisadas en coherencia con tarea 6. Selección por curso inicial propuesta: 40 esenciales en eso1, 70 acumulados eso2, 100 eso3 y 120 eso4, editable y sin afirmar equivalencia curricular oficial. Verificar que cada nuevo lote puede jugarse en los cinco modos cuando sus recursos estén disponibles. Promover fixture→curated mediante selector de conjunto separado: ofrecer empezar perfil de estudio limpio o conservar demostración identificada, sin acreditar intentos de fixtures como revisión de contenido nuevo.
- [ ] Verificar content:test y content:check con publishable=true, pruebas de preguntas y filtros, y revisión documentada del contenido. Si no se puede validar una fuente/dato, mantenerlo pendiente, no afirmar entrega publicada completa y resolver antes de cerrar el MVP. Registrar procedencia/licencia incluso para imágenes SVG del paquete y tipografía del sistema.
- [ ] Commit: `content: publish reviewed ESO verb catalog and course selections`.

### Tarea 15: Aceptación completa y documentación reproducible

**Files:** crear `e2e/acceptance.spec.ts`, `scripts/benchmark-catalog.ts`, `docs/{acceptance-report,known-limitations,dependency-licenses}.md`, `docs/screenshots/{home,catalog,verb,study,games,progress,editor}.png`; actualizar README y checklist del plan. Añadir script `benchmark:catalog`.

**Interfaces:** no crear API nueva; consume todos los contratos anteriores. `benchmark:catalog` prepara 10.000 verbos sintéticos explícitamente de prueba y mide búsqueda/filtros sin incluir preparación; 20 ejecuciones tras calentamiento, informar mediana/p95, equipo/runtime y consultas, objetivo p95 <300 ms. No introducir benchmark como prueba temporal inestable de CI.

- [ ] Codificar los doce escenarios normativos en acceptance.spec.ts con fixtures revisados y reloj controlado: went→go; filtro relación+eso2; lista de cinco en Flashcards/Audio; escucha solo actualiza su habilidad; fallo participio refuerzo; sesiones separadas consolidan; CRUD/export/import duplicado; archivo conserva historial; recarga; 360 px/teclado; falta de audio; ajustes. Afirmar cobertura incompleta tras cuatro went y dominio solo con forma/variante requerida además del espaciado. Casos ya cubiertos pueden importarse como helpers, sin duplicar implementación.
- [ ] Ejecutar `npm run test:e2e -- e2e/acceptance.spec.ts`; corregir contra diseño si falla y repetir solo suites afectadas hasta verde. Usar Chromium, Firefox y WebKit en automatización cuando disponibles; TTS real siempre manual. Documentar cualquier motor no probado sin decir que pasó.
- [ ] Ejecutar cierre una vez: `npm run typecheck`, `npm run test`, `npm run content:check`, `npm run build`, `npm run test:e2e`, `npm run benchmark:catalog`. Registrar resultados reales, no comandos previstos como evidencia de éxito. Repetir solo ante cambios/fallos/incertidumbre nueva.
- [ ] Capturar pantallas reales y revisar visualmente todos los estados principales en móvil/escritorio. README: Node/npm, npm ci, dev, pruebas, build/preview, HTTPS/rutas SPA, almacenamiento, backup, voces y límites offline. Registro de licencias completo con versiones de lockfile; lista honesta de revisión humana no realizada y capacidades P1/P2 excluidas. No presentar voz sintética como grabación humana ni contenido editorial como currículo oficial.
- [ ] Commit: `docs: verify MVP acceptance and document operation` y presentar aplicación local ejecutable, evidencias y limitaciones al usuario. La selección de proveedor/publicación es una acción posterior, no desplegar en esta tarea.

## Mapa de cobertura y dependencias

| Fuente normativa | Tareas responsables |
|---|---|
| FR-CAT-01–05/07; FR-FIC-01/03/04/06/07 | 1–3, 6–9, 14 |
| FR-CAT-02 catálogo curado | 14 (preparación desde hito 1) |
| FR-FIC-02; FR-GAME-03/06 | 6, 11, 14 |
| FR-PLAN-01–04 | 7–9, 14 |
| FR-GAME-01/02/04/10 | 6, 9–10 |
| FR-GAM-01/02/06 | 9, 12–13 |
| FR-EDIT-01–06 | 1–2, 4–5 |
| FR-SET-01/02/05 | 2, 5, 12 |
| RNF-01/02/03/05/06/07/09/10/12 | 1–10, 15 |
| RNF-04/08/11 | 3, 11, 13–15 |
| §14 doce escenarios; §15 entregables | 15 y pruebas de cada tarea |

P1/P2 explícitamente fuera del MVP permanecen fuera; no omitir sus consecuencias P0 (responsive, guardar sesión, distinguir actividad/dominio, ajuste de notificaciones desactivado). La recomendación legible es parte de la selección aprobada aunque FR-PLAN-05 sea P1; no implica un panel explicativo avanzado.

Dependencias: 1→2→3→4→5; 6 usa 1–2; 7 usa 1/6; 8 usa 3/6/7; 9 usa 2/4/6/7/8; 10 usa 9; 11 usa 6/9/10; 12 usa 5/7/9/11; 13 usa 3/9/11/12; 14 comienza editorialmente tras 1 y se integra con 6/8/11; 15 requiere todas. Mantener una sola línea de ejecución hasta elección de método; no delegar en paralelo cambios sobre archivos compartidos.

## Revisión del plan y método

Autorrevisión realizada contra diseño: todos los P0 tienen tarea; las cinco condiciones de Review Focus tienen pruebas; firmas y nombres compartidos se fijan arriba. Contratos de tipos son decisiones del plan, no código de producto generado.

Método propuesto: **nativo**, implementando tareas aquí y revisión independiente final; comparte muchos contratos y evita contextos nuevos por cada tarea. Alternativa: **subagentes**, con implementador/revisor por tarea, más comprobaciones independientes y mayor coste de coordinación. El usuario aprobó continuar con el plan y su ejecución en esta conversación. Se utilizó el método nativo y una revisión independiente final.


## Cierre de ejecución · 30/10/2026

Tareas 1–15 implementadas y verificadas. La evidencia final, las seis correcciones de revisión, las decisiones de ejecución y las limitaciones están en [el informe de aceptación](../../acceptance-report.md). Los checklists originales anteriores se conservan como especificación histórica; este cierre registra el resultado efectivo.

Resultado: 86 pruebas unitarias/integración y 66 E2E pasan, catálogo de 120 verbos/362 ejemplos, compilación y comprobación editorial correctas. Las verificaciones humanas pendientes son revisión docente independiente, lector de pantalla/teclado virtual físico y validación auditiva con una voz real disponible. No se afirma certificación docente/AA ni despliegue. Los avisos bajos de herramientas y la demora no reproducida de Firefox se documentan sin atribuir una corrección no demostrada.
