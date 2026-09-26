# Activity 6: Compact Past Sprints

Goal: keep `past_sprints/` from growing without bound by rewriting old PBI files down to their
durable essentials. Run this only when the human explicitly asks for it (e.g. "compact past
sprints") — never automatically as part of sprint review or retrospective.

## Scope

- Sort `past_sprints/sprint_<timestamp>/` folders by timestamp. Leave the most recent **N** (default
  **4**, or whatever number the human gives for this run) folders completely untouched.
- Apply the rest of this activity only to folders older than the most recent N.
- Never touch `active_sprint/`, `backlog/`, `adr/`, or any file outside `past_sprints/`.

## Per PBI file, in each in-scope sprint folder

1. Check the `Status:` line.
   - **Not `DONE`** (`DISCARDED`, or anything left `DRAFT`/`READY`/`IN_PROGRESS`/`IN_REVIEW` in an
     old sprint): delete the file entirely. It was abandoned or superseded — nothing durable to
     keep.
   - **`DONE`**: compact in place, as follows.
2. Drop these sections entirely: `Status`, `Priority`, `Effort`, `Depends on`, and any grooming/
   "Known context" section (wireframes, exploratory notes, rationale that only mattered during
   planning).
3. Keep `ID`, `As`, `I want to`, `So that` verbatim — they're short and are the only remaining
   record of the original intent.
4. Summarize `Definition of Done` down to the essential bullets — what the feature actually does
   and its key constraints/edge cases. Do not keep it verbatim; compress it. Drop
   verification/test-plan details from the DoD (they're superseded by what "Implemented" reports
   as actually tested).
5. Keep the `Implemented (sprint, <date>)` section — this is already the compact factual record of
   what shipped, which files changed, and what was tested. Trim only if it restates the DoD
   redundantly; don't remove concrete facts (file paths, test counts, endpoint names).
6. Leave `review.md` in that sprint folder untouched.

## Before finishing

Report back to the human: how many sprint folders were compacted, how many PBI files were
deleted (not-DONE) vs. compacted (DONE), and the resulting size before/after if easy to compute.
Ask for confirmation before deleting if anything looks like it might still be referenced by a
`Depends on:` in a PBI you are *not* compacting (i.e. one in the last N sprints, or in
`active_sprint/`) — check with a quick grep across those before deleting.
