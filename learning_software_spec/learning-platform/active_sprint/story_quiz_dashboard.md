ID: QUIZ-DASHBOARD-001

Status: READY

Priority: Medium

Effort: ? (not yet estimated — DoD now specified, see below; estimate at sprint kickoff)

As:
a `trainer`

I want to:
see a dashboard listing the quizzes belonging to my `current course`

So that:
I can confirm a quiz I uploaded is stored, and find it again later

Definition of Done (decided at sprint planning 2026-08-22):
* the dashboard lists the quizzes belonging to my `current course`, showing title, upload
  date, and status per row
* I can delete a quiz row (removes the row and its stored file)
* I can re-upload/replace a quiz's file without creating a new row
* no sort/filter and no assign-to-students in this story — assign-to-students is
  deliberately excluded: no student-facing delivery story exists yet, so building it now
  would get ahead of that
* after QTI-22-IMPORT uploads a quiz, it appears in this list without a page reload

Notes:
* split out during grooming (2026-08-21) from QTI-22-IMPORT, whose DoD required the
  uploaded quiz to "appear in the quiz dashboard" — no story defined that dashboard, and
  COURSE-001 explicitly excludes quiz actions from its own scope
* QTI-22-IMPORT depends on this story
* depends on COURSE-001 (quizzes are scoped to a `current course`)

Open questions:
* none — all resolved at sprint planning 2026-08-22
