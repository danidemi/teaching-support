import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import QuizDashboardPage from './QuizDashboardPage'

// Covers QUIZ-DASHBOARD-001's DoD (active_sprint/story_quiz_dashboard.md):
// lists a course's quizzes (title/upload date/status), can delete a row,
// can replace a quiz's file without creating a new row.

const SIGNED_IN_USER = { id: '1', email: 'trainer@example.com', tenant: { id: 't1', name: "trainer@example.com's workspace" } }

function renderAt(courseId: string) {
  render(
    <MemoryRouter initialEntries={[`/courses/${courseId}/quizzes`]}>
      <Routes>
        <Route path="/courses/:courseId/quizzes" element={<QuizDashboardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function stubFetch(handlers: {
  me?: object | null
  quizzes?: unknown[]
  deleteStatus?: number
  replaceStatus?: number
  replaceBody?: unknown
  uploadStatus?: number
  uploadBody?: unknown
}) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, init?: RequestInit) => {
      if (url === '/api/me') {
        return handlers.me
          ? Promise.resolve({ status: 200, json: () => Promise.resolve(handlers.me) })
          : Promise.resolve({ status: 401, json: () => Promise.resolve({ error: 'not_signed_in' }) })
      }
      if (url.endsWith('/quizzes') && (!init || init.method === undefined)) {
        return Promise.resolve({ status: 200, json: () => Promise.resolve(handlers.quizzes ?? []) })
      }
      if (init?.method === 'DELETE') {
        return Promise.resolve({ status: handlers.deleteStatus ?? 204 })
      }
      if (init?.method === 'PUT') {
        return Promise.resolve({
          status: handlers.replaceStatus ?? 200,
          json: () => Promise.resolve(handlers.replaceBody ?? {}),
        })
      }
      if (init?.method === 'POST') {
        return Promise.resolve({
          status: handlers.uploadStatus ?? 201,
          json: () => Promise.resolve(handlers.uploadBody ?? { id: 'new', title: 'New quiz', status: 'uploaded' }),
        })
      }
      return Promise.resolve({ status: 404, json: () => Promise.resolve({}) })
    }),
  )
}

function chooseFile(testId: string, name = 'quiz.xml') {
  const input = screen.getByTestId(testId) as HTMLInputElement
  const file = new File(['<xml/>'], name, { type: 'text/xml' })
  fireEvent.change(input, { target: { files: [file] } })
}

describe('QuizDashboardPage (QUIZ-DASHBOARD-001)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('prompts to sign in when not signed in', async () => {
    stubFetch({ me: null })
    renderAt('course-1')
    await waitFor(() => expect(screen.getByText(/to view this course's quizzes/i)).toBeInTheDocument())
  })

  it('shows an empty state when the course has no quizzes yet', async () => {
    stubFetch({ me: SIGNED_IN_USER, quizzes: [] })
    renderAt('course-1')
    await waitFor(() => expect(screen.getByText(/no quizzes uploaded/i)).toBeInTheDocument())
  })

  it('lists quizzes with title, uploaded date, and status', async () => {
    stubFetch({
      me: SIGNED_IN_USER,
      quizzes: [{ id: 'q1', title: 'Chapter 1 quiz', fileName: 'ch1.xml', status: 'uploaded', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' }],
    })
    renderAt('course-1')

    await waitFor(() => expect(screen.getByText('Chapter 1 quiz')).toBeInTheDocument())
    expect(screen.getByText('uploaded')).toBeInTheDocument()
  })

  it('deletes a quiz row and refreshes the list', async () => {
    stubFetch({
      me: SIGNED_IN_USER,
      quizzes: [{ id: 'q1', title: 'Chapter 1 quiz', fileName: 'ch1.xml', status: 'uploaded', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' }],
    })
    renderAt('course-1')
    await waitFor(() => expect(screen.getByText('Chapter 1 quiz')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() =>
      expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/courses/course-1/quizzes/q1', expect.objectContaining({ method: 'DELETE' })),
    )
  })

  it('shows an error when delete fails', async () => {
    stubFetch({
      me: SIGNED_IN_USER,
      quizzes: [{ id: 'q1', title: 'Chapter 1 quiz', fileName: 'ch1.xml', status: 'uploaded', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' }],
      deleteStatus: 500,
    })
    renderAt('course-1')
    await waitFor(() => expect(screen.getByText('Chapter 1 quiz')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(screen.getByText(/could not delete/i)).toBeInTheDocument())
  })

  it('uploads a quiz and refreshes the list on success (QTI-22-IMPORT)', async () => {
    stubFetch({ me: SIGNED_IN_USER, quizzes: [] })
    renderAt('course-1')
    await waitFor(() => expect(screen.getByText(/no quizzes uploaded/i)).toBeInTheDocument())

    chooseFile('upload-file-input')

    await waitFor(() =>
      expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/courses/course-1/quizzes', expect.objectContaining({ method: 'POST' })),
    )
  })

  it('shows line/element-level errors when the server rejects the file as invalid QTI (QTI-22-IMPORT)', async () => {
    stubFetch({
      me: SIGNED_IN_USER,
      quizzes: [],
      uploadStatus: 400,
      uploadBody: { error: 'invalid_format', errors: [{ line: 1, message: '<assessmentItem> is missing the required "identifier" attribute' }] },
    })
    renderAt('course-1')
    await waitFor(() => expect(screen.getByText(/no quizzes uploaded/i)).toBeInTheDocument())

    chooseFile('upload-file-input', 'bad.xml')

    await waitFor(() => expect(screen.getByText(/isn't valid qti 2\.2/i)).toBeInTheDocument())
    expect(screen.getByText(/missing the required "identifier" attribute/i)).toBeInTheDocument()
    expect(screen.getByText(/line 1/i)).toBeInTheDocument()
  })

  it('shows a generic error for an unexpected upload failure', async () => {
    stubFetch({ me: SIGNED_IN_USER, quizzes: [], uploadStatus: 500, uploadBody: { error: 'internal_error' } })
    renderAt('course-1')
    await waitFor(() => expect(screen.getByText(/no quizzes uploaded/i)).toBeInTheDocument())

    chooseFile('upload-file-input')

    await waitFor(() => expect(screen.getByText(/could not upload/i)).toBeInTheDocument())
  })
})
