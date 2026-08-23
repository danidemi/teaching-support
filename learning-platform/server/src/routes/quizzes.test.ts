import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import {
  createFakeUserRepository,
  createFakeTenantRepository,
  createFakeCourseRepository,
  createTestSessionMiddleware,
  signInAgent,
} from '../testSupport/fakes.js'
import type { NewQuiz, Quiz, QuizFileUpdate, QuizRepository } from '../db/quizzes.js'

// Covers QUIZ-DASHBOARD-001's DoD (active_sprint/story_quiz_dashboard.md):
// list, delete, and replace-file, all scoped to a course the caller's
// tenant actually owns. Also covers QTI3-MIGRATION-001's DoD
// (active_sprint/story_qti3_migration.md, replacing QTI-22-IMPORT's
// original QTI 2.2 coverage per ADR-0007's hard cutover): POST validates
// the file as QTI 3.0 before creating a row, rejecting an invalid one
// with line/element-level errors and not creating anything.

const VALID_QTI_ITEM = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="q1" title="Sample question">
  <qti-item-body><p>What is 2 + 2?</p></qti-item-body>
</qti-assessment-item>`

function createFakeQuizRepository(): QuizRepository & { rows: (Quiz & { courseId: string })[] } {
  const rows: (Quiz & { courseId: string })[] = []
  let nextId = 1

  return {
    rows,
    async listByCourse(courseId: string) {
      return rows.filter((row) => row.courseId === courseId).map(({ id, title, fileName, status, createdAt, updatedAt }) => ({ id, title, fileName, status, createdAt, updatedAt }))
    },
    async create(quiz: NewQuiz) {
      const now = new Date()
      const created = { id: String(nextId++), courseId: quiz.courseId, title: quiz.title, fileName: quiz.fileName, status: 'uploaded', createdAt: now, updatedAt: now }
      rows.push(created)
      return { id: created.id, title: created.title, fileName: created.fileName, status: created.status, createdAt: created.createdAt, updatedAt: created.updatedAt }
    },
    async delete(quizId: string, courseId: string) {
      const index = rows.findIndex((row) => row.id === quizId && row.courseId === courseId)
      if (index === -1) return false
      rows.splice(index, 1)
      return true
    },
    async replaceFile(quizId: string, courseId: string, file: QuizFileUpdate) {
      const row = rows.find((row) => row.id === quizId && row.courseId === courseId)
      if (!row) return null
      row.fileName = file.fileName
      row.updatedAt = new Date()
      return { id: row.id, title: row.title, fileName: row.fileName, status: row.status, createdAt: row.createdAt, updatedAt: row.updatedAt }
    },
  }
}

function createTestApp() {
  const users = createFakeUserRepository()
  const tenants = createFakeTenantRepository()
  const courses = createFakeCourseRepository()
  const quizzes = createFakeQuizRepository()
  const app = createApp({ users, tenants, courses, quizzes, sessionMiddleware: createTestSessionMiddleware() })
  return { app, users, courses, quizzes }
}

async function createCourse(agent: ReturnType<typeof request.agent>, title = 'Intro to Python') {
  const response = await agent.post('/api/courses').send({ title })
  return response.body.id as string
}

describe('GET /api/courses/:courseId/quizzes (QUIZ-DASHBOARD-001)', () => {
  it('returns 401 when not signed in', async () => {
    const { app } = createTestApp()
    const response = await request(app).get('/api/courses/some-id/quizzes')
    expect(response.status).toBe(401)
  })

  it('returns 404 for a course belonging to a different tenant', async () => {
    // given: a course created by tenant A
    const { app, users } = createTestApp()
    const agentA = await signInAgent(users, app, 'trainer-a@example.com')
    const courseId = await createCourse(agentA)
    const agentB = await signInAgent(users, app, 'trainer-b@example.com')

    // when: tenant B tries to list its quizzes
    const response = await agentB.get(`/api/courses/${courseId}/quizzes`)

    // then: it's a 404, not a 403 — doesn't confirm the course exists at all
    expect(response.status).toBe(404)
  })

  it('lists the quizzes belonging to the course', async () => {
    // given: a course with two seeded quiz rows
    const { app, users, courses, quizzes } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)
    void courses
    await quizzes.create({ courseId, title: 'Quiz 1', fileName: 'quiz1.xml', fileData: Buffer.from('x') })
    await quizzes.create({ courseId, title: 'Quiz 2', fileName: 'quiz2.xml', fileData: Buffer.from('y') })

    // when: listing quizzes for the course
    const response = await agent.get(`/api/courses/${courseId}/quizzes`)

    // then: both are returned, with title, upload date (createdAt), and status
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(2)
    expect(response.body[0]).toMatchObject({ title: 'Quiz 1', status: 'uploaded' })
    expect(response.body[0].createdAt).toBeDefined()
  })

  it('returns an empty list for a course with no quizzes yet', async () => {
    const { app, users } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)

    const response = await agent.get(`/api/courses/${courseId}/quizzes`)

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })
})

describe('POST /api/courses/:courseId/quizzes (QTI-22-IMPORT)', () => {
  it('returns 401 when not signed in', async () => {
    const { app } = createTestApp()
    const response = await request(app).post('/api/courses/some-id/quizzes').attach('file', Buffer.from(VALID_QTI_ITEM), 'quiz.xml')
    expect(response.status).toBe(401)
  })

  it('returns 404 for a course belonging to a different tenant', async () => {
    const { app, users } = createTestApp()
    const agentA = await signInAgent(users, app, 'trainer-a@example.com')
    const courseId = await createCourse(agentA)
    const agentB = await signInAgent(users, app, 'trainer-b@example.com')

    const response = await agentB.post(`/api/courses/${courseId}/quizzes`).attach('file', Buffer.from(VALID_QTI_ITEM), 'quiz.xml')

    expect(response.status).toBe(404)
  })

  it('returns 400 when no file is attached', async () => {
    const { app, users } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)

    const response = await agent.post(`/api/courses/${courseId}/quizzes`)

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'missing_file' })
  })

  it('creates a quiz from a valid QTI 3.0 file, using its declared title', async () => {
    // given: a signed-in trainer with a course
    const { app, users } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)

    // when: uploading a well-formed QTI 3.0 item
    const response = await agent.post(`/api/courses/${courseId}/quizzes`).attach('file', Buffer.from(VALID_QTI_ITEM), 'question1.xml')

    // then: it is created, titled from the file's own "title" attribute
    expect(response.status).toBe(201)
    expect(response.body.title).toBe('Sample question')
    expect(response.body.status).toBe('uploaded')
    const listResponse = await agent.get(`/api/courses/${courseId}/quizzes`)
    expect(listResponse.body).toHaveLength(1)
  })

  it('rejects an invalid QTI file with line/element-level errors, creating nothing', async () => {
    // given: a file missing the required "identifier" attribute
    const { app, users } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)
    const invalid = '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" title="No id"><qti-item-body/></qti-assessment-item>'

    // when: uploading it
    const response = await agent.post(`/api/courses/${courseId}/quizzes`).attach('file', Buffer.from(invalid), 'bad.xml')

    // then: it is rejected with structured errors, and no quiz was created
    expect(response.status).toBe(400)
    expect(response.body.error).toBe('invalid_format')
    expect(response.body.errors.length).toBeGreaterThan(0)
    expect(response.body.errors[0]).toHaveProperty('line')
    expect(response.body.errors[0]).toHaveProperty('message')
    const listResponse = await agent.get(`/api/courses/${courseId}/quizzes`)
    expect(listResponse.body).toEqual([])
  })

  it('rejects malformed (non-well-formed) XML the same way', async () => {
    const { app, users } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)

    const response = await agent.post(`/api/courses/${courseId}/quizzes`).attach('file', Buffer.from('<not><valid<xml'), 'broken.xml')

    expect(response.status).toBe(400)
    expect(response.body.error).toBe('invalid_format')
  })
})

describe('DELETE /api/courses/:courseId/quizzes/:quizId (QUIZ-DASHBOARD-001)', () => {
  it('deletes the quiz row', async () => {
    // given: a course with one quiz
    const { app, users, quizzes } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)
    const quiz = await quizzes.create({ courseId, title: 'Quiz 1', fileName: 'quiz1.xml', fileData: Buffer.from('x') })

    // when: deleting it
    const response = await agent.delete(`/api/courses/${courseId}/quizzes/${quiz.id}`)

    // then: it succeeds and the row is gone
    expect(response.status).toBe(204)
    const listResponse = await agent.get(`/api/courses/${courseId}/quizzes`)
    expect(listResponse.body).toEqual([])
  })

  it('returns 404 for a quiz that does not belong to the course', async () => {
    const { app, users } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)

    const response = await agent.delete(`/api/courses/${courseId}/quizzes/not-a-real-id`)

    expect(response.status).toBe(404)
  })

  it("returns 404 when the course belongs to a different tenant, without deleting anything", async () => {
    // given: a quiz that belongs to tenant A's course
    const { app, users, quizzes } = createTestApp()
    const agentA = await signInAgent(users, app, 'trainer-a@example.com')
    const courseId = await createCourse(agentA)
    const quiz = await quizzes.create({ courseId, title: 'Quiz 1', fileName: 'quiz1.xml', fileData: Buffer.from('x') })
    const agentB = await signInAgent(users, app, 'trainer-b@example.com')

    // when: tenant B tries to delete it
    const response = await agentB.delete(`/api/courses/${courseId}/quizzes/${quiz.id}`)

    // then: rejected, and the quiz still exists for tenant A
    expect(response.status).toBe(404)
    const listResponse = await agentA.get(`/api/courses/${courseId}/quizzes`)
    expect(listResponse.body).toHaveLength(1)
  })
})

describe('PUT /api/courses/:courseId/quizzes/:quizId/file (QUIZ-DASHBOARD-001)', () => {
  it('replaces the file without creating a new row', async () => {
    // given: a course with one quiz
    const { app, users, quizzes } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)
    const quiz = await quizzes.create({ courseId, title: 'Quiz 1', fileName: 'original.xml', fileData: Buffer.from('x') })

    // when: replacing its file
    const response = await agent
      .put(`/api/courses/${courseId}/quizzes/${quiz.id}/file`)
      .attach('file', Buffer.from('<xml>new</xml>'), 'replacement.xml')

    // then: the same row is updated, not a new one added
    expect(response.status).toBe(200)
    expect(response.body.id).toBe(quiz.id)
    expect(response.body.fileName).toBe('replacement.xml')
    const listResponse = await agent.get(`/api/courses/${courseId}/quizzes`)
    expect(listResponse.body).toHaveLength(1)
  })

  it('returns 400 when no file is attached', async () => {
    const { app, users, quizzes } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)
    const quiz = await quizzes.create({ courseId, title: 'Quiz 1', fileName: 'original.xml', fileData: Buffer.from('x') })

    const response = await agent.put(`/api/courses/${courseId}/quizzes/${quiz.id}/file`)

    expect(response.status).toBe(400)
  })

  it('returns 404 for a quiz that does not exist in the course', async () => {
    const { app, users } = createTestApp()
    const agent = await signInAgent(users, app, 'trainer@example.com')
    const courseId = await createCourse(agent)

    const response = await agent
      .put(`/api/courses/${courseId}/quizzes/not-a-real-id/file`)
      .attach('file', Buffer.from('<xml/>'), 'quiz.xml')

    expect(response.status).toBe(404)
  })
})
