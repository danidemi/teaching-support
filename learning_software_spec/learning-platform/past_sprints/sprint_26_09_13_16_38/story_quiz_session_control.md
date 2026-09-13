ID: QUIZ-SESSION-CONTROL-001

Status: DONE

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
  per existing convention): `id` (uuid pk), `quizId` (fk to `quizzes`), `timeLimitSeconds`
  (nullable int — no limit set means "run until stopped"), `startedAt`/`closesAt` (nullable
  timestamps — `closesAt` computed at start/reopen time from `startedAt + timeLimitSeconds`,
  left null if no limit was set), `stoppedAt` (nullable), `createdAt`/`updatedAt`. Tenancy is
  proven by joining `quizzes -> courses -> tenants` (same pattern `quizzes.ts` already uses
  for course scoping), not a denormalized `tenantId` column on this table.
* **no stored `status` column.** Status (`closed` | `running` | `stopped`) is derived on read
  from the timestamp columns: no `startedAt` -> `closed`; `startedAt` set, `stoppedAt` null,
  and (`closesAt` null or `closesAt` still in the future) -> `running`; `startedAt` set and
  either `stoppedAt` set or `closesAt` has passed -> `stopped` (auto-close on deadline, not
  just on an explicit Stop). This is what ADR-0009's "no new server infrastructure" actually
  requires here too — a background job to flip a stored status at `closesAt` would be exactly
  the kind of new infrastructure that ADR argues against; deriving it on every read needs
  none. `GET /api/quiz-sessions/:sessionId` (and any endpoint returning a session) returns
  this derived status, not a raw column.
* **time-limit parsing**: server-side only (client input is not a guard, same principle as
  `courses.ts`'s `isValidTitle`). Accepts `<positive integer>h` or `<positive integer>m`
  (case-insensitive), e.g. `3h`, `75m`; rejects anything else (`banana`, `0m`, `-5h`, empty,
  no unit) with 400. The field is optional — omitting it entirely means no time limit, not a
  validation error.
* **reopening a stopped session** (`POST .../start` again, same endpoint as the first start —
  the DoD's "always reopenable" is just "start" being callable when `stoppedAt` is already
  set): clears `stoppedAt`, re-sets `startedAt` to now, recomputes `closesAt` from whatever
  time limit is given at that call (a fresh or extended limit, per the DoD) — a full restart
  of the deadline, not a resume of the old one. Does not touch anything in
  QUIZ-SESSION-LIVE-STATUS-001's connections table, which is how that story's "keeps
  accumulating" DoD item is satisfied for free.
* new `SessionRepository` (`server/src/db/quizSessions.ts`), following the existing
  `CourseRepository`/`QuizRepository` shape.
* new route file `server/src/routes/quizSessions.ts`: `POST /api/quizzes/:quizId/sessions`
  (create), `POST /api/quiz-sessions/:sessionId/start` (also handles reopen, see above),
  `POST /api/quiz-sessions/:sessionId/stop`, `GET /api/quiz-sessions/:sessionId` (monitor
  page's initial load). All of these take an id from the URL and look up through to a tenant,
  so they're written using ROUTE-ID-GUARD-001's just-established pattern (try/catch around
  the lookup, 404 on a malformed id) from the start, not copied from the buggy
  `authorizeCourse` code — and per that story's own lesson, `testSupport/fakes.ts`'s new
  `createFakeSessionRepository` generates real UUID-shaped ids and throws the same wrapped
  `22P02` shape for a non-UUID id, so these new guards are actually exercised by a test, not
  just structurally present.
* **session URL** (ADR-0008, revised 2026-08-23): the server computes `takeUrl` from
  `APP_BASE_URL` (same `appBaseUrl()` pattern as `signup.ts`) and includes it on every session
  response. The client never builds this URL itself.
* new client page `QuizSessionMonitorPage.tsx` at route `/quiz-sessions/:sessionId`
  (`main.tsx`'s route table), rendering the QR (ADR-0008, `qrcode`'s `toString(..., { type:
  'svg' })` inline-SVG output — no canvas, so it renders and is assertable under jsdom) + the
  `takeUrl` as plain text + Block #1 + a static Block #2 placeholder. Reached from
  `QuizzesSection.tsx` (a "create session" action per quiz row — that component and its
  tests are touched by this story too, not just the new page).
* Block #1's "running" display (clock time + duration remaining) is a simple client-side
  countdown computed from `closesAt` — no polling needed for this story (ADR-0009's polling
  decision is for QUIZ-SESSION-LIVE-STATUS-001's Block #2 counts, not this). When no time
  limit was set, the block shows the running state without a clock/duration readout (nothing
  to count down to) — just the "running" state and the Stop button.
* sequenced **after** ROUTE-ID-GUARD-001, **before** QUIZ-SESSION-LIVE-STATUS-001 (which
  depends on this story's session/Block #1 existing).

Verification (development, 2026-08-23):
* implementation: `quiz_sessions` table + migration (`drizzle/0007_nosy_unicorn.sql`),
  `SessionRepository` (`db/quizSessions.ts`), `createQuizSessionsRouter`
  (`routes/quizSessions.ts`, `deriveStatus`/`parseTimeLimit` exported as pure functions),
  wired into `app.ts`. `server/src/config.ts` (new) holds `appBaseUrl()`, shared between
  `signup.ts` (refactored to use it) and the new session-URL computation. Client:
  `QuizSessionMonitorPage.tsx` + route, `QuizzesSection.tsx`'s new "Create session" action.
  `testSupport/fakes.ts` gained `createFakeSessionRepository`, and `createFakeQuizRepository`
  was moved there from `quizzes.test.ts` (now shared, both using UUID-shaped ids that throw
  per ROUTE-ID-GUARD-001's pattern).
* automated: 121/121 server tests green (30 new: `quizSessions.test.ts`'s pure-function tests
  for `deriveStatus`/`parseTimeLimit` plus route tests for create/start/stop/reopen/malformed
  ids/`takeUrl`), 61/61 client tests green (9 new in `QuizSessionMonitorPage.test.tsx`, 2 new
  in `QuizzesSection.test.tsx`). `tsc -b` / `tsc --noEmit` / `vite build` all clean on both
  sides.
* manual, against a disposable Postgres + server (isolated ports, dev stack untouched,
  confirmed via `docker ps` before/after): full API lifecycle via `curl` (create -> closed,
  start with `75m` -> running with correct `closesAt`, invalid time limit -> 400, stop ->
  stopped, reopen with a new limit -> running again with a fresh `closesAt`, malformed session
  id -> 404 not a crash), and confirmed `takeUrl` is built from `APP_BASE_URL`, not
  request/browser context (ADR-0008).
* manual, real browser (Playwright, ad hoc script against the same disposable instance, not
  committed — the sprint has no browser-suite story this time): signed in through the actual
  UI, opened the monitor page, confirmed the QR code renders as an inline `<svg>`, and
  clicked through Stop -> Reopen -> running again. **This caught a real defect the unit tests
  had missed**: the first implementation only ever showed the time-limit input/Start button
  when `status === 'closed'`, so a `stopped` session rendered a permanently-disabled Stop
  button with no way back in from the UI — contradicting the DoD's "always reopenable, closed
  is not a dead end." Fixed (`stopped` now renders the same Start-labeled-"Reopen" input as
  `closed`) and locked in with a new regression test
  (`QuizSessionMonitorPage.test.tsx`'s "offers a Reopen (start) action after stopping, not a
  dead end") before re-verifying by hand. Worth flagging at retro: the server-side unit tests
  and the first pass of client unit tests both missed this because they test each state in
  isolation rather than a real state transition sequence through the actual UI — the manual
  click-through is what caught it.
