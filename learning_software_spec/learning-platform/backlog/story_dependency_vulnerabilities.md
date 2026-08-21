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
