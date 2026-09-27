# Activity: New PBIs

Goal: gather what should be added in the backlog.

Read `references/ubiquitous_language.md` first. When the human names a concept, role, screen, or
action, match it against the glossary and its `aka:` aliases; if their wording doesn't match,
propose the canonical term. If it's genuinely new, confirm with the human, then add it to the
glossary per `activities/0-ubiquitous-language.md`.

## Interview

This activity's whole point is capturing the human's actual intent — not what you can infer or
justify from reading the code. Treat it as an explicit exception to any general "don't stop to ask
clarifying questions" bias the session may be running under (e.g. an "Auto Mode" instruction to
default to proceeding without stopping): that bias is about not pestering the human over routine
implementation choices, and does not apply to this activity's own defined interview step.

Interview the human to collect new PBIs for the backlog, even when their initial ask already looks
detailed and well-motivated:

1. Ask for a rough list of new PBIs to add. Match each answer to an available template kind
   (bug/story/task/etc.) where it fits.
2. Split the list into individual candidate PBIs.
3. For each one, collect enough detail to draft it — be especially specific about *why* it's
   needed and what result is expected.
4. When the human is vague, or when your own research (reading code, checking existing behavior)
   surfaces a genuine open choice that changes what the delivered PBI actually covers or looks
   like — not a pure implementation detail — put that choice to the human as an explicit question
   (e.g. via AskUserQuestion) *before* writing it into the PBI. Do not silently resolve it yourself
   and record your own resolution in the PBI text, even when you're confident in the answer, even
   when the human's message already contained a lot of detail. A concrete choice with real
   tradeoffs (which pages a fix touches, which of two designs to keep, whether a fix's scope
   covers one component or two) is exactly the kind of thing this step exists to surface — using
   research to identify the choice is good; using it to make the choice instead of the human is
   not.
5. Stay focused on *why* and *what value*, not *how* — implementation planning happens in Sprint
   Planning, not here. But a choice that changes what "done" actually delivers (e.g. "does this
   need to catch a stale server process, or just a stale client bundle?") is *why/what-value*, not
   deferred *how* — surface it now rather than parking it as a TODO for Sprint Planning to
   untangle.

Write each gathered PBI into `backlog/` using the matching template from `backlog/_<kind>.template.md`.