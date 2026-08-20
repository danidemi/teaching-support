ID: HOME-001

Status: DONE — accepted at sprint review 2026-08-20

Priority: High

As:
an `unregistered user`

I want to:
open the `learning platform` home page without needing to sign in first

So that:
I can see what the platform is and what services it offers before deciding to sign in (see `story_login.md`)

Definition of Done:
* as an `unregistered user`, I can open the browser, type the platform URL, and the home page loads
* the home page loads without asking for a Google sign-in first
* the home page shows a top header stating the product name, styled with a background color different from the body
* the sign-in/log-in button sits centered in the body (not in the header)
* no further content is required in the body beyond the sign-in button
* no other page/section is reachable while `unregistered` — this story covers only the home page
* verified by automated unit tests (`client/src/App.test.tsx`, `server/src/app.test.ts`) plus a manual smoke check (`curl` against the running server)

Notes:
* home page content beyond the header and sign-in button is deferred to a later story
* other browsable sections for unregistered users are deferred to a later story

Implementation:
* stack: TypeScript + Node.js + React, see `../adr/ADR-0001-tech-stack.md`
* source: `piattaforma-corsi/learning-platform/client` (React app) and
  `piattaforma-corsi/learning-platform/server` (Express server serving the built client)
* the sign-in button is an inert placeholder for this story — no action wired yet (LOGIN-001 wires it)
