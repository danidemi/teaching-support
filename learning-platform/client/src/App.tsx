import { useEffect, useState } from 'react'
import './App.css'

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

interface SignedInUser {
  id: string
  email: string
}

/**
 * Home page (HOME-001, restructured by AUTH-UX-001): reachable without
 * signing in. The header states the product name (now a link back to `/`),
 * and shows either a "Sign in" link (unregistered) or the signed-in user's
 * email (once `GET /api/me` confirms a session exists).
 *
 * "Sign in" is a plain <a>, not react-router's <Link>, so App.tsx keeps
 * needing no <Router> ancestor and App.test.tsx (which renders <App />
 * standalone) needed no <Router> wrapper — same reasoning as the existing
 * "Sign up" link (ADR-0004).
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

  return (
    <div className="app">
      <header className="app-header">
        <a href="/" className="app-header-title">
          {PRODUCT_NAME}
        </a>
        {user ? (
          <span className="signed-in-user">{user.email}</span>
        ) : (
          <a href="/login" className="sign-in-button">
            Sign in
          </a>
        )}
      </header>
      {confirmStatus && (
        <div role="status" className="confirm-banner">
          <span>{CONFIRM_MESSAGES[confirmStatus] ?? CONFIRM_MESSAGES.invalid}</span>
          <button type="button" className="confirm-banner-dismiss" aria-label="Dismiss" onClick={() => setConfirmStatus(null)}>
            ×
          </button>
        </div>
      )}
      <main className="app-body">
        {!user && (
          <a href="/signup" className="sign-up-link">
            Sign up
          </a>
        )}
      </main>
    </div>
  )
}

export default App
