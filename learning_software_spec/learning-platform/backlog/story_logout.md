ID: LOGOUT-001

Status: DRAFT

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
* hard dependency: needs a working session mechanism to exist first — i.e. AUTH-UX-001 (or
  LOGIN-001, whichever ships session support first) must be DONE before this is playable
* shares the header component (`client/src/App.tsx`) with LOGIN-001, AUTH-UX-001, and
  TENANT-001

Open questions:
* which story actually ships session middleware first (AUTH-UX-001 vs LOGIN-001) — this
  story is blocked on whichever lands first; needs revisiting once that's clearer
