ID: [short representative unique id, matches file name, e.g.: TASK-ADD-DB-ACCOUNT]

Status: [DRAFT, READY,  IN_PROGRESS, IN_REVIEW, DONE, DISCARDED]

Priority: [High | Medium | Low]

Effort: [story points, Fibonacci scale: 1, 2, 3, 5, 8, 13 — relative size, not hours]

Current State: 
[What is the technical bottleneck, vulnerability, technical debt, or architectural flaw right now that will be adressed by this task?]

Scope:
* [one technical result that we need to obtain]
* [another technical result that we need to obtain]

Out of Scope:
* [Explicitly state what will not be done to prevent scope creep]

Definition of Done:
* [one concrete, checkable statement]
* [another concrete, checkable statement]
* [state whether verification is automatic or manual, and how]

---

## Example (for reference only — delete before filling in a real story)

ID: TASK-COMPACT-DB-MIGRATION-SCRIPTS

Status: DRAFT

Priority: High

Effort: 5

Current State:
* There are several DB creation scripts, one for each table. System has not yet published in production and the multiple scripts makes it harder to understand where a specific table is created.

Scope:
* Refactor all the scripts in a single one.

Out of Scope:
* Any refactoring of the actual DB table structures. Table structures have to remain the same.

Definition of Done:
* the suite of unmodified automated tests have to run successfully after creating the db with the new script

