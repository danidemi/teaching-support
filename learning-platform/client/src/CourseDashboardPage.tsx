import { useCallback, useEffect, useState, type FormEvent } from 'react'
import AppHeader from './components/AppHeader'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { useSignedInUser } from './lib/session'

interface Course {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

type SortBy = 'title' | 'createdAt' | 'updatedAt'

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'title', label: 'Title' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

/**
 * `/courses` (COURSE-001): lists the signed-in trainer's tenant's
 * courses, sortable, with a "+ New course" action and row selection that
 * updates the breadcrumb. No edit/delete/upload — out of scope per the
 * DoD; those are future stories' jobs.
 *
 * "Current course" is kept as this page's own state, not a route param or
 * anything persisted — the DoD only requires the breadcrumb to reflect
 * the selection on this page. Once a course is selected, a "View
 * quizzes" link appears (QUIZ-DASHBOARD-001) — that story's screen is
 * reached by its own URL (`/courses/:courseId/quizzes`), not by carrying
 * this page's state into a preserved location.
 */
function CourseDashboardPage() {
  const { user, logout } = useSignedInUser()
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('title')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  const loadCourses = useCallback(async (sort: SortBy) => {
    const response = await fetch(`/api/courses?sortBy=${sort}`)
    if (response.status === 200) {
      setCourses(await response.json())
      setLoadError(false)
    } else {
      setCourses([])
      setLoadError(true)
    }
  }, [])

  useEffect(() => {
    loadCourses(sortBy)
  }, [sortBy, loadCourses])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setCreateError(null)
    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    if (response.status === 201) {
      setShowCreateForm(false)
      setNewTitle('')
      await loadCourses(sortBy)
      return
    }
    const body = await response.json()
    setCreateError(
      body.error === 'title_taken'
        ? 'A course with this name already exists in your tenant.'
        : 'Could not create the course. Check the name and try again.',
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <AppHeader user={user} onLogout={logout} />

      <nav aria-label="Breadcrumb" className="flex items-center justify-between border-b border-border px-6 py-3 text-sm text-ink/70">
        <span>
          Courses{selectedCourse && <> &gt; {selectedCourse.title}</>}
          {!selectedCourse && <> &gt; (no course selected)</>}
        </span>
        {selectedCourse && (
          <a href={`/courses/${selectedCourse.id}/quizzes`} className="text-ink underline underline-offset-2 hover:text-brass">
            View quizzes
          </a>
        )}
      </nav>

      <main className="flex-1 px-6 py-section-gap">
        {!user ? (
          <p className="text-ink/70">
            <a href="/login" className="text-ink underline underline-offset-2 hover:text-brass">
              Sign in
            </a>{' '}
            to view your courses.
          </p>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-group-gap">
            <div className="flex items-center justify-between gap-group-gap">
              <Button type="button" onClick={() => setShowCreateForm(true)}>
                + New course
              </Button>
              <label className="flex items-center gap-2 text-sm text-ink">
                Sort by
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortBy)}
                  className="rounded border border-border bg-white px-2 py-1 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {loadError && <p className="text-sm text-error">Could not load your courses. Try reloading the page.</p>}

            {courses === null ? (
              <p className="text-ink/70">Loading your courses…</p>
            ) : courses.length === 0 ? (
              <p className="text-ink/70">No courses yet — create one to get started.</p>
            ) : (
              <table className="w-full border-collapse overflow-hidden rounded-card border border-border text-left text-sm">
                <thead>
                  <tr className="bg-ink-50 text-ink">
                    <th className="px-4 py-2 font-medium">Title</th>
                    <th className="px-4 py-2 font-medium">Created</th>
                    <th className="px-4 py-2 font-medium">Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      aria-selected={selectedCourse?.id === course.id}
                      className={
                        selectedCourse?.id === course.id
                          ? 'cursor-pointer bg-brass-50 border-t border-border'
                          : 'cursor-pointer border-t border-border hover:bg-ink-50'
                      }
                    >
                      <td className="px-4 py-2 text-ink">{course.title}</td>
                      <td className="px-4 py-2 text-ink/70">{formatDate(course.createdAt)}</td>
                      <td className="px-4 py-2 text-ink/70">{formatDate(course.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {showCreateForm && (
        <div role="dialog" aria-modal="true" aria-labelledby="new-course-title" className="fixed inset-0 flex items-center justify-center bg-ink/40 px-6">
          <Card className="w-full max-w-sm">
            <h2 id="new-course-title" className="mb-group-gap font-display text-xl font-semibold text-ink">
              New course
            </h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-group-gap">
              <div>
                <Label htmlFor="course-name">Course name</Label>
                <Input id="course-name" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} required />
              </div>
              {createError && <p className="text-sm text-error">{createError}</p>}
              <div className="flex gap-group-gap">
                <Button type="submit">Create</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateError(null)
                    setNewTitle('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

export default CourseDashboardPage
