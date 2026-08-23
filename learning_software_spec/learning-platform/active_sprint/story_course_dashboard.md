ID: COURSE-001

Status: IN PROGRESS

Priority: Medium

Effort: 8 (added during grooming, 2026-08-21: full CRUD-ish screen — list, sort, create
modal, selection, breadcrumb — even with the wireframe already drawn)

As:
a `trainer`

I want to:
see a dashboard listing all courses in my current tenant, sort that list, create a new
course from it, and select one course from it to work on

So that:
I can find, start, and switch between the courses I manage, all from one screen

Definition of Done:
* the dashboard shows all courses that belong to my `current tenant` (see `story_tenant_creation.md` —
  this story depends on TENANT-001; "all courses" never means courses outside my tenant)
* I can sort the list by title, creation date, or last update date by clicking the column
  header, not a separate "Sort by" dropdown: 1st click on a header sorts ascending, 2nd
  click on the same header sorts descending, 3rd click removes sorting on that column; the
  currently active column shows a graphical indicator (e.g. an arrow) of its current sort
  direction (rejected at sprint review, 2026-08-23 — see "Sprint review feedback" below)
* a visible action ("New course") opens a form asking for the course's name before creating it
* two courses in the same tenant cannot share the same name (uniqueness is scoped to the
  tenant, not global)
* clicking a course row selects it as the `current course`
* the `current course` is shown in a breadcrumb, visible from the dashboard and from any
  course sub-view
* no other course action (uploading slides/quizzes, editing, deleting) is in scope — this
  story covers list, sort, create, and select only
* no pagination: all of the tenant's courses load in one list (decided at sprint planning
  2026-08-22 — trainers aren't expected to manage hundreds of courses)
* empty state: when the tenant has no courses yet, the dashboard shows a friendly
  "no courses yet, create one" message instead of an empty table (decided at sprint
  planning 2026-08-22)

Wireframe (drawn during grooming, per `reference/do_and_donts.md`'s rule for front-end-heavy
stories without enough visual detail in the story text):

```
+------------------------------------------------------------------+
| Learning Platform                              [Tenant: Acme] [👤]|
+------------------------------------------------------------------+
| Breadcrumb: Courses  >  (no course selected)                     |
+------------------------------------------------------------------+
|  [+ New course]                     Sort by: (Title v)(Created v)(Updated v)
+------------------------------------------------------------------+
|  Title                | Created     | Last updated   |            |
|  ---------------------|-------------|----------------|            |
|  > Intro to Python     | 2026-01-10  | 2026-08-01     |  (row,     |
|  > Advanced SQL        | 2026-03-02  | 2026-07-15     |  clicking  |
|  > Onboarding basics   | 2026-06-20  | 2026-06-20     |  selects)  |
+------------------------------------------------------------------+
```

* clicking "+ New course" opens a modal/form with a single required "Course name" field and
  Create/Cancel buttons
* after creating a course, the dashboard refreshes and the new course row appears
* clicking a row updates the breadcrumb to `Courses > <course name>`

Notes:
* this story replaces three earlier drafts (course creation, course dashboard, course
  selection) that were found during grooming (2026-08-20) to describe one screen, sharing
  one wireframe and one Definition of Done, and that had accidentally reused the same ID
  (`COURSE-MANAGEMENT`) — merging removed the ID collision
* depends on TENANT-001 (tenancy-before-courses, decided during grooming 2026-08-20): course
  rows are tenant-scoped from the start, per `adr/ADR-0002-persistence-and-iam.md`
* shares the header component (`client/src/App.tsx`) with LOGIN-001 and TENANT-001 — this
  story's wireframe draws the same `[Tenant: Acme] [👤]` block those stories build; no new
  header work is expected here (noted during grooming, 2026-08-21, per
  `reference/do_and_donts.md`'s rule to check shared components across stories)
* QTI-22-IMPORT (uploading a quiz) depends on a course existing to upload into — see
  `story_upload_qti_22_quiz.md`

Open questions:
* none — pagination/empty-state resolved at sprint planning 2026-08-22. The lack of a
  front-end UI-library ADR is closed by UI-FOUNDATION-001 (shadcn/ui, ADR-0006). Revised
  during the sprint (see `active_sprint/sprint.md`'s Development sequence): UI-FOUNDATION-001
  is built *before* this story, not after, so this dashboard is built directly on shadcn/ui
  components rather than ad-hoc-styled and restyled later.

Technical decisions made during development (2026-08-22), not specified by the story text:
* "current course" selection is this page's own React state, not a route param or anything
  persisted server-side — no course sub-view exists yet for it to survive navigation into,
  and the DoD only requires the breadcrumb on *this* page to reflect the selection. How
  selection carries into a sub-view is QUIZ-DASHBOARD-001's decision to make, not invented
  here ahead of need.
* `GET /api/courses` and `POST /api/courses` both require a session (`req.session.tenantId`,
  from TENANT-001) — there is no "courses with no tenant" case, so unauthenticated access is
  a flat 401, not an empty list
- extracted a shared `AppHeader` component (`client/src/components/AppHeader.tsx`) and a
  `useSignedInUser` hook (`client/src/lib/session.ts`) out of `App.tsx` — this is the 4th
  screen needing the signed-in header, and the sprint plan flagged rebuilding it repeatedly
  as a risk to avoid; `SignUpPage`/`LoginPage` were refactored onto the same component as
  part of this change (behavior unchanged, verified by their existing tests staying green
  untouched)
* create-course modal is a plain `role="dialog"` overlay, not a native `<dialog>` or a Radix
  Dialog primitive — jsdom's `<dialog>.showModal()` isn't reliably testable, and adding a new
  Radix dependency for one modal wasn't justified by this story's scope

Verification (development, 2026-08-22):
* automated: 52/52 server tests green (`server/src/routes/courses.test.ts` — 11 new tests:
  401 when signed out for both endpoints, tenant-scoped listing, sort by each field with a
  safe fallback for an invalid `sortBy`, empty list for a fresh tenant, create + 201,
  duplicate-title 409 scoped to tenant, same title allowed across tenants, invalid/missing
  title 400), 32/32 client tests green (`CourseDashboardPage.test.tsx` — 8 new tests: sign-in
  prompt, empty state, list rendering, breadcrumb selection and its unselected default, create
  flow closing the dialog and refreshing the list, duplicate-title error keeping the dialog
  open, Cancel closing without creating)
* manual, disposable server instance on port 4127 against a cleaned database: two tenants,
  each creating "Advanced SQL" — confirmed the second tenant's creation succeeds (409 only
  within the same tenant), confirmed each tenant's `GET /api/courses` only returns their own
  courses, confirmed sorting by title returns alphabetical order, confirmed an unauthenticated
  `GET /api/courses` is a flat 401, and confirmed `/courses` serves the SPA shell (200)
* same gap as every other story this sprint: no browser/Playwright click-through, no visual
  review of the rendered table/modal — HTTP/API-level verification only

Technical plan (sprint planning, 2026-08-23):
* no server change needed: `GET /api/courses` already returns the full unpaginated list for
  the tenant (no pagination per this story's own DoD), so ascending/descending/unsorted
  states are all computed **client-side** by re-sorting the already-loaded `Course[]` array —
  no new `sortDir` query param, no server-side change to `courses.listByTenant`
* `CourseDashboardPage.tsx`: replace the "Sort by" `<select>` with `onClick` handlers on each
  `<th>`; track `{ column: SortBy | null; direction: 'asc' | 'desc' }` in state instead of
  the current plain `sortBy`; clicking a header cycles `asc → desc → null` (unsorted) if it's
  the active column, or starts at `asc` if it's a different column; render an arrow
  (`▲`/`▼`) next to the active column's header text, nothing on the others; unsorted falls
  back to the order `GET /api/courses` returns (its existing default, title ascending)
* no ADR needed — no tech-stack change, same React state + shadcn/ui table already in place

Sprint review feedback (2026-08-23) — rejected, not accepted as DONE:
* the built sorting UI is a "Sort by:" dropdown (per the wireframe drawn at grooming); the
  human wants column-header click-to-sort instead, with standard tri-state cycling
  (ascending → descending → unsorted) and a visible sort-direction indicator on the active
  header. The wireframe above is now stale on this point and needs correcting before rework
  starts.
* carried into the next sprint as unfinished work, not returned to `backlog/` as new
  grooming — the DoD is now specific enough; this only needs implementation.
