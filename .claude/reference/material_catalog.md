# Material catalog

Registry of every kind of didactic material can be produced. 
Every authoring subagent `learning-<TYPE>-author` and the
`learning-material-author` orchestrating skill read this file instead of re-deriving the
mapping. 

Trigger values (`delivery_style`, `item_type`, `support_material_kind`) are the enums defined in
`reference/curriculum.schema.json`. Read that schema, do not guess at its enum values.

## Registry

| Material type | Audience | Preferred Formats | Owning subagent | Trigger | Path pattern | Filename pattern |
|---|---|---|---|---|---|---|
| Teacher book | Teacher | AsciiDoc | learning-teacher-book-author | One per CURRICULUM session (compiles every item in that session, any `item_type`/`style`) | `material/teacher/books/` | `session-<NN>-teacher-book.adoc` |
| Student book | Student | AsciiDoc | learning-student-book-author | One per whole course, learner-facing content only | `material/student/books/` | `student-book.adoc` |
| Quiz (student paper) | Student | Markdown | learning-quiz-author | Item with `item_type: checkpoint` or `item_type: assessment` → `kind: assessment`. A `kind: prereq-check` or `kind: engagement` quiz has no automatic curriculum trigger yet — the orchestrating skill offers it as an optional extra per session/item on human request, and the author records that choice as an `instructional_decisions` entry | `material/student/quizzes/` | `session-NN-<node_ref>-quiz-<kind>.md` |
| Quiz answer key (teacher) | Teacher | Markdown | learning-quiz-author | Same trigger as the paired student quiz — every quiz gets a key | `material/teacher/quizzes/` | `session-NN-<node_ref>-quiz-<kind>-key.md` |
| Demo script | Teacher | AsciiDoc | learning-demo-script-author | Item with `style: lecture_demo` | `material/teacher/demo-scripts/` | `session-NN-<node_ref>-demo-script.adoc` |
| Hands-on setup guide | Teacher | AsciiDoc | learning-hands-on-guide-author | Item with `style: hands_on_practical` | `material/teacher/hands-on/` | `session-NN-<node_ref>-setup-guide.adoc` |
| Hands-on solving guide | Student | AsciiDoc | learning-hands-on-guide-author | Same trigger as the paired setup guide — every `hands_on_practical` item gets both | `material/student/hands-on/` | `session-NN-<node_ref>-solving-guide.adoc` |
| Project work brief | Student | AsciiDoc | learning-project-work-author | Item with `style: project_based` | `material/student/project-work/` | `session-NN-<node_ref>-project-work.adoc` |
| Project work facilitation notes | Teacher | AsciiDoc | learning-project-work-author | Same trigger as the paired brief — every `project_based` item gets both | `material/teacher/project-work/` | `session-NN-<node_ref>-facilitation-notes.adoc` |
| Rubric | Student (teacher reads the same file) | Markdown | learning-rubric-author | Item with a non-empty `rubric` field (`item_type: checkpoint` or `assessment`) | `material/student/rubrics/` | `session-NN-<node_ref>-rubric.md` |
| Reading guide | Student | Markdown | learning-reading-guide-author | An item's `support_material` array contains an entry with `kind: reading` | `material/student/reading-guides/` | `session-NN-<node_ref>-reading-guide.md` |

`node_ref` in a filename is the item's own `node_ref`. For the capstone/final assessment, which
may omit `node_ref` and instead carry `covers_node_refs`, use `capstone` in place of `<node_ref>`.

## Notes for every subagent

- Rubrics are **not** duplicated into the teacher tree. Students see the exact rubric they are
  scored against — that is the point of putting it under `material/student/`. If a rubric needs
  scoring nuance the student copy should not carry, `learning-rubric-author` appends a small
  teacher-only addendum file next to it (same directory naming, `-addendum` suffix) instead of
  forking the whole rubric into `material/teacher/`.
- A quiz `kind` (`prereq-check`, `engagement`, `assessment`) is a field inside the quiz model,
  not a different owning subagent — one spec, one agent, covers all three, per
  `design/quiz_spec.md`.
- A hands-on item and a project-work item each produce **two** files, one per tree, from **one**
  subagent run — the two files describe the same exercise from two angles (how to set it up and
  operate it vs. how to work through it as a learner), not two different exercises.
- No subagent writes to `design/curriculum.json`. A material's existence is discovered by
  matching this catalog's filename pattern against `node_ref`/`session_number`, never by filling
  in `support_material[].uri` on the CURRICULUM item — CURRICULUM has exactly one writer,
  `learning-curriculum-sequencer`.
