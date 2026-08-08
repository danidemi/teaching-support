# Plan: didactic material production (phase 4)

Status: **proposed, not started**. Check off a line only after that exact file exists and
matches this plan. This file is a working plan, not an SSOT store — do not read it as a
source of course facts.

## Decisions already made (do not re-litigate)

1. **Architecture**: N non-interactive subagents (one per material type) + 1 main-loop
   orchestrating skill (`/learning-material-author`) that fans them out, collects drafts,
   and runs the single human sign-off loop.
2. **Audience separation**: two physically separate trees, `material/teacher/` and
   `material/student/`. A file's tree membership is its access-control signal — nothing
   with teacher-only content (answer keys, solution walkthroughs, facilitation notes) may
   sit under `material/student/`.
3. **Granularity**: one file per session for the books, sectioned internally per lesson
   item (headed by its `node_ref` and title). Other material types are one file per lesson
   item (see catalog below) since they attach to a single `hands_on_practical` /
   `assessment` / etc. item, not a whole session.
4. **Formats for the previously-unspecified types**: AsciiDoc (`.adoc`) for long-form prose
   (project-work briefs, demo scripts, hands-on setup/solving guides) — same toolchain
   family as the books. Markdown (`.md`) for short/structured content (rubrics, reading
   guides), consistent with quizzes already being `.md`.

## Known pre-existing drift to fix (found during orientation, not introduced by this plan)

- [x] `CLAUDE.md`'s SSOT table lists CURRICULUM as `design/curriculum.md` / "not yet
      created". It is actually `design/curriculum.json`, owned by
      `learning-curriculum-sequencer` (both exist as of commit `ab1ac63`; `curriculum.md` is
      a human-readable render of the json, not a separate store and must be deleted). Fix the row.
      Fixed; `design/curriculum.md` deleted.
- [x] `learning-project-manager.md` still says CURRICULUM has "no owner yet — do not write
      it" in two places. Update now that `learning-curriculum-sequencer` exists and owns it.
- [x] `learning-slide-author` is documented in `CLAUDE.md` and referenced by
      `learning-project-manager.md` as an existing main-loop skill, but no such skill
      directory exists yet (`material/slides/session-01.yml` was produced some other way).
      Remove any reference to such `learning-slide-author`, it is a renmant of an old discarded skill.
      
## New shared reference files (single copy, everyone reads, nobody duplicates)

- [x] `.claude/reference/material_catalog.md` — the registry every subagent and the
      orchestrating skill reads instead of re-deriving: material type → audience → format →
      owning subagent → which `delivery_style`/`item_type`/`support_material_kind` triggers
      it → path pattern → filename pattern. Adding a future material type is one new row
      here plus one new agent file.
- [x] `design/material_authoring_rules.md` — cross-cutting rules shared by every
      authoring subagent: derive only from CURRICULUM + DESIGN + editorial guidelines, never
      invent content; cite the `node_ref`(s) covered at the top of every file; confidence/
      provenance tagging for any inferred (not stated) framing, same spirit as the graph and
      personas; the `status: draft`/`approved` convention (AsciiDoc `:status:` attribute /
      Markdown YAML frontmatter) that stands in for the slide pipeline's render gate; the
      `instructional_decisions` handover list pattern (phase 3 has no owner, so these
      subagents will make some instructional-design calls — record them, tagged `awaiting:
      instructional-designer`, instead of burying them in the prose).
- [x] One shape spec per material type, mirroring `slide_model_spec.md` — each referenced by
      exactly one subagent (written as `design/`, the plan's `desing/` was a typo):
  - [x] `design/teacher_book_spec.md`
  - [x] `design/student_book_spec.md`
  - [x] `design/quiz_spec.md` (covers all three kinds: prereq-check, engagement,
        assessment — one spec, a `kind` field distinguishes them, since the mechanics
        — question/answer/key — are shared)
  - [x] `design/demo_script_spec.md`
  - [x] `design/hands_on_guide_spec.md` (covers both the teacher setup guide and
        the student solving guide for the same lesson item — two outputs, one spec, since
        they describe the same exercise from two angles)
  - [x] `design/project_work_spec.md`
  - [x] `design/rubric_spec.md`
  - [x] `design/reading_guide_spec.md`

## New SSOT store

- [ ] `specifications/editorial_guidelines.md` — new store. Writer:
      `learning-requirements-gatherer` (extended, see below). Holds: instructional
      language, tone/register, terminology consistency rules, idiom/metaphor policy (default
      proposal: avoid idioms whenever the cohort is not entirely native speakers of the
      instructional language, mirroring this repo's own editing rules), visual template/
      branding pointers if any, accessibility notes. Every other new store below is a
      single-writer store the same way, one per material type:

| Store | Path pattern | Writer |
|---|---|---|
| EDITORIAL_GUIDELINES | `specifications/editorial_guidelines.md` | learning-requirements-gatherer |
| MATERIAL — teacher book | `material/teacher/books/session-NN-teacher-book.adoc` | learning-teacher-book-author |
| MATERIAL — student book | `material/student/books/session-NN-student-book.adoc` | learning-student-book-author |
| MATERIAL — quizzes (student) | `material/student/quizzes/session-NN-<node_ref>-quiz-<kind>.md` | learning-quiz-author |
| MATERIAL — quiz keys (teacher) | `material/teacher/quizzes/session-NN-<node_ref>-quiz-<kind>-key.md` | learning-quiz-author |
| MATERIAL — demo scripts (teacher) | `material/teacher/demo-scripts/session-NN-<node_ref>-demo-script.adoc` | learning-demo-script-author |
| MATERIAL — hands-on setup guide (teacher) | `material/teacher/hands-on/session-NN-<node_ref>-setup-guide.adoc` | learning-hands-on-guide-author |
| MATERIAL — hands-on solving guide (student) | `material/student/hands-on/session-NN-<node_ref>-solving-guide.adoc` | learning-hands-on-guide-author |
| MATERIAL — project work brief (student) | `material/student/project-work/session-NN-<node_ref>-project-work.adoc` | learning-project-work-author |
| MATERIAL — project work facilitation notes (teacher) | `material/teacher/project-work/session-NN-<node_ref>-facilitation-notes.adoc` | learning-project-work-author |
| MATERIAL — rubric (student-facing, teacher reads the same file) | `material/student/rubrics/session-NN-<node_ref>-rubric.md` | learning-rubric-author |
| MATERIAL — reading guide (student) | `material/student/reading-guides/session-NN-<node_ref>-reading-guide.md` | learning-reading-guide-author |

Rubrics are deliberately **not** duplicated into the teacher tree: the user's own
requirement is that students see the rubric, so hiding it defeats the point. If a rubric
needs internal scoring nuance the student copy shouldn't carry, `learning-rubric-author`
appends a small teacher-only addendum file instead of forking the whole rubric.

## New subagents (non-interactive, one per material type)

Each of these: reads CURRICULUM + DESIGN + EDITORIAL_GUIDELINES + its own spec +
`material_authoring_rules.md`, writes only its own store row above, never touches another
subagent's files, never writes to `design/curriculum.json` (single-writer rule — the
sequencer owns it; a material's existence is discovered by naming convention against the
catalog, not by anyone filling in `support_material[].uri`).

- [x] `.claude/agents/learning-teacher-book-author.md`
- [x] `.claude/agents/learning-student-book-author.md`
- [x] `.claude/agents/learning-quiz-author.md`
- [x] `.claude/agents/learning-demo-script-author.md`
- [x] `.claude/agents/learning-hands-on-guide-author.md`
- [x] `.claude/agents/learning-project-work-author.md`
- [x] `.claude/agents/learning-rubric-author.md`
- [x] `.claude/agents/learning-reading-guide-author.md`

## New main-loop skill

- [x] `.claude/skills/learning-material-author/SKILL.md` — the human-facing entry point.
      Reads CURRICULUM, resolves scope (whole course / one session / one item) with the
      human, computes which material types apply per item via `material_catalog.md`, fans
      the relevant subagents out **in parallel** (one Agent call per material-type-per-item,
      independent calls batched in one message), presents drafts, collects change requests,
      re-runs only what changed, and on human sign-off flips each file's `status` attribute
      to `approved`. Ends with a manifest: what was produced, where, what is still
      `draft`, and any `instructional_decisions` collected across all subagents this run.

## Updates to existing files

- [x] `.claude/reference/ssot_structure.md` — add the EDITORIAL_GUIDELINES row and the new
      MATERIAL rows from the table above.
- [x] `.claude/skills/learning-requirements-gatherer/SKILL.md` — add an "EDITORIAL
      GUIDELINES" interview section (same structure as GOALS/LOGISTICS/PERSONAS: draw from a
      short framework, ask, propose defaults, confirm). Default proposals to open with:
      idiom/metaphor avoidance when the cohort is not all native speakers of the
      instructional language; one terminology list per course to prevent drift across
      sessions; a named visual template if the client has one, plain/neutral otherwise;
      tone/register (formal vs. conversational) matched to the persona's autonomy
      expectations already captured in STUDENT_PERSONAS. Writes
      `specifications/editorial_guidelines.md` as its fourth store.
      Note: this only adds the interview section to the skill; it does not write
      `specifications/editorial_guidelines.md` itself — that store has exactly one writer,
      the gatherer, running interactively with a human. It is not written by this plan's
      execution.
- [x] `.claude/agents/learning-project-manager.md` — add the 8 new subagents and the new
      orchestrating skill to the team roster and the SSOT ownership table; fix the stale
      CURRICULUM "no owner" lines noted above.
- [x] `CLAUDE.md` — fix the stale CURRICULUM row; add a short pointer to the new material
      pipeline the same way the slide pipeline gets one, without duplicating
      `material_catalog.md`'s content into it.

## Optional / needs a coordination call, not blocking the rest

- [ ] Extend `support_material_kind` in `.claude/reference/curriculum.schema.json` with the
      new kinds (`teacher_book`, `student_book`, `quiz`, `demo_script`,
      `hands_on_setup_guide`, `hands_on_solving_guide`, `project_work`, `rubric`,
      `reading_guide`), mirroring `material_catalog.md`'s vocabulary so the two stay in
      sync. This touches `learning-curriculum-sequencer`'s domain (it is the schema for its
      output store) — additive and non-breaking, but flag it rather than edit it silently.
- [ ] A coverage checker (`node_ref` ↔ material file, both directions), the same role
      `coverage.py` plays for slides. Deferred by default — call it out explicitly as
      unchecked coverage rather than implying it is covered, per this repo's own rule about
      not reporting a KPI nobody ran.
- [ ] PDF/DOCX export from the new `.adoc`/`.md` files. Out of scope for now — the editable
      source file is the deliverable, per the user's stated preference for teacher-editable
      formats. Note the option for later, do not build it unprompted.

## Last step, mandatory

- [ ] Run `learning-support-agent-coherence` after all agent/skill files above are written,
      per `CLAUDE.md`'s standing rule to run it after editing anything under
      `.claude/agents/` or `.claude/skills/`. Report its findings before considering this
      plan complete; only apply its suggested fixes after explicit approval, per its own
      contract.
