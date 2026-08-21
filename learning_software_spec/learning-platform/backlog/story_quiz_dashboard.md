ID: QUIZ-DASHBOARD-001

Status: DRAFT

Priority: Medium

Effort: not estimable yet (added during grooming, 2026-08-21: DoD is still a stub —
estimate once list contents/actions are specified)

As:
a `trainer`

I want to:
see a dashboard listing the quizzes belonging to my `current course`

So that:
I can confirm a quiz I uploaded is stored, and find it again later

Definition of Done:
* [to be filled during a later grooming pass]

Notes:
* split out during grooming (2026-08-21) from QTI-22-IMPORT, whose DoD required the
  uploaded quiz to "appear in the quiz dashboard" — no story defined that dashboard, and
  COURSE-001 explicitly excludes quiz actions from its own scope
* QTI-22-IMPORT depends on this story
* depends on COURSE-001 (quizzes are scoped to a `current course`)

Open questions:
* list contents/columns, sort/filter, and any action beyond viewing (delete, re-upload,
  assign to students) are not specified — needs full grooming before this story is
  sprint-ready
