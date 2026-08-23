import { Router, type RequestHandler } from 'express'
import type { SessionRepository, QuizSession } from '../db/quizSessions.js'
import type { ConnectionRepository } from '../db/quizSessionConnections.js'
import { isInvalidIdError } from '../db/errors.js'
import { appBaseUrl } from '../config.js'

export type SessionStatus = 'closed' | 'running' | 'stopped'

export interface QuizSessionResponse {
  id: string
  quizId: string
  status: SessionStatus
  timeLimitSeconds: number | null
  startedAt: string | null
  closesAt: string | null
  stoppedAt: string | null
  takeUrl: string
  // QUIZ-SESSION-LIVE-STATUS-001: folded into this same response rather
  // than a separate `/status` endpoint — the monitor page already polls
  // this one, and there's no other consumer that wants a session without
  // its counts.
  joinedCount: number
  submittedCount: number
}

/**
 * QUIZ-SESSION-CONTROL-001: no stored `status` column (see
 * `db/quizSessions.ts`) — derived here on every read instead, including
 * auto-close once `closesAt` has passed, so nothing else (a cron job, a
 * background timer) has to flip a value at the deadline. `now` is a
 * parameter, not `new Date()` read internally, purely so tests can pass a
 * fixed clock instead of racing real time.
 */
export function deriveStatus(session: Pick<QuizSession, 'startedAt' | 'closesAt' | 'stoppedAt'>, now: Date): SessionStatus {
  if (!session.startedAt) return 'closed'
  if (session.stoppedAt) return 'stopped'
  if (session.closesAt && session.closesAt.getTime() <= now.getTime()) return 'stopped'
  return 'running'
}

function toResponse(session: QuizSession, now: Date, counts: { joinedCount: number; submittedCount: number }): QuizSessionResponse {
  return {
    id: session.id,
    quizId: session.quizId,
    status: deriveStatus(session, now),
    timeLimitSeconds: session.timeLimitSeconds,
    startedAt: session.startedAt?.toISOString() ?? null,
    closesAt: session.closesAt?.toISOString() ?? null,
    stoppedAt: session.stoppedAt?.toISOString() ?? null,
    takeUrl: `${appBaseUrl()}/quiz-sessions/${session.id}/take`,
    joinedCount: counts.joinedCount,
    submittedCount: counts.submittedCount,
  }
}

/**
 * Accepts `<positive integer>h` or `<positive integer>m` (case
 * insensitive) — e.g. `3h`, `75m` — per the DoD's wireframe-matching
 * format. Returns `null` for an omitted/empty value (no time limit is a
 * valid, non-error choice) and `'invalid'` for anything that doesn't
 * parse as a positive count of hours/minutes, so a route can tell "no
 * limit" apart from "bad input" and only reject the latter.
 */
export function parseTimeLimit(input: unknown): number | null | 'invalid' {
  if (input === undefined || input === null || input === '') return null
  if (typeof input !== 'string') return 'invalid'
  const match = /^(\d+)(h|m)$/i.exec(input.trim())
  if (!match) return 'invalid'
  const amount = Number(match[1])
  if (amount <= 0) return 'invalid'
  const unit = match[2].toLowerCase()
  return unit === 'h' ? amount * 3600 : amount * 60
}

/**
 * `POST /api/quizzes/:quizId/sessions` (create), `POST
 * /api/quiz-sessions/:sessionId/start` (also reopen — see
 * `db/quizSessions.ts`'s `start`), `POST /api/quiz-sessions/:sessionId
 * /stop`, `GET /api/quiz-sessions/:sessionId` — every one of these is
 * trainer-facing and requires a tenant. `POST .../connections` and `POST
 * .../connections/:connectionId/submit` (QUIZ-SESSION-LIVE-STATUS-001)
 * are the opposite: an anonymous student's phone hit these after
 * scanning a QR code, with no session/tenant of any kind, so they skip
 * `sessionMiddleware` entirely and accept a connection regardless of the
 * session's own status (joining before start is exactly what the DoD
 * wants counted).
 *
 * Every id-in-URL lookup here — tenant-scoped or not — follows
 * ROUTE-ID-GUARD-001's pattern: wrapped in try/catch, a malformed id
 * folded into the same 404 as a genuinely missing row.
 */
export function createQuizSessionsRouter(sessions: SessionRepository, connections: ConnectionRepository, sessionMiddleware: RequestHandler): Router {
  const router = Router()

  function requireTenant(req: import('express').Request, res: import('express').Response): string | null {
    if (!req.session.tenantId) {
      res.status(401).json({ error: 'not_signed_in' })
      return null
    }
    return req.session.tenantId
  }

  router.post('/api/quizzes/:quizId/sessions', sessionMiddleware, async (req, res) => {
    const tenantId = requireTenant(req, res)
    if (!tenantId) return
    try {
      const created = await sessions.createForQuiz(req.params.quizId, tenantId)
      if (!created) {
        res.status(404).json({ error: 'quiz_not_found' })
        return
      }
      res.status(201).json(toResponse(created, new Date(), { joinedCount: 0, submittedCount: 0 }))
    } catch (err) {
      if (isInvalidIdError(err)) {
        res.status(404).json({ error: 'quiz_not_found' })
        return
      }
      console.error('create quiz session failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  router.post('/api/quiz-sessions/:sessionId/start', sessionMiddleware, async (req, res) => {
    const tenantId = requireTenant(req, res)
    if (!tenantId) return

    const timeLimitSeconds = parseTimeLimit(req.body?.timeLimit)
    if (timeLimitSeconds === 'invalid') {
      res.status(400).json({ error: 'invalid_time_limit' })
      return
    }

    try {
      const started = await sessions.start(req.params.sessionId, tenantId, timeLimitSeconds)
      if (!started) {
        res.status(404).json({ error: 'session_not_found' })
        return
      }
      const counts = await connections.countsForSession(started.id)
      res.status(200).json(toResponse(started, new Date(), counts))
    } catch (err) {
      if (isInvalidIdError(err)) {
        res.status(404).json({ error: 'session_not_found' })
        return
      }
      console.error('start quiz session failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  router.post('/api/quiz-sessions/:sessionId/stop', sessionMiddleware, async (req, res) => {
    const tenantId = requireTenant(req, res)
    if (!tenantId) return
    try {
      const stopped = await sessions.stop(req.params.sessionId, tenantId)
      if (!stopped) {
        res.status(404).json({ error: 'session_not_found' })
        return
      }
      const counts = await connections.countsForSession(stopped.id)
      res.status(200).json(toResponse(stopped, new Date(), counts))
    } catch (err) {
      if (isInvalidIdError(err)) {
        res.status(404).json({ error: 'session_not_found' })
        return
      }
      console.error('stop quiz session failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  router.get('/api/quiz-sessions/:sessionId', sessionMiddleware, async (req, res) => {
    const tenantId = requireTenant(req, res)
    if (!tenantId) return
    try {
      const session = await sessions.findByIdForTenant(req.params.sessionId, tenantId)
      if (!session) {
        res.status(404).json({ error: 'session_not_found' })
        return
      }
      const counts = await connections.countsForSession(session.id)
      res.status(200).json(toResponse(session, new Date(), counts))
    } catch (err) {
      if (isInvalidIdError(err)) {
        res.status(404).json({ error: 'session_not_found' })
        return
      }
      console.error('get quiz session failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  // QUIZ-SESSION-LIVE-STATUS-001: anonymous — no sessionMiddleware, no
  // tenant. Accepts a join in any session status (a `closed` session's
  // joined count is part of the DoD).
  router.post('/api/quiz-sessions/:sessionId/connections', async (req, res) => {
    try {
      const connection = await connections.create(req.params.sessionId)
      if (!connection) {
        res.status(404).json({ error: 'session_not_found' })
        return
      }
      res.status(201).json({ id: connection.id })
    } catch (err) {
      if (isInvalidIdError(err)) {
        res.status(404).json({ error: 'session_not_found' })
        return
      }
      console.error('create quiz session connection failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  router.post('/api/quiz-sessions/:sessionId/connections/:connectionId/submit', async (req, res) => {
    try {
      const submitted = await connections.markSubmitted(req.params.connectionId, req.params.sessionId)
      if (!submitted) {
        res.status(404).json({ error: 'connection_not_found' })
        return
      }
      res.status(200).json({ ok: true })
    } catch (err) {
      if (isInvalidIdError(err)) {
        res.status(404).json({ error: 'connection_not_found' })
        return
      }
      console.error('submit quiz session connection failed:', err)
      res.status(500).json({ error: 'internal_error' })
    }
  })

  return router
}
