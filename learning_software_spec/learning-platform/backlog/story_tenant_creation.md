ID: TENANT-001

Status: DRAFT

Priority: High

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

