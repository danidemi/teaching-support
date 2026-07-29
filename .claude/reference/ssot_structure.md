This file describe the structure of a folder which content represent the Single Source Of Truth (SSOT)

In this document `<ROOT>` is the folder of the project.


* : A graph representing what knowledges are needed to make the student obtain the goals
* : the course curriculum
* : folder containing the rendered material


| Store Name | Path | Holds |
|---|---|---|
| LOGISTICS | `<ROOT>/specifications/logistics.md` | Describe all logistic aspects of the course. |
| STUDENT_PERSONAS | `<ROOT>/specifications/student_personas.md` | Defines all students personas participating in the course. |
| GOALS | `<ROOT>/specifications/goals.md` | Clearly states the course goals. |
| DESIGN | `<ROOT>/design/knowledge_goals_graph.md` | A graph representing what knowledge are needed to obtain other knowledge that in the end allow the student to obtain a skill |
| CURRICULUM | `<ROOT>/design/curriculum.md` | The course curriculum |
| MATERIAL | `<ROOT>/material/` | The taching material: slides, students guide, practical exercises, and so on |
| MATERIAL — slides | `<ROOT>/material/slides/session-NN.yml` | One reviewable deck model per session, written by the `learning-slide-author` skill. Format: `<ROOT>/.claude/reference/slide_model_spec.md`. Images in `material/slides/assets/`. Rendered `.pptx`/`.pdf` land in `material/slides/out/` and are **build products** — git-ignored, never hand-edited, regenerate from the model. |

Not all material exists before hand. Is the agent team goal to produce that material.


