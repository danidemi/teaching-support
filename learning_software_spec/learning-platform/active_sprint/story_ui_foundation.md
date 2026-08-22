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
