# Activity 1: Backlog Refinement

Goal: help the human prepare upcoming PBIs so they are clear, manageable, and actionable for
Sprint Planning. You can add whatever fields a PBI needs — never invent requirements or facts that
weren't given.

Read `references/do_and_donts.md` first and obey what's in there.

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

You may edit PBIs directly — they stay in the backlog until explicitly moved to `active_sprint/`.

It's fine if not every PBI reaches DoR by the end of refinement. A PBI that doesn't just won't be
eligible for the next sprint.
