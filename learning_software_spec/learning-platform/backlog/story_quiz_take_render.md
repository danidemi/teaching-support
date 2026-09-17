ID: QUIZ-TAKE-RENDER-001

Status: READY

Priority: High — replaces the QUIZ-SESSION-LIVE-STATUS-001 placeholder page with the real
quiz-taking experience it was explicitly built to be a stand-in for.

Effort: 8 (grooming, 2026-09-13 — sized on top of an adopted player library; would be larger
if the sprint-planning ADR instead chooses to hand-build a renderer)

Depends on: QUIZ-PACKAGE-STORAGE-001 (needs a multi-item test's item files to be retrievable
server-side)

As:
a `student` (anonymous, per current session model — no login exists for students yet)

I want to:
open the QR/URL link for a running quiz session and actually see and answer the quiz's
questions, one at a time through the whole test, with my answers recorded

So that:
I can actually take the quiz instead of landing on a placeholder page with a single stub
Submit button

Definition of Done:
* opening the session's take-URL while the session is `running` renders the quiz's actual
  content from its stored QTI package (see QUIZ-PACKAGE-STORAGE-001): each question in the
  `qti-assessment-test`, in order, one at a time, with Next/Submit navigation through all N
  items
  * a session on a standalone single-item quiz (no test wrapper) still works, rendering that
    one item
* in scope for this story: `qti-choice-interaction` only (single-select and multiple-select),
  matching the only interaction type present in real authored content today. Any other QTI
  3.0 interaction type (text-entry, extended-text, match, order, hot-spot, ...) in an
  uploaded item is explicitly out of scope — flagged as a known gap, not silently broken
  (e.g. render a clear "unsupported question type" placeholder for that item rather than
  crashing the page)
* each answer a student gives is recorded against that student's connection for that
  session (extends the existing `quiz_session_connections` per-connection model — no new
  student-identity system; stays anonymous per the 2026-09-13 grooming decision, see note
  below)
* reaching the end and submitting marks the connection `submitted` (extends today's stub
  submit behavior) and shows a confirmation screen
* opening the take-URL before the session has started, or after it has stopped, shows an
  appropriate message instead of quiz content (extends today's placeholder's implicit
  session-status awareness)
* verification: automated where feasible (rendering/recording logic, answer persistence)
  plus a manual click-through of a full multi-item choice-only quiz, start to submit

Known context (grooming, 2026-09-13):
* ADR-0007's open question — "which QTI 3.0 player library (if any) to adopt" — is now
  confirmed cleared as a *dependency* (real options exist, verified by web search), though
  the actual choice is still deferred to sprint planning with an ADR, not decided here:
  * `qti3-item-player` (amp-up.io, npm) — Vue 2.6-based, full response processing/scoring,
    holds 1EdTech QTI 3 Basic + Advanced Delivery Conformance Certification. Framework
    mismatch with this stack's React (ADR-0001) is the main caveat.
  * `qti3` (LongsightGroup, npm, `longsightgroup` org) — TypeScript, framework-neutral core
    with Web Components + a React adapter, includes response processing/scoring, dependency-
    light. Best framework fit for this stack on paper; maturity/adoption not yet vetted.
  * `@ae-studio/qti-renderer` (agencyenterprise, npm) — framework-agnostic vanilla-DOM
    renderer, no external deps, but explicitly does **not** include scoring/response
    processing (would need to be paired with hand-written logic for QUIZ-AUTO-EVAL-001
    regardless).
  * `qti3` has been spiked against this repo's actual fixtures (2026-09-17) — see
    `piattaforma-corsi/learning-platform/spikes/qti3-render/FINDINGS.md`. Naming correction:
    no npm package is literally named `qti3` — it's three packages,
    `@longsightgroup/qti3-core` + `qti3-player` + `qti3-player-react`. Confirmed: correct
    single/multi-select `qti-choice-interaction` rendering (verified in real Chromium, not
    jsdom), correct response capture shape, correct scoring both client-side (preview) and
    server-side via `qti3-core` alone (no browser), no network dependency. The multi-item
    Next/Submit sequencing this DoD needs is hand-written host code either way — qti3's
    player renders one item at a time by design, regardless of which candidate is chosen.
    The other two candidates (`qti3-item-player`, `@ae-studio/qti-renderer`) remain
    unspiked.
* Scope was deliberately narrowed to `qti-choice-interaction` because it's the only
  interaction type present in this repo's QTI fixtures/authored content — broader QTI 3.0
  interaction support is a future PBI if/when authored content needs it.
* Students stay anonymous for this story, per the existing `quiz_session_connections` model.
  The human confirmed a future need for a trainer-configurable "require student
  identification" toggle per session — not built now, noted here for a future PBI.
* Auto-scoring of recorded answers is explicitly NOT part of this story — see
  QUIZ-AUTO-EVAL-001.
