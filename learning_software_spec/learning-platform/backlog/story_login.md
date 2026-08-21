ID: LOGIN-001

Status: DRAFT

Priority: High

Effort: 5 (added during grooming, 2026-08-21: OAuth flow wiring + header changes + error
state; no persistence yet)

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
