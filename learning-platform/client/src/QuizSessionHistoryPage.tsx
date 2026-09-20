import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AppHeader from './components/AppHeader'
import { Card } from './components/ui/card'
import { useSignedInUser } from './lib/session'

type SessionStatus = 'closed' | 'running' | 'stopped'

interface QuizSessionSummary {
  id: string
  status: SessionStatus
  startedAt: string | null
  stoppedAt: string | null
  joinedCount: number
  submittedCount: number
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString()
}

/**
 * `/quizzes/:quizId/sessions` (QUIZ-SESSION-HISTORY-001): every session
 * ever created for one quiz, newest first, each row linking to its
 * existing `QuizSessionMonitorPage` — no new per-session UI, no
 * editing/deleting past sessions, no cross-session aggregate reporting
 * (see the story's grooming notes for what's explicitly out of scope).
 *
 * Reached from `QuizzesSection`'s new "Sessions" action per quiz row.
 */
function QuizSessionHistoryPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const { user, logout } = useSignedInUser()
  const [sessions, setSessions] = useState<QuizSessionSummary[] | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!quizId) return
    let cancelled = false
    fetch(`/api/quizzes/${quizId}/sessions`).then(async (response) => {
      if (cancelled) return
      if (response.status === 200) {
        setSessions(await response.json())
        setLoadError(false)
      } else {
        setSessions(null)
        setLoadError(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [quizId])

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <AppHeader user={user} onLogout={logout} />

      <main className="flex-1 px-6 py-section-gap">
        <h1 className="mb-4 text-lg font-semibold text-ink">Sessions</h1>

        {!user ? (
          <p className="text-ink/70">
            <a href="/login" className="text-ink underline underline-offset-2 hover:text-brass">
              Sign in
            </a>{' '}
            to view this quiz&apos;s sessions.
          </p>
        ) : loadError ? (
          <p className="text-sm text-error">Could not load the sessions for this quiz. Try reloading the page.</p>
        ) : sessions === null ? (
          <p className="text-ink/70">Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <p className="text-ink/70">No sessions yet for this quiz.</p>
        ) : (
          <Card>
            <table className="w-full border-collapse overflow-hidden rounded-card border border-border text-left text-sm">
              <thead>
                <tr className="bg-ink-50 text-ink">
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Started</th>
                  <th className="px-4 py-2 font-medium">Stopped</th>
                  <th className="px-4 py-2 font-medium">Joined / Submitted</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="cursor-pointer border-t border-border hover:bg-ink-50"
                    onClick={() => window.location.assign(`/quiz-sessions/${session.id}`)}
                  >
                    <td className="px-4 py-2 text-ink">{session.status}</td>
                    <td className="px-4 py-2 text-ink/70">{session.startedAt ? formatDateTime(session.startedAt) : 'not started yet'}</td>
                    <td className="px-4 py-2 text-ink/70">{session.stoppedAt ? formatDateTime(session.stoppedAt) : '—'}</td>
                    <td className="px-4 py-2 text-ink/70">
                      {session.joinedCount} / {session.submittedCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </div>
  )
}

export default QuizSessionHistoryPage
