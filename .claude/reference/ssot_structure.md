This file describe the structure of a folder which content represent the Single Source Of Truth (SSOT)

In this document `<ROOT>` is the folder of the project.



| Store Name | Path | Holds |
|---|---|---|
| LOGISTICS | `<ROOT>/specifications/logistics.md` | Describe all logistic aspects of the course. |
| STUDENT_PERSONAS | `<ROOT>/specifications/student_personas.md` | Defines all students personas participating in the course. |
| GOALS | `<ROOT>/specifications/goals.md` | Clearly states the course goals. |
| DESIGN | `<ROOT>/design/knowledge_goals_graph.json` | A graph representing what knowledge are needed to obtain other knowledge that in the end allow the student to obtain a skill. Written by `learning-curriculum-architect`: persona id list, `Baseline`/`DesiredResult`/`Prerequisite` nodes, `Requires` edges, deliberate roots, depth staging. Shape fixed by `<ROOT>/.claude/reference/knowledge_goals_graph.schema.json`. |
| CURRICULUM | `<ROOT>/design/curriculum.md` | The course curriculum — how the DESIGN graph is organized for delivery (sessions, units, order). **No writer yet.** |
| MATERIAL | `<ROOT>/material/` | The taching material: slides, students guide, practical exercises, and so on |
| MATERIAL — slides | `<ROOT>/material/slides/session-NN.yml` | One reviewable deck model per session, written by the `learning-slide-author` skill. Format: `<ROOT>/.claude/reference/slide_model_spec.md`. Images in `material/slides/assets/`. Rendered `.pptx`/`.pdf` land in `material/slides/out/` and are **build products** — git-ignored, never hand-edited, regenerate from the model. |

Not all material exists before hand. Is the agent team goal to produce that material.


