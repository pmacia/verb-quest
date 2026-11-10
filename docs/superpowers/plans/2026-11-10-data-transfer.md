# Data Transfer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve all editable verb content, generate a source-ready base catalogue ZIP, and integrate the transfer page visually.

**Architecture:** Keep browser exchange and backup services. Add a pure release-package builder using fflate and a dedicated advanced panel. A generated consolidated dataset bypasses old enrichment layers. Existing editorial and IPA audits produce an honest report; only structural failures block package generation.

**Tech Stack:** React, TypeScript, AJV, Dexie, fflate, Vitest, Playwright.

- [x] Add field-rich JSON/import/backup round-trip tests; run and inspect.
- [x] Add ZIP builder tests for schema, duplicate IDs, version, icons, archived verbs, exact snapshots, files, privacy and reports; verify failure then implement `transfer/release-package.ts` and binary download helper.
- [x] Add `ReleaseExportPanel.tsx` with version, scope, report and download states. Export full local catalogue only, never list/profile data.
- [x] Integrate compact responsive `import-export.css`, icons, summaries and explicit scopes into ImportExportPage. Preserve existing accessible labels and restore confirmations. Fix stale file previews and busy states when necessary.
- [x] Browser tests for download and ZIP contents, mobile layout, existing imports/restores. Unit suite, build, accessibility and visual checks light/dark.
- [x] Update README and approved design, review diff and commit/push.

## Verification and rulings

- 137 unit tests pass, 18 relevant browser tests pass on Chromium/Firefox/WebKit, build and content checks pass.
- Extracted ZIP applied in a temporary copy, with a different version and edited icon/translation: all 137 tests, content:check and build pass.
- Mobile light/dark visual review and Axe analysis of the transfer page: no violations.
- Fresh reviewer found stale version assumptions and obsolete review attribution; both fixed and re-reviewed (13 focused unit checks passed).
- Ruling: keep historical composition separately and its exact tests; audit the distributed loader independently. This preserves existing editorial evidence while allowing consolidated publications.
- Ruling: downloads with valid structure remain available when editorial checks fail, with explicit report and warning. Export is not automatic publication or certification.
- Ruling: retain `contentVersion` per record; use a new dataset version for distribution. Local import still generates a new contentVersion as before.
