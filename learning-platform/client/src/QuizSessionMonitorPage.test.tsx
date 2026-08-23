import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import QuizSessionMonitorPage from './QuizSessionMonitorPage'

// Covers QUIZ-SESSION-CONTROL-001's DoD
// (active_sprint/story_quiz_session_control.md): the Quiz Session Monitor
// page — QR + URL, Block #1's closed/running states and start/stop
// transitions, and a static Block #2 placeholder.

const SIGNED_IN_USER = { id: '1', email: 'trainer@example.com', tenant: { id: 't1', name: "trainer@example.com's workspace" } }

function renderAt(sessionId: string) {
  render(
    <MemoryRouter initialEntries={[`/quiz-sessions/${sessionId}`]}>
      <Routes>
        <Route path="/quiz-sessions/:sessionId" element={<QuizSessionMonitorPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function stubFetch(handlers: {
  me?: object | null
  session?: object | null
  sessionStatus?: number
  startStatus?: number
  stopStatus?: number
}) {
  let session = handlers.session
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (url === '/api/me') {
        return handlers.me
          ? Promise.resolve({ status: 200, json: () => Promise.resolve(handlers.me) })
          : Promise.resolve({ status: 401, json: () => Promise.resolve({ error: 'not_signed_in' }) })
      }
      if (url.endsWith('/start') && init?.method === 'POST') {
        if (handlers.startStatus && handlers.startStatus !== 200) {
          return Promise.resolve({ status: handlers.startStatus, json: () => Promise.resolve({ error: 'invalid_time_limit' }) })
        }
        session = { ...(session as object), status: 'running', closesAt: '2026-08-23T13:00:00Z' }
        return Promise.resolve({ status: 200, json: () => Promise.resolve(session) })
      }
      if (url.endsWith('/stop') && init?.method === 'POST') {
        if (handlers.stopStatus && handlers.stopStatus !== 200) {
          return Promise.resolve({ status: handlers.stopStatus, json: () => Promise.resolve({ error: 'internal_error' }) })
        }
        session = { ...(session as object), status: 'stopped' }
        return Promise.resolve({ status: 200, json: () => Promise.resolve(session) })
      }
      if (url.match(/^\/api\/quiz-sessions\/[^/]+$/)) {
        if (handlers.sessionStatus && handlers.sessionStatus !== 200) {
          return Promise.resolve({ status: handlers.sessionStatus, json: () => Promise.resolve({ error: 'session_not_found' }) })
        }
        return Promise.resolve({ status: 200, json: () => Promise.resolve(session) })
      }
      return Promise.resolve({ status: 404, json: () => Promise.resolve({}) })
    }),
  )
}

const BASE_SESSION = {
  id: 'session-1',
  quizId: 'q1',
  status: 'closed',
  timeLimitSeconds: null,
  startedAt: null,
  closesAt: null,
  stoppedAt: null,
  takeUrl: 'http://localhost:3000/quiz-sessions/session-1/take',
}

describe('QuizSessionMonitorPage (QUIZ-SESSION-CONTROL-001)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('prompts to sign in when not signed in', async () => {
    stubFetch({ me: null })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByText(/to view this session/i)).toBeInTheDocument())
  })

  it('shows the closed state with a time-limit input and Start button', async () => {
    stubFetch({ me: SIGNED_IN_USER, session: BASE_SESSION })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument())
    expect(screen.getByLabelText(/time limit/i)).toBeInTheDocument()
  })

  it('shows the take URL as plain text and renders a QR code', async () => {
    stubFetch({ me: SIGNED_IN_USER, session: BASE_SESSION })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByText(BASE_SESSION.takeUrl)).toBeInTheDocument())
    await waitFor(() => expect(screen.getByTestId('session-qr-code').innerHTML).toContain('<svg'))
  })

  it('starts the session and shows the running state with a Stop button', async () => {
    stubFetch({ me: SIGNED_IN_USER, session: { ...BASE_SESSION } })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/time limit/i), { target: { value: '75m' } })
    fireEvent.click(screen.getByRole('button', { name: /start/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument())
    expect(screen.getByText(/remaining/i)).toBeInTheDocument()
  })

  it('shows an error and stays closed when starting fails', async () => {
    stubFetch({ me: SIGNED_IN_USER, session: { ...BASE_SESSION }, startStatus: 400 })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /start/i }))

    await waitFor(() => expect(screen.getByText(/could not start the session/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
  })

  it('stops a running session', async () => {
    stubFetch({ me: SIGNED_IN_USER, session: { ...BASE_SESSION, status: 'running', closesAt: '2026-08-23T13:00:00Z' } })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /stop/i }))

    await waitFor(() => expect(screen.getByText(/session ended/i)).toBeInTheDocument())
  })

  // Caught by manual click-through against a real running instance
  // (2026-08-23): the first implementation left a stopped session with no
  // way back in from the UI (Block #1 rendered only a disabled Stop
  // button), contradicting the DoD's "always reopenable". This is the
  // regression test for that fix.
  it('offers a Reopen (start) action after stopping, not a dead end', async () => {
    stubFetch({ me: SIGNED_IN_USER, session: { ...BASE_SESSION, status: 'running', closesAt: '2026-08-23T13:00:00Z' } })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /stop/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /reopen/i })).toBeInTheDocument())
    expect(screen.getByLabelText(/time limit/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/time limit/i), { target: { value: '30m' } })
    fireEvent.click(screen.getByRole('button', { name: /reopen/i }))

    await waitFor(() => expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument())
  })

  it('shows Block #2 as a static placeholder, not real counts', async () => {
    stubFetch({ me: SIGNED_IN_USER, session: BASE_SESSION })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByTestId('block-2-placeholder')).toHaveTextContent(/quiz not yet started/i))
  })

  it('shows an error when the session cannot be loaded', async () => {
    stubFetch({ me: SIGNED_IN_USER, sessionStatus: 404 })
    renderAt('does-not-exist')
    await waitFor(() => expect(screen.getByText(/could not load this session/i)).toBeInTheDocument())
  })
})
