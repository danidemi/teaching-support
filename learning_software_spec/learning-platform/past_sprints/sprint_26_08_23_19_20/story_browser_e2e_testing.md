ID: E2E-BROWSER-001

Status: DONE

Priority: Medium

Effort: 5 (set during grooming, 2026-08-23: Playwright config + disposable-server wiring +
one click-through test per shipped screen)

As:
a `developer` (and, by extension, the human reviewing sprint work)

I want to:
an actual browser click-through test suite (Playwright) covering the platform's screens,
runnable as part of verification

So that:
sprint reviews stop relying only on curl/mocked-`fetch` checks for "reachable/usable in a
browser" claims — every story built during `sprint_26_08_22`-and-onward (AUTH-UX-001,
LOGOUT-001, UI-FOUNDATION-001, TENANT-001, COURSE-001, QUIZ-DASHBOARD-001, QTI-22-IMPORT)
was verified without a browser ever rendering the page

Definition of Done:
* `@playwright/test` is added to `learning-platform`'s own `package.json` (currently it only
  exists at the outer repo level, `npx playwright --version` confirms `1.62.1` is available,
  but it is not wired into this project) with a `playwright.config.ts` pointed at a
  disposable dev-server instance
* an npm script (e.g. `npm run test:e2e`) runs the suite headless against that disposable
  instance + a clean Postgres, without colliding with a developer's long-running dev server
  (per the `do_and_donts.md` rule on disposable-instance verification)
* at least one click-through test per screen shipped so far: `/`, `/signup`, `/login`,
  `/courses`, `/courses/:id/quizzes` — each test reaches its target only via UI navigation
  (clicking links/buttons), never a typed URL, matching the browsing-only style already used
  once in `past_sprints/sprint_26_08_22_15_56` for SIGN-UP-001
* CI/local run instructions documented in `README.md`
* verified automatically: the suite itself is the test; a green run is the Definition of
  Done's proof

Notes:
* raised at Sprint Review (2026-08-23) for the sprint that shipped AUTH-UX-001 through
  DEPS-001: every one of those stories' Verification sections flagged the same gap
  ("no browser/Playwright click-through anywhere this sprint"), on the stated grounds that
  "no such tooling exists in this repo" — that premise was wrong. `npx playwright --version`
  returns `1.62.1`, and an earlier sprint (SIGN-UP-001) already ran one ad hoc
  browsing-only Playwright pass without this infra existing yet. See
  `references/do_and_donts.md` for the retrospective entry this produced.
* scope is test infrastructure + coverage for what already shipped, not a commitment to add
  a browser test for every future story as a standing rule — decide that policy at grooming.

Technical plan (sprint planning, 2026-08-23):
* add `@playwright/test` as a dev dependency to `learning-platform/client/package.json`
  (the suite drives the browser against the client's served UI; keeping it there — not a
  new top-level workspace — matches this repo's existing per-package dependency style)
* `client/playwright.config.ts`: `webServer` config that runs the server against a
  disposable Postgres — reuse `server/docker-compose.yml` for Postgres/mailpit (same
  disposable-instance pattern `scripts/uat.sh` already established this sprint) plus
  `server: npm run build && npm start` in `server/`, `baseURL` pointing at `:3000`; picks a
  non-default test DB name/port if needed to avoid colliding with a developer's own running
  stack — confirm exact isolation approach against `do_and_donts.md`'s disposable-instance
  rule during implementation
* scheduled **last** in this sprint (see `sprint.md`'s development sequence) so it exercises
  the actual screens as they exist after `COURSE-DETAIL-001`'s route changes
  (`/courses/:courseId` replacing `/courses/:courseId/quizzes`) land, rather than testing a
  route about to be removed
* one spec file per screen under `client/e2e/`: `home.spec.ts` (`/`), `signup.spec.ts`,
  `login.spec.ts`, `courses.spec.ts` (`/courses`), `course-detail.spec.ts`
  (`/courses/:courseId`, replacing the old `/courses/:courseId/quizzes` target per
  COURSE-DETAIL-001) — each reaches its target via UI navigation only (click links/buttons),
  per the DoD and the SIGN-UP-001 precedent
* `client/package.json` gets `"test:e2e": "playwright test"`; `README.md` gets a "Browser
  end-to-end tests (E2E-BROWSER-001)" section: what it does, how to run it, that it needs
  Docker (for the disposable Postgres) the same way `scripts/uat.sh` does
* no ADR needed — `@playwright/test` is already present at the outer-repo level (confirmed
  at grooming, `1.62.1`), this only wires it into `learning-platform` itself; no new
  tech-stack element

Verification (development, 2026-08-23):
* implemented per the technical plan, with two adjustments made during development:
  * the disposable Postgres is its own isolated `docker-compose.e2e.yml` (project name
    `learning-platform-e2e`, host port `5433`, no named volume) rather than reusing
    `server/docker-compose.yml` directly — needed to actually guarantee no collision with a
    developer's own running stack (confirmed: ran the suite while `server-postgres-1`/
    `server-mailpit-1` were up and healthy, and they were untouched both before and after)
  * `client/vite.config.ts`'s vitest `test.exclude` gained `e2e/**` — without it, `npm test`
    (vitest) tried to run the Playwright specs itself and failed; this was caught by running
    the full unit suite after adding the e2e specs, not assumed
* 5 spec files (`home`, `signup`, `login`, `courses`, `course-detail`) plus a
  `signUpAndLogIn` helper, all UI-navigation-only (click links/buttons, `page.goto('/')` only
  as the initial entry point) — covers all 5 shipped screens per the DoD, with
  `course-detail.spec.ts` targeting COURSE-DETAIL-001's `/courses/:courseId` (not the
  now-removed `/courses/:courseId/quizzes`)
* `npm run test:e2e` (`client/package.json`) run twice against this machine's Docker: 6/6
  passed both times, ~19s each; the disposable stack's containers/volume were confirmed
  gone after each run (`docker ps`/`docker volume ls`); the dev stack
  (`server-postgres-1`/`server-mailpit-1`) stayed up and untouched throughout both runs
* one benign finding: the webServer process logs an unhandled Postgres-pool error to stderr
  when Playwright kills it at the end of a run (a DB connection mid-flight at kill time) —
  cosmetic noise in the test output, not a test failure (all tests still reported passed);
  not fixed, same category as this codebase's already-accepted jsdom "Not implemented:
  navigation" noise elsewhere
* `README.md` updated with a "Browser end-to-end tests" section: command, what it covers,
  Docker requirement, and that it's safe to run alongside a developer's own dev server
