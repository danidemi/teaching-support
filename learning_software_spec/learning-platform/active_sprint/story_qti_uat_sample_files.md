ID: QTI-UAT-SAMPLES-001

Status: READY (development complete, see Verification below)

Priority: High

Effort: 2 (set during grooming, 2026-08-23: authoring fixed sample files once the validator
they target exists — no new application code)

As:
a `human running UAT`

I want to:
a small set of ready-made QTI 3.0 quiz files to upload during human-led UAT — some that must
be accepted by the system, some that must be rejected by it

So that:
UAT can exercise the real upload/validation path with representative files instead of the
human having to hand-author QTI XML on the spot

Definition of Done:
* 3 **valid** QTI 3.0 sample quiz files exist, each uploadable through the upload flow and
  expected to succeed: one single-choice item, one multiple-choice item, one multi-item test
  (decided at grooming, 2026-08-23)
* 3 **invalid** QTI 3.0 sample quiz files exist, each deliberately broken in a different way:
  malformed XML, wrong root element, missing a required attribute (decided at grooming,
  2026-08-23)
* every file's name states, unambiguously: that it is a test/sample file, what kind of quiz it
  represents, and whether it is expected to be **accepted** or **rejected** by the system,
  e.g. `sample-accept-single-choice-basic.xml`, `sample-reject-missing-identifier.xml`
  (naming convention fixed at grooming, 2026-08-23)
* files live at `server/test-fixtures/qti-samples/` (decided at grooming, 2026-08-23 —
  alongside the server code that validates them, reusable by both the automated validator
  tests and manual UAT upload)
* verified manually during UAT: each "accept" file uploads successfully and appears in the
  quiz dashboard; each "reject" file is refused with a validation error

Notes:
* **hard dependency: `QTI3-MIGRATION-001`.** The only import path built and shipped so far is
  QTI 2.2 (`QTI-22-IMPORT`, done in `past_sprints/sprint_26_08_23_12_32`); the system does not
  accept QTI 3.0 yet. The human confirmed (2026-08-23) the intent is QTI 3.0 specifically, for
  its available player libraries and HTML5-friendliness, and asked for a companion PBI to
  actually add QTI 3.0 support — see `backlog/story_qti3_migration.md`. This story cannot be
  built (there is nothing to validate "accept" against) until that migration story ships.
  Sequencing: `QTI3-MIGRATION-001` before this story, at planning.
* previously written against QTI 2.2 (updated 2026-08-23 to QTI 3.0 per the human's direction
  above) — if `QTI3-MIGRATION-001` ends up deciding on **dual** QTI 2.2 + 3.0 support rather
  than a hard cutover, revisit whether this story should also cover a QTI 2.2 accept/reject
  set, or QTI 3.0 alone is sufficient for UAT purposes

Open questions:
* none — count/variety, naming convention, and file location all fixed at grooming
  (2026-08-23, see DoD above)

Dependencies:
* `QTI3-MIGRATION-001` must ship first (hard cutover to QTI 3.0, decided at grooming
  2026-08-23) — this story is groomed and READY, but not selectable into a sprint before
  that one is done, since there's nothing to validate "accept" against until then

Technical plan (sprint planning, 2026-08-23):
* scheduled after `QTI3-MIGRATION-001` in this sprint's development sequence (see
  `sprint.md`) so the validator these files target actually exists when authored
* 6 files at `server/test-fixtures/qti-samples/`, named per the fixed convention:
  * `sample-accept-single-choice-basic.xml` — one `qti-assessment-item`, single-choice
  * `sample-accept-multiple-choice-basic.xml` — one `qti-assessment-item`, multiple-choice
  * `sample-accept-multi-item-test.xml` — one `qti-assessment-test` referencing 2+ items
  * `sample-reject-malformed-xml.xml` — deliberately unclosed/broken tag
  * `sample-reject-wrong-root-element.xml` — well-formed XML, wrong root (e.g. QTI 2.2's
    `assessmentItem`, doubling as the QTI3-MIGRATION-001 test's "old format now rejected"
    case if convenient to share)
  * `sample-reject-missing-identifier.xml` — well-formed, correct root, missing the
    required `identifier` attribute
* reused by both `validateQti3.test.ts` (import the accept/reject fixtures instead of
  inlining XML strings, where convenient) and manual UAT (upload each through the running
  UI, per DoD)
* no new application code — authoring fixed files only, per the story's own effort estimate

Verification (development, 2026-08-23):
* implemented: all 6 files exist at `server/test-fixtures/qti-samples/`, named per the fixed
  convention — 3 accept (`sample-accept-single-choice-basic.xml`,
  `sample-accept-multiple-choice-basic.xml`, `sample-accept-multi-item-test.xml`) and 3
  reject (`sample-reject-malformed-xml.xml`, `sample-reject-wrong-root-element.xml` — a QTI
  2.2-shaped file, doubling as QTI3-MIGRATION-001's own hard-cutover-rejection case,
  `sample-reject-missing-identifier.xml`)
* automated: added `describe('validateQti3 against the QTI-UAT-SAMPLES-001 fixtures', ...)`
  to `validateQti3.test.ts` — reads each fixture file directly and asserts the intended
  accept/reject outcome; 85/85 server tests green
* manual: ran `npm run build && npm start` against the already-running Postgres, signed up
  + logged in via the real API, created a course, uploaded all 6 files through the real
  `POST /api/courses/:courseId/quizzes` endpoint — all 3 "accept" files returned `201` and
  showed up in `GET .../quizzes` (confirmed 3 rows with the expected titles); all 3 "reject"
  files returned `400` with the expected validation error and created nothing
