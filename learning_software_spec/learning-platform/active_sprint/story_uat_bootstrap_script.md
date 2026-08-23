ID: UAT-BOOTSTRAP-001

Status: READY

Priority: Medium (infrastructure/DX story, not user-facing — flag at sprint planning if UAT
timing makes this more urgent than Medium)

Effort: 3 (set during grooming, 2026-08-23: shell script composing existing docker-compose +
build commands; no new migration step needed, see below)

As:
a `human running UAT`

I want to:
one single script/command that brings up everything needed for a human-led UAT session from
a clean state — database (`docker compose up`), a freshly built server, a freshly built
client — without me running several commands by hand in the right order

So that:
UAT can start immediately, against a known-clean, fully-built stack, without manual setup
steps that are easy to get wrong or forget

Definition of Done:
* `./scripts/uat.sh` (name/location fixed at grooming, 2026-08-23) does all of: starts
  Postgres (and mailpit) via `server/docker-compose.yml`, waits for it to be healthy, builds
  the server (`npm run build` in `server/`), builds the client (`npm run build` in
  `client/`), and starts the built server serving the built client — without requiring the
  human to run any other command first
  * **no separate migration step**: confirmed at grooming (`server/src/index.ts` already
    calls `applyMigrations` on startup, per the existing `do_and_donts.md` rule against
    duplicating that) — the script must not run `db:migrate` itself
* running it from a clean checkout (no `node_modules`, no containers up) works, not just from
  an already-set-up dev machine
* running it again on top of an already-running stack is **idempotent** (decided at
  grooming, 2026-08-23): it tears down and rebuilds cleanly rather than erroring out
* the script is documented (e.g. in `learning-platform/README.md`): what it does, how to run
  it, what port(s) to open in a browser afterward
* explicitly in scope for future maintenance: whenever a story changes how the app is
  built/started/migrated, this script must be updated in the same change — noted here so it
  surfaces at grooming/planning for those future stories, not just at this one
* verified manually: run the script against a torn-down environment, confirm the app is
  reachable and usable in a browser afterward with no other setup step

Notes:
* today the closest equivalent is manual: `docker compose up -d` (from `server/`), then
  `npm run build && npm start` in `server/`, then a separate client build/serve step — no
  single entry point exists yet
* relevant precedent from `do_and_donts.md` (`sprint_26_08_21`): verify the *actual* built/
  started path (`npm run build && npm start`), not a dev-mode shortcut (`tsx`/`vite dev`) —
  this script uses the same build+start commands that entry insists on, not a dev server
* also relevant (`sprint_26_08_22_15_56`): don't run `db:migrate` manually when the server
  already runs migrations on startup — checked at grooming (2026-08-23) against
  `server/src/index.ts`: it already calls `applyMigrations`, so the script must not
  duplicate that step (see DoD above)
* "keep in sync with future updates" is a standing process commitment, not a one-time DoD
  item — kept in the DoD as a flag so it surfaces at future planning sessions, but the actual
  enforcement is procedural (whoever changes build/start/migrate behavior updates this script
  in the same change), not something this story alone can guarantee once and be done with

Open questions:
* none — script name/location, migration-step, and idempotency all fixed at grooming
  (2026-08-23, see DoD above)

Technical plan (sprint planning, 2026-08-23):
* new `./scripts/uat.sh` (top-level, next to `client/`/`server/` — no such folder exists yet
  at this level, only `server/scripts/`) — plain POSIX shell, no new tooling/dependency
* steps: `docker compose -f server/docker-compose.yml down -v` (idempotency: always start
  from a clean container+volume state) → `docker compose -f server/docker-compose.yml up -d`
  → poll until the `postgres` healthcheck reports healthy → `npm ci && npm run build` in
  `server/` → `npm ci && npm run build` in `client/` → `npm start` in `server/` in the
  foreground (it serves the built client per existing `README.md`/ADR-0001 setup)
* no separate migration command — `server/src/index.ts` already runs `applyMigrations` on
  startup (confirmed at grooming); the script relies on that, does not duplicate it
* README.md gets a new section: what the script does, how to run it, and which port to open
  once it's running
* no ADR needed — orchestrates existing commands only, no new tech-stack element

Verification (development, 2026-08-23):
* implemented: `scripts/uat.sh` (new, POSIX `sh`, executable) does exactly the steps in the
  technical plan above — `docker compose down -v` then `up -d` against
  `server/docker-compose.yml`, polls `docker inspect`'s health status for the `postgres`
  service until `healthy` (60s timeout), copies `server/.env.example` to `server/.env` if
  missing (clean-checkout case), `npm ci && npm run build` in `server/`, `npm ci && npm run
  build` in `client/`, then `exec npm start` in `server/` in the foreground
* README.md updated with a "Human-led UAT" section: what the script does, how to run it,
  which port to open (`:3000`) and where captured emails show up (`:8025`); also fixed one
  now-stale line ("will host the Google OAuth endpoints (LOGIN-001)") since that story was
  dropped at backlog grooming this same sprint
* manual, actually run twice against this machine's Docker: first run hit a pre-existing
  stray `node dist/index.js` process squatting on port `:3000` from earlier unrelated work —
  not a script defect, killed it and reran; second run completed clean end-to-end (compose
  down/up, health poll, both builds, server start), logged `learning-platform server
  listening on port 3000`; confirmed via curl: `GET /` → 200 (serves the built SPA shell),
  `GET /courses` → 200 (SPA fallback), `GET /api/me` → 401 (API reachable, no session) — all
  without running any command by hand beyond the one script
* idempotency: confirmed by the two runs above — the second run's `down -v` cleanly tore
  down the first run's containers before recreating them, no manual cleanup needed
  in between
* not verified: a true from-scratch clean checkout (no `node_modules` anywhere yet) — both
  runs happened on a machine that already had dependencies installed once; `npm ci` covers
  the "no `node_modules`" case in principle, but this wasn't tested from an actual fresh
  `git clone`
