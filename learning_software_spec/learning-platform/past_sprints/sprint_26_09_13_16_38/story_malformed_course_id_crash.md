ID: ROUTE-ID-GUARD-001

Status: DONE

Priority: High (a single bad request currently takes the whole server down for every
tenant, not just the caller who sent it)

Effort: Small — scope confirmed at grooming (2026-08-23) to be exactly 2 call sites
(`quizzes.ts`'s `authorizeCourse` and `courses.ts`'s `GET /api/courses/:courseId`), plus
updating the fake repositories and their tests.

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
  get noticed. **Scope confirmed at grooming (2026-08-23)**: exactly 2 call sites exist today
  — `quizzes.ts`'s `authorizeCourse` (unguarded, crashes) and `courses.ts`'s
  `GET /api/courses/:courseId` (already try/catch-guarded, but returns 500 rather than the
  404 shape this DoD requires — also needs fixing, just not for the crash).
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

Technical plan (sprint planning, 2026-08-23):
* `quizzes.ts`'s `authorizeCourse`: wrap the `courses.findByIdForTenant` call in try/catch;
  on a caught error, respond the same way as the existing "course not found" branch (404,
  same JSON shape) rather than letting it propagate.
* `courses.ts`'s `GET /api/courses/:courseId`: its catch branch currently always returns 500;
  narrow it so a malformed-id failure (Postgres `22P02`) returns 404 like the other route,
  while a genuine unexpected error still returns 500.
* both fixes recognize the same failure by checking for Postgres's `22P02` error code (via
  Drizzle's wrapped error), not by pre-validating UUID shape with a regex — keeps the check
  in one place (whatever Postgres itself considers invalid) rather than duplicating UUID
  format rules client-side.
* `testSupport/fakes.ts`: `createFakeCourseRepository`'s `findByIdForTenant` throws an error
  shaped like the real `22P02` case when given a non-UUID-shaped id (matching the interview
  decision), so the route-level try/catch is exercised without a real Postgres instance.
* sequenced **first** in this sprint — the two upcoming quiz-session stories add new
  id-in-URL routes; fixing this pattern first means those new routes can be written
  correctly from the start instead of copying the bug forward.

Verification (development, 2026-08-23):
* implementation: added `server/src/db/errors.ts` (`INVALID_TEXT_REPRESENTATION` = `22P02`,
  `isInvalidIdError`, mirroring `db/users.ts`'s `isUniqueViolation` pattern). `quizzes.ts`'s
  `authorizeCourse` now wraps the lookup in try/catch, returning `'not_found'` for an
  invalid-id error and a new `'error'` outcome (-> 500) for anything else, instead of letting
  either propagate. `courses.ts`'s `GET /api/courses/:courseId` catch branch now checks
  `isInvalidIdError` and returns 404 for that case, 500 otherwise (it was previously an
  unconditional 500).
* `testSupport/fakes.ts`: `createFakeCourseRepository` now generates real UUID-shaped ids
  (`fakeUuid`, replacing the old plain-integer `String(nextId++)`) and its `findByIdForTenant`
  throws the wrapped `22P02` shape for any id that isn't UUID-shaped — this is what actually
  lets a unit test exercise the crash-prevention path, since a fake that never throws can't
  prove the guard does anything.
* automated: 91/91 server tests green (`npm test`), including two new tests in
  `quizzes.test.ts` ("malformed course id (ROUTE-ID-GUARD-001)": returns 404 not a crash, and
  a following request is still served) and `courses.test.ts`'s existing "does not exist" test
  now doubles as this route's own regression test (annotated in place, same assertions).
  `npm run build` (`tsc -b`) is clean.
* manual: verified against a disposable Postgres + server instance on isolated ports (db
  5434, server 3101, via `client/e2e/docker-compose.e2e.yml` under a separate compose project
  name), never touching the already-running dev stack on 5432/3000 — confirmed via `docker
  ps` before and after that only the manual-verify containers were created/removed. Signed up
  + logged in via `/api/signup/expedite`, then sent the exact original repro request
  (`GET /api/courses/does-not-exist/quizzes`): got `404 {"error":"course_not_found"}`, and an
  immediately following `GET /api/courses` returned `200 []` — the server was still up and
  answering, with nothing unusual in its log. Also checked `GET /api/courses/does-not-exist`
  (the `courses.ts` route): `404 {"error":"course_not_found"}` (previously would have been
  500). Disposable instance torn down afterward (`docker compose ... down -v`); the
  pre-existing dev containers were confirmed untouched.
* DoD's "audit every call site" item: confirmed at sprint planning (see Technical plan above)
  that exactly these 2 call sites exist; both are now fixed.
