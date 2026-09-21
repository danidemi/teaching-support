# Activity 0: Ubiquitous Language

Goal: keep a short, shared glossary of the project's domain vocabulary — the terms the human and
the team should use consistently for the same concept — so PBIs, ADRs, and conversation stay
unambiguous as the project grows.

This produces/maintains `references/ubiquitous_language.md` (the index) and, for concepts whose
definition doesn't fit in one line, `references/ul/<kebab-slug>.md` (overflow files).

## When to run this

- **Bootstrapping**: once a project has real PBIs (not just templates), run a first extraction pass.
- **Sprint Review**: after archiving, run a light pass over what was added/changed this sprint (see
  `activities/4-sprint-review.md`).
- **Ad hoc**: if the human introduces or renames a concept mid-conversation and confirms it should
  be tracked (see the disambiguation rule in `activities/1-backlog-refinement.md` and
  `activities/X-new-pbi.md`).

## What counts as a lemma

Scan `backlog/`, `active_sprint/`, `adr/`, and `references/vision.md`. Extract candidate terms that
are one of:

- **Domain concepts / entities** — nouns central to what the product models (e.g. a Quiz Session).
- **Roles** — who acts in the system (e.g. Trainer, Student).
- **Actions** — domain-meaningful verbs distinct from generic CRUD (e.g. "stop a quiz session").
- **Screens / views** — named UI surfaces a human would refer to by name.
- **Named UI components** — reusable named blocks referenced across PBIs (e.g. an "Answer
  Breakdown" block), not every widget.

**Do not include:**

- Code identifiers, function/class/file names, file paths.
- Library, framework, or vendor/spec vocabulary (e.g. QTI element names) — that belongs in
  `adr/` or `references/tech_reference.md`.
- PBI/ADR IDs.
- SCRUM process vocabulary (sprint, backlog, PBI, DoR, DoD, etc.) — that's owned by this skill,
  not the product domain.
- One-off adjectives or generic terms with no risk of ambiguity.

If in doubt whether a term is worth tracking, leave it out. This glossary is a lookup aid, not a
full domain model — a human should be able to read the whole index in under a minute.

## Format

`references/ubiquitous_language.md`:

```markdown
# Ubiquitous Language

One-line entries. Long definitions live in `ul/<slug>.md`, linked from here.

- **Quiz Session Monitor** (aka: quiz monitor page, monitor screen) — the trainer-facing page for
  watching and controlling a live quiz session.
- **Answer Breakdown** (aka: answer breakdown block) — a block on the Quiz Session Monitor showing
  per-option response counts for the class. See [ul/answer-breakdown.md](ul/answer-breakdown.md).
- **Trainer** — the person running the course and controlling quiz sessions.
- **Student** — a course participant answering quiz questions.
```

Rules:

- One bullet per lemma, target 15-20 words for the inline definition.
- Every lemma MUST list its known `aka:` alternate names/phrasings if any exist — this is what
  makes disambiguation possible. Omit the `aka:` parenthetical only if there truly isn't one yet.
- If a definition needs more than ~2 sentences of nuance to be useful, keep the one-line summary
  here and move the full definition to `references/ul/<kebab-slug>.md`, linked inline. Only open
  that file when you're about to write or change something that depends on the concept's
  internals — not during routine reading.
- Target 40-60 lemmas total. Hitting that ceiling is a signal to prune stale or overly-specific
  entries, not to keep growing the file.

## How to run the extraction

1. Read the current `references/ubiquitous_language.md` (create it empty with the header above if
   it doesn't exist yet).
2. Read the sources for this pass and list candidate terms per the inclusion rules:
   - **First/bootstrapping pass** (glossary is empty or near-empty): all of `backlog/`,
     `active_sprint/`, `adr/`, `references/vision.md`.
   - **Sprint Review pass**: only the PBIs just archived into this sprint's `past_sprints/`
     folder, plus any ADRs written during the sprint.
   - **Ad hoc pass**: just the concept the human raised.
3. Decide how to confirm candidates with the human, by pass type:
   - **First/bootstrapping pass**: don't interrogate term by term. Draft the whole index in one
     go and present it once, asking the human to cut, correct, or confirm it as a batch.
   - **Sprint Review / ad hoc pass**: confirm each new candidate individually before adding it —
     the volume is small enough that this stays lightweight.
   - Either way: if a candidate matches an existing lemma or one of its `aka:` entries, don't
     re-propose it — just add the new alias if the wording is genuinely different.
4. Write the updated file. Keep entries alphabetically sorted.

## Renames

Renaming a lemma is a bigger action than adding one — existing PBI prose may rely on the old name.

- Get explicit human confirmation before renaming.
- After confirming, grep for the old name across `backlog/` and `active_sprint/` only, and update
  occurrences to the new canonical term (or add the old name as an `aka:` if both are still in use).
- Never touch `past_sprints/` — it's a frozen archive of what was said at the time.
