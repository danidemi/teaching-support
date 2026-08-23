import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import AppHeader from './components/AppHeader'
import { Card } from './components/ui/card'
import { Input } from './components/ui/input'
import { Button } from './components/ui/button'
import { useSignedInUser } from './lib/session'

type SessionStatus = 'closed' | 'running' | 'stopped'

interface QuizSession {
  id: string
  quizId: string
  status: SessionStatus
  timeLimitSeconds: number | null
  startedAt: string | null
  closesAt: string | null
  stoppedAt: string | null
  takeUrl: string
}

function formatClockTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** e.g. "39m" or "1h 05m" — rounds down, never negative (0m floor). */
function formatDurationRemaining(closesAtIso: string, now: Date) {
  const remainingMs = Math.max(0, new Date(closesAtIso).getTime() - now.getTime())
  const totalMinutes = Math.floor(remainingMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes}m`
}

/**
 * `/quiz-sessions/:sessionId` (QUIZ-SESSION-CONTROL-001): the "Quiz
 * Session Monitor" page — a QR code + plain-text URL for students to
 * join, Block #1 (session lifecycle: closed -> start, running -> stop,
 * always reopenable), and a static Block #2 placeholder (real live
 * counts are QUIZ-SESSION-LIVE-STATUS-001's scope, not this one's).
 *
 * `takeUrl` is never built client-side (ADR-0008) — it comes from the
 * server, computed from `APP_BASE_URL`, since a phone scanning the QR
 * code can't resolve this browser's own `window.location.origin`.
 */
function QuizSessionMonitorPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { user, logout } = useSignedInUser()
  const [session, setSession] = useState<QuizSession | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [timeLimitInput, setTimeLimitInput] = useState('')
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())

  const loadSession = useCallback(async () => {
    if (!sessionId) return
    const response = await fetch(`/api/quiz-sessions/${sessionId}`)
    if (response.status === 200) {
      setSession(await response.json())
      setLoadError(false)
    } else {
      setSession(null)
      setLoadError(true)
    }
  }, [sessionId])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  // Block #1's clock/duration-remaining display ticks on its own —
  // ADR-0009's polling decision is for QUIZ-SESSION-LIVE-STATUS-001's
  // Block #2 counts, not this purely-derived-from-closesAt display.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!session) {
      setQrSvg(null)
      return
    }
    QRCode.toString(session.takeUrl, { type: 'svg' }).then(setQrSvg)
  }, [session])

  async function handleStart() {
    if (!sessionId) return
    setActionError(null)
    const response = await fetch(`/api/quiz-sessions/${sessionId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeLimit: timeLimitInput.trim() || undefined }),
    })
    if (response.status === 200) {
      setTimeLimitInput('')
      await loadSession()
    } else {
      setActionError('Could not start the session. Check the time limit format (e.g. 3h or 75m).')
    }
  }

  async function handleStop() {
    if (!sessionId) return
    setActionError(null)
    const response = await fetch(`/api/quiz-sessions/${sessionId}/stop`, { method: 'POST' })
    if (response.status === 200) {
      await loadSession()
    } else {
      setActionError('Could not stop the session. Try again.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <AppHeader user={user} onLogout={logout} />

      <main className="flex-1 px-6 py-section-gap">
        {!user ? (
          <p className="text-ink/70">
            <a href="/login" className="text-ink underline underline-offset-2 hover:text-brass">
              Sign in
            </a>{' '}
            to view this session.
          </p>
        ) : loadError || !session ? (
          <p className="text-sm text-error">Could not load this session. Try reloading the page.</p>
        ) : (
          <div className="mx-auto grid max-w-4xl gap-section-gap md:grid-cols-2">
            <div className="flex flex-col gap-group-gap">
              {qrSvg && (
                <div
                  data-testid="session-qr-code"
                  className="w-40"
                  // qrcode's `toString(..., { type: 'svg' })` output — a
                  // plain SVG markup string, no canvas element needed
                  // (jsdom has none), per ADR-0008.
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              )}
              <p className="break-all rounded border border-border bg-white px-3 py-2 text-sm text-ink">{session.takeUrl}</p>

              <Card>
                <h2 className="mb-3 text-sm font-medium text-ink">Session control</h2>
                {actionError && <p className="mb-2 text-sm text-error">{actionError}</p>}
                {session.status === 'running' ? (
                  <div className="flex flex-col gap-2">
                    {session.closesAt && (
                      <p className="text-sm text-ink">
                        Closes at {formatClockTime(session.closesAt)} &middot; {formatDurationRemaining(session.closesAt, now)} remaining
                      </p>
                    )}
                    <p className="text-sm text-ink/70">Running</p>
                    <Button type="button" onClick={handleStop}>
                      Stop
                    </Button>
                  </div>
                ) : (
                  // 'closed' (never started) and 'stopped' (always
                  // reopenable, per the DoD — "closed is not a dead end")
                  // both show the same time-limit input + Start button.
                  <div className="flex flex-col gap-2">
                    {session.status === 'stopped' && <p className="text-sm text-ink/70">Stopped</p>}
                    <label htmlFor="time-limit" className="text-xs text-ink/70">
                      Time limit (optional, e.g. 3h or 75m)
                    </label>
                    <Input
                      id="time-limit"
                      value={timeLimitInput}
                      onChange={(event) => setTimeLimitInput(event.target.value)}
                      placeholder="e.g. 75m"
                    />
                    <Button type="button" onClick={handleStart}>
                      {session.status === 'stopped' ? 'Reopen' : 'Start'}
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            <Card data-testid="block-2-placeholder">
              <h2 className="mb-3 text-sm font-medium text-ink">Live status</h2>
              {session.status === 'closed' && <p className="text-sm text-ink/70">Quiz not yet started.</p>}
              {session.status === 'running' && <p className="text-sm text-ink/70">Running — live counts are not available yet.</p>}
              {session.status === 'stopped' && <p className="text-sm text-ink/70">Session ended.</p>}
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default QuizSessionMonitorPage
