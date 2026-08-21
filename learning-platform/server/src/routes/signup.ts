import { Router } from 'express'
import { hashPassword } from '../auth/password.js'
import { isUniqueViolation, type UserRepository } from '../db/users.js'

const MIN_PASSWORD_LENGTH = 8

/**
 * Minimal shape check for the email field — the DoD only specifies the
 * password-length rule, so the email rule is the smallest one that keeps
 * a missing/blank email from reaching the insert as an unhandled 500:
 * non-empty and containing '@'. Recorded here rather than invented
 * silently, per SIGNUP-EXPEDITE-001's Technical plan.
 */
function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.trim().length > 0 && email.includes('@')
}

function isValidPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH
}

/**
 * `GET /api/config` and `POST /api/signup/expedite`
 * (SIGNUP-EXPEDITE-001, `active_sprint/story_expedite_sign_up.md`).
 *
 * The feature flag is read from `process.env` on every request, not
 * captured at module load — so a test can flip it per-request and the
 * "403 when the flag is off" case stays testable without a process
 * restart.
 */
export function createSignupRouter(users: UserRepository): Router {
  const router = Router()

  router.get('/api/config', (_req, res) => {
    res.status(200).json({
      expediteSignupEnabled: process.env.EXPEDITE_SIGNUP_ENABLED === 'true',
    })
  })

  router.post('/api/signup/expedite', async (req, res) => {
    if (process.env.EXPEDITE_SIGNUP_ENABLED !== 'true') {
      res.status(403).json({ error: 'feature_disabled' })
      return
    }

    const { email, password } = req.body ?? {}

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'invalid_email' })
      return
    }

    if (!isValidPassword(password)) {
      res.status(400).json({ error: 'password_too_short' })
      return
    }

    try {
      const passwordHash = await hashPassword(password)
      const created = await users.create({
        email,
        passwordHash,
        confirmedAt: new Date(),
      })
      res.status(201).json(created)
    } catch (err) {
      if (isUniqueViolation(err)) {
        res.status(409).json({ error: 'email_taken' })
        return
      }
      // Express 4 does not catch rejections from async handlers itself —
      // respond here rather than letting it hang/crash the process.
      console.error('signup/expedite failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  return router
}
