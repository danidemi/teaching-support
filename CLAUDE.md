# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

There is no application code, build, test, or lint step here. The repo is
two things at once:

1. **A Claude Code agent/skill system** (`.claude/`) for planning adult courses and producing their didactic material (slides, quizzes, exercises, manuals).
2. **A live test course project** it is being developed against — `specifications/` and `design/` currently hold a likely course that human can regenerate for testing purpose.

## Pipeline and how to invoke it

Phases (`.claude/reference/phases.md`): requirements gathering → curriculum design → instructional
design → materials development. Phase 3 has **no owner**; phase 4 covers slides plus the wider
material catalog below (teacher/student books, quizzes, demo scripts, hands-on guides, project
work, rubrics, reading guides).

- `/learning-requirements-gatherer` — **must be run by the human in the main conversation loop.** It
  interviews the human and writes LOGISTICS, GOALS, STUDENT_PERSONAS, EDITORIAL_GUIDELINES.
- `learning-curriculum-architect` — a subagent; `learning-project-manager` delegates to it with the
  Agent tool once the three requirement stores exist and are signed off. Writes DESIGN.
- `learning-curriculum-sequencer` — a subagent; delegated to once DESIGN is signed off. Writes
  CURRICULUM (`design/curriculum.json`), organizing the DESIGN graph into delivery sessions.
- The slide pipeline (see below) turns approved CURRICULUM items into per-session slide decks.
- `/learning-material-author` — a main-loop skill (its sign-off gate needs conversation). Fans out
  the 8 material-authoring subagents (teacher/student book, quiz, demo script, hands-on guide,
  project work, rubric, reading guide) per CURRICULUM item, collects drafts, and runs the human
  sign-off loop. Registry of which type applies to which item:
  `.claude/reference/material_catalog.md`. Shared authoring rules:
  `design/material_authoring_rules.md`.
- `learning-support-agent-coherence` — run this skill after editing **any** file under
  `.claude/agents/` or `.claude/skills/`. It audits name/path/ownership drift, reports first, and only
  edits after explicit human approval.

Because phase 3 has no owner, the phase-4 authoring roles necessarily make some
instructional-design decisions. Each records them in an `instructional_decisions` list tagged
`awaiting: instructional-designer` rather than burying them in the material's wording — that list
is the handover when a phase-3 owner exists.

## The rule that shapes the whole design: skill vs. subagent

A subagent receives one prompt and returns one final message — it has **no channel to ask the human
anything mid-run**. Therefore:

- Anything **interactive** must be a **skill running in the main loop** (hence requirements gathering
  is a skill, not an agent, and neither the orchestrator nor any subagent can run it — they must stop
  and ask the human to invoke it).
- Only **non-interactive design decisions** become subagents.

Preserve this split when adding roles. Delegation is blocking; independent subagent calls go in one
message to run in parallel, dependent ones are chained.

## Single Source of Truth

One authoritative store per domain, **exactly one writer**, everyone else reads the *current* version
before generating — retrieval before generation, never memory or invention. `.claude/reference/ssot_structure.md`
is canonical for paths:

| Store | Path | Writer |
|---|---|---|
| LOGISTICS | `specifications/logistics.md` | learning-requirements-gatherer (skill) |
| GOALS | `specifications/goals.md` | learning-requirements-gatherer (skill) |
| STUDENT_PERSONAS | `specifications/student_personas.md` | learning-requirements-gatherer (skill) |
| EDITORIAL_GUIDELINES | `specifications/editorial_guidelines.md` | learning-requirements-gatherer (skill) |
| DESIGN (knowledge graph) | `design/knowledge_goals_graph.json` | learning-curriculum-architect |
| CURRICULUM | `design/curriculum.json` | learning-curriculum-sequencer |
| MATERIAL — slides | `material/slides/session-NN.yml` | no main-loop skill currently drives this; see `tools/slides/` |
| MATERIAL — everything else | `material/teacher/`, `material/student/` | the 8 phase-4 authoring subagents, fanned out by `/learning-material-author`; see `.claude/reference/material_catalog.md` |

Stores hold **hypotheses as well as facts** — the prerequisite graph and the personas are informed
guesses. Every entry carries a confidence/provenance tag (`[stated]`, `[inferred]`,
`[invented framing]`, `[risk]`); low-confidence entries route to human review, and downstream work on a
still-provisional store is blocked pending sign-off.

## The slide pipeline (`tools/slides/`)

One of the repo's two toolchains (the other is `tools/graph/`, below), and it is fully
containerised — the host needs Docker and nothing else. First `slides build` takes a few minutes
and ~1.6 GB of disk.

```bash
tools/slides/slides check   material/slides/session-01.yml   # lint + coverage
tools/slides/slides preview material/slides/session-01.yml   # DRAFT-stamped render
tools/slides/slides render  material/slides/session-01.yml   # requires status: approved
```

- **The model is the source; `.pptx`/`.pdf` are build products** under `material/slides/out/`,
  git-ignored, never hand-edited. Model format: `.claude/reference/slide_model_spec.md`. Design rules:
  `.claude/reference/slide_design_rules.md` (distilled from `doc/writing_effective_slides.md` — a
  rewrite, not a mirror copy, so re-derive it rather than diffing).
- **Thresholds live in `tools/slides/slide_rules.yml`**, never hard-coded in the scripts. Only
  mechanical defects are errors; every judgement call is a warning, so the linter never blocks a render
  on a false positive.
- **Nothing hand-computes what a script computes.** `slidelint.py` does the counts, required fields,
  licence metadata, Kolb/lane completeness, timing sums and the notes-novelty KPI; `coverage.py` checks
  objectives and units in both directions. Do not report a KPI you did not run.
- **`status: approved` is set by a human only.** `render` refuses a draft; `preview` stamps `[DRAFT]`.
- **`reference.pptx` is generated, not authored** — `make_reference.py` patches pandoc's default
  template, whose title placeholder holds only two lines at 33pt and clips the three-line sentence
  headlines the Assertion-Evidence model produces. Re-run it inside the container if pandoc changes.
- `tools/slides/example/fixture.yml` is the pipeline self-test — check it first to tell a bad deck
  apart from a bad toolchain.

## The knowledge graph editor (`tools/graph/`)

The repo's other toolchain — a browser app for viewing, editing, and certifying the DESIGN store
(`design/knowledge_goals_graph.json`). Also fully containerised.

```bash
tools/graph/graph edit  design/knowledge_goals_graph.json   # opens a browser, view/edit/save
tools/graph/graph check design/knowledge_goals_graph.json   # schema + closure check, headless
```

- **The JSON file is the source; the canvas layout is not** — positions are re-computed with
  Dagre on every load and never persisted, so they can't pollute a diff. Model reference:
  `.claude/reference/knowledge_goals_graph_model.md`; shape authority:
  `.claude/reference/knowledge_goals_graph.schema.json`.
- **A git commit of the JSON file is the certification** — unlike the slide pipeline there's no
  `status: approved` flag; the store is plain text, one writer, human-reviewed via the normal git
  diff.
- **Nothing hand-computes what `check.mjs` computes.** Schema validation and the closure check
  (every node needs a path down to a `Baseline`, unless it's marked `root: true`) run there; do
  not eyeball a graph for either and report it as checked.
- `tools/graph/README.md` covers running it in detail; `doc/tmp/app-editing-chart/plan.md` is the
  build log for how this toolchain came to exist, including the bugs found along the way.

## Known traps

- **An abandoned `learning/` layout.** An older design put stores under `learning/project.md`,
  `learning/ssot/…` and `learning/output/…`; `learning` is in `.gitignore` and nothing lives there. The
  live agent files no longer reference it, so treat any `learning/…` path you meet as a leftover to fix,
  and never "correct" a file that already uses the canonical paths to match it.
- **Commented-out roster.** Lines prefixed with `#` in `learning-project-manager.md` describe
  *planned* agents, skills, and stores that do not exist — e.g. `instructional-designer`,
  `assessment-designer`, `editor`, `proof-reader`, `pedagogy-reviewer`; delegating to any of them
  will fail. Check comment status byte-exactly (`grep -n '^#' <file>`): `#` also starts Markdown
  headings, which are live text. The agents and skills that do exist: `learning-project-manager`,
  `learning-curriculum-architect`, `learning-curriculum-sequencer`, and the 8 phase-4 authoring
  subagents listed in `.claude/reference/material_catalog.md`; the skills
  `learning-requirements-gatherer`, `learning-material-author`, and
  `learning-support-agent-coherence`.
- **Duplicated theory docs.** `.claude/reference/andragogy_principles.md`,
  `experiential_learning.md`, and `curriculum_sequencing_summary.md` are byte-identical copies of
  `doc/pedagogic/*` / `doc/curriculum_sequencing_summary.md`. **Agents read the `.claude/reference/`
  copies** (the architect refers to them as `reference/…`, without the `.claude/` prefix); `doc/` is
  the human-facing research library. Edit both if the theory changes.

## Special folders

* **doc/**: and all its nested folders, reserved to humans. Do not read from it, do not write in it unless explicitly told.
This directory holds the research this system implements — pedagogy (`doc/pedagogic/`: andragogy, Kolb's
experiential cycle, cognitive load, persona definition), assessment design, content standards, and the
LLM prerequisite-graph notes. `doc/ai-architectures/possible_architecture.md` describes the full
aspirational agent roster and SSOT rationale; `reusable_agents.md` covers the folder-as-project-boundary
model. Consult these before inventing a new pedagogical rule — it is probably already specified there.

## Editing rules for agents and skills

To ensure maximum accessibility for non-native English speakers and international audiences, strictly follow these writing guidelines when asked to create, edit, review skills and agents:

1. **Avoid Idioms and Metaphors:** Do not use idiomatic expressions, regional slang, or figurative phrases (e.g., avoid "touch base," "get your feet wet," "hit the ground running," or "running to land").
2. **Use Literal & Direct Terms:** State concepts using clear, precise, and literal language. Choose the most direct verb or phrase to describe an action or state.
3. **Prefer Plain Language:** Use widely recognized standard vocabulary. Avoid rare, obscure, or overly complex prose when simple, standard English conveys the same meaning.
4. **Maintain Clarity Over Rhetoric:** Prioritize scannability, clarity, and ease of translation over clever phrasing or literary flair.

#### Examples:
* **Avoid:** "This concept needs to be seen running to land."
  **Use:** "Students need to see this system execute live to fully understand it."
* **Avoid:** "Before we jump into the weeds, let's touch base on the setup."
  **Use:** "Before we discuss the detailed steps, let's review the required setup."
* **Avoid:** "This feature is currently on the back burner."
  **Use:** "This feature is currently deprioritized."