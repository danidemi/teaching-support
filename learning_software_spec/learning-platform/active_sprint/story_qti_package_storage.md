ID: QUIZ-PACKAGE-STORAGE-001

Status: READY

Priority: High — blocks both QUIZ-TAKE-RENDER-001 and QUIZ-AUTO-EVAL-001; without it, no
multi-question quiz authored by the `learning-quiz-author` plugin can ever be taken by a
student.

Effort: 5 (grooming, 2026-09-13)

As:
a `trainer`

I want to:
upload a quiz produced by the course-authoring plugin — a manifest, one `qti-assessment-test`
file, and one `qti-assessment-item` file per question — and have the platform store the whole
package, not just one file

So that:
a real, multi-question quiz I authored can actually be reassembled and served to students,
instead of only a single-question quiz (today's only supported shape) working

Definition of Done:
* a trainer can upload a QTI 3.0 package — a `.zip` containing `imsmanifest.xml` + `test.xml`
  (a `qti-assessment-test`) + N `items/item-NN.xml` files (each a `qti-assessment-item`),
  referenced from `test.xml` by `qti-assessment-item-ref href="..."` — as one quiz, via the
  existing single-file upload input (per ADR-0010)
* all files belonging to one package are stored together (`quiz_files`, one row per file,
  per ADR-0010), associated with the same `quizzes` row via `quizId`, and every `href`
  reference in `test.xml` resolves to a stored item file — no dangling references
* uploading a single standalone `qti-assessment-item` (today's existing supported shape,
  e.g. the current `sample-accept-single-choice-basic.xml` fixture) keeps working from the
  trainer's point of view — same accepted input, same success/failure behavior — even though
  internally it is now stored as a 1-row package with no manifest (per ADR-0010); this is a
  migration of `QTI-22-IMPORT`/ADR-0007's existing storage, not a behavior change for the
  trainer
* structural validation (currently `server/src/qti/validateQti3.ts`) is extended to check the
  package as a whole: zip is a valid archive, manifest well-formed, every item-ref
  resolvable, each referenced item file itself passes today's existing item-level structural
  checks
* a malformed or incomplete package (not a valid zip, missing manifest/test file, a missing
  item file, a dangling href) is rejected with a normal 4xx error, matching the existing
  validation-failure shape — not a partial or silently-broken store
* verification: automated — unit/integration tests covering a valid multi-item package
  upload, a standalone single-item upload (regression), and at least one malformed-package
  rejection case per failure mode above

Technical plan (sprint planning, 2026-09-13): see ADR-0010 (upload format, zip library,
`quiz_files` storage shape, validation extension, migration dropping `quizzes.fileData`).

Known context (grooming, 2026-09-13):
* Confirmed gap: `learning-plugin`'s `learning-quiz-author` agent authors
  `imsmanifest.xml` + `test.xml` + `items/item-NN.xml` (a full package). The current
  `quizzes` table/upload path (`server/src/db/schema.ts`, `server/src/routes/quizzes.ts`)
  stores exactly one file's bytes per row (`fileData` bytea) — a package produced by the
  plugin cannot be uploaded as-is today.
* This story is upstream of QUIZ-TAKE-RENDER-001 and QUIZ-AUTO-EVAL-001 — both assume a
  multi-item test's item files are actually retrievable server-side.
