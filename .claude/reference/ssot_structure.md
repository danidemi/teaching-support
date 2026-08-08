This file describe the structure of a folder which content represent the Single Source Of Truth (SSOT)

In this document `<ROOT>` is the folder of the project.



| Store Name | Path | Holds |
|---|---|---|
| LOGISTICS | `<ROOT>/specifications/logistics.md` | Describe all logistic aspects of the course. |
| STUDENT_PERSONAS | `<ROOT>/specifications/student_personas.md` | Defines all students personas participating in the course. |
| GOALS | `<ROOT>/specifications/goals.md` | Clearly states the course goals. |
| DESIGN | `<ROOT>/design/knowledge_goals_graph.json` | A graph representing what knowledge are needed to obtain other knowledge that in the end allow the student to obtain a skill. Written by `learning-curriculum-architect`: persona id list, `Baseline`/`DesiredResult`/`Prerequisite` nodes, `Requires` edges, deliberate roots, depth staging. Shape fixed by `<ROOT>/.claude/reference/knowledge_goals_graph.schema.json`. |
| CURRICULUM | `<ROOT>/design/curriculum.json` | The course curriculum — how the DESIGN graph is organized for delivery (sessions, ordered items, delivery style/pattern, assessments, support material). Written by `learning-curriculum-sequencer`. Shape fixed by `<ROOT>/.claude/reference/curriculum.schema.json`. |
| EDITORIAL_GUIDELINES | `<ROOT>/specifications/editorial_guidelines.md` | Instructional language, tone/register, terminology consistency rules, idiom/metaphor policy, visual template/branding pointers, accessibility notes. Written by `learning-requirements-gatherer` as its fourth store. |
| MATERIAL | `<ROOT>/material/` | The teaching material: slides, teacher/student books, quizzes, demo scripts, hands-on guides, project work, rubrics, reading guides, and so on. Split into two physically separate trees, `material/teacher/` and `material/student/` (plus `material/slides/`, shared) — a file's tree membership is its access-control signal; nothing with teacher-only content may sit under `material/student/`. |
| MATERIAL — slides | `<ROOT>/material/slides/session-NN.yml` | One reviewable deck model per session. No main-loop skill currently drives this; see `<ROOT>/tools/slides/`. Format: `<ROOT>/.claude/reference/slide_model_spec.md`. Images in `material/slides/assets/`. Rendered `.pptx`/`.pdf` land in `material/slides/out/` and are **build products** — git-ignored, never hand-edited, regenerate from the model. |
| MATERIAL — teacher book | `<ROOT>/material/teacher/books/session-NN-teacher-book.adoc` | One AsciiDoc book per session, sectioned per lesson item. Written by `learning-teacher-book-author`. Shape: `<ROOT>/design/teacher_book_spec.md`. |
| MATERIAL — student book | `<ROOT>/material/student/books/session-NN-student-book.adoc` | One AsciiDoc book per session, sectioned per lesson item. Written by `learning-student-book-author`. Shape: `<ROOT>/design/student_book_spec.md`. |
| MATERIAL — quizzes | `<ROOT>/material/student/quizzes/session-NN-<node_ref>-quiz-<kind>.md` (student) and `<ROOT>/material/teacher/quizzes/session-NN-<node_ref>-quiz-<kind>-key.md` (teacher key) | One quiz + key per triggering item, `kind` one of `prereq-check`/`engagement`/`assessment`. Written by `learning-quiz-author`. Shape: `<ROOT>/design/quiz_spec.md`. |
| MATERIAL — demo scripts | `<ROOT>/material/teacher/demo-scripts/session-NN-<node_ref>-demo-script.adoc` | One per `lecture_demo` item. Written by `learning-demo-script-author`. Shape: `<ROOT>/design/demo_script_spec.md`. |
| MATERIAL — hands-on guides | `<ROOT>/material/teacher/hands-on/session-NN-<node_ref>-setup-guide.adoc` (teacher) and `<ROOT>/material/student/hands-on/session-NN-<node_ref>-solving-guide.adoc` (student) | One pair per `hands_on_practical` item, same exercise from two angles. Written by `learning-hands-on-guide-author`. Shape: `<ROOT>/design/hands_on_guide_spec.md`. |
| MATERIAL — project work | `<ROOT>/material/student/project-work/session-NN-<node_ref>-project-work.adoc` (student brief) and `<ROOT>/material/teacher/project-work/session-NN-<node_ref>-facilitation-notes.adoc` (teacher notes) | One pair per `project_based` item. Written by `learning-project-work-author`. Shape: `<ROOT>/design/project_work_spec.md`. |
| MATERIAL — rubrics | `<ROOT>/material/student/rubrics/session-NN-<node_ref>-rubric.md` | One per item with a non-empty `rubric` field, deliberately not duplicated into the teacher tree — students see the exact rubric they are scored against. Written by `learning-rubric-author`. Shape: `<ROOT>/design/rubric_spec.md`. |
| MATERIAL — reading guides | `<ROOT>/material/student/reading-guides/session-NN-<node_ref>-reading-guide.md` | One per item whose `support_material` includes a `reading` entry. Written by `learning-reading-guide-author`. Shape: `<ROOT>/design/reading_guide_spec.md`. |

Not all material exists before hand. Is the agent team goal to produce that material. See
`<ROOT>/.claude/reference/material_catalog.md` for the full type-to-trigger-to-path registry,
and `<ROOT>/design/material_authoring_rules.md` for the rules every authoring subagent follows.


