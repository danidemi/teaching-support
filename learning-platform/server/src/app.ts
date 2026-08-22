import express, { type Express, type RequestHandler } from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSignupRouter } from './routes/signup.js'
import { createLoginRouter } from './routes/login.js'
import { createUserRepository, type UserRepository } from './db/users.js'
import { createConfirmationTokenRepository, type ConfirmationTokenRepository } from './db/confirmationTokens.js'
import { createTenantRepository, type TenantRepository } from './db/tenants.js'
import { createCoursesRouter } from './routes/courses.js'
import { createCourseRepository, type CourseRepository } from './db/courses.js'
import { createMailer, type Mailer } from './email/mailer.js'
import { createSessionMiddleware } from './auth/session.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist')

export interface AppDeps {
  users: UserRepository
  confirmationTokens: ConfirmationTokenRepository
  mailer: Mailer
  tenants: TenantRepository
  courses: CourseRepository
  // AUTH-UX-001: applied only to the login router's own routes (see
  // routes/login.ts) — pass a fake (e.g. `express-session` with its
  // default in-memory store) in tests, so exercising /api/login doesn't
  // need Postgres.
  sessionMiddleware: RequestHandler
}

/**
 * Builds the Express app: serves the built React client (HOME-001's home
 * page) as static files, plus a health check endpoint and (from
 * SIGNUP-EXPEDITE-001) the `/api/*` signup/config endpoints.
 *
 * Kept separate from index.ts so tests can import the app without binding
 * to a port. `deps.users` defaults to the real Postgres-backed repository
 * (needs DATABASE_URL) — pass a fake in tests so the DB-free unit test
 * suite (app.test.ts) stays DB-free; only tests that exercise the signup
 * routes need to pass one.
 */
export function createApp(deps?: Partial<AppDeps>): Express {
  const app = express()

  // Lazy: only connects to Postgres/SMTP the first time a signup route
  // actually runs. Building these eagerly here would make every
  // createApp() call need DATABASE_URL/SMTP_HOST, breaking the DB-free
  // unit test suite (app.test.ts calls createApp() with no deps and never
  // hits the signup routes).
  const users = deps?.users ?? lazyUserRepository()
  const confirmationTokens = deps?.confirmationTokens ?? lazyConfirmationTokenRepository()
  const mailer = deps?.mailer ?? lazyMailer()
  const tenants = deps?.tenants ?? lazyTenantRepository()
  const courses = deps?.courses ?? lazyCourseRepository()
  const sessionMiddleware = deps?.sessionMiddleware ?? lazySessionMiddleware()

  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  app.use(express.json())

  // API routes must be registered before the static/SPA fallback below,
  // or `/api/*` requests get swallowed and served index.html instead.
  app.use(createSignupRouter(users, confirmationTokens, mailer))
  app.use(createLoginRouter(users, tenants, sessionMiddleware))
  app.use(createCoursesRouter(courses, sessionMiddleware))

  app.use(express.static(CLIENT_DIST))

  // client-side routing fallback: any unmatched GET serves the SPA shell
  app.get('*', (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })

  return app
}

function lazyUserRepository(): UserRepository {
  let real: UserRepository | undefined

  function resolve(): UserRepository {
    if (!real) {
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set — copy server/.env.example to server/.env first')
      }
      real = createUserRepository(databaseUrl)
    }
    return real
  }

  return {
    create: (user) => resolve().create(user),
    confirmUser: (userId) => resolve().confirmUser(userId),
    findByEmail: (email) => resolve().findByEmail(email),
  }
}

function lazyConfirmationTokenRepository(): ConfirmationTokenRepository {
  let real: ConfirmationTokenRepository | undefined

  function resolve(): ConfirmationTokenRepository {
    if (!real) {
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set — copy server/.env.example to server/.env first')
      }
      real = createConfirmationTokenRepository(databaseUrl)
    }
    return real
  }

  return {
    create: (token) => resolve().create(token),
    findByHash: (tokenHash) => resolve().findByHash(tokenHash),
    markUsed: (id) => resolve().markUsed(id),
  }
}

function lazyMailer(): Mailer {
  let real: Mailer | undefined

  function resolve(): Mailer {
    if (!real) {
      const smtpHost = process.env.SMTP_HOST
      const smtpPort = process.env.SMTP_PORT
      if (!smtpHost || !smtpPort) {
        throw new Error('SMTP_HOST/SMTP_PORT are not set — copy server/.env.example to server/.env first')
      }
      real = createMailer(smtpHost, Number(smtpPort))
    }
    return real
  }

  return {
    sendConfirmationEmail: (to, link) => resolve().sendConfirmationEmail(to, link),
  }
}

function lazyTenantRepository(): TenantRepository {
  let real: TenantRepository | undefined

  function resolve(): TenantRepository {
    if (!real) {
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set — copy server/.env.example to server/.env first')
      }
      real = createTenantRepository(databaseUrl)
    }
    return real
  }

  return {
    ensureCurrentTenant: (userId, email) => resolve().ensureCurrentTenant(userId, email),
  }
}

function lazyCourseRepository(): CourseRepository {
  let real: CourseRepository | undefined

  function resolve(): CourseRepository {
    if (!real) {
      const databaseUrl = process.env.DATABASE_URL
      if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set — copy server/.env.example to server/.env first')
      }
      real = createCourseRepository(databaseUrl)
    }
    return real
  }

  return {
    listByTenant: (tenantId, sortBy) => resolve().listByTenant(tenantId, sortBy),
    create: (course) => resolve().create(course),
  }
}

/**
 * Lazy the same way lazyUserRepository/etc. are: building the real session
 * middleware eagerly would need DATABASE_URL/SESSION_SECRET set for every
 * createApp() call, breaking app.test.ts (calls createApp() with no deps
 * and never hits a route this middleware is mounted on). Deferred until a
 * request actually reaches the login router.
 */
function lazySessionMiddleware(): RequestHandler {
  let real: RequestHandler | undefined

  function resolve(): RequestHandler {
    if (!real) {
      const databaseUrl = process.env.DATABASE_URL
      const sessionSecret = process.env.SESSION_SECRET
      if (!databaseUrl || !sessionSecret) {
        throw new Error('DATABASE_URL/SESSION_SECRET are not set — copy server/.env.example to server/.env first')
      }
      real = createSessionMiddleware(databaseUrl, sessionSecret)
    }
    return real
  }

  return (req, res, next) => resolve()(req, res, next)
}
