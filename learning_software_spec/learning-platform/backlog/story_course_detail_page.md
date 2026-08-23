ID: COURSE-DETAIL-001

Status: READY — depends on COURSE-001 finishing its sort-UX rework first (see Dependencies)

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
