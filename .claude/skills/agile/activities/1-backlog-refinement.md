# Activity 1: Backlog Refinement

Goal: help the human prepare upcoming PBIs so they are clear, manageable, and actionable for
Sprint Planning. You can add whatever fields a PBI needs — never invent requirements or facts that
weren't given.

Read `references/do_and_donts.md` and `references/ubiquitous_language.md` first and obey/use
what's in there.

## Using the ubiquitous language

When a PBI (or the human, describing one) uses a name that doesn't match a glossary lemma or one
of its `aka:` aliases, propose rephrasing it with the canonical term instead of leaving both
wordings in play. If the human confirms it's actually a new concept, add it to the glossary (see
`activities/0-ubiquitous-language.md`) rather than letting an undocumented synonym spread through
the backlog.

## Definition of Ready (DoR)

A PBI must satisfy this before it can enter a sprint:

- **Clear User Value**: states who the change is for, what is being built, and why it matters.
- **Defined Acceptance Criteria**: explicit, testable conditions for "finished."
- **Estimated Effort**: the effort a human will spend *overseeing* the agent's work on this PBI,
  not the time the agent takes to build it.
- **Appropriate Sizing**: small enough to finish comfortably within a single sprint.
- **Cleared Dependencies**: external blockers, third-party access, design assets, or approvals are
  secured in advance.
- **Testable**: criteria allow QA/developers to write unit, integration, or manual test cases.

## How to run it

For each PBI in `backlog/`:

- Grill it for assertions or requirements incoherent with the project context (ADRs, vision, other
  PBIs already in flight).
- Propose alternative, clearer ways to phrase the same PBI.
- Collect untold-but-needed details from the human — don't assume them.
- Make sure it has a Definition of Done (DoD) that can be tested automatically where possible, or
  manually otherwise.
- Check for inconsistencies against already-developed PBIs and interview the human on how to
  reconcile them.
- If the human attaches an image (wireframe, screenshot, mockup) while describing a PBI, save it
  under that PBI's own `assets/<pbi-id>/` folder per `SKILL.md`'s "PBI attachments" convention and
  reference it from the PBI — don't let it drop once the conversation moves on.

You may edit PBIs directly — they stay in the backlog until explicitly moved to `active_sprint/`.

It's fine if not every PBI reaches DoR by the end of refinement. A PBI that doesn't just won't be
eligible for the next sprint.
