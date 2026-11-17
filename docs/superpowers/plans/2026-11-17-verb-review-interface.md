# Verb review interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrar la interfaz de reto de voz aprobada sin cambiar la evaluación.
**Architecture:** VerbReviewGame contiene pregunta, respuestas y dock; SessionShell conserva sesión y feedback, con variantes visuales solo para repaso. useReviewInput añade restauración del último dictado.
**Tech Stack:** React, TypeScript, CSS, Vitest, Playwright.
**Spec:** docs/superpowers/specs/2026-11-17-verb-review-interface-design.md

## Global Constraints
- Sin dependencias nuevas ni cambios en la evaluación o persistencia.
- Mantener comprobación automática/manual, teclado y dialectos.
- Estilos limitados al repaso; foco visible y movimiento reducido.

## Review Focus
- Soltar el micrófono antes del permiso: conservar la parada diferida existente.
- Descartar un dictado no borra lo escrito antes ni registra un fallo.
- Teclado móvil no queda cubierto por controles flotantes.
- Micrófono denegado o ausente mantiene comprobar y escribir disponibles.
- Sesiones de otros juegos conservan presentación y comportamiento.

### Task 1: Interfaz y controles
**Files:** src/features/games/VerbReviewGame.tsx, use-review-input.ts, verb-review.css, SessionShell.tsx; e2e/verb-review.spec.ts.
**Interfaces:** Consume GameProps y reconocimiento existentes; produce discard() que restaura ReviewDraft previo.
- [x] Añadir regresión de descartar dictado, tarjetas enfocables y ausencia de Terminar dictado; ejecutar y observar fallo.
- [x] Integrar pregunta, campos, dock circular, estados y restauración de borrador.
- [x] Integrar cabecera y feedback solo para verb_review; CSS responsive, hover, halo y foco.
- [x] Ejecutar pruebas unitarias y e2e de repaso en los tres motores, build y revisión visual claro/oscuro a 320/390/768/1440.
- [x] Revisar diff y guardar cambios verificados.

## Verification
- 210 unit tests passed.
- 36 browser tests passed across Chromium, Firefox and WebKit (review, game selection and solution audio).
- Production build and typecheck passed; existing large content chunk warning remains unchanged.
- Reviewed mobile/desktop screenshots in light/dark themes and widths 320/390/768/1440.
- Native microphone behavior on physical phones remains a device-level check, as documented in README.
