ID: QTI-22-IMPORT

Status: DRAFT

Priority: Medium

Effort: 8 (added during grooming, 2026-08-21: QTI 2.2 parsing/validation with line/element
-level error reporting is the riskiest part; still blocked on QUIZ-DASHBOARD-001)

As:
a `trainer`

I want to:
upload a quiz in QTI-22 format

So that:
I can then later submit the quiz to the students

Definition of Done:
* can select a local quiz in QTI 2.2 format and upload it to the application
* the quiz is checked for format and an error is reported if the format is not correct
* the quiz appears in the quiz dashboard (see `story_quiz_dashboard.md` — QUIZ-DASHBOARD-001)

Notes:
* depends on COURSE-001 (a `current course` must be selected — this is the course the
  uploaded quiz belongs to; there is no course-less quiz)
* depends on QUIZ-DASHBOARD-001 (added during grooming, 2026-08-21): this story's DoD needs
  a place to show the uploaded quiz, and no other story defines one
* persistence decided during grooming (2026-08-21): raw QTI files are stored in PostgreSQL
  binary fields, per `adr/ADR-0002-persistence-and-iam.md`'s PostgreSQL choice
* "format is not correct" reports back to the trainer line/element-level errors





