# Compatible dictation Implementation Plan

**Approved scope:** retain push-to-talk and add configurable compatible phrase capture with device detection.

- [x] Add optional reviewCapture setting (auto/hold/compatible), schema, defaults, validation and settings selector. Auto chooses compatible on iPhone/iPad, including desktop-like iPad user agents; manual overrides win. Conservative device detection avoids relying on masked iOS versions.
- [x] Add recognition continuous option; compatible capture uses false and is never stopped on pointer release.
- [x] Before each compatible capture play a short spoken cue; start a fresh recognizer after cue completion. Cancellation invalidates pending cue callbacks and closes any active capture; no automatic retry loops.
- [x] Adapt all microphone buttons to tap-to-start/cancel in compatible mode, with explicit instructions and existing processing/fallback safeguards. Preserve original pointer/keyboard/assistive push-to-talk behavior.
- [x] Verify detection, settings export/import, cancellation during cue, repeated compatible captures, natural completion and unchanged hold behavior with unit/browser tests. Physical iOS 27.2 verification remains required.

**Source:** https://bugs.webkit.org/show_bug.cgi?id=321436#c8 — reported workaround, not a guaranteed browser fix.

## Verification
- 218 unit tests passed, including settings validation, legacy compatibility and full backup restore.
- 33 browser cases passed in Chromium, Firefox and WebKit, including repeated natural phrase captures, late cue cancellation, navigation cleanup, desktop-like iPad detection and manual hold override.
- Production build/typecheck completed as part of browser setup. Independent review found no important defects; wording adjusted to refer to the browser rather than Safari when manually overridden.
- Awaiting physical iPhone/iPad verification; the workaround cannot guarantee recovery of an already stalled native audio process.
