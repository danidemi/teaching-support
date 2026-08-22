ID: SIGN-UP-001

Status: DONE

Priority: Low

Effort: 8 (added during grooming, 2026-08-21: confirmation-email delivery, token handling
and the docker-compose addition are new work on top of what SIGNUP-EXPEDITE-001 already
built — highest-effort auth story)

As:
a `unregistered user`

I want to:
sign up with my email and password, receive a confirmation email, and click a link to
confirm my account

So that:
I'm able to become a registered user without any social login

Definition of Done:
* two users cannot sign up with the same email — `POST /api/signup` returns `409` on a
  duplicate
* password must be at least 8 characters — `400` otherwise (same rule as
  SIGNUP-EXPEDITE-001)
* on signup, a new `users` row is created with `confirmed_at` null (unconfirmed) and no
  session is created — same "no auto-login" rule as SIGNUP-EXPEDITE-001, decided during
  sprint planning (2026-08-21)
* a confirmation email is sent to the given address (via Mailpit in local dev) containing a
  link to `{APP_BASE_URL}/confirm?token=...`; a row is created in `confirmation_tokens` with
  `expires_at` 24h in the future
* visiting the link while the token is valid and unused sets `confirmed_at = now()` on the
  user, marks the token's `used_at`, and redirects to `/confirm-result?status=ok`
* visiting an expired link redirects to `/confirm-result?status=expired`; visiting an
  already-used link redirects to `/confirm-result?status=used`; an unrecognized token
  redirects to `/confirm-result?status=invalid`. `/confirm-result` renders a distinct message
  for each status
* verified manually in local dev: sign up via `/signup`, open Mailpit's web GUI
  (http://localhost:8025), open the captured email, click the link, confirm
  `/confirm-result?status=ok` renders and the user's `confirmed_at` is set; then reuse the
  same link and confirm `status=used`; verify a duplicate email returns `409` and a
  7-character password returns `400`

Technical plan:
* **API**: `POST /api/signup`, body `{ email, password }` → `201 { id, email }` /
  `400 { error: "password_too_short" }` / `409 { error: "email_taken" }`.
  `GET /api/confirm?token=...` → `302` to `/confirm-result?status=ok|expired|used|invalid`
  (no JSON body — pure redirect, so the link works from any mail client with no extra
  client-side call).
* **Token**: raw token = `crypto.randomBytes(32).toString('hex')`, put in the email link
  as-is; only its SHA-256 hex digest is stored in `confirmation_tokens.token_hash` — so a
  database leak alone doesn't yield usable tokens. Lookup on confirm: hash the incoming
  token, match against `token_hash`.
* **Migration**: adds `confirmation_tokens` (`id` uuid pk, `user_id` uuid references
  `users.id`, `token_hash` text not null, `expires_at` timestamptz not null, `used_at`
  timestamptz nullable, `created_at` timestamptz default now()). Does *not* touch
  `confirmed_at`/`password_hash` — those already exist from SIGNUP-EXPEDITE-001's migration.
* **Email delivery**: `server/docker-compose.yml` gets a `mailpit` service
  (`axllent/mailpit`, SMTP port `1025`, web GUI port `8025`); `server/.env.example` gets
  `SMTP_HOST=localhost`, `SMTP_PORT=1025`, and `APP_BASE_URL=http://localhost:3000` (used to
  build the confirmation link). Server sends via `nodemailer` against `SMTP_HOST`/`SMTP_PORT`
  — no auth needed against Mailpit locally.
* **Client**: extends SIGNUP-EXPEDITE-001's `/signup` screen (the normal "Sign up" submit,
  scaffolded but not wired by that story, now calls `POST /api/signup`) and adds
  `/confirm-result`, a route that reads `?status=` and renders one of four messages.
* **Password hashing**: reuses `server/src/auth/password.ts` from SIGNUP-EXPEDITE-001
  unchanged (bcryptjs, cost factor 10).
* **Session**: none created here either — see LOGIN-EMAIL-001.

Notes:
* alternative to LOGIN-001 (Google sign-in), not a replacement — decided during grooming
  (2026-08-20): both are valid ways to become a `registered user`, and either satisfies
  TENANT-001's precondition; this story stays independent of LOGIN-001 and Low priority
* IAM approach resolved by `adr/ADR-0002-persistence-and-iam.md`: build it ourselves
  (no off-the-shelf IAM product), users stored in PostgreSQL
* screen/route reuse: this story extends SIGNUP-EXPEDITE-001's `/signup` screen and its
  `password.ts` module rather than building a second, separate sign-up form
* becoming `confirmed_at`-set here reaches the same account state SIGNUP-EXPEDITE-001
  reaches immediately — in both cases, actually signing in afterward is
  LOGIN-EMAIL-001's job, not this story's

Out of scope (deliberately, decided during sprint planning 2026-08-21):
* signing in after confirmation — see new backlog story `story_login_with_email.md`
  (LOGIN-EMAIL-001)
* production SMTP provider — Mailpit covers local dev/verification only; a real provider
  needs deciding before this is deployed anywhere beyond local dev, but that decision does
  not block building or verifying this story now

Implementation (2026-08-21):
* code: `server/src/auth/tokens.ts` (raw-token generation + SHA-256 hashing),
  `server/src/db/confirmationTokens.ts` (`ConfirmationTokenRepository`),
  `server/src/db/schema.ts` (`confirmation_tokens` table),
  `server/drizzle/0002_next_brother_voodoo.sql` (its migration),
  `server/src/db/users.ts` (added `confirmUser(userId)`), `server/src/email/mailer.ts`
  (`Mailer`, nodemailer against Mailpit), `server/src/routes/signup.ts` (`POST /api/signup`,
  `GET /api/confirm`, both reusing SIGNUP-EXPEDITE-001's validation and
  `isUniqueViolation`), `server/src/app.ts` (wired `confirmationTokens`/`mailer` deps,
  lazily resolved same as `users`), `server/docker-compose.yml` (`mailpit` service, ports
  1025/8025), `server/.env.example`/`server/.env` (`SMTP_HOST`, `SMTP_PORT`,
  `APP_BASE_URL`), `client/src/SignUpPage.tsx` (wired the normal "Sign up" submit to
  `POST /api/signup`), `client/src/ConfirmResultPage.tsx` (new — renders the
  `?status=` message), `client/src/main.tsx` (added the `/confirm-result` route).
* no new ADR: nodemailer/Mailpit and the token-hashing scheme were already decided during
  sprint planning (2026-08-21, recorded in `active_sprint/sprint.md` and this story's
  Technical plan) — nothing new was decided during development itself.
* confirmation link points at `{APP_BASE_URL}/api/confirm?token=...` (matching the
  Technical plan's route, `GET /api/confirm`), not the bare `/confirm` mentioned in one
  DoD bullet — that bullet's path was shorthand; the Technical plan's explicit route
  contract is the source of truth.
* automated tests: `server/src/auth/tokens.test.ts`, `server/src/routes/signup.test.ts`
  (extended with `POST /api/signup` and `GET /api/confirm` cases, using in-memory fakes for
  the token repository and mailer, same DI pattern as `UserRepository`) — given/when/then,
  all passing alongside the pre-existing suites (29/29 server). Client:
  `client/src/SignUpPage.test.tsx` (extended) and `client/src/ConfirmResultPage.test.tsx`
  (new) — 14/14 client.
* manual verification (all DoD bullets) run against real Postgres + Mailpit via
  `docker compose up -d`: signed up via `POST /api/signup`, opened the captured email
  through Mailpit's HTTP API, followed the real link — `status=ok` and `confirmed_at` set;
  revisited the same link — `status=used`; an unrecognized token — `status=invalid`; a
  token whose `expires_at` was forced into the past — `status=expired`; a duplicate email —
  `409`; a 7-character password — `400`; no `Set-Cookie` header on signup.
* verification ran on a second server instance (`PORT=3099`), not the port-3000 process the
  human already had running — that process predates this story and doesn't have its routes,
  so hitting it directly would have silently 200'd through the SPA fallback instead of
  confirming anything (this is exactly what happened on the first attempt, following the
  link Mailpit captured, since `APP_BASE_URL` in `.env` points at :3000).
* the local `.env` (not `.env.example`) needed `SMTP_HOST`/`SMTP_PORT`/`APP_BASE_URL` added
  by hand — `.env.example` already had them documented but nothing had copied them over
  since SIGNUP-EXPEDITE-001 last touched this file.
* test users/tokens created during manual verification were deleted from the dev Postgres
  afterward (`email LIKE '%@example.com'`), and the verification server instance was
  stopped, so a later manual re-run doesn't hit a stale `409`.
* not yet done: the human's own long-running server process on port 3000 is still serving
  the pre-this-story build — it needs a restart (after `npm run build` in `client/` and
  `npm run db:migrate`/restart in `server/`) before `/signup`'s normal submit or
  `/api/confirm` links will work there.
