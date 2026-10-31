# Family Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Relacionar el filtro general de formas con selección múltiple detallada de familias.
**Architecture:** Componente dedicado con selector de ámbito y casillas; funciones puras calculan familias efectivas y restringen candidatos antes del motor existente. Estado local null=todas, []=ninguna; no cambia el esquema persistido.
**Tech Stack:** React, TypeScript, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-10-31-family-filter-design.md

## Global Constraints
- Sin dependencias ni cambios en datos o consultas persistidas.
- Mantener búsqueda, otros filtros, edición y archivados.
- Controles accesibles con teclado, estado mixto y diseño móvil.

## Review Focus
- Familias compartidas entre relaciones: usar relación del verbo.
- Etiquetas generales solapadas: preferir familia detallada sin perder verbos personalizados.
- Cero seleccionadas: cero resultados, no quitar el filtro.
- Reinicio desde chips y limpiar búsqueda: coherencia y conservar otros filtros al limpiar solo familias.
- Archivo/importación: opciones desde el catálogo relevante, sin depender de búsqueda/otros filtros.

## Tarea 1
- [x] Pruebas RED→GREEN de clasificación, familia vacía, ninguna y compatibilidad con consultas.
- [x] Crear family-filter.ts y FamilyFilter.tsx. Integrar en CatalogPage, estilos y chips.
- [x] E2E RED→GREEN de selección general/parcial, combinación y reinicio; adaptar prueba de enriquecimiento.
- [x] Suite, tipos/build, revisión independiente y comprobación visual; README, cierre y commit.

## Cierre · 31/10/2026

Implementación inline, checkout existente limpio, sin dependencias ni cambios de esquema. RED→GREEN: cuatro pruebas de funciones y un nuevo recorrido E2E (tres motores); adaptado el recorrido de enriquecimiento. Selección local null/todas y []/ninguna permite conservar la semántica de consultas guardadas. Se usan relaciones editoriales reales y familias detalladas con alternativa para datos antiguos/personalizados. Familias compartidas no se asignan por prefijos.

Verificación: 107 pruebas unitarias/integración; 87 E2E correctas en Chromium, Firefox y WebKit; comprobación de contenido sin errores; tipos y compilación correctos. Accesibilidad automatizada con selección parcial y vista de 360 px; inspección visual a 360 y 1440 px. Revisión independiente del cambio completo sin defectos importantes ni menores señalados. README actualizado. La selección se conserva al cerrar el panel y se reinicia al salir de biblioteca, como los demás filtros de esta pantalla.
