import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'
import type { CreatedUser, NewUser, UserRepository } from '../db/users.js'
import { UNIQUE_VIOLATION } from '../db/users.js'

/**
 * In-memory fake for the signup routes' tests — keeps this suite DB-free,
 * per server/src/db/client.ts's comment that the unit test suite must not
 * touch Postgres. Throws the same shape `drizzle-orm/node-postgres`
 * actually throws on a unique violation — the SQLSTATE code nested on
 * `.cause.code`, not `.code` directly (confirmed against a real Postgres
 * during SIGNUP-EXPEDITE-001 development: `isUniqueViolation` originally
 * checked only `.code` and silently 500'd on a real duplicate email while
 * this fake — throwing the flat shape — still made the 409 test pass).
 */
function createFakeUserRepository(): UserRepository & { rows: CreatedUser[] } {
  const rows: CreatedUser[] = []
  let nextId = 1

  return {
    rows,
    async create(user: NewUser) {
      if (rows.some((row) => row.email === user.email)) {
        throw Object.assign(new Error('duplicate key value violates unique constraint'), {
          cause: { code: UNIQUE_VIOLATION },
        })
      }
      const created = { id: String(nextId++), email: user.email }
      rows.push(created)
      return created
    },
  }
}

describe('POST /api/signup/expedite (SIGNUP-EXPEDITE-001)', () => {
  const originalFlag = process.env.EXPEDITE_SIGNUP_ENABLED

  beforeEach(() => {
    process.env.EXPEDITE_SIGNUP_ENABLED = 'true'
  })

  afterEach(() => {
    process.env.EXPEDITE_SIGNUP_ENABLED = originalFlag
  })

  it('creates the account and returns 201 when the flag is on and input is valid', async () => {
    // given: the expedite flag is on and a fresh email/password
    const users = createFakeUserRepository()
    const app = createApp({ users })

    // when: signing up
    const response = await request(app)
      .post('/api/signup/expedite')
      .send({ email: 'dev@example.com', password: 'longenough' })

    // then: the account is created
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: '1', email: 'dev@example.com' })
    expect(response.headers['set-cookie']).toBeUndefined()
  })

  it('returns 403 when the feature flag is off, even with valid input', async () => {
    // given: the expedite flag is off
    process.env.EXPEDITE_SIGNUP_ENABLED = 'false'
    const app = createApp({ users: createFakeUserRepository() })

    // when: signing up anyway
    const response = await request(app)
      .post('/api/signup/expedite')
      .send({ email: 'dev@example.com', password: 'longenough' })

    // then: it is rejected regardless of what the client sends
    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'feature_disabled' })
  })

  it('returns 409 when the email is already taken', async () => {
    // given: an email that already has an account
    const users = createFakeUserRepository()
    const app = createApp({ users })
    await request(app).post('/api/signup/expedite').send({ email: 'dev@example.com', password: 'longenough' })

    // when: signing up again with the same email
    const response = await request(app)
      .post('/api/signup/expedite')
      .send({ email: 'dev@example.com', password: 'anotherlongone' })

    // then: it is rejected as a duplicate
    expect(response.status).toBe(409)
    expect(response.body).toEqual({ error: 'email_taken' })
  })

  it('returns 400 when the password is shorter than 8 characters', async () => {
    // given: a password under the minimum length
    const app = createApp({ users: createFakeUserRepository() })

    // when: signing up
    const response = await request(app)
      .post('/api/signup/expedite')
      .send({ email: 'dev@example.com', password: 'short7x' })

    // then: it is rejected
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'password_too_short' })
  })

  it('returns 400 when the email is missing', async () => {
    // given: no email in the request body
    const app = createApp({ users: createFakeUserRepository() })

    // when: signing up
    const response = await request(app).post('/api/signup/expedite').send({ password: 'longenough' })

    // then: it is rejected rather than reaching the insert
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: 'invalid_email' })
  })
})

describe('GET /api/config (SIGNUP-EXPEDITE-001)', () => {
  const originalFlag = process.env.EXPEDITE_SIGNUP_ENABLED

  afterEach(() => {
    process.env.EXPEDITE_SIGNUP_ENABLED = originalFlag
  })

  it('reports the expedite flag as enabled when EXPEDITE_SIGNUP_ENABLED=true', async () => {
    // given: the env var is set to true
    process.env.EXPEDITE_SIGNUP_ENABLED = 'true'
    const app = createApp({ users: createFakeUserRepository() })

    // when: the client fetches config on load
    const response = await request(app).get('/api/config')

    // then: it reflects the flag
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ expediteSignupEnabled: true })
  })

  it('reports the expedite flag as disabled when the env var is unset', async () => {
    // given: the env var is not set
    delete process.env.EXPEDITE_SIGNUP_ENABLED
    const app = createApp({ users: createFakeUserRepository() })

    // when: the client fetches config on load
    const response = await request(app).get('/api/config')

    // then: it defaults to off
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ expediteSignupEnabled: false })
  })
})
