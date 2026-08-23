import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import QuizSessionTakePage from './QuizSessionTakePage'

// Covers QUIZ-SESSION-LIVE-STATUS-001's DoD
// (active_sprint/story_quiz_session_live_status.md): the placeholder
// page a student reaches via the QR/URL — joins on load, offers a stub
// submit action, no sign-in of any kind.

function renderAt(sessionId: string) {
  render(
    <MemoryRouter initialEntries={[`/quiz-sessions/${sessionId}/take`]}>
      <Routes>
        <Route path="/quiz-sessions/:sessionId/take" element={<QuizSessionTakePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function stubFetch(handlers: { joinStatus?: number; joinBody?: unknown; submitStatus?: number }) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (url.endsWith('/connections') && init?.method === 'POST') {
        return Promise.resolve({
          status: handlers.joinStatus ?? 201,
          json: () => Promise.resolve(handlers.joinBody ?? { id: 'connection-1' }),
        })
      }
      if (url.endsWith('/submit') && init?.method === 'POST') {
        return Promise.resolve({ status: handlers.submitStatus ?? 200, json: () => Promise.resolve({ ok: true }) })
      }
      return Promise.resolve({ status: 404, json: () => Promise.resolve({}) })
    }),
  )
}

describe('QuizSessionTakePage (QUIZ-SESSION-LIVE-STATUS-001)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('joins the session on load, with no sign-in of any kind', async () => {
    stubFetch({})
    renderAt('session-1')

    await waitFor(() => expect(screen.getByTestId('joined-placeholder')).toBeInTheDocument())
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/quiz-sessions/session-1/connections', expect.objectContaining({ method: 'POST' }))
    // never calls /api/me or anything sign-in related
    expect(vi.mocked(fetch)).not.toHaveBeenCalledWith('/api/me')
  })

  it('shows an error when the session cannot be joined', async () => {
    stubFetch({ joinStatus: 404 })
    renderAt('does-not-exist')
    await waitFor(() => expect(screen.getByText(/could not join this session/i)).toBeInTheDocument())
  })

  it('submits via the stub action and shows a confirmation', async () => {
    stubFetch({ joinBody: { id: 'connection-1' } })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(screen.getByText(/submitted — thanks/i)).toBeInTheDocument())
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/api/quiz-sessions/session-1/connections/connection-1/submit',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('shows an error when submit fails', async () => {
    stubFetch({ submitStatus: 500 })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => expect(screen.getByText(/could not submit/i)).toBeInTheDocument())
  })
})
