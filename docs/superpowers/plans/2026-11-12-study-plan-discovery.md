# Study Plan Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expose ready-made and personal plans directly in Study with clear scope, practice and duration, and start/customize actions.

**Architecture:** Keep stable template IDs; configure ten distinct templates including context. Share a compact PlanLibrary between Study and Plans. Existing personal plans remain untouched. Extend explicit recognition/recall goals so beginner and pattern presets can describe their true practice without relaxing mixed-plan compatibility. Exam quick start accepts a saved-list choice only for that template, creating a session snapshot rather than an unsolicited personal plan.

**Tech Stack:** React/TypeScript, existing plan/query/session services, AJV, Vitest, Playwright.

- [x] Failing tests for ten valid differentiated templates, ought family restriction, context-only questions and exam snapshot/ownership.
- [x] Configure templates and optional quick-start exam list; add recognition/recall goal schema/editor choices and preserve filter fields when customized.
- [x] Shared plan presentation/library with real selection counts, readable goals/duration, list prerequisite and empty states; Study quick start and personal/preset sections; Plans same cards linking to Study or editor.
- [x] Responsive colored cards and icon toolbar; preserve active-session resume and summary precedence.
- [x] Unit/build/browser coverage for direct start/customize, family/editor persistence, list choice, missing errors, local plans, active-session resume and mobile/dark accessibility; fresh review.
- [x] Documentation and final verification; commit/push.

User approved proposal with “Genial!” after the five changes were specified. Course durations use the supported5/10/15 values; no new notification or scheduling behavior. Source selection counts exclude archived verbs but are not a promise of number taught per session. Presets are never automatically saved as personal plans.

## Verification and decisions

- Ten presets validate and have actual distinct filters/objectives/modes. Familyought resolves5 curated verbs; context generates only sentence-gap questions; difficult has0 new verbs.
- 148 unit tests passed;24 browser tests passed across Chromium/Firefox/WebKit, including direct start, list prerequisite, no unsolicited plans, persistence, session resume and spaced-learning acceptance. Production build/typecheck pass through the browser test webServer.
- Mobile widths320/390/768 and desktop1440 inspected; dark Axe analysis finds no violations; light desktop and dark mobile card screenshots inspected.
- Fresh reviewer found no actionable issues in ownership, preset cloning, preservation of personal plans, filter merging or session precedence.
- New custom plans default to the complete ESO1 configuration; beginner customizations retain their recognition/memory focus. This preserves the general plan-editor workflow.
- Existing headings can occur in both the next-session summary and personal cards; browser tests now scope the intended region. Completion tests wait for the summary before navigating, preserving asynchronous database commits.
- Empty exam list selector is omitted when no saved lists exist; the card explains creating a list instead.
