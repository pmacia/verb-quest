# Interpretación del dictado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Interpretar respuestas habladas de principiantes sin falsas aceptaciones automáticas.
**Architecture:** Intérprete puro con segmentación acotada y sugerencias; hook mantiene confirmación efímera; UI integrada reutiliza estilos.
**Tech Stack:** TypeScript, React, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-11-22-review-speech-design.md

## Global Constraints
Sin dependencias ni cambios de captura. Teclado estricto. Dudas requieren confirmación asistida.

## Review Focus
Palabras adicionales no se ignoran; alternativas secundarias no autoaprueban; campos escritos no reciben equivalencias de voz; descarte/edición invalidan propuestas; variantes y orden se mantienen.

### Task 1: Intérprete y confirmación
- [x] Añadir pruebas rojas para b/been, being, a woke, alternativas, orden, texto sobrante y escritura.
- [x] Crear speech-interpretation.ts y ampliar resolveReviewSpeech; mantener evaluateReview estricto salvo equivalencias seguras.
- [x] Hook recalcula propuesta al comprobar, conserva borrador y ofrece confirmar asistido o evaluar original.
- [x] UI muestra confirmación accesible integrada y sugerencias de alternativa.
- [x] Verificar pruebas unitarias, E2E de confirmación/edición y build.
- [x] Revisión independiente y corregir hallazgos.

## Verificación
223 pruebas unitarias correctas. Suite de repaso: 48 casos correctos y 3 casos de confirmación corregidos y repetidos con éxito en Chromium/Firefox/WebKit (51 en total). Build/typecheck PWA correcto durante Playwright. Accesibilidad del panel comprobada en claro y oscuro; se desactivan transiciones en esa prueba para no medir colores intermedios al cambiar el tema. Captura real con acento hispano e iPhone pendiente de pruebas del usuario.

Revisión independiente: corregidos foco/scroll de confirmación y filtro de vocabulario para no sugerir bought por brought sin una alternativa real. No se introducen cambios en permisos ni captura.
