ID: QTI-22-IMPORT

Status: DRAFT

Priority: Medium

As:
a `trainer`

I want to:
upload a quiz in QTI-22 format

So that:
I can then later submit the quiz to the students

Definition of Done:
* can select a local quiz in QTI 2.2 format and upload it to the application
* the quiz is checked for format and an error is reported if the format is not correct
* the quiz appear in the quiz dashboard

Notes:
* depends on COURSE-001 (a `current course` must be selected — this is the course the
  uploaded quiz belongs to; there is no course-less quiz)
* persistence for the uploaded file/parsed quiz is not yet decided beyond
  `adr/ADR-0002-persistence-and-iam.md`'s PostgreSQL choice — where the raw QTI file itself
  is stored (DB blob vs. filesystem/object storage) is an open question
* raw test files stored in database binary fields
* "format is not correct" reports back to the trainer line/element-level errors





