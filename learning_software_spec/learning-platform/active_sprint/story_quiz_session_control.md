ID: QUIZ-SESSION-CONTROL-001

Status: READY

Priority: Medium-High — split out at grooming (2026-08-23) from the original
QUIZ-SESSION-MONITOR-001 draft as the first of two stories; ships first because it delivers a
complete, testable trainer flow (create → start → stop → reopen) on its own, even with
Block #2 showing static placeholders.

Effort: Medium — one new page (Quiz Session Monitor), session create/start/stop/reopen
lifecycle, QR generation, Block #1's two states + transitions. No live-count wiring (that's
QUIZ-SESSION-LIVE-STATUS-001).

As:
a `trainer`

I want to:
create a quiz session, start it (optionally with a time limit), stop it — either because I
decide to end it or because it ran its course — and reopen a stopped session if needed

So that:
I can control a quiz's live delivery from one screen, with a session record that persists
across start/stop/reopen instead of being a one-shot, disposable action

Definition of Done:
* from a quiz's page (course detail / quizzes section), a trainer can create a new **quiz
  session** — an occurrence of that quiz being taken. A quiz can have several sessions over
  time (e.g. a retake), all kept, not just the latest one
* creating a session opens a new screen, the **"Quiz Session Monitor"**, showing:
  * a QR code encoding a URL, and the same URL as plain text (the student-facing target is
    out of scope here — see QUIZ-SESSION-LIVE-STATUS-001 for the placeholder page itself;
    this story only needs the URL to exist and be renderable as a QR code)
  * **Block #1** (session control):
    * while the session is **closed**: a time-limit input (format like `3h` or `75m`) and a
      "Start" button
    * once **started**: the block shows the clock time the session will auto-close at and
      the duration remaining (both refer to the same deadline, shown two ways — decided
      during the 2026-08-23 backlog interview), and a "Stop" button
    * a session can always be reopened after being stopped (closed is not a dead end) —
      reopening returns to the "started" sub-state (a fresh or extended time limit can be
      set again)
  * **Block #2** (live status) is present on the page but shows a static/neutral placeholder
    in all three visual states (not yet wired to real counts) — full behavior is
    QUIZ-SESSION-LIVE-STATUS-001's scope
* verified automatically: unit/integration tests for session creation, and for Block #1's
  closed/running states and the start/stop/reopen transitions between them, using
  seeded/fake session data
* verified manually: a trainer creates a session, starts it with a time limit, confirms the
  clock-time/duration-remaining display, stops it, confirms it can be reopened, against a
  running disposable server instance

Wireframes (hand-drawn, from the original draft — reproduced faithfully by Claude from the
image, not redrawn by a human):
* overall layout: `assets/quiz-session-monitor/main.png`
* Block #1, closed/pre-start: `assets/quiz-session-monitor/block1.prestart.png`
* Block #1, running: `assets/quiz-session-monitor/block1.running.png`

Notes:
* split out at the 2026-08-23 backlog grooming from the original combined
  `QUIZ-SESSION-MONITOR-001` draft, together with **QUIZ-SESSION-LIVE-STATUS-001**. The split
  point is Block #1 (session lifecycle, no live counts needed) vs. Block #2 + the
  student-facing placeholder (live counts, which need a concrete presence/answer-tracking
  decision — see the sibling story).
* real-time update mechanism (polling vs. WebSocket/SSE) is not needed for this story's own
  scope (Block #1's clock/duration display can be a simple client-side countdown from the
  known deadline) — left for QUIZ-SESSION-LIVE-STATUS-001 to decide, since that's where live
  server-pushed counts actually matter.

Dependencies:
none — builds on the existing course detail / quizzes section pages.

Open questions:
none blocking grooming.

Technical plan (sprint planning, 2026-08-23):
* new `quiz_sessions` Drizzle table (`server/src/db/schema.ts`, migration applied at startup
  per existing convention): `id` (uuid pk), `quizId` (fk to `quizzes`), `status` (text:
  `closed` | `running` | `stopped`), `timeLimitSeconds` (nullable int), `startedAt`/`closesAt`
  (nullable timestamps — `closesAt` computed at start time from `startedAt +
  timeLimitSeconds`), `stoppedAt` (nullable), `createdAt`/`updatedAt`. Tenancy is proven by
  joining `quizzes -> courses -> tenants` (same pattern `quizzes.ts` already uses for course
  scoping), not a denormalized `tenantId` column on this table.
* new `SessionRepository` (`server/src/db/quizSessions.ts`), following the existing
  `CourseRepository`/`QuizRepository` shape.
* new route file `server/src/routes/quizSessions.ts`: `POST /api/quizzes/:quizId/sessions`
  (create), `POST /api/quiz-sessions/:sessionId/start`, `POST /api/quiz-sessions/:sessionId
  /stop` (also used for reopen — reopening is `POST .../start` again on a `stopped` session),
  `GET /api/quiz-sessions/:sessionId` (monitor page's initial load). All of these take an id
  from the URL and look up through to a tenant, so they're written using
  ROUTE-ID-GUARD-001's just-established pattern (try/catch around the lookup, 404 on a
  malformed id) from the start, not copied from the buggy `authorizeCourse` code.
* new client page `QuizSessionMonitorPage.tsx` at route `/quiz-sessions/:sessionId`
  (`main.tsx`'s route table), rendering the QR (ADR-0008, `qrcode` package) + URL + Block #1
  + a static Block #2 placeholder.
* sequenced **after** ROUTE-ID-GUARD-001, **before** QUIZ-SESSION-LIVE-STATUS-001 (which
  depends on this story's session/Block #1 existing).
