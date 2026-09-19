ID: QUIZ-TAKE-URL-LINK-001

Status: READY

Priority: Low — cosmetic/usability improvement to an existing, already-working page.

Effort: 1

Depends on: none (extends `QuizSessionMonitorPage`, already built by
QUIZ-SESSION-LIVE-STATUS-001/QUIZ-SESSION-CONTROL-001)

As:
a `trainer`

I want to:
click the take-quiz URL shown next to the QR code on the Quiz Session Monitor page to open it
directly, instead of having to copy/select the plain text

So that:
I can quickly open the student view myself (e.g. to sanity-check the session) without manually
copying the URL into a new tab

Definition of Done:
* the `takeUrl` text shown on `QuizSessionMonitorPage` (currently a plain, non-interactive
  `<p>`) becomes a clickable link that opens the URL in a new browser tab
  (`target="_blank"`, with `rel="noopener noreferrer"`)
* an "open in new tab" icon (square with an arrow pointing up-right) is shown next to the URL
  text, using `lucide-react`'s `ExternalLink` icon — already available transitively via
  shadcn/ui (ADR-0006), no new dependency needed
* visual style otherwise matches the existing box (same border/background/padding); only the
  text becomes a link and gains the icon
* verification: automated — a component test asserts the rendered element is an `<a>` with
  `href` equal to `session.takeUrl`, `target="_blank"`, and `rel="noopener noreferrer"`, plus a
  visual check (screenshot) that the icon renders next to the URL

Known context (grooming, 2026-09-19):
* No wireframe needed — this is a small, localized change to one existing element
  (`client/src/QuizSessionMonitorPage.tsx`, the `<p>` rendering `session.takeUrl`).
* No backend change — `takeUrl` is already served by the existing session response
  (ADR-0008).
