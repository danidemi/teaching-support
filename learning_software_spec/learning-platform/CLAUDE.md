This folder helps a human to organize the development of a software using you as an AI platform that is able to provide all skills of a highly professional develoment team.

# Folder structure

The folder is organizes as a classical project managed by SCRUM plus some specific folders.

# backlog/

contains stories that yet need to be developed

# reference/

contains reference files:
* `vision.md`: as "the vision" of the resulting product and other references that stay constant during the development.
* `tech_references.md`: contains tech references as the folder where the source lives and so on.

# active_sprint/

contains the story and the tasks to be developed in the current spring

# past_sprints/

contains the stories realized in the past sprints. Archive only.

# adr/

contains the ADR. They are always read and obeyed for each new development to guarantee project is technically coherent

# Activities

## 1. Backlog Grooming

Analize all the stories in backlog. help human better define them in order each of them to be detailed enough to be used to implement the story it describes. You can add whatever info or field you need, just don't invent anything. Discuss with the human, grill the story, propose alteranite ways to describe the same story, collect needed details, be sure to have a definition of done that can be tested automatically by you or at least by the human. Check for inconsistencies among other stories already developed.
You can modify the stories and the tasks directly. They stay there in the backlog until explicitly moved into current sprint.

## 2. Sprint Planning

Decide with the human which stories and tasks to work on. Chose the smalles possible subset. 1 only story in the current sprint is not a bad choice, of the story is complex.

## 3. Development

Technical analysys:
- always ground in the existing ADR to check the development does not change somethig that should remain
- if a tech choice is performed prepare an ADR related to it.
- if there is a reason to modify the tech stack in order to complete a task ask the human fisrst and explicitly explain that in the ADR.

Develop:
- use language best practices
- ensure existing unit tests work
- use unit tests with given / when / then pattern
- ensure definiiton of done is respected.
- ensure existing unit tests plus current tests pass.
- update the story as "READY"

## 4. Sprint Review

when no more stories to be developed and tasks remain or when human told you so, ask him whether the development is accepted.
stories and tasks human told you are ok, mark them as "DONE"
stories and tasks human told you are not ok, or incomplete, ask him for details and mark them as "IN PROGRESS", You'll work on them in another spring.
at the end, move all DONE stories in the PAST SPRINTS folder, creating a specific subfolder for it called `sprint_<YY_MM_DD>/`.
add to `sprint_<YY_MM_DD>/` a `review.md` stating what have been done, decuded and observed during the sprint.

## 5. Sprint Retrospective

remember what has been done in the sprint and think about what you think it worked good, what should be changed. Ask human feedback too.
select the one good think it there is, the one bad thing and write a related doc in reference, in order to apply it next time.