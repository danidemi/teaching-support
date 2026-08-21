ID: ORM-SELECTION-001

Status: READY

Priority: High

Effort: 3 (added during grooming, 2026-08-21: a decision plus a small spike, not a full
feature)

As:
a `maintainer` of learning-platform

I want to:
choose the ORM/query-builder library used to read and write PostgreSQL from `server/`

So that:
TENANT-001 and every later story touching persistence (COURSE-001, QTI-22-IMPORT,
DB-MIGRATIONS-001) build on one settled data-access library instead of each picking
independently

Definition of Done:
* a choice is made between the candidates already named in `adr/ADR-0002-persistence-and-iam.md`
  (Prisma, Drizzle) or another TypeScript/Node option, with rationale
* the choice is recorded as an ADR (amends/extends ADR-0002)
* a minimal spike (connect to a local Postgres, define one table, run one query) proves the
  choice works end-to-end, committed as a small example or as part of TENANT-001's setup
* local Postgres for the spike (and for local dev generally) runs via Docker Compose — a
  `docker-compose.yml` with a postgres service, checked into `server/`
* existing client/server unit tests still pass

Notes:
* added during grooming (2026-08-21), split out from DB-MIGRATIONS-001 once it was noticed
  that ADR-0002 deferred the ORM choice to "whichever story first needs to read/write the
  database" without giving that story an id
* this is the technical-overhead PBI referenced by CLAUDE.md's Activity 2 ("When the
  technical and infrastructural overhead is sensible ... a new dedicated PBI can be
  created")
* TENANT-001 and DB-MIGRATIONS-001 both depend on this story and must use the library it
  selects
* moved to READY during grooming (2026-08-21): selected for the next sprint together with
  DB-MIGRATIONS-001, as the sprint's foundation for the persistence work TENANT-001 and
  later stories need

Open questions:
* none — local Postgres run method decided during grooming (2026-08-21): Docker Compose
