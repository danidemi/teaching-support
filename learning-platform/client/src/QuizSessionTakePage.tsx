import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QtiAssessmentItemPlayer, type QtiAssessmentItemPlayerHandle } from '@longsightgroup/qti3-player-react'
import { Card } from './components/ui/card'
import { Button } from './components/ui/button'

type SessionStatus = 'closed' | 'running' | 'stopped'
type JoinState = 'joining' | 'joined' | 'error'

interface QuizItem {
  identifier: string
  path: string
  xml: string
  supported: boolean
}

/**
 * `/quiz-sessions/:sessionId/take` (QUIZ-TAKE-RENDER-001): the real
 * quiz-taking experience, replacing QUIZ-SESSION-LIVE-STATUS-001's
 * placeholder page. Still no sign-in of any kind — a student scanning a QR
 * code has no account (see `server/src/routes/quizSessions.ts`'s doc
 * comment for the full list of anonymous, no-tenant endpoints this page
 * calls).
 *
 * Joining (`POST .../connections`) happens on mount regardless of session
 * status, unchanged from the placeholder — a join before the session
 * starts is still counted (QUIZ-SESSION-LIVE-STATUS-001's DoD). Status is
 * fetched separately to decide what to render; there is no polling here —
 * the approved wireframe ("check back once the trainer starts it") is a
 * manual-refresh flow, not a live one.
 */
function QuizSessionTakePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [joinState, setJoinState] = useState<JoinState>('joining')
  const [connectionId, setConnectionId] = useState<string | null>(null)
  const [status, setStatus] = useState<SessionStatus | null>(null)
  const [items, setItems] = useState<QuizItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const playerRef = useRef<QtiAssessmentItemPlayerHandle>(null)

  useEffect(() => {
    if (!sessionId) return
    let cancelled = false

    async function load() {
      const [joinResponse, statusResponse] = await Promise.all([
        fetch(`/api/quiz-sessions/${sessionId}/connections`, { method: 'POST' }),
        fetch(`/api/quiz-sessions/${sessionId}/status`),
      ])
      if (cancelled) return

      if (joinResponse.status !== 201) {
        setJoinState('error')
        return
      }
      const joinBody = await joinResponse.json()
      setConnectionId(joinBody.id)
      setJoinState('joined')

      if (statusResponse.status !== 200) return
      const statusBody = await statusResponse.json()
      if (cancelled) return
      setStatus(statusBody.status)

      if (statusBody.status === 'running') {
        const itemsResponse = await fetch(`/api/quiz-sessions/${sessionId}/items`)
        if (cancelled || itemsResponse.status !== 200) return
        const itemsBody = await itemsResponse.json()
        if (cancelled) return
        setItems(itemsBody.items)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [sessionId])

  async function recordCurrentAnswer(item: QuizItem) {
    const responses = item.supported ? (playerRef.current?.serialize()?.responses ?? null) : null
    await fetch(`/api/quiz-sessions/${sessionId}/connections/${connectionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemPath: item.path, responses }),
    })
  }

  async function handleNext() {
    if (!items) return
    const item = items[index]
    setActionError(null)
    try {
      await recordCurrentAnswer(item)
    } catch {
      setActionError('Could not save your answer. Try again.')
      return
    }
    const isLast = index === items.length - 1
    if (!isLast) {
      setIndex((i) => i + 1)
      return
    }
    if (!sessionId || !connectionId) return
    const response = await fetch(`/api/quiz-sessions/${sessionId}/connections/${connectionId}/submit`, { method: 'POST' })
    if (response.status === 200) {
      setSubmitted(true)
    } else {
      setActionError('Could not submit. Try again.')
    }
  }

  const currentItem = items?.[index]

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <Card className="max-w-sm text-center">
        <h1 className="mb-3 text-lg font-semibold text-ink">Quiz session</h1>
        {joinState === 'joining' && <p className="text-sm text-ink/70">Joining…</p>}
        {joinState === 'error' && <p className="text-sm text-error">Could not join this session. Ask your trainer for a new link.</p>}

        {joinState === 'joined' && status === 'closed' && (
          <p className="text-sm text-ink/70" data-testid="not-started-message">
            This quiz hasn&apos;t started yet. Check back once the trainer starts the session.
          </p>
        )}

        {joinState === 'joined' && status === 'stopped' && (
          <p className="text-sm text-ink/70" data-testid="stopped-message">
            This quiz session has ended.
          </p>
        )}

        {joinState === 'joined' && status === 'running' && submitted && (
          <p className="text-sm font-medium text-ink" data-testid="submitted-confirmation">
            ✓ Quiz submitted!
          </p>
        )}

        {joinState === 'joined' && status === 'running' && !submitted && currentItem && (
          <div className="flex flex-col items-center gap-group-gap" data-testid="quiz-question">
            <p className="text-sm text-ink/70">
              Question {index + 1} of {items?.length}
            </p>
            {currentItem.supported ? (
              <QtiAssessmentItemPlayer key={currentItem.identifier} ref={playerRef} xml={currentItem.xml} />
            ) : (
              <p className="text-sm text-ink/70" data-testid="unsupported-item-message">
                ⚠ This question type isn&apos;t supported yet and has been skipped.
              </p>
            )}
            {actionError && <p className="text-sm text-error">{actionError}</p>}
            <Button type="button" onClick={handleNext}>
              {items && index === items.length - 1 ? 'Submit' : 'Next'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default QuizSessionTakePage
