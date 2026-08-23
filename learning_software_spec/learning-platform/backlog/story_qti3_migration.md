ID: QTI3-MIGRATION-001

Status: READY

Priority: High (blocks `QTI-UAT-SAMPLES-001`, which is High)

Effort: 5 (set during grooming, 2026-08-23: same shape as `QTI-22-IMPORT`'s validator work
[effort 8] but narrower — hard cutover decided, no dual-format code path, no player-library
adoption in scope)

As:
a `trainer` (and, by extension, the students who will eventually take these quizzes)

I want to:
the platform to accept and validate quizzes in **QTI 3.0** format instead of QTI 2.2

So that:
the platform can eventually use QTI 3.0's off-the-shelf, HTML5-friendly "player" libraries to
actually run/deliver a quiz to a student, instead of only storing and re-displaying a raw
file — something QTI 2.2 does not offer as readily

Definition of Done:
* the upload/validation path currently built for QTI 2.2 (`QTI-22-IMPORT`,
  `server/src/qti/validateQti22.ts`) is **replaced** by one that validates against QTI 3.0's
  namespace/root elements (`qti-assessment-item`/`qti-assessment-test`, per the QTI 3.0 spec)
  instead of QTI 2.2's (`assessmentItem`/`assessmentTest`) — decided at grooming (2026-08-23):
  **hard cutover**, not dual support; a QTI 2.2 file uploaded after this ships is rejected
  the same way any other malformed/wrong-namespace file is
* a trainer selecting a local QTI 3.0 file and uploading it succeeds the same way QTI 2.2
  upload does today (format-checked, stored, appears in the quiz dashboard) — same DoD shape
  as `QTI-22-IMPORT`, ported to the new format
* scope decided at grooming (2026-08-23): **validation/storage parity only** — accept,
  validate, store, list — matching `QTI-22-IMPORT`'s own original scope. Adopting an actual
  QTI 3.0 player library and wiring up playback is explicitly **out of scope** here; no
  student-facing quiz-delivery story exists yet (see `QUIZ-DASHBOARD-001`'s own exclusion),
  so playback is deferred to a future story once one does
* an ADR is written at Sprint Planning for this change, per CLAUDE.md's Activity 2 (the tech
  choice being the QTI version the platform standardizes on, and the hard-cutover decision)
  — the ADR should record *why*: QTI 3.0's available player libraries and HTML5-native
  delivery are the stated motivation for the version move, even though this story itself does
  not yet adopt a player library
* verified automatically + manually, same shape as `QTI-22-IMPORT`'s own verification: unit
  tests for the new validator (accept/reject cases, including at least one pre-existing QTI
  2.2 sample now correctly rejected as unsupported) plus a manual upload of at least one real
  QTI 3.0 sample file against a disposable server instance

Notes:
* raised by the human (2026-08-23) while reviewing a separate PBI for sample UAT files —
  that PBI (`QTI-UAT-SAMPLES-001`) had assumed QTI 2.2 because that's what's built today; this
  story is what actually justifies moving the samples to QTI 3.0. See
  `backlog/story_qti_uat_sample_files.md`, now updated to target QTI 3.0 and depend on this
  story.
* stated motivation for QTI 3.0 over QTI 2.2: existing "player" libraries that can run a quiz
  end-to-end (not just store/validate it), and QTI 3.0 being HTML5-friendly — **not yet
  independently verified against the actual spec/library landscape**, and this story
  deliberately does not adopt a player library (see scope decision above), so that claim
  doesn't need to be settled to build this story. It does need settling before whatever
  future story adds actual quiz playback — flag it there again.
* touches the same files QTI-22-IMPORT built:
  `server/src/qti/validateQti22.ts` and its route/tests, plus whatever schema/column naming
  assumed "22" in its name (check for that literally, e.g. `validateQti22`, at planning)
* no student-facing quiz-delivery story exists yet (noted as an explicit exclusion in
  `QUIZ-DASHBOARD-001`) — actually *running* a quiz via a QTI 3.0 player library is a future
  story, not bundled into this one

Open questions:
* none blocking READY — hard cutover and validation-only scope were decided at grooming
  (2026-08-23, see above). Which concrete QTI 3.0 player library to adopt, if any, is
  deferred to whichever future story actually adds playback — not this one.
