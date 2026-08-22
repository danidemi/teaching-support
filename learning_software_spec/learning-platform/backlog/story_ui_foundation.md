ID: UI-FOUNDATION-001

Status: DRAFT

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
* a UI component library/framework is adopted (candidates to be compared at sprint
  planning — e.g. shadcn/ui, MUI, Chakra, Mantine — against ADR-0001's React + TypeScript +
  Vite stack; this is a tech-stack addition, so it needs its own ADR per CLAUDE.md's Sprint
  Planning activity)
* the existing screens (Home, Sign-up, Confirm-result, and whatever the auth-UX restructure
  in `story_auth_ux.md`/AUTH-UX-001 has shipped by the time this is picked up) are rebuilt
  on top of it — consistent spacing, colors, typography, and button/input/link styles across
  all of them, not just the newest screen
  the specific consistency criteria to be written up as a checklist during grooming, so
  "consistent" is checkable, not just eyeballed)
* verified by human visual sign-off against the checklist above (the `frontend-design`
  Claude Code plugin, already installed in this project, should be used for aesthetic
  direction/review during development)

Notes:
* raised during sprint review (2026-08-22): current Home/Sign-up/Confirm-result screens
  were built functionality-first with no design pass
  * this is deliberately a foundation-laying story, not a per-screen redesign — screens
    built after this one should reuse its components rather than styling themselves
    independently
* depends on/coordinates with AUTH-UX-001 (`story_auth_ux.md`) — that story reshapes the
  header/sign-in/sign-up screens; sequencing (this before or after AUTH-UX-001) needs
  deciding at sprint planning to avoid restyling a layout that's about to be replaced, or
  vice versa

Open questions:
* which UI library — no preference from the human; propose 2-3 candidates at sprint
  planning
* exact consistency checklist (spacing scale, color palette, type scale, component states)
  — to be written during grooming
* sequencing against AUTH-UX-001 — which lands first
