import express, { type Express } from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSignupRouter } from './routes/signup.js'
import { createUserRepository, type UserRepository } from './db/users.js'
import { createConfirmationTokenRepository, type ConfirmationTokenRepository } from './db/confirmationTokens.js'
import { createMailer, type Mailer } from './email/mailer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist')

export interface AppDeps {
  users: UserRepository
  confirmationTokens: ConfirmationTokenRepository
  mailer: Mailer
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

  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  app.use(express.json())

  // API routes must be registered before the static/SPA fallback below,
  // or `/api/*` requests get swallowed and served index.html instead.
  app.use(createSignupRouter(users, confirmationTokens, mailer))

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
