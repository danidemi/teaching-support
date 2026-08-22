This folder helps a human to organize the development of a software using you as an AI platform that is able to provide all skills of a highly professional develoment team.

# Folder structure

The folder is organizes as a classical project managed by SCRUM plus some specific folders.

# `backlog/` folder

contains stories that yet need to be developed

# `reference/` folder

contains reference files:
* `vision.md`: as "the vision" of the resulting product and other references that stay constant during the development.
* `tech_references.md`: contains tech references as the folder where the source lives and so on.
* `do_and_donts.md`: running log of process decisions made during sprint retrospectives (activity
  5). Read it during backlog grooming and before development, and obey what is in there. Append to
  it, don't rewrite past entries, whenever a retrospective produces a new decision.

# `active_sprint/` folder

contains the story and the tasks to be developed in the current spring

# `past_sprints/` folder

contains the stories realized in the past sprints. Archive only.

# `adr/` folder

contains the ADR. They are always read and obeyed for each new development to guarantee project is technically coherent

# Activities

## 1. Backlog Refinement

The goal is to help the human prepare upcoming `Sprint Backlog Items` so they are clear, manageable, and actionable prior to Sprint Planning. You can add whatever info or field you need, just don't invent anything. 

In other words, the goal is to try to make each `Sprint Backlog Items` to comply with the `The Definition of Ready` (DoR), an agreed-upon set of criteria that a Product Backlog Item (PBI) must satisfy before a Scrum team will accept it into an upcoming Sprint. It acts as a quality filter during backlog refinement to prevent vague, blocked, or oversized work from entering Sprint Planning.

* Clear User Value: The item clearly states who the change is for, what is being built, and why it matters.
* Defined Acceptance Criteria: explicit, testable conditions that outline exactly how the feature must behave to be considered finished.
* Estimated Effort: in here, it means the effort of a human will spend overviewing the process crried on by an agent, not the time the human or the agent will spend to develop the feature.
* Appropriate Sizing: The item is small enough to be completed comfortably within a single Sprint.
* Cleared Dependencies: External blockers, third-party API access, design assets, or technical approvals are secured in advance.
* Testable: The criteria allow Quality Assurance (QA) and Developers to write unit, integration, or manual test cases.

Discuss with the human, grill the content of the `Sprint Backlog Items`, propose alternative ways to describe the same story, collect needed details, be sure to include a definition of done that can be tested automatically by you or at least by the human. Check for inconsistencies among other stories already developed.

You can modify the stories and the tasks directly. They stay there in the backlog until explicitly moved into current sprint.

It is perfectly acceptable that at the enf of the grooming not all `Sprint Backlog Items` comply with a DoR, that just mean that PBI won't be selected to be part of the next sprint.

## 2. Sprint Planning

Decide with the human which PBIs to work on. Chose the smalles possible subset. 1 only story in the current sprint is not a bad choice, of the story is complex.

For the selected PBIs, help the human in define how the PBI will be done. Several technical questions and choices may arise from that analysis. Help the human proposing several possible sensible choices that are coherent with the existing ADRs.
Technical analysys:
- always ground in the existing ADR to check the development does not change somethig that should remain
- if a tech choice is performed prepare an ADR related to it.
- if there is a reason to modify the tech stack in order to complete a task ask the human fisrst and explicitly explain that in the ADR.

Update the PBI with a plan about how to implement it.

When the technical and infrastructural overhead is sensible and/or complex and/or potentially impactful, a new dedicated PBI can be created in the sprint which content is being defined.

## 3. Sprint

Develop:
- use language best practices
- comply with defined ADRs
- ensure existing unit tests work
- use unit tests with given / when / then pattern
- ensure that the development comply with all the requirements stated by "definiiton of done".
- before ensure existing unit tests plus current tests pass.
- update the story as "READY"

## 4. Sprint Review

When no more stories to be developed and tasks remain or when human told you so, ask him whether the development is accepted.
* stories and tasks human told you are ok, mark them as "DONE"
* stories and tasks human told you are not ok, or incomplete, ask him for details and mark them as "IN PROGRESS", You'll work on them in another spring.
* at the end, move all DONE stories in the PAST SPRINTS folder, creating a specific subfolder for it called `sprint_<YY_MM_DD_HH_mm>/`, along with a 
new file called `review.md` stating what have been done, decuded and observed during the sprint.

After that ask human what new BPIs should be added. Collect the feedback by the human and keep on intervitinging him until you are able to have enough info to create the needed new BPIs.
During the interview:
* start the interview asking a list of new things that should be done.
* split the list in potential BPIs
* for each BPI collect all the info you need, but be parcicularly specific about the reasons why a BPI is needed, and what are the expected results.
* when human is too generic, propose him hypotesis, questions, choices that will allow him to deeply think about the new stories.
* in this phase the focus is not about how things will be done, but instead why they will be done, what value they will carry, how they will be verified

## 5. Sprint Retrospective

Remember what has been done in the sprint and think about what you think it worked good, what should be changed. Ask human feedback too.
Select one good thing, one bad thing and extract the good practice that should be replicated in the next sprint, the bad practice that must not be repeated and append them to `reference/do_and_donts.md`, in order to apply it next time.
Keep the `reference/do_and_donts.md` short, actionable, brief, meaningful.
Don't let the file to grow too much, compact it if it's too big keeping the more meaningful DOs and DONTs.
