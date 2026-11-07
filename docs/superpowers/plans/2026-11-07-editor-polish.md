# Editor identity, status and preview plan

**Goal:** Plain page title with dot, prominent draft identity, persistent optional verb icon, dismissible local notice, sticky coherent action/status bar and non-learning previews of draft forms/examples.

**Decisions:** Keep ID protected in both form and JSON as previously approved. Add optional `icon` to the supported verb schema; old records retain automatic defaults. Audio previews use the library synthesis engine (including read), with activity tracking disabled; IPA/audio URL metadata does not alter the existing synthesis engine. Notice suppression is a local UI preference.

- [x] Add failing browser checks for icon persistence, notice suppression, sticky pending-state toolbar and draft playback.
- [x] Add optional icon field, chooser and shared resolver preference; preserve old records/imports.
- [x] Refine title, subject, notice and sticky action/state feedback, including saving/cancel/archive labels.
- [x] Add draft form/dialect and example previews without awards or progress changes.
- [x] Verify save/reload, JSON ID protection, light/dark mobile layouts, previews and existing tests; review and publish.

## Verification

- 128 unit tests passed.
- Full browser run: 176 passed; one new WebKit layout assertion raced the initial field remount. Replaced immediate bounding-box access with visibility/polling assertions.
- Final targeted run: all 15 editor-polish checks passed in Chromium, Firefox and WebKit, including the previously failing case.
- Draft stop controls were also checked against pending speech in all three browsers.
- Independent review identified the narrow icon-picker row; fixed to a full-width grid, verified by width assertions and light/dark contrast checks.
