# ADR-0008: QR code generation for the Quiz Session Monitor

## Status
Accepted — 2026-08-23

## Context
QUIZ-SESSION-CONTROL-001 needs to render a QR code encoding the student-facing session URL
on the Quiz Session Monitor page. No QR code library exists in either `client/` or `server/`
today — this is the first story that needs one.

The URL to encode is known once a session is created (it's just `<app base url>/sessions/
<sessionId>` or similar); no server round-trip is needed to produce the QR image itself, only
to know the session id.

## Decision
Generate the QR code **client-side**, using the **`qrcode`** npm package (pure JavaScript, no
native/node-gyp dependency — consistent with ADR-0004's `bcryptjs` rationale for avoiding
native build steps), calling its browser-safe `toDataURL`/canvas API to render directly into
an `<img>`/`<canvas>` on the Quiz Session Monitor page.

* Client-side avoids a new server endpoint and any server-side image-generation dependency —
  the client already has the URL (constructed from `window.location.origin` + the session
  id), so there's nothing for the server to compute.
* `qrcode` is small, widely used, and has no runtime dependency on native bindings, matching
  this project's existing preference (ADR-0004) for keeping the dependency tree
  build-portable across local dev, Docker, and CI.

## Consequences
* `client/package.json` gains `qrcode` as a runtime dependency (plus `@types/qrcode` as a dev
  dependency, since the package doesn't ship its own types).
* The plain-text URL is still shown alongside the QR code (per the wireframe) — this is
  already in QUIZ-SESSION-CONTROL-001's Definition of Done, unaffected by this ADR.
* If a future story needs the QR code server-side (e.g. embedded in an emailed/printed
  handout), this decision is revisited then — not needed for this sprint.
