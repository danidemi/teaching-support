ID: COURSE-DETAIL-001

Status: DONE

Priority: Medium

Effort: 5 (set during grooming, 2026-08-23: reshape existing routing, add breadcrumb, adjust
the courses list's click behavior, cover with tests)

As:
a `trainer`

I want to:
click a course in the courses list and land on a course detail page for it, showing that
course's components (quizzes now; didactic materials and other components in later sprints)

So that:
there is one consistent place to work on everything belonging to a selected course, and I
always know which course I'm in

Definition of Done:
* clicking a course row on the courses list (`COURSE-001`) navigates to a course detail page
  for that course
* the course detail page's breadcrumb reads `Courses > <selected course name>`
* the course detail page shows the course's quizzes (the list/delete/re-upload UI already
  built by `QUIZ-DASHBOARD-001`) as one component/section of the page
* decided at grooming (2026-08-23): clicking a course row on the courses list navigates
  **directly** to the detail page — no intermediate "selected course" state or "View
  quizzes" link on the list page itself. The list page's own breadcrumb goes back to always
  reading `Courses > (no course selected)` (per COURSE-001's wireframe), since nothing is
  ever "selected" on that page anymore; only the detail page, reached by navigation, shows
  `Courses > <course name>`
* verified automatically: navigating from the courses list to a course, and from there to a
  different course, updates the breadcrumb and the shown quizzes correctly each time (existing
  QuizDashboardPage tests continue to pass, plus new tests for the breadcrumb and navigation)

Notes:
* **this reshapes existing navigation, not greenfield work.** Today, per
  `past_sprints/sprint_26_08_23_12_32/story_quiz_dashboard.md`'s dev notes: clicking a course
  row on `CourseDashboardPage` sets in-memory `current course` state and shows a "View
  quizzes" link to `/courses/:courseId/quizzes`; that quizzes page has **no breadcrumb** at
  all. This story turns `/courses/:courseId/quizzes` (or a new route it's replaced by) into
  the actual "course detail page," adds the breadcrumb there, and keeps quizzes as one
  section of it rather than the entire page — needs a decision at grooming on whether the
  quizzes route/component is renamed or a new detail page wraps it.
* course selection is still not persisted (COURSE-001's decision stands: no server-side
  "current course", no session state) — the course id continues to travel via the URL/route
  param, same as `QUIZ-DASHBOARD-001` already does it
* explicitly future work, not in this story's scope: didactic materials or any other course
  component besides quizzes — DoD only requires the page structure to accommodate more
  sections later, not build them now
* the direct-navigation decision above (2026-08-23) removes COURSE-001's row-click
  in-memory-selection behavior and its "View quizzes" link — at planning, update
  `active_sprint/story_course_dashboard.md`'s wireframe/DoD to match once this story is
  scheduled, since it currently still describes selection-then-link

Dependencies:
* COURSE-001 (courses list) — currently `IN PROGRESS` in `active_sprint/`, reworking its
  sort UI; this story should be scheduled after that rework lands, since it changes the same
  page's row-click behavior
* QUIZ-DASHBOARD-001 — done; this story reuses its quiz list UI as-is

Open questions:
* none — direct-navigation decision made at grooming (2026-08-23, see DoD above)

Technical plan (sprint planning, 2026-08-23):
* `client/src/CourseDashboardPage.tsx`: remove `selectedCourse` state, the `aria-selected`
  row highlighting, and the "View quizzes" link; a course row click becomes a plain
  navigation (`window.location.assign`, consistent with this codebase's existing
  full-navigation pattern elsewhere — no `<Router>` dependency needed here since this page
  is already rendered under `<BrowserRouter>` via `main.tsx`, but a plain link/anchor per
  row is simpler than adding `useNavigate` for a one-line redirect) to
  `/courses/:courseId` (new route, replacing today's direct link to
  `/courses/:courseId/quizzes`); breadcrumb permanently reads
  `Courses > (no course selected)` on this page, per the DoD
* new `client/src/CourseDetailPage.tsx` at route `/courses/:courseId`: fetches the course's
  own title (new/reused `GET /api/courses/:courseId` — check `server/src/routes/courses.ts`
  for whether a single-course-by-id endpoint already exists; add one if not, following the
  existing list endpoint's shape) to render the breadcrumb `Courses > <course name>`, then
  renders the existing quiz list/upload/delete/replace UI as one section
* `QuizDashboardPage.tsx`'s existing JSX/logic becomes that section — extracted into a
  `client/src/components/QuizzesSection.tsx` (keeps `courseId` as a prop instead of reading
  it via `useParams` itself) so `CourseDetailPage` can render it without a nested route;
  `/courses/:courseId/quizzes` route is removed in favor of `/courses/:courseId`
* `main.tsx`: replace the `/courses/:courseId/quizzes` route with `/courses/:courseId` →
  `<CourseDetailPage />`
* update `QuizDashboardPage.test.tsx`'s existing coverage to target the extracted
  `QuizzesSection` component directly (same test bodies, same assertions, just rendered via
  the new component/props instead of the page+route); add new `CourseDetailPage.test.tsx`
  for breadcrumb + navigation-between-courses coverage per the DoD
* no ADR needed — reshapes existing routing/components, no new tech-stack element

Verification (development, 2026-08-23):
* implemented exactly per the technical plan: `server/src/routes/courses.ts` gained
  `GET /api/courses/:courseId` (same 401/404 shape as the quizzes route); `QuizDashboardPage.tsx`'s
  logic moved unchanged into `client/src/components/QuizzesSection.tsx` (courseId as a prop);
  new `client/src/CourseDetailPage.tsx` fetches the course, renders the breadcrumb, and renders
  `QuizzesSection`; `CourseDashboardPage.tsx` lost `selectedCourse` state/highlighting/"View
  quizzes" link — a row click now does `window.location.assign('/courses/:courseId')`
  (consistent with this codebase's established full-navigation pattern, not `useNavigate`);
  `main.tsx`'s route table replaced `/courses/:courseId/quizzes` with `/courses/:courseId`
* automated: 89/89 server tests (4 new for `GET /api/courses/:courseId` — signed-out,
  own-tenant, other-tenant 404, nonexistent-id 404) and 50/50 client tests (ported
  `QuizDashboardPage.test.tsx` to `QuizzesSection.test.tsx` unchanged in substance; new
  `CourseDetailPage.test.tsx` for breadcrumb/sign-in-gate/cross-course navigation; updated
  `CourseDashboardPage.test.tsx`'s two selection-dependent tests to assert direct navigation
  and the now-permanent "no course selected" breadcrumb); both `npm run build`s clean
* manual: ran the built server against the real Postgres, signed up + logged in, created two
  courses, confirmed `GET /api/courses/:id` returns each course's own title, confirmed
  `/courses/:id` serves the SPA shell, uploaded a quiz to one course and confirmed it's scoped
  to that course only (the other course's quiz list stayed empty)
* **discovered, out of scope, flagged for a new backlog story**: while testing a malformed
  course id manually, found that `quizzes.ts`'s `authorizeCourse` helper calls
  `courses.findByIdForTenant` **without** a surrounding try/catch — a non-UUID course id
  segment (e.g. a stale/hand-typed URL) makes Postgres reject the query, and the resulting
  rejection is unhandled and **crashes the whole server process**. This is pre-existing
  (predates this story, part of `QUIZ-DASHBOARD-001`/`QTI-22-IMPORT`'s original routes), not
  something COURSE-DETAIL-001 introduced — this story's own new `GET /api/courses/:courseId`
  route wraps the same call in try/catch and correctly returns 500 instead of crashing. Not
  fixed here since it's outside this story's scope; needs its own backlog story
  (a proper 404 for a malformed id, and an audit of other unguarded route handlers for the
  same pattern).
