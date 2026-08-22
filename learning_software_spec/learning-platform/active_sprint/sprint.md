# Sprint plan — started 2026-08-22

## Scope

All 8 stories that reached READY during this planning session:

* DEPS-001 — dependency vulnerability cleanup
* AUTH-UX-001 — sign-in page, header sign-in button, email/password login
* LOGOUT-001 — log-out control
* UI-FOUNDATION-001 — shadcn/ui adoption + screen restyle
* TENANT-001 — tenant check/creation on first login
* COURSE-001 — course dashboard (list/sort/create/select)
* QUIZ-DASHBOARD-001 — quiz dashboard (list/delete/re-upload)
* QTI-22-IMPORT — QTI 2.2 quiz upload

This is a large sprint by CLAUDE.md's "smallest possible subset" guideline — flagged to the
human at planning time (2026-08-22) and confirmed as intentional.

## Development sequence (2026-08-22, revised for strictly sequential development)

The human asked for strictly sequential development (one PBI at a time), so the two chains
recorded at planning time are linearized into one order:

**AUTH-UX-001 → LOGOUT-001 → UI-FOUNDATION-001 → TENANT-001 → COURSE-001 →
QUIZ-DASHBOARD-001 → QTI-22-IMPORT → DEPS-001**

Rationale for this order (not the order originally written above, which described two
independent parallel chains — kept as historical context below):
* AUTH-UX-001 first: introduces the session mechanism (ADR-0005) and builds the header with
  slots for the log-out control and tenant label, so LOGOUT-001/TENANT-001 fill in rather
  than restructure the header again.
* LOGOUT-001 next: needs AUTH-UX-001's session support, nothing else does yet.
* UI-FOUNDATION-001 third, *before* the tenancy/course chain: this means COURSE-001 and
  QUIZ-DASHBOARD-001 get built on shadcn/ui once, instead of ad-hoc-styled and restyled
  later. (This supersedes COURSE-001's own Open Questions note, written at planning time,
  that assumed it would ship before UI-FOUNDATION-001 — see that story's file.)
* TENANT-001 → COURSE-001 → QUIZ-DASHBOARD-001 → QTI-22-IMPORT: unchanged internal order,
  each depending on the previous (tenant scoping → course scoping → quiz-dashboard existing
  → a place to show an uploaded quiz).
* DEPS-001 last: it bumps existing deps: AUTH-UX-001 adds `express-session` +
  `connect-pg-simple`, UI-FOUNDATION-001 adds Tailwind + Radix. Running the audit before
  those land would make DEPS-001's "zero high/critical" DoD stale by sprint end.

### Historical context: chains as recorded at planning time

**Auth/UI chain:** AUTH-UX-001 → LOGOUT-001 → UI-FOUNDATION-001
**Tenancy/course chain:** TENANT-001 → COURSE-001 → QUIZ-DASHBOARD-001 → QTI-22-IMPORT
**DEPS-001:** no dependency on either chain

These two chains are independent of each other and could be worked in parallel; the human
chose sequential execution instead (2026-08-22), hence the single linear order above.

## New ADRs from this planning session

* `adr/ADR-0005-session-management.md` — `express-session` + `connect-pg-simple`
* `adr/ADR-0006-ui-component-library.md` — shadcn/ui

## Decisions made at sprint planning (2026-08-22), now reflected in each story

* AUTH-UX-001: Postgres-backed session store, no rate limiting for now, confirm outcome
  shown as a dismissible banner
* UI-FOUNDATION-001: shadcn/ui, sequenced after AUTH-UX-001, lightweight consistency
  checklist fixed now (not deferred)
* LOGIN-001: confirmed still blocked — Google OAuth credentials don't exist yet; stays in
  `backlog/`, out of this sprint
* COURSE-001: no pagination, friendly empty-state message
* QUIZ-DASHBOARD-001: DoD filled in — list (title/upload date/status), delete, re-upload;
  no sort/filter, no assign-to-students (no delivery story exists yet)
* TENANT-001: stale ORM-SELECTION-001/DB-MIGRATIONS-001 dependency removed — both are DONE
