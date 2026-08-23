import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card } from './components/ui/card'
import { Button } from './components/ui/button'

type JoinState = 'joining' | 'joined' | 'error'

/**
 * `/quiz-sessions/:sessionId/take` (QUIZ-SESSION-LIVE-STATUS-001): the
 * placeholder page a student reaches by scanning the trainer's QR code.
 * Explicitly NOT the real quiz-taking experience (no story specifies that
 * yet, per QUIZ-SESSION-CONTROL-001's scope decision) — this page exists
 * only to give the trainer's Quiz Session Monitor a real, if minimal,
 * signal to show: "joined" on mount, "submitted" from one stub button.
 *
 * No sign-in of any kind — a student scanning a QR code has no account
 * and no session cookie. The two calls this page makes
 * (`POST .../connections`, `POST .../connections/:id/submit`) are the
 * only anonymous endpoints in this codebase, by design (see
 * `server/src/routes/quizSessions.ts`'s doc comment).
 */
function QuizSessionTakePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [joinState, setJoinState] = useState<JoinState>('joining')
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    fetch(`/api/quiz-sessions/${sessionId}/connections`, { method: 'POST' }).then(async (response) => {
      if (cancelled) return
      if (response.status === 201) {
        const body = await response.json()
        setConnectionId(body.id)
        setJoinState('joined')
      } else {
        setJoinState('error')
      }
    })
    return () => {
      cancelled = true
    }
  }, [sessionId])

  async function handleSubmit() {
    if (!sessionId || !connectionId) return
    setActionError(null)
    const response = await fetch(`/api/quiz-sessions/${sessionId}/connections/${connectionId}/submit`, { method: 'POST' })
    if (response.status === 200) {
      setSubmitted(true)
    } else {
      setActionError('Could not submit. Try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <Card className="max-w-sm text-center">
        <h1 className="mb-3 text-lg font-semibold text-ink">Quiz session</h1>
        {joinState === 'joining' && <p className="text-sm text-ink/70">Joining…</p>}
        {joinState === 'error' && <p className="text-sm text-error">Could not join this session. Ask your trainer for a new link.</p>}
        {joinState === 'joined' && (
          <div className="flex flex-col items-center gap-group-gap" data-testid="joined-placeholder">
            <p className="text-sm text-ink/70">
              You&apos;re in. This is a placeholder page — the real quiz will appear here in a future update.
            </p>
            {actionError && <p className="text-sm text-error">{actionError}</p>}
            {submitted ? (
              <p className="text-sm font-medium text-ink">Submitted — thanks!</p>
            ) : (
              <Button type="button" onClick={handleSubmit}>
                Submit
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default QuizSessionTakePage
