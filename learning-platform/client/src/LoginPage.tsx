import { useState, type FormEvent } from 'react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import AppHeader from './components/AppHeader'

/**
 * `/login` screen (AUTH-UX-001, restyled by UI-FOUNDATION-001 — ADR-0006).
 * Email + password is the only sign-in method listed for now — Google
 * sign-in (LOGIN-001) is added to this page later, once its OAuth
 * credentials exist.
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
    <div className="min-h-screen flex flex-col bg-paper">
      <AppHeader user={null} />
      <main className="flex flex-1 items-center justify-center px-6 py-section-gap">
        <Card className="w-full max-w-sm">
          <h1 className="mb-group-gap font-display text-2xl font-semibold text-ink">Sign in</h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-group-gap">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button type="submit">Sign in</Button>
          </form>
          {message && (
            <p role="status" className="mt-group-gap text-sm text-error">
              {message}
            </p>
          )}
          <a href="/signup" className="mt-group-gap block text-center text-sm text-ink underline underline-offset-2 hover:text-brass">
            Don&apos;t have an account yet? Create one
          </a>
        </Card>
      </main>
    </div>
  )
}

export default LoginPage
