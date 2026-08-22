import { describe, it, expect } from 'vitest'
import request from 'supertest'
import session from 'express-session'
import { createApp } from '../app.js'
import { hashPassword } from '../auth/password.js'
import type { NewUser, UserForLogin, UserRepository } from '../db/users.js'
import { UNIQUE_VIOLATION } from '../db/users.js'
import type { Course, CourseRepository, CourseSort, NewCourse } from '../db/courses.js'
import type { Tenant, TenantRepository } from '../db/tenants.js'

// Covers COURSE-001's DoD (active_sprint/story_course_dashboard.md):
// GET /api/courses lists the caller's tenant's courses, sortable;
// POST /api/courses creates one, rejecting a duplicate title within the
// same tenant; both require a session (a course list always belongs to
// some tenant, never "no tenant").

function createFakeUserRepository(): UserRepository & { rows: UserForLogin[] } {
  const rows: UserForLogin[] = []
  let nextId = 1
  return {
    rows,
    async create(user: NewUser) {
      const created: UserForLogin = { id: String(nextId++), email: user.email, passwordHash: user.passwordHash, confirmedAt: user.confirmedAt }
      rows.push(created)
      return { id: created.id, email: created.email }
    },
    async confirmUser(userId: string) {
      const row = rows.find((row) => row.id === userId)
      if (row) row.confirmedAt = new Date()
    },
    async findByEmail(email: string) {
      return rows.find((row) => row.email === email) ?? null
    },
  }
}

function createFakeTenantRepository(): TenantRepository {
  const rows = new Map<string, Tenant>()
  let nextId = 1
  return {
    async ensureCurrentTenant(userId: string, email: string) {
      const existing = rows.get(userId)
      if (existing) return existing
      const tenant: Tenant = { id: String(nextId++), name: `${email}'s workspace` }
      rows.set(userId, tenant)
      return tenant
    },
  }
}

/**
 * In-memory fake enforcing the same (tenantId, title) uniqueness the real
 * `courses_tenant_id_title_unique` index does, throwing the same wrapped
 * shape `isUniqueViolation` recognizes (mirrors signup.test.ts's fake for
 * the email-uniqueness case).
 */
function createFakeCourseRepository(): CourseRepository & { rows: (Course & { tenantId: string })[] } {
  const rows: (Course & { tenantId: string })[] = []
  let nextId = 1

  return {
    rows,
    async listByTenant(tenantId: string, sortBy: CourseSort) {
      return rows
        .filter((row) => row.tenantId === tenantId)
        .map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }))
        .sort((a, b) => (a[sortBy] < b[sortBy] ? -1 : a[sortBy] > b[sortBy] ? 1 : 0))
    },
    async create(course: NewCourse) {
      if (rows.some((row) => row.tenantId === course.tenantId && row.title === course.title)) {
        throw Object.assign(new Error('duplicate key value violates unique constraint'), {
          cause: { code: UNIQUE_VIOLATION },
        })
      }
      const now = new Date(Date.now() + rows.length) // stable, increasing across calls in one test
      const created = { id: String(nextId++), tenantId: course.tenantId, title: course.title, createdAt: now, updatedAt: now }
      rows.push(created)
      return { id: created.id, title: created.title, createdAt: created.createdAt, updatedAt: created.updatedAt }
    },
  }
}

function createTestSessionMiddleware() {
  return session({ secret: 'test-secret', resave: false, saveUninitialized: false, cookie: { secure: false } })
}

async function signInAgent(users: UserRepository & { rows: UserForLogin[] }, tenants: TenantRepository, app: ReturnType<typeof createApp>, email: string) {
  const created = await users.create({ email, passwordHash: await hashPassword('correcthorse'), confirmedAt: null })
  await users.confirmUser(created.id)
  const agent = request.agent(app)
  await agent.post('/api/login').send({ email, password: 'correcthorse' })
  return agent
}

function createTestApp() {
  const users = createFakeUserRepository()
  const tenants = createFakeTenantRepository()
  const courses = createFakeCourseRepository()
  const app = createApp({ users, tenants, courses, sessionMiddleware: createTestSessionMiddleware() })
  return { app, users, tenants, courses }
}

describe('GET /api/courses (COURSE-001)', () => {
  it('returns 401 when not signed in', async () => {
    // given: no session
    const { app } = createTestApp()

    // when: listing courses anyway
    const response = await request(app).get('/api/courses')

    // then: it is rejected — there is no tenant-less course list
    expect(response.status).toBe(401)
  })

  it("lists only the caller's tenant's courses", async () => {
    // given: two tenants, each with their own course
    const { app, users, tenants } = createTestApp()
    const agentA = await signInAgent(users, tenants, app, 'trainer-a@example.com')
    const agentB = await signInAgent(users, tenants, app, 'trainer-b@example.com')
    await agentA.post('/api/courses').send({ title: 'Intro to Python' })
    await agentB.post('/api/courses').send({ title: 'Advanced SQL' })

    // when: A lists their courses
    const response = await agentA.get('/api/courses')

    // then: only A's course is returned
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(1)
    expect(response.body[0].title).toBe('Intro to Python')
  })

  it('sorts by the requested field', async () => {
    // given: a tenant with courses created out of alphabetical order
    const { app, users, tenants } = createTestApp()
    const agent = await signInAgent(users, tenants, app, 'trainer@example.com')
    await agent.post('/api/courses').send({ title: 'Zebra basics' })
    await agent.post('/api/courses').send({ title: 'Advanced SQL' })

    // when: listing sorted by title
    const response = await agent.get('/api/courses?sortBy=title')

    // then: the courses come back alphabetically, not in creation order
    expect(response.body.map((c: { title: string }) => c.title)).toEqual(['Advanced SQL', 'Zebra basics'])
  })

  it('defaults to sorting by title when sortBy is missing or invalid', async () => {
    // given: a tenant with courses
    const { app, users, tenants } = createTestApp()
    const agent = await signInAgent(users, tenants, app, 'trainer@example.com')
    await agent.post('/api/courses').send({ title: 'Zebra basics' })
    await agent.post('/api/courses').send({ title: 'Advanced SQL' })

    // when: listing with an unrecognized sortBy value
    const response = await agent.get('/api/courses?sortBy=not-a-real-field')

    // then: it falls back to title order rather than erroring
    expect(response.status).toBe(200)
    expect(response.body.map((c: { title: string }) => c.title)).toEqual(['Advanced SQL', 'Zebra basics'])
  })

  it('returns an empty list for a tenant with no courses yet', async () => {
    // given: a freshly signed-in user with no courses
    const { app, users, tenants } = createTestApp()
    const agent = await signInAgent(users, tenants, app, 'trainer@example.com')

    // when: listing courses
    const response = await agent.get('/api/courses')

    // then: an empty list, not an error
    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })
})

describe('POST /api/courses (COURSE-001)', () => {
  it('returns 401 when not signed in', async () => {
    // given: no session
    const { app } = createTestApp()

    // when: creating a course anyway
    const response = await request(app).post('/api/courses').send({ title: 'Intro to Python' })

    // then: it is rejected
    expect(response.status).toBe(401)
  })

  it('creates a course and returns 201', async () => {
    // given: a signed-in trainer
    const { app, users, tenants } = createTestApp()
    const agent = await signInAgent(users, tenants, app, 'trainer@example.com')

    // when: creating a course
    const response = await agent.post('/api/courses').send({ title: 'Intro to Python' })

    // then: it is created
    expect(response.status).toBe(201)
    expect(response.body.title).toBe('Intro to Python')
    expect(response.body.id).toBeDefined()
  })

  it('rejects a duplicate title within the same tenant', async () => {
    // given: a tenant that already has a course with this title
    const { app, users, tenants } = createTestApp()
    const agent = await signInAgent(users, tenants, app, 'trainer@example.com')
    await agent.post('/api/courses').send({ title: 'Intro to Python' })

    // when: creating another course with the same title
    const response = await agent.post('/api/courses').send({ title: 'Intro to Python' })

    // then: it is rejected as a duplicate
    expect(response.status).toBe(409)
    expect(response.body).toEqual({ error: 'title_taken' })
  })

  it('allows the same title in two different tenants', async () => {
    // given: two different tenants
    const { app, users, tenants } = createTestApp()
    const agentA = await signInAgent(users, tenants, app, 'trainer-a@example.com')
    const agentB = await signInAgent(users, tenants, app, 'trainer-b@example.com')
    await agentA.post('/api/courses').send({ title: 'Intro to Python' })

    // when: the other tenant creates a course with the same title
    const response = await agentB.post('/api/courses').send({ title: 'Intro to Python' })

    // then: it succeeds — uniqueness is scoped to the tenant, not global
    expect(response.status).toBe(201)
  })

  it('rejects an empty title', async () => {
    // given: a signed-in trainer
    const { app, users, tenants } = createTestApp()
    const agent = await signInAgent(users, tenants, app, 'trainer@example.com')

    // when: creating a course with a blank title
    const response = await agent.post('/api/courses').send({ title: '   ' })

    // then: it is rejected
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'invalid_title' })
  })

  it('rejects a missing title', async () => {
    // given: a signed-in trainer
    const { app, users, tenants } = createTestApp()
    const agent = await signInAgent(users, tenants, app, 'trainer@example.com')

    // when: creating a course with no title field
    const response = await agent.post('/api/courses').send({})

    // then: it is rejected
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'invalid_title' })
  })
})
