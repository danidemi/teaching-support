import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

/**
 * `/signup` screen. Email + password fields, scaffolded by
 * SIGNUP-EXPEDITE-001 alongside the "expedite sign up" option (shown only
 * once `GET /api/config` confirms the flag is on). The normal "Sign up"
 * submit is wired by SIGN-UP-001 to `POST /api/signup` — the confirmation-
 * email flow: the account is created unconfirmed, and a link is emailed.
 */
function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [expediteEnabled, setExpediteEnabled] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/config')
      .then((res) => res.json())
      .then((config) => {
        if (!cancelled) setExpediteEnabled(Boolean(config.expediteSignupEnabled))
      })
      .catch(() => {
        // config fetch failing just keeps the expedite option hidden
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSignUp(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const body = await response.json()
    if (response.status === 201) {
      setMessage(`Account created for ${body.email}. Check your email for a confirmation link.`)
    } else {
      setMessage(`Sign up failed: ${body.error}`)
    }
  }

  async function handleExpediteSignUp() {
    setMessage(null)
    const response = await fetch('/api/signup/expedite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const body = await response.json()
    if (response.status === 201) {
      setMessage(`Account created for ${body.email}. Sign in separately — no session was started.`)
    } else {
      setMessage(`Sign up failed: ${body.error}`)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <span>Learning Platform</span>
      </header>
      <main className="app-body">
        <form onSubmit={handleSignUp}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit">Sign up</button>
          {expediteEnabled && (
            <button type="button" onClick={handleExpediteSignUp}>
              Expedite sign up
            </button>
          )}
        </form>
        {message && <p role="status">{message}</p>}
      </main>
    </div>
  )
}

export default SignUpPage
