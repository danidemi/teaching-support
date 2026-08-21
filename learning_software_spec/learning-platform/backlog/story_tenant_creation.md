ID: TENANT-001

Status: DRAFT

Priority: High

Effort: 5 (added during grooming, 2026-08-21: first story to touch Postgres in earnest —
schema, membership check/creation logic, header UI — on top of whatever ORM-SELECTION-001
already settled)

As:
an `registered user`

I want:
* the system to check whether I'm already associated with a tenant 
* if I'm not associated to any tenant, it have to create a new one 
* and associate me to it

So that:
* other users in other tenants cannot access my resources

Definition of Done:
* the system knows what tenants the user is associated to
* the `registered user` at any given moment has a single `current tenant` that is the one in which he is working.
* the `registered user` visualizes its `current tenant` close to its avatar.

Notes:
* sequenced immediately after LOGIN-001, decided during grooming (2026-08-20): tenancy comes
  before course management, since it changes the course data model (courses are tenant-scoped
  from the start) — see `story_course_dashboard.md` and `adr/ADR-0002-persistence-and-iam.md`
* precondition is `registered user`, satisfiable via LOGIN-001 (Google) or SIGN-UP-001
  (email/password) — either path leads here
* shares the header component (`client/src/App.tsx`) with LOGIN-001: LOGIN-001 adds the
  avatar/name, this story adds the tenant label next to it — coordinate rather than each
  story re-touching the header independently
* persistence: `tenants` and `users` tables in PostgreSQL, per
  `adr/ADR-0002-persistence-and-iam.md`
* depends on ORM-SELECTION-001 (added during grooming, 2026-08-21): this story is the
  first to read/write Postgres, so it needs the ORM/query-builder choice settled first,
  and depends on DB-MIGRATIONS-001 for how its `tenants`/`users` schema gets created
* shares the header component (`client/src/App.tsx`) with COURSE-001 too, not only
  LOGIN-001 — COURSE-001's wireframe shows the same `[Tenant: Acme] [👤]` header block
  (noted during grooming, 2026-08-21, per `references/do_and_donts.md`'s rule to check
  shared components across stories)

