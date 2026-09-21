ID: BUG-QUIZ-EMPTY-ANSWER-MANUAL-GRADING

Status: DISCARDED — already fixed, confirmed at backlog refinement 2026-09-21

Steps To Reproduce:
1. Create/open a quiz that contains only automatically-evaluable questions (no question type requiring manual grading).
2. As a student, submit/complete the quiz without answering any question.
3. Open the quiz overview page as the teacher/reviewer and check the student's result.

Expected result:
Since all questions in the quiz are automatically evaluable, an unanswered submission is a legitimate, fully-gradable answer: it should be automatically scored 0 and shown with a score, with no manual grading required.

Actual result:
The overview page shows the student's answer as "needs manual grading", even though the quiz contains no question that actually requires manual grading.

Note:
"Needs manual grading" should only be shown when the quiz contains at least one question/answer that cannot be automatically evaluated.

Priority: High — same data-integrity class as QUIZ-CONNECTION-INTEGRITY-001: a legitimate 0-score
result is misrepresented as pending manual work.

Effort: 3

Depends on: QUIZ-CONNECTION-INTEGRITY-001 (`active_sprint/`, reopened 2026-09-20) — that story's
DoD already claims to cover this exact case ("a genuine zero-answer submission ... appears with a
real score, not shown as needs manual grading"), but as of this grooming pass neither story is
actually implemented in code. Fold this bug's fix into that story rather than doing it twice;
don't select this bug into a sprint on its own until that dependency is resolved one way or the
other.

Known context (grooming, 2026-09-20, confirmed by reading the code):
* Root cause is in two places, not one:
  1. `client/src/QuizSessionMonitorPage.tsx:298-300` labels a result "needs manual grading"
     whenever `maxScore === 0`, with no check for *why* it's 0 — a quiz with zero
     non-auto-gradable questions and a student who answered nothing both produce `maxScore: 0`
     today, and the client can't tell them apart.
  2. `GET /api/quiz-sessions/:sessionId/results` (`server/src/routes/quizSessions.ts:239-250`)
     computes `maxScore` as the sum over `quiz_session_answers` rows the student actually
     submitted (one row per answered item — `server/src/db/quizSessionAnswers.ts`). A student who
     answers **zero** items has zero rows, so `maxScore` comes out `0` regardless of how many
     points the quiz's items were actually worth. The server has no per-connection signal today
     for "the quiz's true total possible score," only "the sum of what was answered."
* This means a correct fix needs the quiz's own item definitions (to know the real total possible
  score) at scoring time, not just the answer rows — `resolveQuizItems`/`quizzes.getFilesByQuizId`
  (already used by the `.../items` endpoint, `server/src/routes/quizSessions.ts:322-338`) is the
  likely source for that.
* This bug's own framing ("needs manual grading only when the quiz has a non-auto-gradable
  question") and QUIZ-CONNECTION-INTEGRITY-001's framing ("key off `submittedAt`, not off has at
  least one answer row") are two different lenses on the same underlying gap — the real DoD needs
  both: a full-marks-possible quiz with a zero-answer submission must show `0 / <real max>`, and a
  quiz with a genuinely ungraded item must still show "needs manual grading" for that item.

Refinement (2026-09-21) — discarded, confirmed by reading current code:
* `client/src/QuizSessionTakePage.tsx`'s `handleNext` now calls `recordCurrentAnswer` (POST
  `.../answers`) for every item on every Next click, even when nothing was selected
  (`responses: null`). A real student who reaches final submit without answering anything still
  gets one `quiz_session_answers` row per item, each with its item's true `maxScore`
  (`item.supported ? 1 : 0`) — so `results.connections[i].maxScore` is always the quiz's real
  total for any connection reached through the actual take-page UI. The client's display
  condition (`hasUngraded && maxScore === 0`) can no longer be true for that path, so "needs
  manual grading" cannot appear for a fully-auto-gradable quiz through real usage. This appears to
  postdate the 2026-09-20 grooming pass that filed this bug.
* The one remaining case that still yields `maxScore: 0, hasUngraded: false` (displayed as
  `0 / 0`, not "needs manual grading") is a connection whose `submit` is called with zero prior
  answer rows — reachable today only by calling the submit API directly, bypassing the real
  take-page flow entirely. `server/src/routes/quizSessions.test.ts:807`
  ("includes a genuine zero-answer submission as a real result, not excluded
  (QUIZ-CONNECTION-INTEGRITY-001)") already asserts `0 / 0` as the *expected*, committed result
  for exactly that case — not filed as a bug by the story that added it.
* Discarded rather than kept/rescoped: the human's call, given the original defect (the literal
  "needs manual grading" text for a real student's empty submission) is not reachable through the
  product's actual UI today.
