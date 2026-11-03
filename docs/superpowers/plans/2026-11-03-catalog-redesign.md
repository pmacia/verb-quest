# Catálogo y ficha renovados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar la GUI de la referencia sin regresiones, con traducciones por forma y acceso rápido al tema.

**Architecture:** Mantener consultas, filtros, servicios y almacenamiento actuales. Compartir etiquetas y presentación de formas entre catálogo y ficha, centralizando todo el audio en un controlador que permita forma/variante/dialecto y secuencias. Añadir traducción opcional a cada forma para compatibilidad con contenido antiguo.

**Tech Stack:** React/TypeScript, CSS propio, Dexie, Vitest y Playwright existentes; sin dependencias nuevas.

**Spec:** docs/design/2026-11-03-catalog-reference-analysis.md; el usuario aprobó traducción general arriba, específica por forma y pidió implementación.

## Global Constraints

- IPA siempre visible; fuentes y calidad ocultas por defecto según las preferencias actuales.
- Preservar read /riːd/, /red/, /red/, variantes completas, historial y modificaciones locales.
- Tokens e iconos SVG del proyecto; no copiar el CSS de referencia ni introducir fuentes remotas.
- Alcance GUI de catálogo/ficha más selector global de tema; reglas de aprendizaje intactas.

## Review Focus

- Variantes was/were y got/gotten: todas visibles y audio correcto por forma/dialecto.
- Un botón UK/US no debe conservar una voz fijada de otro dialecto sin aviso.
- Traducciones nuevas no deben sobrescribir fichas locales ni reiniciar progreso.
- Cambiar vista debe conservar filtros y selección; archivado/restauración siguen reversibles.
- Tema Sistema, teclado, móvil y contraste oscuro deben funcionar sin estado de tema paralelo.

## Task 1 — Contenido compatible

**Files:** domain types/schema, content/form-translations.json y dataset, editor, pruebas.
**Interface:** translation?: string en formas base/variantes; applyFormTranslations conserva los datos y solo enlaza por id/forma/valor exactos.
- [ ] RED: traducciones de go/read/be/get, 120 verbos completos, validación, identidad de aprendizaje y compatibilidad de fichas antiguas.
- [ ] GREEN: catálogo curated-1.3 y traducciones revisadas de las formas existentes, editor e importación JSON compatibles.
- [ ] Verificar unidad/contenido y registrar resultado.

## Task 2 — Audio y componentes compartidos

**Files:** audio service/player, use-catalog-audio, VerbBadges, VerbForms, CSS de componente.
**Interfaces:** reproducción de verbo o segmento con dialecto explícito, un único estado/cancelación; VerbForms recibe verbo, densidad y acción de reproducción.
- [ ] RED: read aislado por forma, variantes completas, voz incompatible con dialecto explícito y cancelación secuencia→individual.
- [ ] GREEN: compartir controlador, renderizado por variante, etiquetas españolas con datos reales.
- [ ] Verificar contratos y registrar resultado.

## Task 3 — GUI de catálogo y ficha

**Files:** CatalogPage, FamilyFilter, VerbDetailPage y estilos de catálogo/ficha.
- [ ] RED: vistas detallada/compacta, selección conservada, todas las formas/IPA/audio, traducciones y etiquetas en ficha.
- [ ] GREEN: cabecera, buscador, chips de filtros, tarjetas/filas, selección y edición; mantener sonido final y todos los filtros actuales.
- [ ] GREEN: ficha con significado general, etiquetas, traducciones específicas, IPA y UK/US; ejemplos y bloques existentes conservados.
- [ ] Verificar E2E pertinente, móvil/teclado y registrar resultado.

## Task 4 — Tema, revisión y cierre

**Files:** AppShell, Icon, estilos, README, pruebas tema.
- [ ] RED: botón rápido persiste tema y respeta tema efectivo Sistema.
- [ ] GREEN: usar servicio de ajustes sin duplicar control del DOM; errores visibles.
- [ ] Ejecutar tipos, unidad, contenido/IPA, E2E, HMR y revisión independiente final.
- [ ] Corregir hallazgos importantes con regresiones, actualizar README y publicar los commits autorizados.

## Ledger

Ruling: se reutiliza el checkout actual — el usuario revisa un servidor ya abierto y la instrucción del entorno prefiere conservar el checkout — coste: no hay aislamiento adicional de archivos.
Ruling: ejecución inline autorizada por «vamos con la implementación» sobre la propuesta acordada; no se vuelve a pedir aprobación de la planificación operativa.
