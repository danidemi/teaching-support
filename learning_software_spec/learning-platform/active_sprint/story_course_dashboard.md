ID: COURSE-001

Status: READY

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
* I can sort the list by title, creation date, or last update date
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
