ID: LOGIN-EMAIL-001

Status: SUPERSEDED by AUTH-UX-001 (`story_auth_ux.md`) — see that story's Notes,
2026-08-22 backlog refinement

Priority: Medium

Effort: ? (not yet estimated — needs grooming)

As:
a `registered user` who signed up with email and password

I want to:
sign in on a later visit using my email and password

So that:
I can get back into the platform without repeating sign-up, and without using Google
sign-in

Definition of Done:
* [to be defined during grooming — draft shape below]
* a `POST /api/login` (or similar) endpoint checks email + password against the stored
  bcrypt hash and, on success, creates a session (cookie via `express-session`, per the
  session-mechanism decision recorded in `active_sprint/story_expedite_sign_up.md` and
  `active_sprint/story_sign_in_with_own_email.md`)
* login is rejected (generic error, not revealing which part is wrong) when: the email
  doesn't exist, the password doesn't match, or the account's `confirmed_at` is still null
  (unconfirmed — signup exists via SIGN-UP-001/SIGNUP-EXPEDITE-001 but not yet activated)
* after a successful login, the UI reflects the signed-in state (same requirement LOGIN-001
  has for Google sign-in — shared header, per the do/don't rule on checking shared
  components across stories)

Notes:
* added during sprint planning (2026-08-21), grilling `SIGNUP-EXPEDITE-001` and
  `SIGN-UP-001`: neither of those stories creates a session on signup (auto-login was
  explicitly rejected as a security risk — signing up with an email you don't own must not
  grant access), which leaves no way for an email/password user to ever get back in. This
  story closes that gap.
* depends on `express-session` (or equivalent) being wired into `server/` — not yet present
  in the codebase; first story to introduce session middleware
* shares the header component (`client/src/App.tsx`) with LOGIN-001 and TENANT-001 — same
  avatar/signed-in-state UI, coordinate rather than re-touch independently
* out of scope for the current sprint (2026-08-21): SIGNUP-EXPEDITE-001 and SIGN-UP-001 are
  the sprint's scope; this story stays in `backlog/` until groomed and picked up separately

Open questions:
* session store: in-memory (fine for local dev, lost on restart, doesn't scale past one
  server instance) vs. a Postgres-backed session store (`connect-pg-simple` or similar) —
  needs deciding before READY
* login screen: new `/login` route, or reuse `/signup`'s screen with a mode toggle? — needs
  deciding before READY
* rate limiting / lockout after repeated failed attempts — not addressed yet, needs a
  decision (even if the decision is "explicitly out of scope for now")
