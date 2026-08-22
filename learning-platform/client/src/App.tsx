import { useEffect, useState } from 'react'
import { Button } from './components/ui/button'

const PRODUCT_NAME = 'Learning Platform'

/**
 * Messages for the `?status=` outcome `GET /api/confirm` redirects here
 * with (AUTH-UX-001 — previously rendered on the now-retired
 * `/confirm-result` page). An unrecognized/missing status falls back to
 * the `invalid` message rather than rendering nothing.
 */
const CONFIRM_MESSAGES: Record<string, string> = {
  ok: 'Your account is confirmed. You can sign in now.',
  expired: 'This confirmation link has expired. Please sign up again to get a new one.',
  used: 'This confirmation link has already been used.',
  invalid: 'This confirmation link is not valid.',
}

/**
 * UI-FOUNDATION-001: the confirm banner uses the success/error tokens
 * (tailwind.config.js) — `ok` reads as success, everything else as an
 * error state, matching how the platform elsewhere signals outcomes.
 */
const CONFIRM_TONE: Record<string, 'success' | 'error'> = {
  ok: 'success',
  expired: 'error',
  used: 'error',
  invalid: 'error',
}

interface SignedInUser {
  id: string
  email: string
  // TENANT-001: null only for a session predating this story (or a
  // lookup race) — every current login path assigns one.
  tenant: { id: string; name: string } | null
}

/**
 * Home page (HOME-001, restructured by AUTH-UX-001/LOGOUT-001/TENANT-001,
 * restyled by UI-FOUNDATION-001): reachable without signing in. The header
 * states the product name (a link back to `/`), and shows either a
 * "Sign in" link (unregistered) or the signed-in user's current tenant and
 * email plus a "Log out" control (once `GET /api/me` confirms a session
 * exists) — TENANT-001's "visualizes its current tenant close to its
 * avatar", `user.email` standing in for the avatar until one exists.
 *
 * "Sign in" is a plain <a> wrapped in `Button asChild`, not react-router's
 * <Link>, so App.tsx keeps needing no <Router> ancestor and App.test.tsx
 * (which renders <App /> standalone) needed no <Router> wrapper — same
 * reasoning as the existing "Sign up" link (ADR-0004).
 */
function App() {
  const [user, setUser] = useState<SignedInUser | null>(null)
  const [confirmStatus, setConfirmStatus] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('status'),
  )

  useEffect(() => {
    let cancelled = false
    fetch('/api/me')
      .then((res) => (res.status === 200 ? res.json() : null))
      .then((body) => {
        if (!cancelled && body) setUser(body)
      })
      .catch(() => {
        // a failed check is treated the same as signed-out
      })
    return () => {
      cancelled = true
    }
  }, [])

  // LOGOUT-001: a full navigation back to `/` after the server confirms
  // the session is destroyed, so every bit of client state (this
  // component's, and anything future protected screens hold) resets from
  // a clean signed-out load rather than being patched in place.
  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' })
    window.location.assign('/')
  }

  const tone = confirmStatus ? CONFIRM_TONE[confirmStatus] ?? 'error' : null

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="flex items-center justify-between border-b-2 border-brass bg-ink px-6 py-4 text-paper">
        <a href="/" className="font-display text-xl font-semibold tracking-tight text-paper no-underline">
          {PRODUCT_NAME}
        </a>
        {user ? (
          <span className="flex items-center gap-group-gap">
            {user.tenant && (
              <span className="rounded border border-brass/60 px-2 py-0.5 text-xs font-medium text-brass-50">
                {user.tenant.name}
              </span>
            )}
            <span className="text-sm font-medium">{user.email}</span>
            <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          </span>
        ) : (
          <Button asChild variant="ghost" size="sm">
            <a href="/login">Sign in</a>
          </Button>
        )}
      </header>

      {confirmStatus && (
        <div
          role="status"
          className={
            tone === 'success'
              ? 'flex items-center justify-between gap-group-gap border-b border-success/30 bg-success-50 px-6 py-3 text-sm text-success'
              : 'flex items-center justify-between gap-group-gap border-b border-error/30 bg-error-50 px-6 py-3 text-sm text-error'
          }
        >
          <span>{CONFIRM_MESSAGES[confirmStatus] ?? CONFIRM_MESSAGES.invalid}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setConfirmStatus(null)}
            className="text-lg leading-none opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      <main className="flex flex-1 flex-col items-center justify-center gap-group-gap px-6 text-center">
        <h1 className="font-display text-3xl font-semibold text-ink">Plan courses. Author quizzes. Teach with confidence.</h1>
        <p className="max-w-md text-base text-ink/70">
          The Learning Platform helps trainers build and manage adult-education courses from
          one place.
        </p>
        {!user && (
          <Button asChild variant="outline" className="mt-2">
            <a href="/signup">Sign up</a>
          </Button>
        )}
      </main>
    </div>
  )
}

export default App
