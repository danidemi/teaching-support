import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import AppHeader from './components/AppHeader'
import { Button } from './components/ui/button'
import { useSignedInUser } from './lib/session'

interface Quiz {
  id: string
  title: string
  fileName: string
  status: string
  createdAt: string
  updatedAt: string
}

interface QtiValidationError {
  line: number
  message: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

/**
 * `/courses/:courseId/quizzes` (QUIZ-DASHBOARD-001, plus the "Upload
 * quiz" action from QTI-22-IMPORT): lists the quizzes belonging to one
 * course, with upload (format-validated server-side), delete, and
 * replace-file (not format-validated — see quizzes.ts's comment).
 *
 * This is the "course sub-view" COURSE-001's breadcrumb note anticipated
 * — reached via the "View quizzes" link on `CourseDashboardPage` once a
 * course row is selected there, per this story's own need for a
 * course-scoped screen to exist at all.
 */
function QuizDashboardPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user, logout } = useSignedInUser()
  const [quizzes, setQuizzes] = useState<Quiz[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [uploadErrors, setUploadErrors] = useState<QtiValidationError[] | null>(null)
  const replaceInputRef = useRef<HTMLInputElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const [replacingQuizId, setReplacingQuizId] = useState<string | null>(null)

  const loadQuizzes = useCallback(async () => {
    if (!courseId) return
    const response = await fetch(`/api/courses/${courseId}/quizzes`)
    if (response.status === 200) {
      setQuizzes(await response.json())
      setLoadError(false)
    } else {
      setQuizzes([])
      setLoadError(true)
    }
  }, [courseId])

  useEffect(() => {
    loadQuizzes()
  }, [loadQuizzes])

  async function handleDelete(quizId: string) {
    if (!courseId) return
    setActionError(null)
    const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}`, { method: 'DELETE' })
    if (response.status === 204) {
      await loadQuizzes()
    } else {
      setActionError('Could not delete the quiz. Try again.')
    }
  }

  async function handleUploadFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !courseId) return

    setActionError(null)
    setUploadErrors(null)
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(`/api/courses/${courseId}/quizzes`, { method: 'POST', body: formData })
    if (response.status === 201) {
      await loadQuizzes()
      return
    }
    const body = await response.json()
    if (response.status === 400 && body.error === 'invalid_format') {
      setUploadErrors(body.errors)
    } else {
      setActionError('Could not upload the quiz. Try again.')
    }
  }

  function startReplace(quizId: string) {
    setReplacingQuizId(quizId)
    replaceInputRef.current?.click()
  }

  async function handleReplaceFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    const quizId = replacingQuizId
    event.target.value = ''
    setReplacingQuizId(null)
    if (!file || !quizId || !courseId) return

    setActionError(null)
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(`/api/courses/${courseId}/quizzes/${quizId}/file`, { method: 'PUT', body: formData })
    if (response.status === 200) {
      await loadQuizzes()
    } else {
      setActionError('Could not replace the file. Try again.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <AppHeader user={user} onLogout={logout} />

      <nav aria-label="Breadcrumb" className="border-b border-border px-6 py-3 text-sm text-ink/70">
        <a href="/courses" className="text-ink underline underline-offset-2 hover:text-brass">
          Courses
        </a>{' '}
        &gt; Quizzes
      </nav>

      <main className="flex-1 px-6 py-section-gap">
        {!user ? (
          <p className="text-ink/70">
            <a href="/login" className="text-ink underline underline-offset-2 hover:text-brass">
              Sign in
            </a>{' '}
            to view this course's quizzes.
          </p>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-group-gap">
            <input ref={replaceInputRef} type="file" className="hidden" onChange={handleReplaceFileChosen} data-testid="replace-file-input" />
            <input ref={uploadInputRef} type="file" className="hidden" onChange={handleUploadFileChosen} data-testid="upload-file-input" />

            <div>
              <Button type="button" onClick={() => uploadInputRef.current?.click()}>
                Upload quiz
              </Button>
            </div>

            {loadError && <p className="text-sm text-error">Could not load the quizzes for this course. Try reloading the page.</p>}
            {actionError && <p className="text-sm text-error">{actionError}</p>}
            {uploadErrors && (
              <div className="rounded border border-error/30 bg-error-50 px-4 py-3 text-sm text-error">
                <p className="font-medium">This file isn&apos;t valid QTI 3.0:</p>
                <ul className="mt-1 list-disc pl-5">
                  {uploadErrors.map((err, index) => (
                    <li key={index}>
                      Line {err.line}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {quizzes === null ? (
              <p className="text-ink/70">Loading quizzes…</p>
            ) : quizzes.length === 0 ? (
              <p className="text-ink/70">No quizzes uploaded to this course yet.</p>
            ) : (
              <table className="w-full border-collapse overflow-hidden rounded-card border border-border text-left text-sm">
                <thead>
                  <tr className="bg-ink-50 text-ink">
                    <th className="px-4 py-2 font-medium">Title</th>
                    <th className="px-4 py-2 font-medium">Uploaded</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="border-t border-border">
                      <td className="px-4 py-2 text-ink">{quiz.title}</td>
                      <td className="px-4 py-2 text-ink/70">{formatDate(quiz.createdAt)}</td>
                      <td className="px-4 py-2 text-ink/70">{quiz.status}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => startReplace(quiz.id)}>
                            Replace file
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(quiz.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default QuizDashboardPage
