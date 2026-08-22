ID: AUTH-UX-001

Status: READY

Priority: Medium

Effort: ? (not yet estimated — needs grooming; absorbs LOGIN-EMAIL-001's scope, see Notes)

As:
an `unregistered user` or a `registered user` returning to the platform

I want to:
find sign-in from a standard navbar button, see all available sign-in methods on one
sign-in page, get to sign-up from a "don't have an account? create one" link, and land back
on the home page once I've actually confirmed my account

So that:
signing in/up feels familiar (matches how most web apps do it) instead of requiring me to
already know a `/signup` URL exists, and I'm not left stranded on a bare status page after
confirming

Definition of Done:
* the header shows a "Sign in" button (visible to an `unregistered user`) — no longer only a
  link to `/signup` on the home page
* clicking "Sign in" goes to a `/login` (or similar) page listing available sign-in methods;
  for now that means email + password only (Google/LOGIN-001 stays out until its OAuth
  credentials are confirmed — its button is added to this page later, not now)
* the sign-in page has a "Don't have an account yet? Create one" link to `/signup`
* `/signup` hosts both the expedite sign-up button (SIGNUP-EXPEDITE-001, when
  `EXPEDITE_SIGNUP_ENABLED`) and the classical email+password sign-up form
  (SIGN-UP-001) — both already exist; this story is about how they're presented together,
  not new sign-up logic
* email+password sign-in itself: `POST /api/login` checks email + password against the
  stored bcrypt hash and creates a session on success (cookie via `express-session`, session
  store `connect-pg-simple` backed by Postgres — decided at sprint planning 2026-08-22, so
  sessions survive a server restart); login is rejected with a generic error (not revealing
  which part is wrong) when the email doesn't exist, the password doesn't match, or
  `confirmed_at` is still null — this is LOGIN-EMAIL-001's former Definition of Done, absorbed
  here (see Notes)
* no rate limiting / lockout on repeated failed login attempts — explicitly out of scope for
  now (decided at sprint planning 2026-08-22); revisit if abuse becomes a real problem
* clicking the confirmation link (`GET /api/confirm?token=...`) redirects straight to the
  home page instead of `/confirm-result`; the home page shows the confirmation outcome
  (confirmed / expired / used / invalid) as a dismissible banner at the top of the page
  (decided at sprint planning 2026-08-22) — `/confirm-result` is retired
* the platform name in the top-left of the header links to the home page
* once signed in (by any method), the header reflects the signed-in state (name/avatar) —
  the actual sign-out control is LOGOUT-001's (`story_logout.md`) job, not this story's
* verified: automated tests for `POST /api/login`'s success/rejection cases (given/when/then,
  in-memory fakes, same pattern as `signup.test.ts`); manual/Playwright browsing-only
  verification that sign-in, sign-up, and the confirm redirect are all reachable without
  typing a URL

Notes:
* raised during sprint review (2026-08-22): current `/signup` screen and the home page's
  bare "Sign up" link/inert "Sign in" button don't match how users expect auth navigation to
  work
* **absorbs `backlog/story_login_with_email.md` (LOGIN-EMAIL-001)**, per decision during
  this backlog-refinement interview (2026-08-22) — the login page and the login logic land
  together rather than as separate PBIs, since one is meaningless without the other.
  LOGIN-EMAIL-001 is marked SUPERSEDED, its DoD content carried over above.
* depends on `express-session` (or equivalent) being wired into `server/` — not yet present
  in the codebase; this is the first story to introduce session middleware (carried over
  from LOGIN-EMAIL-001), backed by `connect-pg-simple` per the sprint-planning decision above
* shares the header component (`client/src/App.tsx`) with LOGIN-001, LOGOUT-001, and
  TENANT-001 — coordinate rather than re-touch independently
* sequenced before UI-FOUNDATION-001 (decided at sprint planning 2026-08-22): this story
  ships with today's ad-hoc styling; UI-FOUNDATION-001 restyles it afterward along with the
  other screens, rather than restyling a header/login layout mid-change
* out of scope: Google sign-in itself (LOGIN-001, still blocked on OAuth credentials);
  logging out (LOGOUT-001)

Open questions:
* none — all resolved at sprint planning 2026-08-22

Verification (development, 2026-08-22):
* automated: 36/36 server tests green (`server/src/routes/login.test.ts` — 7 new tests
  covering success, unknown email, wrong password, unconfirmed account, missing fields,
  and `GET /api/me` signed-in/signed-out), 21/21 client tests green
  (`client/src/LoginPage.test.tsx` — new; `client/src/App.test.tsx` — rewritten for the
  header/banner restructure)
* manual, disposable server instance on port 4123 with matching `APP_BASE_URL` (per this
  sprint's DO): expedite-signed-up a user, confirmed `POST /api/login` returns 401 for wrong
  password and for an unknown email with the same `invalid_credentials` body, confirmed 200 +
  `Set-Cookie` for the right password, confirmed `GET /api/me` returns 401 with no cookie and
  200 with it, confirmed the `session` row actually lands in Postgres (not just in-memory) via
  `psql`, and confirmed `GET /api/confirm?token=...` redirects to `/?status=ok` (not
  `/confirm-result`) using a real signup + Mailpit-captured email
* gap, not closed: the DoD's "manual/Playwright browsing-only verification" was done at the
  HTTP level (curl following the same redirect chain a browser follows), not through an
  actual browser clicking links starting from `/`. No Playwright (or other browser-automation)
  setup exists anywhere in this repo yet — adding one is a bigger addition than this story's
  own scope, so it wasn't done silently. Flagging for Sprint Review: either accept the
  HTTP-level verification as sufficient for this story, or scope a small follow-up PBI to add
  browser-automation infrastructure before the next story that calls for it.
