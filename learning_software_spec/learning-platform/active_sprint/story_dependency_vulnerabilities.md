ID: DEPS-001

Status: READY

Priority: Low

Effort: 3 (added during grooming, 2026-08-21: mostly running `npm audit fix` and verifying
tests, with unknown but bounded risk if `--force` is needed)

As:
a `maintainer` of learning-platform

I want to:
address the `npm audit` findings in `client` and `server` (5 vulnerabilities: 3 moderate,
1 high, 1 critical, all in dev dependencies) flagged during the HOME-001 sprint but not
fixed then

So that:
the project does not carry known vulnerable dependencies indefinitely

Definition of Done:
* `npm audit` on `client` and `server` reports zero high/critical vulnerabilities
* `npm audit fix` (without `--force`, to avoid breaking changes) is tried first; any
  remaining vulnerability that only `--force` can resolve is either fixed with a follow-up
  manual verification (existing tests still pass) or explicitly logged here as accepted risk
  with a reason
* existing client and server unit tests still pass after any dependency bump

Notes:
* carried over from `past_sprints/sprint_26_08_20/review.md`, which flagged this as a
  "backlog candidate" but did not create a story for it — added during grooming (2026-08-20)
  so it isn't silently dropped between sprints
* moved to READY during grooming (2026-08-21): clear DoD, no dependencies, no open
  questions — meets DoR on its own merits. Not selected for the current sprint (see
  `active_sprint/sprint.md`), kept small and independent for a future sprint slot
* run last in this sprint (decided at sprint planning 2026-08-22, see `active_sprint/sprint.md`):
  AUTH-UX-001 and UI-FOUNDATION-001 both added dependencies of their own, which would have
  made an earlier "zero high/critical" check stale by sprint end
* the vulnerability count grew between grooming (5) and development (7 client / 8 server) —
  new advisories published in the meantime (`react-router`, `vitest`/`@vitest/mocker`, plus
  `drizzle-kit`'s chain which didn't exist in the project at grooming time, added by
  ORM-SELECTION-001/TENANT-001). The DoD's "5 vulnerabilities" count in this story's own "I
  want" section is now stale; the DoD's actual criteria (zero high/critical, tests still
  pass) are what was verified, not the specific number.

Technical decisions made during development (2026-08-22):
* plain `npm audit fix` (no `--force`) fixed nothing on either package — every path npm
  offered required a semver-major bump. Handled with targeted, explicit version pins instead
  of `npm audit fix --force`'s automatic resolution, so each bump could be checked
  individually rather than accepting whatever npm picked (which, for `server`, was actually a
  **downgrade** to `drizzle-kit@0.18.1` — npm's audit fix logic will pick an older version if
  that's what avoids the advisory range, not necessarily a newer one):
  - `client`: `vite` ^5 → ^7 (not ^8 — `@vitejs/plugin-react`'s stable line only peers with
    vite through ^7; bumped that too, to ^5.2.0, which does peer with ^7), `vitest` ^2 → ^4.
    This cleared every vulnerability except `react-router`/`react-router-dom`.
  - `server`: `vitest` ^2 → ^4. This cleared every vulnerability except the
    `drizzle-kit`/`@esbuild-kit/*` chain.
* **accepted risk: `react-router-dom` stays on v6** (`client`). The only fix is v7, which
  ADR-0004 explicitly deferred ("Revisit the v7 pin once the project's Node baseline moves to
  20+") because v7 requires Node ≥20 and the project's stated baseline is Node 18.19.1.
  Bumping it here would silently reverse that ADR's decision without the deliberate call
  ADR-0004 said it needs — out of scope for a dependency-vulnerability cleanup story. The
  vulnerabilities themselves (open redirect via backslash in `<Link>`/`useNavigate`;
  constructor injection in SSR hydration) don't apply here either: this app does no SSR, and
  its `<Link>`/`useNavigate` usage is minimal and not fed attacker-controlled backslash-laden
  paths (see AUTH-UX-001 — even the sign-in/sign-up links are plain `<a>` tags, not
  react-router `<Link>`).
* **accepted risk: `drizzle-kit`'s `@esbuild-kit/core-utils`/`@esbuild-kit/esm-loader` chain**
  (`server`, dev dependency only). The only non-major fix path npm offers is a downgrade; the
  only real fix is a `1.0.0-rc` **pre-release** of `drizzle-kit` (confirmed via `npm view` —
  the release-candidate line drops `@esbuild-kit/*` for `jiti`/`get-tsconfig` instead), which
  isn't an acceptable trade for a stable project's tooling. The underlying advisory
  (`GHSA-67mh-4wv8-2f99`) is about esbuild's *development server* accepting arbitrary
  cross-origin requests — `drizzle-kit generate`/`migrate` are one-shot local CLI
  invocations that never start a dev server, so this project has no exposure to what the
  advisory actually describes.
* found and fixed a real bug while verifying: `server/tsconfig.json` had no `exclude` for
  test files, so `tsc -b` compiled `*.test.ts` into `dist/*.test.js` alongside production
  code. Vitest 2 apparently never picked those up, but Vitest 4 did, silently running every
  server test twice (78 tests reported as 156). Fixed by excluding
  `src/**/*.test.ts`/`src/testSupport/**` from the TypeScript build — dist/ no longer ships
  test code either, which it never should have.

Verification (development, 2026-08-22):
* `client`: 7 → 2 vulnerabilities (0 high/critical remaining, both moderate and accepted-risk
  per above). 41/41 tests green on vitest 4. Full `tsc -b && vite build` succeeds on vite 7.
* `server`: 8 → 4 vulnerabilities (0 high/critical remaining, all four moderate and one
  accepted-risk chain per above). 78/78 tests green on vitest 4 (after the dist/ double-count
  fix). `tsc -b` succeeds; the actual compiled `dist/index.js` was smoke-tested with `node`
  directly (not `tsx`) on a disposable server instance — `/healthz` and `/` both responded
  correctly, confirming the tsconfig `exclude` change didn't affect the real production
  artifact.
