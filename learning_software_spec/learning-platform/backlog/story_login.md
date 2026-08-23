ID: LOGIN-001

Status: WON'T DO — Google OAuth sign-in dropped (backlog grooming, 2026-08-23); AUTH-UX-001's
email/password login (`past_sprints/sprint_26_08_23_12_32/story_auth_ux.md`, DONE) is the
platform's only sign-in method going forward. Kept in `backlog/` rather than deleted, as a
record of the decision and its reasoning — not eligible for any future sprint.

Priority: High

Effort: 5 (added during grooming, 2026-08-21: OAuth flow wiring + header changes + error
state; no persistence yet) — moot, story dropped

As:
an `unregistered user`

I want to:
sign in to the platform with a Google account

So that:
* I will be able to use the services that will be provided, i.e. to upload a quiz I prepared to allow my students to access it and take it

Definition of Done:
* as an `unregistered user`, I can open the browser, type the platform URL, and land on the home page (see `past_sprints/sprint_26_08_20/story_access_home_page.md` — HOME-001, DONE)
* on the home page, I can find a sign-in/log-in button
* clicking the button starts the Google account sign-in flow
* after a successful Google sign-in, I become a `registered user`
* once a `registered user`, the UI shows my name/avatar so I can tell I am signed in
* if the sign-in fails or is cancelled, I am shown the login page again with an error message
* verified manually (no automated test yet — the Google OAuth flow is not mocked)

Open questions:
* downgraded from READY to DRAFT during grooming (2026-08-21): a Google Cloud OAuth
  project, client ID/secret, and authorized redirect URIs are not confirmed to exist yet —
  a DoR "cleared dependencies" gap. Needs confirmation before this can go back to READY.

Notes:
* added during backlog refinement (2026-08-22): AUTH-UX-001 (`story_auth_ux.md`) now owns
  the combined sign-in page and header — this story's "sign-in/log-in button" and DoD should
  be reconciled with AUTH-UX-001's `/login` page once both are groomed (Google becomes one
  more option on that page rather than its own flow entry point)
* log-out is LOGOUT-001's (`story_logout.md`) job, not this story's
* **dropped at backlog refinement (2026-08-23)**: the human decided against Google OAuth
  sign-in entirely, rather than clearing the blocked OAuth-credentials dependency — the
  DoR "cleared dependencies" gap noted below is now moot, since there's nothing left to
  clear. Email/password (AUTH-UX-001) is the platform's only sign-in method.
