ID: HOME-LOGIN-001

Status: DONE

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

Technical plan (sprint planning, 2026-08-23):
* extract the form block of `client/src/LoginPage.tsx` (email/password inputs, submit
  handler, error message) into a new `client/src/components/SignInForm.tsx` — same
  fetch/`/api/login` logic, same `window.location.assign('/')` on success (per that file's
  existing doc comment, so `/api/me` re-runs against the fresh session cookie); `LoginPage`
  renders `<SignInForm />` inside its existing `<Card>`, no behavior change
* `App.tsx` (home page): when `useSignedInUser()` resolves `user` truthy, redirect to
  `/courses` via `react-router-dom`'s `useNavigate` (already a dependency, used elsewhere —
  e.g. `QuizDashboardPage.tsx`'s `useParams`); when `user` is falsy, render `<SignInForm />`
  in place of the current hero-only body (hero text can stay above/around it, per whatever
  layout looks right — no wireframe exists for this, keep it simple)
* no ADR needed — no tech-stack change, reusing existing routing/session primitives

Deviation from plan (development, 2026-08-23):
* the redirect uses `window.location.assign('/courses')`, not `useNavigate` — ADR-0004
  ("Client-side routing") explicitly keeps `App.tsx` free of any `<Router>`-ancestor
  requirement so it "keeps rendering standalone in tests with no `<Router>` ancestor";
  `useNavigate` throws outside a Router. A full navigation also matches the pattern
  `SignInForm`/`LoginPage` already use on successful login, for the same reason (session
  cookie freshness).

Verification (development, 2026-08-23):
* implemented: `client/src/components/SignInForm.tsx` (new, shared) holds the
  email/password fields, submit handler, and error message, extracted unchanged out of
  `LoginPage.tsx`; `LoginPage.tsx` now renders `<SignInForm />` inside its existing `<Card>`;
  `App.tsx` renders the same `<SignInForm />` in a `<Card>` when signed out, alongside the
  existing "Sign up" button, and redirects to `/courses` via `window.location.assign` in a
  `useEffect` once `user` is truthy
* automated: 47/47 client tests green — all pre-existing `/login` tests pass unmodified
  against the extracted component; 4 new tests in `App.test.tsx` (home page shows the
  form, submitting it behaves like `/login`, a signed-in visitor is redirected to
  `/courses`, a signed-out visitor is not redirected); `npm run build` succeeds with no
  type errors
* manual: not run this pass — same sprint-wide gap tracked by E2E-BROWSER-001 (deferred)
