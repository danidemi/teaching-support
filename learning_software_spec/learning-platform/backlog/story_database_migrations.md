ID: DB-MIGRATIONS-001

Status: DRAFT

Priority: High

As:
a `maintainer` of learning-platform

I want to:
use a well established database migration tool to store the database migration within the app.

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
