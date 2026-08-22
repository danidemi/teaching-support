import './App.css'

const MESSAGES: Record<string, string> = {
  ok: 'Your account is confirmed. You can sign in now.',
  expired: 'This confirmation link has expired. Please sign up again to get a new one.',
  used: 'This confirmation link has already been used.',
  invalid: 'This confirmation link is not valid.',
}

/**
 * `/confirm-result` (SIGN-UP-001): renders a distinct message for each
 * `?status=` value `GET /api/confirm` redirects here with. An
 * unrecognized/missing status falls back to the `invalid` message rather
 * than rendering nothing.
 */
function ConfirmResultPage() {
  const status = new URLSearchParams(window.location.search).get('status')
  const message = MESSAGES[status ?? ''] ?? MESSAGES.invalid

  return (
    <div className="app">
      <header className="app-header">
        <span>Learning Platform</span>
      </header>
      <main className="app-body">
        <p role="status">{message}</p>
      </main>
    </div>
  )
}

export default ConfirmResultPage
