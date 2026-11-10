# Verb Definitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add main senses in simple English to verb detail only, merging identical UK/US definitions and preserving editable content through every complete transfer format.

**Architecture:** Optional `definitions` records on Verb (text, dialects, sources, reviewStatus). Store authored paraphrases in the curated base records, avoiding another runtime enrichment layer; publish base version curated-1.4 while preserving learning evidence and local edits. Reuse existing source visibility settings. A dedicated definition section and editor fields isolate this content from catalogue and assessed learning.

**Tech Stack:** React, TypeScript, AJV, Vitest, Playwright.

- [x] Consult Cambridge main verb senses and US entries, document paraphrase provenance and unresolved review honestly.
- [x] Add types/schema and failing tests for definitions, dialect grouping, compatibility and full transfers.
- [x] Add authored definitions to all 120 curated records; bump distributed dataset version and relevant historical assertions without changing learning revision.
- [x] Detail section between tags and forms; combine matching text, preserve distinct dialects, show source metadata only with professional setting.
- [x] Editor add/remove/edit text, dialects and provenance/review; retain all JSON/import/backup/release data and automatic tests.
- [x] Verify complete units, content audit, browser scenarios, mobile light/dark accessibility; fresh review and documentation; commit/push.

Decision: English main senses only, user confirmed. Original concise paraphrases, not copied dictionary entries. No automated bulk scraping or runtime external calls for students. Consultation does not mean Cambridge authored or endorsed the app's definitions.

## Verification and decisions

- 120 verbs / 152 original main-sense paraphrases; Cambridge references and consultation dates stored per definition, method recorded in the review manifest and docs/content/definitions-review.md.
- Definitions optional for backward compatibility; no new runtime enrichment layer or dictionary requests.
- Each definition edited in identity, with dialects, all source fields and review status. Changes reset its review status to needs_review.
- 141 unit tests pass. 30 relevant browser tests pass across Chromium, Firefox and WebKit, including editor, transfer/restore/release and definition scenarios; final definition-specific rerun after wording/ordering adjustments: all6 tests pass.
- Content audit/build pass. Mobile light/dark visual inspection and Axe for detail/editor: no violations.
- Fresh review found misleading functional wording for be; corrected to 'Used to identify...' / 'Used to describe where...'. No other important findings.
- Source consultation used indexed Cambridge content where direct requests returned403. Validated denotes assisted editorial review of a paraphrase, not Cambridge authorship/certification or independent teacher review.
- Shared text merged only for display; stored provenance remains editable. Draft > needs_review > validated when merging.
- Base/content version1.4 propagates additions through normal seed reconciliation, preserves local edits as pending base and does not change learningRevision.
