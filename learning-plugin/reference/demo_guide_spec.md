# Demo guide spec

The **demo guide** is the trainer's script for one live demonstration: precise enough that, for a
step built around a terminal command, the trainer can copy-paste it as written. It is authored and
reviewed independently of every other material type — it does not name a path under
`material/student/`, and no student-facing file names its path either.

One AsciiDoc file per CURRICULUM item whose `didactic_activity` is `demo`, at
`material/teacher/demos/session-NN-<node_ref>-demo-guide.adoc`. `session-NN` is the item's
enclosing session's `session_number`; `node_ref` is the item's own.

Why one file per item, not per session: a demo is rehearsed and delivered as a single unit, and a
trainer teaching only part of a session still needs the whole script for the demo they are
actually running.

---

## Why this document cannot be "verified"

The authoring agent has no access to the actual delivery environment — no target machine, no
installed toolchain, no live credentials. Every command, menu path, or expected output it writes
is a **grounded guess**, not a tested fact, unless the CURRICULUM item or a DESIGN
node it traces to states the exact detail directly.

This is a deliberate, accepted limit, not a defect to work around by inventing confidence the agent
does not have. Two things compensate for it:

1. Every command-shaped or output-shaped claim is tagged `[stated]` / `[inferred]` / `[invented
   framing]` / `[risk]` per `material_authoring_rules.md`, same as every other material type.
2. The guide carries a mandatory rehearsal notice (see "Header", below) telling the trainer to run
   the demo once, exactly as written, before teaching it live — this document is the rehearsal
   script, not a substitute for the rehearsal.

The agent may use local, read-only checks (e.g. `<tool> --version`, `<tool> --help`, `git
rev-parse`) to make a command's flags and syntax accurate for the tool version actually present in
this repository's sandbox — never to claim the trainer's own delivery environment was verified,
since it wasn't. Never run a command that mutates state, calls a network service, or could plausibly
be part of the demo itself; that would pollute the very environment the guide is trying to describe
from a clean start.

## Header

```asciidoc
= Demo guide — <title>
:status: draft
:session: NN
:node_ref: PRQ-… / DR-…
:target_minutes: 15
:language: it

[NOTE]
====
Rehearse this guide once, end to end, exactly as written, before teaching it live. Every command
and expected output below is a grounded guess from the course design, not a tested fact — flag
anything that does not match what you see, and update this file once corrected.
====
```

`:status:` — `draft` until a human reviews the guide and sets `approved`. The authoring agent never
sets `approved` itself, the same rule every other material type in this project follows.

## Preconditions

One section, before step 1, stating everything that must already be true for step 1 to work:

- Tools and versions the demo assumes.
- Starting state: repo/branch/commit, seed data, running services, accounts already logged in.
- Network/credential requirements.
- Anything the audience should already have on their own screen, if this is a follow-along demo.

An honest gap here (a detail the agent could not ground in any store) is written as a `[risk]`-tagged
line naming exactly what the trainer must supply, never silently omitted.

## Steps

One numbered step per distinct thing the trainer does. Each step:

```asciidoc
=== Step N — <short label>

Trainer-only:: yes | no                 // no = students do this too, in parallel or right after
Deliberate failure:: no | yes — <what it demonstrates>   // only when the step is meant to error
Timing:: 2 min

Do::
  <exactly what the trainer types, clicks, or says — see "Action kinds" below>

Expect::
  <what should be visible/returned immediately after — prose, not a check>

Verify::
  <one concrete, checkable assertion the trainer can confirm before moving to the next step —
  distinct from Expect: "the pod's STATUS column reads Running", not "it should work">

Why::
  Mechanical: <why this step is technically necessary here>
  Teaches: <which DESIGN node/objective this step advances>

If it goes wrong::
  <the failure modes worth naming for this exact step, each with its fix — not a generic
  troubleshooting appendix; a trainer under time pressure reads this step, not a table of contents>
```

### Action kinds

A step's `Do::` is not always a shell command — never assume a terminal. Write whichever applies:

- **Command** — the literal string to run, in a fenced `[source,bash]` (or matching language)
  block, verbatim and copy-paste ready: no leading `$` prompt, no line-wrapping that would break a
  paste, placeholders wrapped in angle brackets and named in prose right after the block (e.g.
  `<CLUSTER_NAME>` — the value set in Preconditions).
- **UI interaction** — the exact click path ("Settings → Deploy → click *Enable*"), named menu
  items and buttons as they actually read, not paraphrased.
- **Narration** — what the trainer says or points out with no system interaction (e.g. drawing the
  audience's attention to a specific line of output already on screen).

## Verbatim output and volatile values

When `Expect::` or `Verify::` quotes real command output, mark anything that will differ at
delivery time — timestamps, generated ids, ports, pod names — as illustrative (e.g. `pod/api-<hash>
1/1 Running`) rather than presenting one run's literal values as if they always recur.

## Reset and resume

One section after the last step:

- **Reset**: how to return to the Preconditions' clean state, so the trainer can re-run the whole
  demo for another cohort.
- **Resume mid-demo**: if the demo is interrupted after step K, what the trainer needs to check or
  redo to safely continue from step K+1 rather than restarting from step 1.

## Live-failure fallback

One section holding what the trainer shows the room if the live demo breaks and cannot be fixed
in-class: pre-captured output, a screenshot description, or a recorded-outcome summary, plus one
line on how to pick the demo back up afterward (skip to the next item, or debrief from the
fallback material as if it had run).

An agent that cannot produce real fallback material (e.g. no image capability) writes an explicit
`[risk]`-tagged placeholder naming what a human still needs to capture, never a silent gap.

## Timing cross-check

Sum every step's `Timing::` plus setup, and compare against the item's `duration_minutes` in
CURRICULUM. A mismatch is not corrected by silently rewriting the budget — record
it as an `instructional_decisions` entry (see below) so a human resolves it.

## instructional_decisions

Any instructional-design call the agent had to make (how granular to split steps, how much
narration to script versus leave to the trainer's own words, what counts as a deliberate failure
worth keeping) is recorded as an `instructional_decisions` block near the top of the file, the same
`awaiting: instructional-designer` convention every other material type uses — never buried only in
step wording.

```asciidoc
[NOTE.instructional-decision]
====
Decision: <…>
Rationale: <…>
Confidence: stated | inferred | invented
Awaiting: instructional-designer
====
```

## Status

`:status: draft` until a human reviews the guide and sets `:status: approved:`. The authoring agent
never sets `approved` itself.
