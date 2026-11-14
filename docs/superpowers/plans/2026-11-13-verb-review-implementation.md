# Repaso de verbos — implementation plan

**Goal:** Implement the approved three-form review game with native speech, configurable checking and persistent safe retries.
**Spec:** ../specs/2026-11-13-verb-review-design.md (approved by user).
**Stack:** Existing React/Vite, TypeScript, Dexie, native browser APIs. No new dependencies.
**Execution:** Main agent owns integration, question/evaluation/session logic, UI and settings. Under dispatching-parallel-agents, one independent worker owns only the native recognition adapter and its tests; it has no shared-file writes.

## Tasks

- [x] Domain and evaluator: add optional review snapshot, input provenance and settings; generate one triple per verb, dialect-filtered variants, real coverage IDs. Test exact/homophone matching, alternatives, be/read and spelling safeguards.
- [x] Recognition adapter: tested injectable controller, synchronous user-gesture start, final/interim distinction, stop-during-permission, error/timeout and stale-event cleanup. No automatic restart loop.
- [x] Session engine: full selection for standalone review, recall-only evidence, no base credit for English prompt, repeats after up to three pending questions, assisted retries and old-mode compatibility. Tests before changes.
- [x] UI and settings: game card/preparation language, three editable fields, hold/per-field mic, automatic/manual behavior, safe review, per-column feedback and solution audio. Spanish prompt synthesis; preserve English default behavior.
- [x] Persistence: optional fields, defaults for old profiles, backup roundtrip and draft preservation on pause/reload.
- [x] Verification: full unit suite, production build, focused browser regression flows in three engines with simulated recognition, mobile/dark/a11y checks; state real-device microphone testing limitation.
- [x] Final independent review, README, commit and push.

## Review focus

Wrong recognized alternatives must not be cherry-picked; came/come remains distinct. Repeated legitimate words survive. A recording belongs to a question and cannot submit later. Permission/network failures never create learning attempts. Voice cannot earn spelling or pronunciation. Partial progress and variants are credited only when produced. Pause preserves queue/draft; finish does not reopen it. Old backups and old games retain behavior.

## Verification and decisions (14 November 2026)

- 210 unit tests across 37 files passed; the new engine, progress, persistent draft/backup and recognition controller are covered.
- 48 focused browser tests passed across Chromium/Firefox/WebKit, including all new review flows and existing games/study acceptance. One earlier Chromium save timed out; isolated rerun and full final batch passed without changes to that existing flow.
- TypeScript and production build passed through the browser runner; final compact-mobile CSS is checked again in the 12 new-game browser cases.
- Independent final review identified an unsafe alternatives cap. Fixed by per-segment deduplication and an explicit review request on Cartesian overflow; resolver also refuses oversized alternative sets. Reviewer verified the fix and no remaining issue in it.
- Reading Spanish uses optional speech-language selection; existing English defaults remain intact.
- Provenance is recorded per field as well as per answer, so a typed homophone cannot be accepted merely because another field was dictated.
- GUI uses native controls and tokens; contrast checks corrected green-result text and the new feedback text. Mobile microphone sits beside its field to reduce vertical space.
- Real iOS/Android microphone checks remain explicitly pending; no claim of device-specific native recognition reliability. No paid dependencies or recordings introduced.
