import session from 'express-session'
import request from 'supertest'
import { createApp } from '../app.js'
import { hashPassword } from '../auth/password.js'
import type { NewUser, UserForLogin, UserRepository } from '../db/users.js'
import { UNIQUE_VIOLATION } from '../db/users.js'
import type { Course, CourseRepository, CourseSort, NewCourse } from '../db/courses.js'
import type { Tenant, TenantRepository } from '../db/tenants.js'

/**
 * Shared in-memory fakes for route tests, factored out of
 * `courses.test.ts` when `quizzes.test.ts` needed the same
 * users/tenants/courses fakes (QUIZ-DASHBOARD-001) — kept here rather
 * than duplicated a third time.
 */

export function createFakeUserRepository(): UserRepository & { rows: UserForLogin[] } {
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

export function createFakeTenantRepository(): TenantRepository {
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
export function createFakeCourseRepository(): CourseRepository & { rows: (Course & { tenantId: string })[] } {
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
    async findByIdForTenant(courseId: string, tenantId: string) {
      const row = rows.find((row) => row.id === courseId && row.tenantId === tenantId)
      return row ? { id: row.id, title: row.title, createdAt: row.createdAt, updatedAt: row.updatedAt } : null
    },
  }
}

export function createTestSessionMiddleware() {
  return session({ secret: 'test-secret', resave: false, saveUninitialized: false, cookie: { secure: false } })
}

export async function signInAgent(
  users: UserRepository & { rows: UserForLogin[] },
  app: ReturnType<typeof createApp>,
  email: string,
) {
  const created = await users.create({ email, passwordHash: await hashPassword('correcthorse'), confirmedAt: null })
  await users.confirmUser(created.id)
  const agent = request.agent(app)
  await agent.post('/api/login').send({ email, password: 'correcthorse' })
  return agent
}
