ID: BUG-ANSWER-BREAKDOWN-MULTISELECT

Status: DRAFT

Steps To Reproduce:
1. As a student, take a quiz containing a `qti-choice-interaction` item with `max-choices="0"` (or
   any multi-select item, `cardinality="multiple"`), selecting all correct options.
2. Submit the quiz — the student sees the correct score (e.g. "Your score: 2 / 2").
3. As a trainer, stop the quiz session and open the Answer Breakdown block
   (QUIZ-CLASS-REVIEW-001) on the Quiz Session Monitor page.

Expected result:
The multi-select question's answer breakdown shows the counts for each option the class actually
picked (e.g. "2": 1, "7": 1), with the correct options marked, matching what was actually
submitted and scored.

Actual result:
Every option shows a count of 0, even though the student answered correctly and was scored 2/2.
The answer is not counted as "no answer" either — it's silently dropped from the totals.

Root cause (found during QUIZ-CLASS-REVIEW-001 rework, 2026-09-21):
`computeAnswerBreakdown` (`server/src/qti/answerBreakdown.ts`) buckets `qti-choice-interaction`
responses with `if (typeof value !== 'string') continue`, assuming every stored response is a
single identifier string. But a multi-select item stores its response as an array of identifiers
(`{ RESPONSE: ["choice_a", "choice_c"] }`, confirmed against `scoreChoiceAnswer`'s own handling in
`server/src/qti/scoreAnswer.ts`), so every multi-select answer is skipped by that `continue` and
never counted in any bucket.
