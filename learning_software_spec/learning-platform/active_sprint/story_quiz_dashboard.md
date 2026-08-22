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

Technical decisions made during development (2026-08-22), not specified by the story text:
* no `POST /api/courses/:courseId/quizzes` ships in this story — creating a quiz is
  QTI-22-IMPORT's job (format validation happens there, before a row is ever created).
  `QuizRepository.create` exists now so QTI-22-IMPORT can call it directly; this story's own
  tests seed rows through that same repository method rather than through a route.
* `quizzes.status` is a plain text column defaulting to `'uploaded'`, not an enum — nothing
  in either this story's or QTI-22-IMPORT's DoD produces more than that one value yet
* raw quiz files are stored as Postgres `bytea` (`quizzes.file_data`), per ADR-0002 — added a
  minimal `customType` for it since drizzle-orm/pg-core has no built-in binary column
* reachability: this is the "course sub-view" COURSE-001's breadcrumb note anticipated —
  added a "View quizzes" link to `CourseDashboardPage` that appears once a course row is
  selected, linking to the new `/courses/:courseId/quizzes` route. Selection itself is still
  not persisted anywhere (COURSE-001's decision stands) — the link just carries the selected
  course's id into the URL at the moment it's clicked.
* every route requires a session **and** that the course belongs to the caller's tenant
  (`CourseRepository.findByIdForTenant`, new) — a course in another tenant and a
  non-existent course both get the same 404, so this can't be used to probe which course ids
  exist elsewhere; a missing session is a distinct 401

Verification (development, 2026-08-22):
* automated: 62/62 server tests green (`server/src/routes/quizzes.test.ts` — 10 new tests:
  401 signed-out, 404 cross-tenant course for list/delete, list with title/uploaded-date/
  status, empty list, delete removes the row, delete 404 for a non-existent quiz, replace-file
  updates the same row without adding one, replace-file 400 with no file attached, replace-file
  404 for a non-existent quiz), 38/38 client tests green (`QuizDashboardPage.test.tsx` — 5 new
  tests: sign-in prompt, empty state, list rendering, delete + refresh, delete-failure error;
  `CourseDashboardPage.test.tsx` — 1 new test: "View quizzes" link appears after selection)
* manual, disposable server instance against a cleaned database: created a course via the
  real API, seeded one quiz row directly via `psql` (no create route exists yet to do this
  through HTTP), then via the real API: listed it, replaced its file (confirmed the response
  still has the same `id` and the `fileName` changed), deleted it (204), confirmed via `psql`
  the row count dropped to 0 — the delete actually removed the row, not just hid it
* migration verified: `bytea` (`quizzes.file_data`) resolved correctly against real Postgres
  (`\d quizzes` shows the column as `bytea`, not left as an unresolved custom type)
* same gap as every other story this sprint: no browser/Playwright click-through, no visual
  review — HTTP/API-level verification only
