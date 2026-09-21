ID: QUIZ-RANDOM-ANSWER-ORDER-001

Status: DRAFT

Priority: Medium

Effort: [to be estimated in Sprint Planning]

As:
a `teacher`

I want to:
choose, when starting a quiz session, whether each student receives the answer choices of each
question in a random order that's independent per student (e.g. for a question with choices
a, b, c, d, student 1 sees [d, a, c, b] while student 2 sees [c, a, d, b])

So that:
students who peek at a classmate's screen during the session can't gain an advantage from seeing
the same answer position at the same time, while I can still disable this when answer order
matters (e.g. ordered-list questions or answers meant to be read in a specific sequence)

Definition of Done:
* when starting a quiz session, the teacher can turn "random answer order per student" on or off,
  independently of the question-order setting
* the setting defaults to off (preserves current answer-order behavior unless the teacher opts in)
* when on, each connected student is independently assigned a shuffled order of choices for each
  applicable question; two students are not guaranteed (and in practice unlikely) to see the same
  order
* when off, all students see the choices in the item's authored order, as today
* scoring, the answer breakdown, and session monitoring correctly attribute each response to its
  actual choice regardless of the order it was presented in
* verified with automated tests covering both the on/off toggle and per-student choice shuffling,
  plus manual verification with two simultaneous test student sessions
