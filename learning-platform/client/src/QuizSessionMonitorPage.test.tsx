import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import QuizSessionMonitorPage from './QuizSessionMonitorPage'

// Covers QUIZ-SESSION-CONTROL-001's DoD
// (active_sprint/story_quiz_session_control.md): the Quiz Session Monitor
// page — QR + URL, Block #1's closed/running states and start/stop
// transitions. Also covers QUIZ-SESSION-LIVE-STATUS-001's DoD
// (active_sprint/story_quiz_session_live_status.md): Block #2's real
// joined/submitted counts in all three states.

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
  joinedCount: 0,
  submittedCount: 0,
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

  it('shows the joined count before start (QUIZ-SESSION-LIVE-STATUS-001)', async () => {
    stubFetch({ me: SIGNED_IN_USER, session: { ...BASE_SESSION, joinedCount: 3 } })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByTestId('block-2-live-status')).toHaveTextContent(/quiz not yet started.*3 joined/i))
  })

  it('shows the answers progress while running (QUIZ-SESSION-LIVE-STATUS-001)', async () => {
    stubFetch({ me: SIGNED_IN_USER, session: { ...BASE_SESSION, status: 'running', startedAt: '2026-08-23T12:00:00Z', closesAt: '2026-08-23T13:00:00Z', joinedCount: 4, submittedCount: 2 } })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByTestId('block-2-live-status')).toHaveTextContent('2/4 answered'))
    expect(screen.getAllByRole('progressbar')).toHaveLength(2)
  })

  it('shows the submission tally, not an answered percentage, after stop (revised at sprint planning)', async () => {
    stubFetch({ me: SIGNED_IN_USER, session: { ...BASE_SESSION, status: 'stopped', joinedCount: 10, submittedCount: 7 } })
    renderAt('session-1')
    await waitFor(() => expect(screen.getByTestId('block-2-live-status')).toHaveTextContent('7/10 submitted'))
  })

  it('polls for updated counts while closed (not just while running)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/me') return Promise.resolve({ status: 200, json: () => Promise.resolve(SIGNED_IN_USER) })
      return Promise.resolve({ status: 200, json: () => Promise.resolve(BASE_SESSION) })
    })
    vi.stubGlobal('fetch', fetchMock)
    renderAt('session-1')
    await vi.waitFor(() => expect(screen.getByTestId('block-2-live-status')).toBeInTheDocument())

    const callsAfterLoad = fetchMock.mock.calls.length
    await vi.advanceTimersByTimeAsync(10000)
    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsAfterLoad)
    vi.useRealTimers()
  })

  it('stops polling once the session is stopped', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/me') return Promise.resolve({ status: 200, json: () => Promise.resolve(SIGNED_IN_USER) })
      return Promise.resolve({ status: 200, json: () => Promise.resolve({ ...BASE_SESSION, status: 'stopped' }) })
    })
    vi.stubGlobal('fetch', fetchMock)
    renderAt('session-1')
    await vi.waitFor(() => expect(screen.getByTestId('block-2-live-status')).toBeInTheDocument())

    const callsAfterLoad = fetchMock.mock.calls.length
    await vi.advanceTimersByTimeAsync(10000)
    // already stopped on the very first load, so no interval should have
    // been started at all
    expect(fetchMock.mock.calls.length).toBe(callsAfterLoad)
    vi.useRealTimers()
  })

  it('shows an error when the session cannot be loaded', async () => {
    stubFetch({ me: SIGNED_IN_USER, sessionStatus: 404 })
    renderAt('does-not-exist')
    await waitFor(() => expect(screen.getByText(/could not load this session/i)).toBeInTheDocument())
  })
})
