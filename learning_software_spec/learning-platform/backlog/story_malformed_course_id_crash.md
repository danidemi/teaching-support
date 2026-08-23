ID: ROUTE-ID-GUARD-001

Status: DRAFT

Priority: High (a single bad request currently takes the whole server down for every
tenant, not just the caller who sent it)

Effort: [set at grooming]

As:
a `trainer` (and, by extension, every other tenant sharing the same running server)

I want to:
a malformed course id in a URL (e.g. a stale bookmark, a hand-edited link, or anything else
that isn't a valid UUID) to be rejected with an ordinary error response, not crash the
entire server process for everyone currently using it

So that:
one bad request from one user can't take the platform down for every other signed-in user at
the same time

Definition of Done:
* [to be refined at grooming — starting point below]
* a request with a non-UUID course id segment (any route under `/api/courses/:courseId...`)
  returns a normal 4xx JSON error (404, matching the "course not found" shape already used
  for a valid-but-nonexistent id, so a caller can't distinguish "malformed" from "doesn't
  exist" — same information-hiding rationale `quizzes.ts`'s existing comment already gives
  for the tenant-mismatch case)
* the server process does not crash or exit — confirmed by a request immediately after the
  bad one still succeeding
* every route handler that calls `CourseRepository.findByIdForTenant` (or any other
  DB-lookup-by-id-from-a-route-param) is audited for the same unguarded-await pattern, not
  just the one instance found — fix all instances found, not just the one that happened to
  get noticed
* verified automatically: decided during the 2026-08-23 backlog interview — the fake
  repositories in `testSupport/fakes.ts` (`createFakeCourseRepository` etc.) are updated to
  `throw` for a non-UUID-shaped id, the same way real Postgres does, instead of just
  returning `null`. This keeps the reproduction fast/in-memory while actually exercising the
  bug's failure mode, rather than a real-Postgres-backed test
* verified manually: send a request with a hand-typed non-UUID course id against a running
  disposable server instance, confirm a 404 (not a crash), confirm the server is still up
  and answering other requests afterward

Notes:
* **found during COURSE-DETAIL-001's manual verification** (2026-08-23,
  `past_sprints/.../story_course_detail_page.md`'s own Verification section) — not a defect
  introduced by that story. The bug is in `server/src/routes/quizzes.ts`'s `authorizeCourse`
  helper: it calls `courses.findByIdForTenant(req.params.courseId, ...)` with no surrounding
  try/catch. A non-UUID id makes Postgres raise `invalid input syntax for type uuid`
  (`22P02`), the rejection is never caught, and it crashes the whole Node process — confirmed
  by hand: `curl .../api/courses/does-not-exist/quizzes` took the server down; a following
  request got no reply until it was manually restarted.
* COURSE-DETAIL-001's own new `GET /api/courses/:courseId` route does NOT have this bug — it
  wraps the same `findByIdForTenant` call in a try/catch and correctly returns 500 instead of
  crashing. That's still not the DoD's "same 404 as any other malformed-input case" shape,
  and it's not proof no other call site has the unguarded version — the point of this
  story's "audit every call site" DoD item is to not rely on having found all of them by luck.
* **fix location, decided during the 2026-08-23 backlog interview**: at the route-handler
  layer — this stack's equivalent of a "controller" (there's no separate controller class
  here the way there would be in e.g. Spring Boot). The three layers in this codebase map
  as: `server/src/routes/*.ts` (route handlers — receive the request, orchestrate calls,
  shape the response: the "controller" role) call into `server/src/db/*.ts`
  (`CourseRepository` etc. — the "repository"/data-access role); there is no separate
  "entity" class layer, Drizzle's inferred row types fill that role. So each route handler
  (`quizzes.ts`'s `authorizeCourse`, and any other call site the audit turns up) validates
  the id shape or wraps the lookup in try/catch itself — matching the pattern
  COURSE-DETAIL-001's own new `GET /api/courses/:courseId` route already uses correctly —
  rather than pushing the guard down into the repository methods.

Open questions:
* none blocking grooming — both open questions from this story's original filing (test
  reproduction approach, fix location) were resolved during the 2026-08-23 backlog interview,
  see the DoD and Notes above.
