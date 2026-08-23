ID: QUIZ-SESSION-MONITOR-001

Status: DRAFT

Priority: [set at grooming]

Effort: [set at grooming — this looks large: session creation, a new page with 3 stateful
blocks, QR generation, a placeholder student page, and some mechanism for tracking connected
students/answers even though real quiz delivery doesn't exist yet. Consider splitting at
grooming if it doesn't fit comfortably in one sprint.]

As:
a `trainer`

I want to:
create a quiz session, start it (optionally with a time limit), watch it progress live
(students connecting, questions answered, time remaining), and stop it — either because
everyone finished early or because I decide to end it (e.g. a feedback-only quiz)

So that:
I can control and observe a quiz's live delivery from one screen, instead of having no
visibility into whether/how students are actually taking it

Definition of Done:
* from a quiz's page (course detail / quizzes section), a trainer can create a new **quiz
  session** — an occurrence of that quiz being taken. A quiz can have several sessions over
  time (e.g. a retake), all kept, not just the latest one
* creating a session opens a new screen, the **"Quiz Session Monitor"** (named during the
  2026-08-23 backlog interview), showing:
  * a QR code encoding a URL, and the same URL as plain text, that a student would open to
    take the quiz
  * **Block #1** (session control):
    * while the session is **closed**: a time-limit input (format like `3h` or `75m`) and a
      "Start" button
    * once **started**: the block shows the clock time the session will auto-close at and
      the duration remaining (if a time limit was set), and a "Stop" button
    * a session can always be reopened after being stopped (closed is not a dead end)
  * **Block #2** (live status), matching whichever of these three states applies:
    * before start: "quiz not yet started" + the number of students currently connected
    * while running: an "answers" progress bar (percentage of connected students who have
      submitted, out of the total connected) and a time-remaining bar
    * after stop: total submissions (e.g. "7/10") and percentage of questions answered
      across all submissions
* the QR/URL leads to a **placeholder** page for now — explicitly NOT the real quiz-taking
  experience (no story specifies that yet). The placeholder's own behavior (what it shows,
  whether it's enough to register as "a student connected") is decided at grooming/planning
  for this story — see Open Questions below
* verified automatically: unit/integration tests for each of Block #1 and Block #2's states
  and the transitions between them, using seeded/fake session data (no real student traffic
  needed for this)
* verified manually: a trainer creates a session, starts it with a time limit, opens the
  placeholder page in a second tab (simulating a student), confirms the "connected" count and
  progress reflect it, then stops the session and confirms the final submission/answered
  numbers

Wireframes (hand-drawn, from the original draft — reproduced faithfully by Claude from the
image, not redrawn by a human):
* overall layout: `assets/quiz-session-monitor/main.png`
* Block #1, closed/pre-start: `assets/quiz-session-monitor/block1.prestart.png`
* Block #1, running: `assets/quiz-session-monitor/block1.running.png`
* Block #2, pre-start: `assets/quiz-session-monitor/block2.prestart.png`
* Block #2, running: `assets/quiz-session-monitor/block2.running.png`
* Block #2, after stop: `assets/quiz-session-monitor/block2.poststop.png`

Decisions made during the 2026-08-23 backlog interview:
* **page name**: "Quiz Session Monitor" (the draft's own "public page", pending a better
  name, per the trainer)
* **student-facing quiz page**: building the real one is explicitly a separate, future story
  (not specified yet) — this story ships only a placeholder at the QR/URL target, so the
  whole create → start → watch → stop flow is real end-to-end even though nobody can
  actually answer a question yet
* **Block #1's two numbers** (`12:23` / `39m` in the wireframe): a clock time (when the
  session auto-closes) shown alongside the duration remaining until then — both refer to the
  same deadline, shown two ways

Open questions (for grooming/planning):
* how does a student's presence get counted as "connected", and an "answer submitted" get
  counted, given only a placeholder page exists at the QR/URL target? The placeholder needs
  *just enough* behavior (e.g. registering a connection on load) to make Block #2's live
  counts meaningful for this story's own manual verification — without building real quiz
  delivery. Needs a concrete decision before this is planned.
* does "a session can always be reopened" (noted in the original draft) mean a stopped
  session's final Block #2 numbers (submissions/answered %) are preserved and then continue
  accumulating after reopening, or reset? Not specified in the wireframes.
* is there a session list/history view (to find and reopen a past session, given multiple
  sessions per quiz are allowed), or does this story only cover a single freshly-created
  session's monitor page? The draft doesn't show one — likely a separate story, but worth
  confirming at grooming so this story's scope boundary is explicit.
* real-time update mechanism for Block #2 while running (polling vs. WebSocket/SSE) — a
  technical question for planning, not decided here.
