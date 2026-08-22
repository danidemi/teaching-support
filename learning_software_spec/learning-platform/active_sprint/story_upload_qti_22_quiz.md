ID: QTI-22-IMPORT

Status: READY

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

Open questions:
* none — both dependencies (COURSE-001, QUIZ-DASHBOARD-001) reached READY at sprint
  planning 2026-08-22; this story is a scheduling dependent, not an open question

Technical decisions made during development (2026-08-22), not specified by the story text:
* **validation scope, flagged explicitly**: this is structural validation (well-formed XML,
  correct root element `<assessmentItem>`/`<assessmentTest>` in the QTI 2.2 namespace, the
  root's required `identifier`/`title` attributes, and — for an item — at least one
  `<itemBody>`), not full validation against the official `imsqti_v2p2.xsd` schema. That
  schema is a large multi-file XSD this environment has no network access to fetch, and
  hand-transcribing it would itself be unverifiable. The chosen checks target the mistakes a
  trainer would actually make (wrong file, missing required fields, broken XML), reported
  with real line numbers via a streaming XML parser (`sax`) — see
  `server/src/qti/validateQti22.ts`'s own doc comment. Flagging for Sprint Review: accept
  this narrower scope, or treat full XSD validation as a follow-up PBI once schema files are
  available to load into the repo.
  * per this same limitation, "not correct" errors are always returned together (not one at
    a time) — a trainer fixing a file one round trip at a time would be worse than seeing
    everything wrong at once, and the DoD's wording ("line/element-level errors", plural)
    already implies more than one may apply.
* quiz title comes from the QTI file's own `title` attribute (required for a valid file),
  not the uploaded filename — the filename is still kept in `fileName` for the dashboard
  reference, but a human-authored title reads better than a filesystem name.
* "appears in the quiz dashboard... without a page reload" is satisfied by
  `QuizDashboardPage` re-fetching its list after a successful upload (same pattern as
  create/delete/replace already use) — no websocket/push mechanism, since the upload and the
  dashboard are the same page.
* `PUT .../file` (replace, QUIZ-DASHBOARD-001) still does not run this validation — only
  `POST` (create) does. Carried over from that story's own scope note; not revisited here.

Verification (development, 2026-08-22):
* automated: `validateQti22.test.ts` — 10 new unit tests (valid item accepted with title
  extracted, malformed XML rejected with a line number, wrong root element named in the
  error, missing identifier/title/itemBody each caught, wrong namespace caught, empty file
  caught, assessmentTest accepted without requiring itemBody, multiple errors collected at
  once). `quizzes.test.ts` — 6 new route tests (401/404 same as other quiz routes, 400 with no
  file, 201 + declared title on a valid upload, 400 with structured errors and nothing
  created for an invalid file, malformed XML rejected the same way). 78/78 server tests
  green. Client: `QuizDashboardPage.test.tsx` — 3 new tests (upload calls `POST`, invalid-QTI
  response renders the line/message list, an unexpected failure shows a generic error).
  41/41 client tests green.
* manual, disposable server instance against a cleaned database: uploaded a valid QTI 2.2
  item (course "Geography 101") — confirmed it's created with the title taken from the file
  (not the filename) and appears in the list; uploaded one missing `identifier` — confirmed
  400 with the exact structured error, and confirmed the quiz count stayed unchanged (nothing
  was created); uploaded malformed XML — confirmed multiple distinct errors reported
  together (missing identifier, missing title, and the XML parse error, all in one response);
  final `psql` check confirmed the `quizzes` table has exactly the one valid row
* same gap as every other story this sprint: no browser/Playwright click-through — HTTP/API-
  level verification only

