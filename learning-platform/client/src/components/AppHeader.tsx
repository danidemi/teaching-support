import { Button } from './ui/button'
import type { SignedInUser } from '../lib/session'

interface AppHeaderProps {
  user: SignedInUser | null
  onLogout?: () => void
}

/**
 * Shared header, built once here so COURSE-001 (and whatever comes after
 * it) doesn't re-touch this markup independently — the sprint's flagged
 * risk of the header getting rebuilt on every story that needs it
 * (AUTH-UX-001, LOGOUT-001, TENANT-001, now COURSE-001).
 *
 * `onLogout` is optional: `SignUpPage`/`LoginPage` never render the
 * signed-in state (a session cookie visiting `/signup` while signed in
 * isn't a case any story has specified behavior for), so they pass no
 * `user`/`onLogout` and just get the product-name-only header.
 *
 * The "Courses" link only appears once signed in — COURSE-001's dashboard
 * needs to be reachable from anywhere without typing a URL.
 */
function AppHeader({ user, onLogout }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b-2 border-brass bg-ink px-6 py-4 text-paper">
      <div className="flex items-center gap-section-gap">
        <a href="/" className="font-display text-xl font-semibold tracking-tight text-paper no-underline">
          Learning Platform
        </a>
        {user && (
          <a href="/courses" className="text-sm font-medium text-paper/90 hover:text-paper">
            Courses
          </a>
        )}
      </div>
      {user ? (
        <span className="flex items-center gap-group-gap">
          {user.tenant && (
            <span className="rounded border border-brass/60 px-2 py-0.5 text-xs font-medium text-brass-50">
              {user.tenant.name}
            </span>
          )}
          <span className="text-sm font-medium">{user.email}</span>
          <Button type="button" variant="ghost" size="sm" onClick={onLogout}>
            Log out
          </Button>
        </span>
      ) : (
        <Button asChild variant="ghost" size="sm">
          <a href="/login">Sign in</a>
        </Button>
      )}
    </header>
  )
}

export default AppHeader
