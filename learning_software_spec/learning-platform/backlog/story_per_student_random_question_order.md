ID: QUIZ-RANDOM-QUESTION-ORDER-001

Status: READY

Priority: Medium

Effort: 5

Note: shares implementation ground with `QUIZ-RANDOM-ANSWER-ORDER-001` (per-student
randomization at session-start, similar attribution requirements for scoring/breakdown/monitoring).
Kept as a separate PBI, but plan both into the same sprint if either is picked.

As:
a `trainer`

I want to:
choose, when starting a quiz session, whether each student receives the session's questions in a
random order that's independent per student (e.g. student 1 gets [1, 4, 3, 2], student 2 gets
[3, 4, 1, 2])

So that:
students who peek at a classmate's screen during the session can't gain an advantage from seeing
the same question at the same time, while I can still disable this when question order matters
(e.g. for scaffolded quizzes where later questions build on earlier ones)

Definition of Done:
* when starting a quiz session, the trainer can turn "random question order per student" on or off
* the setting defaults to off (preserves current fixed-order behavior unless the trainer opts in)
* when on, each connected student is independently assigned a shuffled order of the session's
  questions; two students are not guaranteed (and in practice unlikely) to see the same order
* when off, all students see the questions in the session's authored order, as today
* scoring, the answer breakdown, and session monitoring correctly attribute each answer to its
  question regardless of the order it was presented in
* verified with automated tests covering both the on/off toggle and per-student shuffling, plus
  manual verification with two simultaneous test student sessions
