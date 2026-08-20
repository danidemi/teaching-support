# DOs and DON'Ts

Running log of process decisions made during retrospectives, to apply in later sprints.
Newest entries at the bottom.

## sprint_26_08_20

* **DO** write a concrete, checkable Definition of Done for a story before starting
  implementation. It removed ambiguity during HOME-001's build — the only rework came from
  a legitimate new decision at sprint review, not from a spec gap.
* **DO** draw a wireframe before implementing a story that involves a large part of the
  front end, at least when the story's own text does not already give enough visual detail
  (layout, colors, placement of elements). Do this during grooming or right before
  development starts, not after a first implementation attempt.
* **DON'T** treat backlog grooming's "check for inconsistencies among other stories" step as
  done without explicitly checking whether stories share the same page/component (e.g.
  HOME-001 and LOGIN-001 shared the same header). This coupling should surface during
  grooming, not later during sprint planning.

## sprint after sprint_26_08_20 (backlog grooming, 2026-08-20)

* **DO** use standard Scrum semantics for story status: `DRAFT` → `READY` once the story has
  passed its Definition of Ready (groomed, DoD is solid, sprint-eligible) → `DONE` once it has
  passed its Definition of Done and been accepted at review. `READY` does **not** mean
  "already developed" — LOGIN-001 was correctly `READY` (groomed, not yet built) and no status
  change was needed for it; the earlier reading of CLAUDE.md's Activity 3 wording caused
  confusion on this point, worth avoiding next time.
* **DON'T** let a sprint review's "carried over as a backlog candidate" note (e.g. the
  `npm audit` finding) stay unconverted into an actual backlog story. It went missing between
  the HOME-001 review and this grooming session; a story now exists
  (`backlog/story_dependency_vulnerabilities.md`).
* **DO** catch duplicate story IDs during grooming, not later. Three drafts (course creation,
  dashboard, selection) all used the same ID (`COURSE-MANAGEMENT`) because they were, in fact,
  one screen — merging them into one story (`story_course_dashboard.md`) fixed both the
  duplication and the artificial three-way split at once.
