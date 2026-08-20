ID: COURSE-001

Status: DRAFT

Priority: Medium

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

Wireframe (drawn during grooming, per `references/do_and_donts.md`'s rule for front-end-heavy
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
* QTI-22-IMPORT (uploading a quiz) depends on a course existing to upload into — see
  `story.upload-qti-22-quiz.md`

Open questions:
* pagination/empty-state (no courses yet) behavior is not specified — needs grooming before
  this story is sprint-ready
* There isn't any ADR related to front end technologies, as CSS framework, responsiveness, etc.
