import { useState, type FormEvent } from 'react'
import './App.css'

/**
 * `/login` screen (AUTH-UX-001). Email + password is the only sign-in
 * method listed for now — Google sign-in (LOGIN-001) is added to this page
 * later, once its OAuth credentials exist.
 *
 * On success, does a full navigation to `/` (not client-side routing) so
 * the home page's `/api/me` check re-runs against the freshly-issued
 * session cookie rather than relying on stale in-memory state.
 */
function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setMessage(null)
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (response.status === 200) {
      window.location.assign('/')
      return
    }
    const body = await response.json()
    setMessage(`Sign in failed: ${body.error}`)
  }

  return (
    <div className="app">
      <header className="app-header">
        <a href="/" className="app-header-title">
          Learning Platform
        </a>
      </header>
      <main className="app-body">
        <form onSubmit={handleLogin}>
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button type="submit">Sign in</button>
        </form>
        {message && <p role="status">{message}</p>}
        <a href="/signup" className="create-account-link">
          Don&apos;t have an account yet? Create one
        </a>
      </main>
    </div>
  )
}

export default LoginPage
