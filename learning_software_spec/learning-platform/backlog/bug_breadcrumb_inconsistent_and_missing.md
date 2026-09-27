ID: BUG-BREADCRUMB-NAV

Status: READY

Steps To Reproduce:
1. Open `/courses` (Course dashboard) before selecting any `course`.
2. Select a `course` (e.g. "Seed Course").
3. From the course detail page, open a `quiz`'s Sessions list, then click into a specific `quiz
   session` (e.g. its monitor/history page).

Expected result:
A breadcrumb is present and correct at every step, letting the trainer navigate back up the
structure at any point, rendered by one shared, route-driven breadcrumb component (decided with
the human 2026-09-27 — not per-page duplication):
1. `Courses` alone, with no placeholder second segment, since nothing is "selected" on `/courses`
   (decided with the human 2026-09-27 — drop the "(no course selected)" text rather than keep it).
2. `Courses > Seed Course` — correct today.
3. `Courses > Seed Course > <Quiz title> > <Session start date/time>`, on both the Sessions-list
   page and the session monitor/history page. `<Quiz title>` links to the quiz's Sessions list
   (`/quizzes/:quizId/sessions`) — there is no separate quiz-detail page. `<Session>` is identified
   by its start date/time (e.g. "27/09/2026, 16:00"), matching the Started column already shown in
   the sessions table. Decided with the human, 2026-09-27.

Actual result:
1. `Courses > (no course selected)` is always shown on `/courses` — confirmed in code
   (`CourseDashboardPage.tsx`'s own comment: since COURSE-DETAIL-001, clicking a course row
   navigates straight to its detail page instead of "selecting" it in place, so nothing on this
   page is ever "selected" and the second breadcrumb segment is a permanent placeholder by
   design). The user finds this confusing/inconsistent even though it's intentional.
2. `Courses > Seed Course` — correct, rendered by `CourseDetailPage.tsx`.
3. The breadcrumb disappears entirely once a `quiz session` is opened, from both the Sessions list
   and a specific session's own page. Confirmed in code: a `<nav aria-label="Breadcrumb">` exists
   only in `CourseDashboardPage.tsx` and `CourseDetailPage.tsx` — `QuizSessionHistoryPage.tsx` and
   `QuizSessionMonitorPage.tsx` render no breadcrumb at all, so there is no way back to the
   `course`/`quiz` the trainer was working on except the browser's Back button.

Priority: Medium — a real navigation dead-end for trainers running a live class, though a browser
Back button is a workaround.

Effort: 5

Verification: manual — screenshot of the breadcrumb at each of the three steps above (`/courses`,
course detail, quiz session monitor/history), per `do_and_donts.md`'s screenshot rule for
GUI-touching changes.

Note:
User's own words: "I click a quiz session and it disappear, so I cannot go back to the course I
was working on. I click on a specific session and the breadcrumb is still missing so I cannot go
back in the structure."

Decided with the human (2026-09-27):
* build one shared, route-driven breadcrumb component (not per-page copies), used by
  `CourseDashboardPage.tsx`, `CourseDetailPage.tsx`, `QuizSessionHistoryPage.tsx`, and
  `QuizSessionMonitorPage.tsx`
* drop the "(no course selected)" placeholder entirely — `/courses` shows just `Courses`

Edge case flagged during grooming, not yet decided: the sessions table's own screenshot shows a
session that "not started yet" (`startedAt: null`) — `<Session start date/time>` has no value to
show for that case. Development should pick a reasonable fallback label (e.g. "Not started") and
flag it for human confirmation rather than leaving the segment blank or crashing.

This story also touches `QuizSessionHistoryPage.tsx`/`QuizSessionMonitorPage.tsx`, which
`TABLE-STYLE-001` touches too — flag that overlap at sprint planning per `do_and_donts.md`'s
sprint_26_08_20 entry on shared-page coupling.

Technical finding (grooming, 2026-09-27, confirmed by reading the code): neither
`GET /api/quizzes/:quizId/sessions` nor `GET /api/quiz-sessions/:sessionId` returns the quiz's
title or its `courseId` — there is no `GET /api/quizzes/:quizId` endpoint at all today. Building
the `Courses > <course> > <quiz> > <session>` trail on the Sessions-list and monitor/history pages
needs a new way to resolve quiz → course (and session → quiz for the monitor page), not just a
route param read. This affects both the design (still open, above) and the effort estimate.
