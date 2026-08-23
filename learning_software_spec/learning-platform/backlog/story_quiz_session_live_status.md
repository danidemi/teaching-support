ID: QUIZ-SESSION-LIVE-STATUS-001

Status: READY

Priority: Medium — split out at grooming (2026-08-23) from the original
QUIZ-SESSION-MONITOR-001 draft as the second of two stories; depends on
QUIZ-SESSION-CONTROL-001 shipping first (needs a real session/Block #1 to attach live counts
to).

Effort: Medium — a placeholder student-facing page that registers presence/answers, plus
wiring Block #2's three visual states to real counts.

As:
a `trainer`

I want to:
watch a quiz session progress live once it's started — students connecting, and (in a stub
form, since real quiz delivery doesn't exist yet) answers being registered — and see a final
tally once it's stopped

So that:
I have visibility into whether/how students are actually taking the quiz, instead of the
session running with no feedback at all

Definition of Done:
* the QR/URL from QUIZ-SESSION-CONTROL-001 leads to a **placeholder** page — explicitly NOT
  the real quiz-taking experience (no story specifies that yet). Opening it:
  * registers the visit as a "connected" student for that session (decided during the
    2026-08-23 backlog grooming: presence is counted on page load — a simple, real signal
    that doesn't require building actual quiz delivery)
  * offers a single stub action (e.g. a "submit" button) that registers as that student
    having "answered" for the session, without any real question/answer content — enough to
    make Block #2's answered-percentage meaningful for this story's own verification
* **Block #2** (live status) shows whichever of these three states applies, using real counts
  from the placeholder page's signals:
  * before start: "quiz not yet started" + the number of students currently connected
  * while running: an "answers" progress bar (percentage of connected students who have hit
    the stub "submit", out of the total connected) and a time-remaining bar
  * after stop: total submissions (e.g. "7/10") and percentage of questions answered across
    all submissions
* reopening a stopped session **keeps accumulating** Block #2's numbers rather than resetting
  them (decided during the 2026-08-23 backlog grooming) — a reopened session picks up where
  it left off, consistent with "closed is not a dead end"
* verified automatically: unit/integration tests for each of Block #2's three states and the
  transitions between them, using seeded/fake connection and submission data
* verified manually: a trainer starts a session, opens the placeholder page in a second tab
  (simulating a student), confirms the "connected" count reflects it, hits the stub "submit"
  action and confirms the answers progress bar reflects it, stops the session and confirms
  the final submission/answered numbers, then reopens it and confirms the numbers carried
  over rather than resetting

Wireframes (hand-drawn, from the original draft — reproduced faithfully by Claude from the
image, not redrawn by a human):
* Block #2, pre-start: `assets/quiz-session-monitor/block2.prestart.png`
* Block #2, running: `assets/quiz-session-monitor/block2.running.png`
* Block #2, after stop: `assets/quiz-session-monitor/block2.poststop.png`

Notes:
* split out at the 2026-08-23 backlog grooming from the original combined
  `QUIZ-SESSION-MONITOR-001` draft, together with **QUIZ-SESSION-CONTROL-001** (see that
  story for Block #1 / session lifecycle, which this story assumes already exists).
* real-time update mechanism for Block #2 while running (polling vs. WebSocket/SSE) is a
  technical question for sprint planning, not decided here.
* out of scope, confirmed at grooming: a session list/history view (finding and reopening a
  past session from a list) — this story, like QUIZ-SESSION-CONTROL-001, only covers a
  single already-created session's monitor page. Worth its own future story once multiple
  concurrent/past sessions need to be browsed.
* the real student quiz-taking experience (replacing the placeholder page) remains explicitly
  out of scope — a separate, not-yet-specified future story, as decided for
  QUIZ-SESSION-CONTROL-001.

Dependencies:
QUIZ-SESSION-CONTROL-001 (needs a real session and Block #1 to exist first).

Open questions:
none blocking grooming.
