ID: HOME-LOGIN-001

Status: READY

Priority: High

Effort: 3 (set during grooming, 2026-08-23: extract a shared sign-in-form component out of
`LoginPage.tsx`, render it on the home page, add a signed-in redirect — no new backend work)

As:
an `unregistered/signed-out user`

I want to:
see the sign-in form directly on the home page, not just a "Sign in" button that leads to a
separate page

So that:
I can log in in one step instead of clicking through to `/login` first

Definition of Done:
* the home page (`/`) shows the same email/password sign-in form that `/login` shows, without
  requiring a click to a separate page first
* the sign-in form is a single shared/reusable component used by both the home page and the
  existing `/login` page — not two copies of the same markup/logic
* submitting the form from the home page behaves identically to submitting it from `/login`
  (same validation, same error messages, same successful-login redirect)
* `/login` itself still exists and still works (for any direct link/bookmark to it) — this
  story does not remove that route
* a **signed-in** user visiting `/` does not see the sign-in form — decided at grooming
  (2026-08-23): they are redirected to `/courses`. No signed-in home/dashboard content exists
  yet (`HOME-001` only ever covered the signed-out home page), and building one is
  out-of-scope new UI work beyond this story's "add a login form" ask; a richer signed-in
  home page is left for a future PBI if wanted
* verified automatically: existing `/login` tests keep passing unmodified against the
  extracted shared component, plus new tests for the form's presence/behavior on the home
  page and for the signed-in redirect

Notes:
* likely touches `client/src/pages/LoginPage.tsx` and whatever the home page component is —
  needs a look during grooming/planning at how much of `LoginPage.tsx` is "the form" vs. page
  chrome (header, layout) that should stay page-specific
* `AppHeader`/`useSignedInUser` (`client/src/components/AppHeader.tsx`,
  `client/src/lib/session.ts`) is the precedent for "extract a shared piece once several pages
  need it" — same approach likely applies here (see COURSE-001's dev notes,
  `past_sprints/sprint_26_08_23_12_32/story_course_dashboard.md`)
Open questions:
* none — signed-in behavior (redirect to `/courses`) decided at grooming (2026-08-23, see
  DoD above)
