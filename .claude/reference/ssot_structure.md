This file describe a list of files that represent the Single Source Of Truth (SSOT) for an adult class.

In this document `<ROOT>` is the folder of the project.

Listed Owners are the only skills and agents that are authorized to write that SSOT. All others are can read.

| Store Name | Path | Holds | Owners |
|---|---|---|---|
| LOGISTICS | `<ROOT>/specifications/logistics.md` | Describe all logistic aspects of the course. | skill `learning-requirements-gatherer` |
| STUDENT_PERSONAS | `<ROOT>/specifications/student_personas.md` | Defines all students personas participating in the course. | skill `learning-requirements-gatherer` |
| GOALS | `<ROOT>/specifications/goals.md` | Clearly states the course goals. | skill `learning-requirements-gatherer` |
| DESIGN | `<ROOT>/design/knowledge_goals_graph.json` | A graph representing what knowledge are needed to obtain other knowledge that in the end allow the student to obtain the course goals. Written by : persona id list, `Baseline`/`DesiredResult`/`Prerequisite` nodes, `Requires` edges, deliberate roots, depth staging. Shape fixed by `<ROOT>/.claude/reference/knowledge_goals_graph.schema.json`. | `learning-curriculum-architect` |
| CURRICULUM | `<ROOT>/design/curriculum.json` | The course curriculum — how the DESIGN graph is organized for delivery (sessions, ordered items, delivery style/pattern, assessments, support material). Shape fixed by `<ROOT>/.claude/reference/curriculum.schema.json`. | `learning-curriculum-sequencer` |
| EDITORIAL_GUIDELINES | `<ROOT>/specifications/editorial_guidelines.md` | Instructional language, tone/register, terminology consistency rules, idiom/metaphor policy, visual template/branding pointers, accessibility notes. | `learning-requirements-gatherer` |

Not all material exists before hand. Is the agent team goal to produce that material. See
`reference/material_catalog.md` for the full type-to-trigger-to-path registry,
and `material_authoring_rules.md` for the rules every authoring subagent follows.


