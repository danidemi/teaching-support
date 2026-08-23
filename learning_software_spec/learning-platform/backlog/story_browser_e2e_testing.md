ID: E2E-BROWSER-001

Status: READY

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
