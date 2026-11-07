# Complete verb editor implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Edit every supported content field through structured controls, with the compact, coloured and accessible visual language of catalogue/detail.

**Architecture:** Keep VerbEditorPage responsible for persistence, conflicts, navigation and archive workflows. Add a structured field editor with reusable primitive/array/record controls and route-scoped CSS. The runtime validator remains authoritative. Preserve untouched optional properties through immutable updates; keep JSON as an optional interchange tool. User explicitly chose read-only existing ID, contentVersion and updatedAt.

**Tech stack:** React/TypeScript, existing domain validation, Vitest and Playwright/Axe.

## Coverage

- Identity: id (read-only once saved), lemma, meanings, meaningNotes, editorialStatus.
- Forms: independent base value, translations; all variants for past, participle, third person and present participle; dialect, usageNote, group usageNotes; labelled otherForms.
- Pronunciation: UK/US and base other pronunciations; ipa, audioUrl (absent/null/URL), audioSource, audioLicense, validated (absent/false/true).
- Classification: relation, frequency, courses, families, topics, difficulty; arbitrary keys and values in spellingEndings and phoneticEndings.
- Examples: id, sentence, translation, targetForm, grammarPoint, dialect, reviewStatus, source, audioUrl, form, acceptedAnswers; add/remove rows.
- Notes: mnemonics and notes arrays.
- Sources: label, url, license, checkedAt; add/remove rows.
- Metadata: createdAt editable; version and updatedAt protected; archival date/state shown with existing archive/restore workflows.
- Schema/runtime-only fields otherForms and base pronunciation.other must be reflected in TypeScript as well as form controls.

## Tasks

- [x] Add failing browser coverage for complete structured editing, preservation after save/reload, optional groups, source/audio fields, protected metadata and responsive accessibility.
- [x] Extend domain types to match already-supported runtime fields, without changing the schema contract.
- [x] Implement reusable editors for strings, optional enums/booleans/URLs, arrays, pronunciation, variants, groups, examples, sources and ending maps.
- [x] Integrate into VerbEditorPage; preserve fast variant editing, dirty guards, conflict handling and validated JSON. Use persisted revision for optimistic concurrency, never draft revision.
- [x] Apply scoped palette, section navigation, compact icon toolbars, responsive layout and clear save/error state.
- [x] Verify all coverage entries, archive/restore, JSON protection, all unit/browser tests and visual light/dark layouts. Request independent review and address findings.

## Decisions and checks

- User confirmed that existing ID, version and modification date remain protected; all content is editable.
- Archival date is editable in the draft; an active-to-archived save requires the same impact confirmation as the archive shortcut.
- Fast variant input keeps a stable metadata baseline during typing and distinguishes homographs by position/occurrence; regression tests for retyping either homograph first failed and then passed.
- No runtime schema expansion was needed: TypeScript now describes fields that were already accepted by validation.
- Independent review found no new issues; the pre-existing homograph issue was fixed and covered.
- Structured editing and full preservation tests pass, as do dark/mobile accessibility checks for every section. Final verification on 2026-11-07: 127 unit tests and 162 browser tests passed across Chromium, Firefox and WebKit.
