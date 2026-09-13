ID: QUIZ-AUTO-EVAL-001

Status: READY

Priority: Medium-High — completes the value of QUIZ-TAKE-RENDER-001 (a recorded-but-never-
scored answer is of limited use to either the student or the trainer).

Effort: 5 (grooming, 2026-09-13 — assumes hand-written scoring logic against
`qti-correct-response`; would shrink if QUIZ-TAKE-RENDER-001's sprint-planning ADR adopts a
player library that already does response processing/scoring, e.g. `qti3` or
`qti3-item-player` — see that story's Known context)

Depends on: QUIZ-TAKE-RENDER-001 (needs real recorded answers to evaluate)

As:
a `student` and a `trainer`

I want to:
have my quiz answers automatically evaluated against the correct response defined in the QTI
item, as soon as I submit the whole quiz

So that:
I (the student) see my result right away instead of not knowing how I did, and I (the
trainer) can see how the class performed without grading anything by hand for the question
types that support it

Definition of Done:
* on final submit of a quiz session take-attempt, every answered `qti-choice-interaction`
  item is scored automatically against that item's QTI-declared correct response
  (`qti-correct-response`) — correct/incorrect per item, plus a total score for the attempt
* the student sees their own score immediately on the post-submit confirmation screen (not
  just "submitted", the actual result)
* the trainer's Quiz Session Monitor page (QUIZ-SESSION-CONTROL-001/
  QUIZ-SESSION-LIVE-STATUS-001) shows per-student and/or aggregate results once the session
  has stopped — exact shape (list of students with scores, class average, score
  distribution, ...) to be decided at sprint planning/wireframe, not assumed here
* an item whose interaction type is not auto-gradable (i.e. anything outside this story's
  scored scope) is recorded but left in an explicit "needs manual grading" / ungraded state
  — never silently scored as 0, never silently dropped, never blocks the rest of the
  attempt's auto-gradable items from being scored
  * no manual-grading UI is built by this story — that's future work if/when a non-
    auto-gradable interaction type actually appears in authored content (today's fixtures
    only use `qti-choice-interaction`, which is auto-gradable, so this path may not be
    exercised by real content yet, but the behavior must still be defined and tested)
* re-opening a stopped session (existing reopen capability from QUIZ-SESSION-CONTROL-001)
  and a student retaking it produces a new, independently-scored attempt — does not overwrite
  or average with a prior attempt
* verification: automated — unit tests covering a fully-correct attempt, a fully-incorrect
  attempt, a mixed attempt, and (if QUIZ-TAKE-RENDER-001 ships any non-gradable item type by
  then) an ungraded-item case

Known context (grooming, 2026-09-13):
* Deliberately split out from QUIZ-TAKE-RENDER-001 at the human's request — render/record
  and evaluate are independently shippable and testable.
* Evaluation timing decided at grooming: on final submit only (not per-question), student
  sees their own score immediately.
