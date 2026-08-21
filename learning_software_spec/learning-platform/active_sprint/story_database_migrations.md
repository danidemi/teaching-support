ID: DB-MIGRATIONS-001

Status: READY

Priority: High

Effort: 3 (added during grooming, 2026-08-21: setting up the migration tool and a first
migration is small once ORM-SELECTION-001 has picked the library)

As:
a `maintainer` of learning-platform

I want to:
use a well established database migration tool to version and apply database schema
changes, with migration files stored in the app's own repository

So that:
schema changes (new tables/columns for TENANT-001, COURSE-001, QTI-22-IMPORT, ...) are
tracked, repeatable, and applied the same way in every environment, instead of being
applied by hand against Postgres

Definition of Done:
* a migration tool compatible with the library chosen in ORM-SELECTION-001 is set up in
  `server/` (e.g. Prisma Migrate if Prisma is chosen, Drizzle Kit if Drizzle is chosen)
* migration files live under version control in `server/` and are applied via a single
  documented command (e.g. `npm run migrate`)
* a first migration exists and, run against a clean local Postgres, produces the schema
  TENANT-001 needs (`tenants`, `users` tables per `adr/ADR-0002-persistence-and-iam.md`)
* running the migration command twice in a row is a no-op the second time (idempotent)
* existing client/server unit tests still pass

Notes:
* rewritten during grooming (2026-08-21) — the previous version of this story was a
  copy-paste of DEPS-001 (npm audit content) and did not describe migrations at all; its
  claimed provenance ("carried over from `past_sprints/sprint_26_08_20/review.md`") was
  false — that review does not mention migrations
* depends on ORM-SELECTION-001 (added during grooming, 2026-08-21): the migration tool
  choice follows from the ORM choice, since each ships its own migration tool
* sequenced alongside/after TENANT-001, since TENANT-001 is the first story needing the
  `tenants`/`users` schema this story's first migration must produce
* moved to READY during grooming (2026-08-21): selected for the next sprint together with
  ORM-SELECTION-001; within the sprint, do ORM-SELECTION-001 first since this story's
  migration tool follows from that choice
