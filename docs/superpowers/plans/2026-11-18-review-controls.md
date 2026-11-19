# Review controls refinement

Approved design: three main slots, contextual field microphones, integrated keyboard fallback and an always available “No lo sé”.

- [x] Add reveal action that cancels capture/cues, submits a revealed assisted response, never awards a correct answer and schedules the existing retry.
- [x] Render revealed forms neutrally, read the solution once, then allow explicit Next. Do not auto-advance while reading.
- [x] Main controls: incomplete = Write / Mic / No lo sé; complete = Repeat (or Write without voice) / Check / No lo sé. Freeze layout during capture; discard remains a secondary action.
- [x] Show each field microphone when its card is selected or that microphone is active, with a short per-form instruction.
- [x] Replace the detached keyboard dictation button with the existing Write control and concise contextual guidance.
- [x] Verify reveal during capture/cue and complete drafts, pending retry without an earned correct answer, selected fields, keyboard fallback and unchanged original/compatible modes with unit and browser tests.

Prompt audio circles were independently corrected and checked at 36 × 36 px in the previous commit.

## Verification — 2026-11-19
- 219 unit tests passed.
- 42 browser tests passed in Chromium, Firefox and WebKit, including revealing a complete correct draft without earned correctness, pending retry and zero answer XP, capture/cue cancellation, contextual microphones and integrated keyboard fallback.
- Production build/typecheck completed through browser setup; diff whitespace check clean.
- Mobile initial/revealed screenshots inspected. Accessibility check on revealed state passed after improving neutral label contrast.
- Independent review reported no important defects.
