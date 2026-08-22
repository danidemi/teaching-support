ID: AUTH-UX-001

Status: DRAFT

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
  stored bcrypt hash and creates a session on success (cookie via `express-session`); login
  is rejected with a generic error (not revealing which part is wrong) when the email
  doesn't exist, the password doesn't match, or `confirmed_at` is still null
  — this is LOGIN-EMAIL-001's former Definition of Done, absorbed here (see Notes)
* clicking the confirmation link (`GET /api/confirm?token=...`) redirects straight to the
  home page instead of `/confirm-result`; the home page shows the confirmation outcome
  (confirmed / expired / used / invalid) — `/confirm-result` is retired
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
  from LOGIN-EMAIL-001)
* shares the header component (`client/src/App.tsx`) with LOGIN-001, LOGOUT-001, and
  TENANT-001 — coordinate rather than re-touch independently
* coordinates with UI-FOUNDATION-001 (`story_ui_foundation.md`) on sequencing — see that
  story's Notes
* out of scope: Google sign-in itself (LOGIN-001, still blocked on OAuth credentials);
  logging out (LOGOUT-001)

Open questions:
* session store: in-memory vs. Postgres-backed (`connect-pg-simple` or similar) — needs
  deciding before READY (carried over from LOGIN-EMAIL-001)
* rate limiting / lockout after repeated failed login attempts — needs an explicit decision,
  even if it's "out of scope for now" (carried over from LOGIN-EMAIL-001)
* exact home-page presentation of the confirm outcome (banner? inline message? auto-dismiss?)
  — needs deciding during grooming
