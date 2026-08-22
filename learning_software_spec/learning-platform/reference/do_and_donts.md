# Do and don'ts

Running log of process decisions from sprint retrospectives. Read during backlog grooming
and before development. Append new entries below; don't rewrite past ones. Keep this file
short — compact it if it grows too large, keeping only the most meaningful entries.

## From sprint_26_08_22_15_56 (SIGNUP-EXPEDITE-001, SIGN-UP-001)

* **DO** verify against a disposable server instance on its own port, with matching
  `APP_BASE_URL`, instead of the human's long-running dev server — a stale process can
  silently 200 unroutable paths via the SPA fallback and produce a false pass.
* **DON'T** run `npm run db:migrate` manually before starting the server — migrations
  already run automatically on startup (`server/src/index.ts`); a manual run is redundant
  and adds a step that can drift from what actually happens in production-like startup.
