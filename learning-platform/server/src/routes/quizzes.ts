import { Router, type Request, type Response, type RequestHandler } from 'express'
import multer from 'multer'
import path from 'node:path'
import type { CourseRepository } from '../db/courses.js'
import type { QuizRepository } from '../db/quizzes.js'
import { validateQti22 } from '../qti/validateQti22.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

/**
 * `GET/POST /api/courses/:courseId/quizzes` (list — QUIZ-DASHBOARD-001;
 * create — QTI-22-IMPORT), `DELETE .../quizzes/:quizId`
 * (QUIZ-DASHBOARD-001), and `PUT .../quizzes/:quizId/file`
 * (QUIZ-DASHBOARD-001 replace, no format validation — see that story's
 * Notes on why this and create aren't held to the same check).
 *
 * Every route first calls `courses.findByIdForTenant` — a course id that
 * doesn't exist and one that exists in a different tenant get the same
 * 404, so a caller can't use this to probe which course ids exist in
 * other tenants.
 */
export function createQuizzesRouter(courses: CourseRepository, quizzes: QuizRepository, sessionMiddleware: RequestHandler): Router {
  const router = Router()

  /**
   * 401 (no session) and 404 (course doesn't exist, or belongs to a
   * different tenant) are kept distinct — unlike the course-vs-tenant
   * case, "are you signed in at all" is not information worth hiding.
   */
  async function authorizeCourse(req: Request): Promise<'unauthenticated' | 'not_found' | 'ok'> {
    if (!req.session.tenantId) return 'unauthenticated'
    const course = await courses.findByIdForTenant(req.params.courseId, req.session.tenantId)
    return course ? 'ok' : 'not_found'
  }

  function rejectIfUnauthorized(authResult: 'unauthenticated' | 'not_found' | 'ok', res: Response): boolean {
    if (authResult === 'unauthenticated') {
      res.status(401).json({ error: 'not_signed_in' })
      return true
    }
    if (authResult === 'not_found') {
      res.status(404).json({ error: 'course_not_found' })
      return true
    }
    return false
  }

  router.get('/api/courses/:courseId/quizzes', sessionMiddleware, async (req, res) => {
    if (rejectIfUnauthorized(await authorizeCourse(req), res)) return
    try {
      const rows = await quizzes.listByCourse(req.params.courseId)
      res.status(200).json(rows)
    } catch (err) {
      console.error('list quizzes failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  // QTI-22-IMPORT: format-checked before a row is ever created. A failing
  // upload returns every structural error found (line/element-level, per
  // the DoD), not just the first — a trainer fixing a file one round trip
  // at a time is a worse experience than seeing everything wrong at once.
  router.post('/api/courses/:courseId/quizzes', sessionMiddleware, upload.single('file'), async (req, res) => {
    if (rejectIfUnauthorized(await authorizeCourse(req), res)) return
    if (!req.file) {
      res.status(400).json({ error: 'missing_file' })
      return
    }

    const validation = validateQti22(req.file.buffer)
    if (!validation.valid) {
      res.status(400).json({ error: 'invalid_format', errors: validation.errors })
      return
    }

    try {
      const title = validation.title || path.parse(req.file.originalname).name
      const created = await quizzes.create({
        courseId: req.params.courseId,
        title,
        fileName: req.file.originalname,
        fileData: req.file.buffer,
      })
      res.status(201).json(created)
    } catch (err) {
      console.error('create quiz failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  router.delete('/api/courses/:courseId/quizzes/:quizId', sessionMiddleware, async (req, res) => {
    if (rejectIfUnauthorized(await authorizeCourse(req), res)) return
    try {
      const deleted = await quizzes.delete(req.params.quizId, req.params.courseId)
      if (!deleted) {
        res.status(404).json({ error: 'quiz_not_found' })
        return
      }
      res.status(204).end()
    } catch (err) {
      console.error('delete quiz failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  router.put('/api/courses/:courseId/quizzes/:quizId/file', sessionMiddleware, upload.single('file'), async (req, res) => {
    if (rejectIfUnauthorized(await authorizeCourse(req), res)) return
    if (!req.file) {
      res.status(400).json({ error: 'missing_file' })
      return
    }
    try {
      const updated = await quizzes.replaceFile(req.params.quizId, req.params.courseId, {
        fileName: req.file.originalname,
        fileData: req.file.buffer,
      })
      if (!updated) {
        res.status(404).json({ error: 'quiz_not_found' })
        return
      }
      res.status(200).json(updated)
    } catch (err) {
      console.error('replace quiz file failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  return router
}
