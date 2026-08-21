ID: SIGN-UP-001

Status: READY

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
