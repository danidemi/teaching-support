ID: QUIZ-SESSION-LIVE-STATUS-001

Status: DONE

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
  * before start: "quiz not yet started" + the number of students who have **joined** so far
    (revised at sprint planning 2026-08-23 — see Notes: "currently connected" overclaims what
    a load-registers-presence signal can actually mean, so the label says "joined", not
    "connected now")
  * while running: an "answers" progress bar (percentage of joined students who have hit the
    stub "submit", out of the total joined) and a time-remaining bar
  * after stop: total submissions (e.g. "7/10") **only** (revised at sprint planning
    2026-08-23 — see Notes: "percentage of questions answered" is not something this story
    can compute, since there are no real questions or answers behind the stub submit button)
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
* **revised at sprint planning (2026-08-23), before coding, per review**: two DoD lines from
  backlog grooming didn't survive contact with what the placeholder page can actually signal:
  * "currently connected" implied a live presence check (a student who left would drop out
    of the count). A load-registers-presence signal can't tell "still here" from "opened it
    once and left" — so the count is relabeled "joined" throughout, an honest description of
    what it actually measures, rather than a number that reads as more real-time than it is.
  * "percentage of questions answered across all submissions" needs real questions and
    answers, neither of which exist behind the stub submit button. Dropped from the
    post-stop display; only the submission count (e.g. "7/10") remains.

Dependencies:
QUIZ-SESSION-CONTROL-001 (needs a real session and Block #1 to exist first).

Open questions:
none blocking grooming.

Technical plan (sprint planning, 2026-08-23):
* new `quiz_session_connections` Drizzle table: `id` (uuid pk), `sessionId` (fk to
  `quiz_sessions`), `connectedAt` (timestamp, default now), `submittedAt` (nullable
  timestamp). One row per placeholder-page load — a page reload creates a second row (and
  therefore counts as a second "join"); this is a known, accepted limitation of a
  load-registers-presence model, not something this story's DoD asks to solve (no real
  student identity exists yet to dedupe against) — see the "joined" relabeling in Notes.
* **the connect/submit endpoints take no session/tenant** — unlike every other route in
  `quizSessions.ts`, these are hit by an anonymous student's phone (it scanned a QR code; it
  has no login of any kind). `POST /api/quiz-sessions/:sessionId/connections` and `POST
  .../connections/:connectionId/submit` skip `sessionMiddleware`/`requireTenant` entirely —
  they only need the session to exist (checked without a tenant join, unlike every
  tenant-scoped lookup elsewhere in this router). Connecting is allowed in *any* session
  status, including `closed` — the DoD explicitly wants a joined count before start.
* both of these still take an id from the URL (`:sessionId`, and `:connectionId` for submit)
  and follow ROUTE-ID-GUARD-001's pattern regardless of the no-tenant change: try/catch,
  malformed id -> 404, and the fakes for both throw the wrapped `22P02` shape for a
  non-UUID-shaped id, same as every other id-in-URL route this sprint.
* new client route `/quiz-sessions/:sessionId/take` — the placeholder page. On mount, `POST
  /api/quiz-sessions/:sessionId/connections` (creates a connection row, returns its id, held
  in the placeholder page's component state); a "Submit" button calls `POST
  /api/quiz-sessions/:sessionId/connections/:connectionId/submit` (sets `submittedAt`).
* new `GET /api/quiz-sessions/:sessionId/status` endpoint (trainer-side, tenant-scoped like
  the rest of the router) returning the session's own state (per QUIZ-SESSION-CONTROL-001)
  plus `joinedCount` and `submittedCount` derived from this table — the single source Block
  #2 reads from in all three of its states.
* per ADR-0009, **revised at sprint planning**: `QuizSessionMonitorPage`'s Block #2 polls this
  status endpoint while the session is `closed` **or** `running` (a joined count needs to
  update before start too, not just during), and stops polling once `stopped`. This also
  means Block #1 gets a session status correction for free once `closesAt` passes without an
  explicit Stop — the original story's client-only countdown had no way to notice that on its
  own; polling picks up the server-derived `stopped` status on its next tick. Verified
  specifically during this story's manual check, not filed as a separate bug.
* reopening a session (already wired by QUIZ-SESSION-CONTROL-001) does not touch this table
  at all — old connection rows stay as they are, so counts naturally keep accumulating rather
  than resetting, satisfying the grooming decision without any extra reset-avoidance logic.
* new Playwright specs in `client/e2e/` for both screens this sprint added
  (`quiz-session-monitor.spec.ts`, `quiz-session-take.spec.ts`) — E2E-BROWSER-001's own README
  section claims one spec per shipped screen; QUIZ-SESSION-CONTROL-001 shipped one screen
  without adding its spec (caught here, not filed separately, since this story is what
  actually needs a second browser tab/context to prove the join count reacts to a real
  placeholder-page visit — the same thing an ad hoc manual script proved for
  QUIZ-SESSION-CONTROL-001, now committed instead of thrown away).
* sequenced **last** in this sprint — depends on QUIZ-SESSION-CONTROL-001's session/Block #1
  and route-guard pattern.

Verification (development, 2026-08-23):
* implementation: `quiz_session_connections` table + migration
  (`drizzle/0008_steady_thunderbolt_ross.sql`), `ConnectionRepository` (`db/
  quizSessionConnections.ts`), two new anonymous routes on the existing `quizSessions`
  router (`POST .../connections`, `POST .../connections/:connectionId/submit` — no
  `sessionMiddleware`, `markSubmitted` scoped to both `connectionId` and `sessionId`).
  `GET /api/quiz-sessions/:sessionId` (and every other session response) now includes
  `joinedCount`/`submittedCount` — folded into the existing response rather than a separate
  `/status` endpoint, a simplification from the technical plan's original sketch, since
  nothing else needs a session without its counts. Client: `QuizSessionTakePage.tsx` (the
  placeholder, no sign-in of any kind) at `/quiz-sessions/:sessionId/take`, and
  `QuizSessionMonitorPage`'s Block #2 now shows real counts and polls while `closed` or
  `running` (stops once `stopped`).
* automated: 128/128 server tests green (7 new: anonymous join/submit, malformed ids,
  cross-session-connection rejection, accumulation-through-reopen), 69/69 client tests green
  (4 new in `QuizSessionTakePage.test.tsx`; 8 new in `QuizSessionMonitorPage.test.tsx` for
  Block #2's three states and the polling behavior, using `vi.useFakeTimers`). `tsc --noEmit`/
  `tsc -b`/`vite build` all clean.
* automated (E2E-BROWSER-001 debt paid off): two new Playwright specs committed to
  `client/e2e/` — `quiz-session-monitor.spec.ts` (the screen QUIZ-SESSION-CONTROL-001 shipped
  without one) and `quiz-session-take.spec.ts` (two separate browser contexts — trainer +
  anonymous student — proving a real join/submit through the actual UI reaches the trainer's
  monitor). Both pass; full e2e suite (10 specs) passes.
* manual, real browser, against a disposable Postgres + server (isolated ports, dev stack
  confirmed untouched via `docker ps` before/after): (1) started a session with a 1-minute
  limit and, with **no page reload or re-navigation**, waited for the poll tick to flip
  Block #1 from Stop to Reopen on its own once `closesAt` passed — confirms the
  self-correction side effect flagged at planning; (2) full anonymous-student flow across two
  separate browser contexts (no shared cookies): joined via the placeholder page, watched the
  trainer's Block #2 pick up "1 joined" within one poll tick with no manual refresh, submitted
  via the stub button, started the session, and watched "1/1 answered" appear the same way.
* one pre-existing, unrelated issue surfaced while running the e2e suite for this story:
  Playwright's `webServer` teardown crashes the server process with an unhandled `error`
  event on the pg pool ("terminating connection due to administrator command") when the
  disposable Postgres container is torn down before the server process exits. Confirmed this
  predates this story — the same crash reproduces running only the pre-existing
  `courses.spec.ts` alone, unmodified. Out of scope here (a pool-level error-handling gap in
  `server/src/db/client.ts`, nothing to do with quiz sessions); flagging for sprint review
  rather than fixing under this story's DoD.
