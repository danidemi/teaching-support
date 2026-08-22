ID: SIGNUP-EXPEDITE-001

Status: DONE

Priority: High

Effort: 3 (added during grooming, 2026-08-21: standalone minimal screen + endpoint + one
migration column; no confirmation-email flow, no SMTP integration — small relative to
SIGN-UP-001's 8)

As:
a `developer`

I want to:
sign up with my email and password and have the account created and enabled immediately,
without going through the confirmation-link flow (mail -> confirmation link -> confirmed
user)

So that:
I can quickly run manual tests

Definition of Done:
* in the sign-up screen (`/signup`) I can choose "expedite sign up" (or similar), enter
  email and password, and the account is created with `confirmed_at` already set — no
  confirmation email is sent or required
* **no auto-login**: signup does not create a session. The account exists and is enabled,
  but I am not signed in afterward — signing in is LOGIN-EMAIL-001's concern
  (`backlog/story_login_with_email.md`, added during this planning session)
* this expedite path is only reachable when `EXPEDITE_SIGNUP_ENABLED=true` in `.env`:
  `GET /api/config` returns `{ expediteSignupEnabled: true }`, the client fetches it once on
  load and only then shows the "expedite sign up" option; `POST /api/signup/expedite`
  itself returns `403` when the flag is off, regardless of what the UI shows
* two users cannot sign up with the same email — `POST /api/signup/expedite` returns `409`
  on a duplicate
* password must be at least 8 characters — `400` otherwise, with a body identifying which
  field failed (e.g. `{ error: "password_too_short" }`)
* passwords are hashed with bcryptjs (cost factor 10) before being stored — never stored in
  plain text
* verified manually: with the flag on, `POST /api/signup/expedite` with a fresh email/8+char
  password returns `201`, and the `users` row has `password_hash` set and `confirmed_at` not
  null; with the flag off, the option is absent from `/signup` and the endpoint itself
  returns `403`; a duplicate email returns `409`; a 7-character password returns `400`; no
  session cookie is set in any of these responses

Technical plan:
* **API**: `POST /api/signup/expedite`, body `{ email, password }` →
  `201 { id, email }` / `400 { error: "password_too_short" }` /
  `409 { error: "email_taken" }` / `403 { error: "feature_disabled" }`.
  `GET /api/config` → `{ expediteSignupEnabled: boolean }`, reading `EXPEDITE_SIGNUP_ENABLED`
  from `process.env` server-side.
* **Client**: introduces `react-router-dom` (first use in this codebase — `client/src/App.tsx`
  currently has no routing at all). Routes: `/` (existing home, unchanged), `/signup` (new
  screen: email + password fields, a normal "Sign up" submit, and — only when
  `/api/config` says so — an "expedite sign up" option calling the `/expedite` endpoint
  instead). SIGN-UP-001 adds the normal submit's backend behavior; this story only needs the
  expedite path to work, but should scaffold both fields/buttons since SIGN-UP-001 reuses
  this screen.
* **Password module**: `server/src/auth/password.ts` — `hashPassword(plain): Promise<string>`
  and `verifyPassword(plain, hash): Promise<boolean>`, using `bcryptjs` (pure JS, no native
  build step — chosen during planning, 2026-08-21, to avoid node-gyp issues across
  dev/Docker/CI), cost factor 10. SIGN-UP-001 imports this unchanged.
* **Migration**: adds to `users` (`server/drizzle/`): `password_hash` (`text`, nullable —
  Google-OAuth users via LOGIN-001 have none) and `confirmed_at`
  (`timestamp with time zone`, nullable). This story's own signup path sets `confirmed_at`
  to `now()` immediately; SIGN-UP-001 leaves it null until its confirmation flow runs.
* **Session**: none created by this story. No cookie, no `express-session` wiring here —
  that's LOGIN-EMAIL-001's job.

Notes:
* standalone — decided during grooming (2026-08-21): this story builds its own minimal
  email+password screen and endpoint now, rather than waiting for SIGN-UP-001 (which is
  DRAFT, Low priority, and still has open questions on confirmation-email delivery).
  SIGN-UP-001 is expected to later reuse/extend this screen and its backend code to add the
  confirmation-email branch, rather than duplicating it.
* no auto-login decided during sprint planning (2026-08-21): auto-login on signup would let
  someone sign up with an email they don't own and get immediate access — defeats the point
  of the confirmation flow SIGN-UP-001 adds, and this story should behave consistently with
  it. `LOGIN-EMAIL-001` (new backlog story) covers actually signing in afterward.
* persistence: writes to the existing `users` table (`server/drizzle/0000_loving_chamber.sql`,
  from DB-MIGRATIONS-001/ORM-SELECTION-001, both DONE) plus this story's own migration
  (`password_hash`, `confirmed_at`) — no other schema change needed.
* no hard dependency blocking this sprint: Postgres, Drizzle, and the migration tool are
  already DONE (sprint_26_08_21); the `users` table already exists. Not blocked by LOGIN-001
  or TENANT-001 either — this path creates a user row on its own, same as SIGN-UP-001 would.
* password hashing scheme is a tech-stack decision — per CLAUDE.md Activity 3, record it (and
  the bcryptjs-over-bcrypt choice) as an ADR when development starts on this story.
* out of scope: tenant association (TENANT-001's concern), the confirmation-email flow
  (SIGN-UP-001's concern), and signing in (LOGIN-EMAIL-001's concern) — this story only gets
  the user row created and enabled.

Implementation (2026-08-21):
* code: `server/src/auth/password.ts`, `server/src/db/users.ts`, `server/src/routes/signup.ts`
  (`GET /api/config`, `POST /api/signup/expedite`), `server/src/app.ts` (wired, deps-injectable
  `UserRepository` so `app.test.ts` stays DB-free), `server/drizzle/0001_futuristic_lethal_legion.sql`
  (adds `password_hash`, `confirmed_at`), `client/src/SignUpPage.tsx`, `client/src/main.tsx`
  (`react-router-dom` routes `/` and `/signup`), `client/vite.config.ts` (dev `/api` proxy).
* tech decisions recorded in `adr/ADR-0004-password-hashing-and-client-routing.md`.
* automated tests: `server/src/auth/password.test.ts`, `server/src/routes/signup.test.ts`,
  `client/src/SignUpPage.test.tsx` — given/when/then, all passing alongside the pre-existing
  suites (12/12 server, 6/6 client).
* manual verification (all DoD bullets) run against a real Postgres via `docker compose up`:
  flag-on signup returns `201` with `password_hash`/`confirmed_at` set on the row and no
  `Set-Cookie` header; a duplicate email returns `409`; a 7-char password returns `400`;
  flag-off makes `/api/config` report `false` and the endpoint itself return `403`.
* found and fixed during manual verification: `isUniqueViolation` initially checked `err.code`
  only, but `drizzle-orm/node-postgres` wraps the raw `pg` error in a `DrizzleQueryError`,
  putting the SQLSTATE on `err.cause.code` instead — the duplicate-email case returned `500`
  against real Postgres until this was corrected to check both. The original fake repository in
  `signup.test.ts` threw the flat `{ code }` shape, so the unit test alone didn't catch this;
  real-DB verification did. Fixed both the fake (now throws the wrapped shape Drizzle actually
  produces) and added `server/src/db/users.test.ts`, a dedicated unit test for
  `isUniqueViolation` covering both shapes plus two negative cases — 16/16 server tests passing
  after the fix.
* re-verified against real Postgres after the fix: duplicate email now returns `409` as
  required; `GET /signup` also confirmed to serve the SPA shell (`200`, `<div id="root">`)
  through the production `client/dist` path, not just the Vite dev proxy.
* the three manual-verification test users were deleted from the dev Postgres afterward
  (`DELETE FROM users WHERE email LIKE '%@example.com'`) so a later manual re-run doesn't hit a
  stale `409`.
* not yet done: `EXPEDITE_SIGNUP_ENABLED=true` is documented in `.env.example` but not added to
  any local `.env` — each developer adds it locally to exercise the flag.
