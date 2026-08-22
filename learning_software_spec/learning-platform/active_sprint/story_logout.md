ID: LOGOUT-001

Status: READY

Priority: Medium

Effort: ? (not yet estimated — needs grooming)

As:
a `registered user` who is currently signed in (by any method)

I want to:
see a log-out button when I'm signed in, and click it to end my session

So that:
I can leave the platform in a shared/public device without staying signed in, and
confirm from the UI that signing in actually worked

Definition of Done:
* whenever a session exists (however it was created — Google via LOGIN-001, or
  email+password via AUTH-UX-001), the header shows a log-out control instead of the
  "Sign in" button
* clicking log out destroys the session (server-side session/cookie invalidated) and the
  header returns to the signed-out state
* after logging out, protected functionality (whatever exists by the time this is picked
  up) behaves as if the user is an `unregistered user` again
* verified: automated test for the logout endpoint (session destroyed, cookie cleared);
  manual/Playwright browsing-only verification that logging in then out is reachable
  end-to-end via the header controls, no URL typed

Notes:
* raised during sprint review (2026-08-22), alongside AUTH-UX-001: neither LOGIN-001 nor
  the former LOGIN-EMAIL-001 (now absorbed into AUTH-UX-001) specified a log-out control,
  even though both create a session
* deliberately kept as its own PBI rather than folded into AUTH-UX-001 or LOGIN-001, since
  its signed-in header state is shared by whichever sign-in method lands first — building it
  once here avoids either of those stories re-solving the same problem
* hard dependency: needs a working session mechanism to exist first — AUTH-UX-001 ships
  session support first (decided at sprint planning 2026-08-22), so AUTH-UX-001 must be DONE
  before this is playable. This is a scheduling dependency, not an open question — the story
  itself is fully specified and can be picked up as soon as AUTH-UX-001 ships.
* shares the header component (`client/src/App.tsx`) with LOGIN-001, AUTH-UX-001, and
  TENANT-001

Open questions:
* none — all resolved at sprint planning 2026-08-22

Verification (development, 2026-08-22):
* automated: 39/39 server tests green (`server/src/routes/login.test.ts` — 3 new tests:
  destroys the session so a subsequent `GET /api/me` reports signed out, clears the session
  cookie, and is idempotent with no session), 23/23 client tests green
  (`client/src/App.test.tsx` — 2 new tests: log-out control replaces "Sign in" once signed
  in, clicking it calls `POST /api/logout` and navigates home)
* manual, disposable server instance on port 4124 with matching `APP_BASE_URL`: signed in,
  confirmed the `session` table had 2 rows (1 from a stale earlier run, 1 for this session),
  logged out, confirmed the row count dropped to 1 (the session was actually destroyed
  server-side, not just the cookie cleared), confirmed `GET /api/me` with the same cookie
  jar returns 401 after logout, and confirmed the logout response's `Set-Cookie` expires the
  cookie (`Expires=Thu, 01 Jan 1970...`)
* same gap as AUTH-UX-001: HTTP-level verification only, no browser/Playwright click-through
  (no such infrastructure exists in this repo)
