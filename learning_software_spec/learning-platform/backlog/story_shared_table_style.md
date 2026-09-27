ID: TABLE-STYLE-001

Status: READY

Priority: Medium

Effort: 5

As:
a `trainer` (and the team maintaining the UI)

I want to:
every table in the app (quiz list, sessions list, and any future one) to share one consistent
visual style, defined in exactly one place

So that:
the app looks coherent instead of each table looking hand-rolled, and a future style change (e.g.
"make headers bolder") is a single edit instead of finding and fixing every table separately

Definition of Done:
* a single shared table component/style (exact form — shared React component vs. shared CSS
  classes — to be decided at grooming) is introduced and used by all existing tables, at minimum
  the quiz list (`client/src/components/QuizzesSection.tsx`) and the sessions list
  (`client/src/QuizSessionHistoryPage.tsx`), plus any other `<table>` usage found in
  `client/src/CourseDashboardPage.tsx` / `client/src/QuizSessionMonitorPage.tsx`
* the resulting single style resolves the concrete inconsistencies the user flagged between the
  two reference screenshots. Decided with the human (2026-09-27):
  * tables fill the available width, like today's sessions table, not the quiz table's
    centered/contained layout
  * the sessions table's left accent bar (colored strip framing the whole table) is kept and
    becomes part of the shared style, applied to every table — not dropped for a plainer look
  * table body rows get alternating background colors (zebra striping) — new, not present in
    either current variant, requested by the human during this grooming pass
  * header background/typography: adopt the quiz table's header as-is (light-gray background, bold
    dark text) — decided with the human, 2026-09-27
  * cell/action padding: adopt the sessions table's padding (already reads correctly at full
    width) — decided with the human, 2026-09-27
* no table-specific CSS/layout is duplicated per page after this change; a future table added to
  the app can reuse the shared style without re-authoring it
* verification: manual — screenshot of at least two tables (quiz list and sessions list) after the
  change, in both light and dark color-scheme, showing both now share the same header/row/padding
  style (per `do_and_donts.md`'s sprint_26_09_19 DON'T: visual/CSS defects have twice escaped
  because only one color scheme was checked)

Note:
Reference screenshots attached by the user, showing the two current inconsistent styles:
* quiz table (centered, doesn't fill width, light header, bordered action buttons):
  [`assets/TABLE-STYLE-001/current-quiz-table-centered-bordered-buttons.png`](assets/TABLE-STYLE-001/current-quiz-table-centered-bordered-buttons.png)
* sessions table (full width, left accent bar, different padding/header):
  [`assets/TABLE-STYLE-001/current-sessions-table-full-width-accent-bar.png`](assets/TABLE-STYLE-001/current-sessions-table-full-width-accent-bar.png)

User's own words: "each table style has pro and cons but none is right". All resolved-style
decisions above (width, accent bar, zebra striping, header, padding) were made with the human at
this grooming session, 2026-09-27.
