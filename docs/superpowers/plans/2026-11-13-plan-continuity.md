# Study-plan continuity implementation plan

> Execute inline using superpowers:executing-plans; no parallel implementation.

**Goal:** Make it clear how to return to a previously used plan after finishing a session.

**Architecture:** Derive recent plans from existing session history, preserving prepared-plan identities and exam list IDs. Share the same recent-plan selector between Home, Study and plan cards; keep unfinished sessions first and never reset learning evidence.

**Stack:** Existing React, TypeScript, Dexie, native controls and scoped CSS. No dependencies.

**Spec:** User request in this chat: show recent plans on Home, suggest continuing the latest in the blue hero, and guide returning students when selecting a used plan.

## Tasks

- [x] Test and retain optional exam list ID in session plan context; preserve old backups.
- [x] Add tested recent-plan selector: newest sessions first, deduplicate by plan (and exam list), exclude unrelated free games and deleted personal plans; handle missing lists without silently choosing another.
- [x] Show up to three recent plans on Home, with clear names, practice/review counts and links to the next session. Hero priorities: active session, recent plan, existing generic suggestion.
- [x] Study defaults to latest recent plan, honors explicit plan/list URLs, and explains that the next session preserves progress. Mark used library cards as continuations and remember the exam list where available.
- [x] Verify unit suite, browser flows for returning after completion/reload, active session priority, multiple plans, exam list retention, missing-list handling and mobile/dark accessibility.
- [x] Review and document behavior, then commit and push.

## Constraints and review focus

- A completed session is not a completed plan; continuing starts a new session using existing progress.
- Plan scope is the full selection, not the daily new-verb limit.
- Personal plans use current saved definitions. Template IDs are resolved from current templates.
- Legacy personal sessions work through planId. Legacy prepared sessions without identity cannot be safely inferred.
- A missing exam list requires a new choice; never fall back to a different list.
- Keep home recommendations separate from global XP and mastery claims.

## Verification

- Full unit suite: 174 tests across 34 files passed.
- Browser suite: 24 tests passed across Chromium, Firefox and WebKit (continuity, existing Study library, saved plans and learning acceptance).
- Production build and TypeScript check passed through the browser-test server.
- Mobile overflow checks at 320/390/768/1440 pixels; dark-theme accessibility checks passed.
- Exam-list metadata survives full backup restoration. Missing-list and deleted-plan selection are covered by unit tests.
- Final diff reviewed inline; the independent review service was unavailable. No completion claim relies on an unreturned review.

Ruling: Returning opens the preparation screen for the next session rather than starting it automatically, keeping the existing user flow and allowing review of the selection.
Ruling: Legacy prepared sessions without plan identity cannot be inferred safely; show recent entries only for identified plans.
