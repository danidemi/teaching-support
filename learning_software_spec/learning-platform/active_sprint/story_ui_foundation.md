ID: UI-FOUNDATION-001

Status: READY

Priority: Medium

Effort: ? (not yet estimated — needs grooming)

As:
any user of the platform (`unregistered` or `registered`)

I want to:
see a visually polished, consistent interface instead of today's low-quality, ad-hoc
styling

So that:
the product feels trustworthy and professional, and every new screen built afterward
starts from a shared visual foundation instead of inventing its own styling

Definition of Done:
* `shadcn/ui` is adopted as the UI component library (decided at sprint planning 2026-08-22
  — see the ADR this decision requires per CLAUDE.md's Sprint Planning activity, to be
  written before development starts). Chosen over MUI/Mantine because it's copy-in
  components (Radix + Tailwind) rather than a runtime dependency, giving full styling
  control with no version lock-in.
* the existing screens (Home, Sign-up, Confirm-result, and whatever AUTH-UX-001 has shipped
  by the time this is picked up — this story lands after AUTH-UX-001, see Notes) are rebuilt
  on top of it — consistent spacing, colors, typography, and button/input/link styles across
  all of them, not just the newest screen
* consistency checklist (decided at sprint planning 2026-08-22, so "consistent" is checkable):
  one spacing scale, one color palette (primary/neutral/error), one type scale, and defined
  button/input/link states (default/hover/focus/disabled), applied identically across every
  rebuilt screen
* verified by human visual sign-off against the checklist above (the `frontend-design`
  Claude Code plugin, already installed in this project, should be used for aesthetic
  direction/review during development)

Notes:
* raised during sprint review (2026-08-22): current Home/Sign-up/Confirm-result screens
  were built functionality-first with no design pass
  * this is deliberately a foundation-laying story, not a per-screen redesign — screens
    built after this one should reuse its components rather than styling themselves
    independently
* sequenced after AUTH-UX-001 (`story_auth_ux.md`), decided at sprint planning 2026-08-22:
  AUTH-UX-001 ships with today's ad-hoc styling, and this story restyles the resulting
  header/sign-in/sign-up screens along with Home and Sign-up, rather than restyling a layout
  that's about to change
* needs its own ADR for the `shadcn/ui` adoption before development starts, per CLAUDE.md's
  Sprint Planning activity (tech-stack addition against ADR-0001)

Open questions:
* none — all resolved at sprint planning 2026-08-22

Verification (development, 2026-08-22):
* shadcn/ui adopted per ADR-0006: Tailwind CSS 3 + Radix primitives, copy-in components
  under `client/src/components/ui/` (`button.tsx`, `input.tsx`, `label.tsx`, `card.tsx`), not
  a versioned component-library dependency
* consistency checklist encoded as reusable tokens, not just applied by eye:
  - spacing scale: `tailwind.config.js`'s `field-gap`/`group-gap`/`section-gap`, used by all
    three rebuilt screens (`App.tsx`, `SignUpPage.tsx`, `LoginPage.tsx`)
  - color palette: `ink` (primary), `paper` (background), `brass` (accent), `success`/`error`
    (status), `border` (neutral) — same six tokens reused everywhere via the shared
    components, no screen defines its own colors
  - type scale: `tailwind.config.js`'s `fontSize` scale; three named faces (`font-display`
    for headings, `font-sans` for body/UI, `font-mono` reserved for future
    technical/data display — not yet consumed on-screen, flagged below)
  - button/input/link states: `Button`/`Input` components define default/hover/
    focus-visible/disabled explicitly (not left to browser UA defaults) — verified in the
    compiled CSS (e.g. `.border-error\/30`, `.gap-group-gap`, `.font-display` all present in
    `dist/assets/*.css`, confirming Tailwind actually generated these custom-token classes
    rather than silently dropping them)
* also fixed while restyling: `SignUpPage.tsx`'s header previously had a plain, unlinked
  product-name `<span>` (a pre-existing gap AUTH-UX-001 didn't close on that screen) — now
  a link to `/`, matching `App.tsx`/`LoginPage.tsx`
* signature element (design-lead pass, `frontend-design` skill): auth-form cards render as a
  library/course-catalog index card (brass left spine + folded top-right corner) rather than
  a generic centered white box, tying the visual identity to the course-authoring subject
  matter instead of a generic default
* automated: 39/39 server tests green (unchanged — no server-side change in this story),
  23/23 client tests green, unchanged assertions (role-based queries survived the markup
  rewrite) — confirms the restyle didn't alter behavior, only appearance
* manual: disposable server instance confirmed `/`, `/signup`, and the built CSS asset all
  serve 200 with the new bundle
* gaps, not closed — both need human follow-through, not something I can self-certify:
  - **no actual screenshot/visual review was possible**: no browser or screenshot tool is
    available in this environment (checked for Chromium/Playwright/Puppeteer — none
    installed). The restyle was verified structurally (compiled CSS contains the expected
    classes, pages serve 200, tests pass) but never actually seen rendered. The DoD's
    "verified by human visual sign-off against the checklist" step is still fully open —
    please review the three screens in a browser before accepting this story.
  - `font-mono` (IBM Plex Mono) is declared as a design token but not yet used on any
    screen — no on-screen content currently warrants it (e.g. raw error codes are shown as
    plain text, unchanged from before this story, not a new gap this story introduced).
    Leaving the token defined and unused is fine for now; flagging so it isn't mistaken for
    an oversight.
