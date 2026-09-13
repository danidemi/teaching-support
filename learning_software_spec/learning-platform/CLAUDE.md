This folder helps a human to organize the development of a software using you as an AI platform that is able to provide all skills of a highly professional develoment team.

# Folder structure

The folder is organizes as a classical project managed by SCRUM plus some specific folders and files.

## `references/` folder

Contains references files:
* `vision.md`: as "the vision" of the project is being developed and other references that stay constant during the development.
* `tech_references.md`: contains tech references as the folder where the source lives and so on.
* `do_and_donts.md`: running log of process decisions made during sprint retrospectives (activity
  5). Read it during backlog grooming and before development, and obey what is in there. Append to
  it, don't rewrite past entries, whenever a retrospective produces a new decision.

## `backlog/` folder

Contains `Product Backlog Items` (PBIs) that are not yet developed and among which the human will chose the ones to develop in the next sprint.

## `active_sprint/` folder

Contains the PBIs to be developed in the current sprint.

## `past_sprints/` folder

Contains the sprints and its PBIs realized in the past sprints. Archive only. 
One folder per past sprint, all its PBis inside.

## `adr/` folder

Contains the ADRs. 
They are always read and obeyed for each new development to guarantee the development of the project is technically and architecturally coherent among the various sprints.

# Activities

## 1. Backlog Refinement

The goal is to help the human prepare upcoming `PBI` so they are clear, manageable, and actionable to Sprint Planning. 
You can add whatever info or field you need, just don't invent anything. 

In other words, the goal is to try to make each `PBI` to comply with the `The Definition of Ready` (DoR), 
an agreed-upon set of criteria define here below that a `PBI` must satisfy before a Scrum team will accept it into an upcoming Sprint. 
It acts as a quality filter during backlog refinement to prevent vague, blocked, or oversized work from entering Sprint Planning.

* Clear User Value: The item clearly states who the change is for, what is being built, and why it matters.
* Defined Acceptance Criteria: explicit, testable conditions that outline exactly how the feature must behave to be considered finished.
* Estimated Effort: in here, it means the effort of a human will spend overviewing the process carried on by an agent, not the time the human or the agent will spend to develop the feature.
* Appropriate Sizing: The item is small enough to be completed comfortably within a single Sprint.
* Cleared Dependencies: External blockers, third-party API access, design assets, or technical approvals are secured in advance.
* Testable: The criteria allow Quality Assurance (QA) and Developers to write unit, integration, or manual test cases.

To reach the `DoR`, inteview the human along these lines:

* Grill the content of the `PBI` for assertions, requirements and requests that are not coherent with the project context (i.e.: ADRs, vision, other PBIs in the same sprint) 
* Propose alternative better ways to describe the same PBI, 
* Collect untold but needed details
* Be sure to include a `Definition of Done` (DoD) that can preferabily be tested automatically by you or at least by the human. 
* Check for inconsistencies among other PBIs already developed and interview the human about how to align it back to the project.

You can modify the PBIs directly, because they stay in the backlog until explicitly moved into current sprint.

It is perfectly acceptable that at the end of the refinement not all PBI will comply with a DoR. It just means that PBI won't be selected to be part of the next sprint.

## 2. Sprint Planning

Decide with the human which PBIs to work on. Prefer the smallest possible subset. Even to include just 1 PBI in the next sprint is not a bad choice if it is particlarly complex of it there aren't other related PBIs.

For the selected PBIs, interview and help the human with the goal of define how the PBI will be implemented. 

* Help the human proposing several possible sensible choices that are coherent with the existing ADRs.
* Always ground in the existing ADR to check the development does not change somethig that should remain
* If human commit to a main technolgoical alternative, write an ADR related to it.
* If there is a reason to modify the tech stack in order to complete a task ask the human fisrst and explicitly explain the rationale in the ADR.

Update the PBI with a plan about how to implement it.

When the technical and infrastructural overhead is sensible and/or complex and/or potentially impactful, a new dedicated PBI can be created in the sprint which content is being defined.

## 3. Sprint

The goal is to develop the PBIs included in the current sprint.

Develop along these guidelines:
- Use language best practices
- Comply with defined ADRs
- Ensure existing automatic unit tests work
- Use unit tests with given / when / then pattern
- Ensure that the development comply with all the requirements stated by the PBI's DoD.
- Always ensure existing unit tests plus current tests pass.
- update the story as "READY"

## 4. Sprint Review

The goal is to acquire the human approval about whether the PBIs have been developed correctly and optionally whether the product increment just developed brings new PBIs.

When no more stories to be developed and tasks remain or when human told you so, ask him whether the development is accepted.
* stories and tasks human told you are ok, mark them as "DONE"
* stories and tasks human told you are not ok, or incomplete, ask him for details and mark them as "IN PROGRESS", You'll work on them in another spring.
* at the end, move all DONE stories in the PAST SPRINTS folder, creating a specific subfolder for it called `sprint_<YY_MM_DD_HH_mm>/`, along with a 
new file called `review.md` stating what have been done, decuded and observed during the sprint.

After that ask human what new PBIs should be added. Collect the feedback by the human and keep on intervitinging him until you are able to have enough info to create the needed new BPIs.
During the interview:
* start the interview asking a list of new things that should be done.
* split the list in potential PBIs
* for each PBI collect all the info you need, but be parcicularly specific about the reasons why a PBI is needed, and what are the expected results.
* when human is too generic, propose him hypotesis, questions, choices that will allow him to deeply think about the new stories.
* in this phase the focus is not about how things will be done, but instead why they will be done, what value they will carry, how they will be verified

## 5. Sprint Retrospective

Remember what has been done in the sprint and think about what you think it worked good, what should be changed. Ask human feedback too.
Select one good thing, one bad thing and extract the good practice that should be replicated in the next sprint, the bad practice that must not be repeated and append them to `references/do_and_donts.md`, in order to apply it next time.
Keep the `references/do_and_donts.md` short, actionable, brief, meaningful.
Don't let the file to grow too much, compact it if it's too big keeping the more meaningful DOs and DONTs.

