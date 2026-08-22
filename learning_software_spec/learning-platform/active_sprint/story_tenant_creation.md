ID: TENANT-001

Status: READY

Priority: High

Effort: 5 (added during grooming, 2026-08-21: first story to touch Postgres in earnest —
schema, membership check/creation logic, header UI — on top of what ORM-SELECTION-001 and
DB-MIGRATIONS-001 already settled)

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
* ORM-SELECTION-001 and DB-MIGRATIONS-001 are DONE (`past_sprints/sprint_26_08_21/`) —
  Drizzle + `pg` is chosen (ADR-0003) and the migration mechanism exists
  (`applyMigrations()` runs on server startup); this story is unblocked and defines the
  actual `tenants`/`users` schema in its own migration
* shares the header component (`client/src/App.tsx`) with COURSE-001 too, not only
  LOGIN-001 — COURSE-001's wireframe shows the same `[Tenant: Acme] [👤]` header block
  (noted during grooming, 2026-08-21, per `reference/do_and_donts.md`'s rule to check
  shared components across stories)

Open questions:
* none

Technical decisions made during development (2026-08-22), not specified by the thin DoD above:
* tenant assignment happens at `POST /api/login` (`server/src/routes/login.ts`), not at
  signup — signup (SIGNUP-EXPEDITE-001/SIGN-UP-001) deliberately never starts a session, so
  login is the first point a `registered user` is actually "using" the platform
* auto-created tenant name: `${email}'s workspace` — unique by construction, since
  `users.email` is already unique, without a separate name-picking UI/step this thin a DoD
  doesn't ask for
* concurrency: two simultaneous first-logins for the same never-before-tenant user race on
  `tenants.name`'s unique constraint; the loser's insert fails and re-reads what the winner
  just assigned, rather than erroring (`server/src/db/tenants.ts`)
* current tenant is carried in the session (`req.session.tenantId`/`tenantName`, set at
  login) and returned by `GET /api/me` as `tenant: {id, name}` — not a new endpoint, reusing
  the same "who am I" call the header already makes
* this is one-tenant-per-user, not a multi-user membership model — matches the DoD's "a
  single current tenant" text; inviting others into an existing tenant is future scope, not
  invented here
* cleanup: dropped the ORM-SELECTION-001 spike table (`spike_items`) and its script
  (`db:spike`/`scripts/db-spike.ts`) — its own comment said to do this "once TENANT-001 is
  fully implemented"; new migration `0004_illegal_toad_men.sql`

Verification (development, 2026-08-22):
* automated: 41/41 server tests green (`server/src/routes/login.test.ts` — 4 new tests:
  `GET /api/me` includes the current tenant, repeated logins reuse the same tenant, two
  different users get two different tenants), 24/24 client tests green (`App.test.tsx` — 1
  new test: the tenant name renders next to the signed-in user's email)
* manual, disposable server instance on port 4126 against a cleaned database: signed up two
  users, logged user A in twice — confirmed both `GET /api/me` calls returned the exact same
  tenant id/name (not two separate tenants) — then logged user B in and confirmed a distinct
  tenant, and confirmed via `psql` that the `tenants` table has exactly the two expected rows
* migration verified: ran `npm run db:migrate` against the real database and confirmed
  `\dt` no longer lists `spike_items`
* same gap as AUTH-UX-001/LOGOUT-001/UI-FOUNDATION-001: no browser/Playwright click-through
  and no visual review of the tenant badge in the header — HTTP/API-level verification only
