# Example Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the approved audit to enrich verb-detail examples and let context exercises use their variety.

**Architecture:** Revise the existing curated JSON directly, preserving IDs for replacements and adding stable IDs for additions; no new runtime layer. Choose among compatible reviewed context examples with the supplied RNG. Preserve dialect, target spelling and subject restrictions. Publish curated-1.5 with updated evidence/version metadata.

**Tech Stack:** TypeScript/React, curated JSON, Vitest, Playwright.

- [x] Review all97 drafts, classify replacements/additions, refine English/translations/context, complete know with two useful main-sense examples. Show all eight alternative spellings in context, replacing repetitive past examples where no additional sentence is needed.
- [x] Add failing tests for selection diversity, repeatability, dialect/was-were restrictions and invalid-example exclusion; implement random selection among valid examples.
- [x] Add content checks for contextual metadata and accepted answers; ensure all variants/forms remain covered. Store a before/after implementation record for all120 verbs.
- [x] Update base/content version and editorial manifest, preserve non-context learning evidence and all transfer formats. Document that context revisions may require fresh evidence without erasing history.
- [x] Browser checks for enriched detail/audio/editor/transfer and exercises, light/dark mobile layout; unit suite, content checks, build, fresh review.
- [x] Update README and source review log, verify counts and changes, commit/push.

The prior audit and proposals are immutable historical evidence; implementation can refine or replace a draft after review. No dictionary example copying, no default addition of all phrasal or specialised senses, no universal sentence quota.

## Verification and decisions

- 146 unit tests pass; content audit and production build pass. 27 browser checks pass across Chromium/Firefox/WebKit (enriched detail, audio, layouts/accessibility, games and full transfer/restore).
- Fresh reviewer checked all103 added/revised records and the RNG/filter implementation: no actionable findings.
- Final catalogue453 examples:91 additions,12 revisions,69 affectedverbs. Eight replacements from audit drafts plus variant spellings and the contextual UK get revision; two additional know contexts complete its main senses.
- Compared actual before/after semantic revisions: only context changes for69 verbs, no changes to other assessed skills.
- Existing examples keep stable IDs; source/content versioncurated1.5 distributes changes with existing protection of local edits. The historical audit remains unchanged; implementation decisions and IDs recorded separately.
- No GUI overhaul needed: maxsix examples perverb; existing translations, playback and editor handle the richer data.
