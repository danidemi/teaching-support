import { and, eq, isNotNull } from 'drizzle-orm'
import { createDb } from './client.js'
import { quizSessionConnections, quizSessions } from './schema.js'

export interface QuizSessionConnection {
  id: string
  sessionId: string
  connectedAt: Date
  submittedAt: Date | null
}

export interface SessionCounts {
  joinedCount: number
  submittedCount: number
}

/**
 * QUIZ-SESSION-LIVE-STATUS-001: anonymous student-facing "join"/"submit"
 * signals from the placeholder page, plus the trainer-facing counts
 * derived from them. `create`/`markSubmitted` take no tenant — see
 * `db/schema.ts`'s doc comment on why: an anonymous student's phone has
 * no login of any kind, only a session id from the URL it scanned.
 * `null` from `create`/`markSubmitted` means the referenced id doesn't
 * exist (session or connection respectively) — same "doesn't exist"
 * shape the rest of this codebase's repositories already use, just
 * without a tenant dimension to also fold in here.
 */
export interface ConnectionRepository {
  create(sessionId: string): Promise<QuizSessionConnection | null>
  // Scoped to sessionId too, not just connectionId — a connection id is
  // effectively unguessable (a random uuid), but there's no reason to
  // accept one that doesn't actually belong to the session in the URL.
  markSubmitted(connectionId: string, sessionId: string): Promise<boolean>
  countsForSession(sessionId: string): Promise<SessionCounts>
  // QUIZ-TAKE-RENDER-001: same "belongs to this session" scoping as
  // `markSubmitted`, for the new answers route to check before writing a
  // `quiz_session_answers` row against an arbitrary connectionId.
  belongsToSession(connectionId: string, sessionId: string): Promise<boolean>
}

export function createConnectionRepository(databaseUrl: string): ConnectionRepository {
  const { db } = createDb(databaseUrl)

  return {
    async create(sessionId) {
      const sessionRows = await db.select({ id: quizSessions.id }).from(quizSessions).where(eq(quizSessions.id, sessionId)).limit(1)
      if (sessionRows.length === 0) return null
      const rows = await db.insert(quizSessionConnections).values({ sessionId }).returning()
      return rows[0]
    },

    async markSubmitted(connectionId, sessionId) {
      const rows = await db
        .update(quizSessionConnections)
        .set({ submittedAt: new Date() })
        .where(and(eq(quizSessionConnections.id, connectionId), eq(quizSessionConnections.sessionId, sessionId)))
        .returning({ id: quizSessionConnections.id })
      return rows.length > 0
    },

    async countsForSession(sessionId) {
      const joined = await db.select({ id: quizSessionConnections.id }).from(quizSessionConnections).where(eq(quizSessionConnections.sessionId, sessionId))
      const submitted = await db
        .select({ id: quizSessionConnections.id })
        .from(quizSessionConnections)
        .where(and(eq(quizSessionConnections.sessionId, sessionId), isNotNull(quizSessionConnections.submittedAt)))
      return { joinedCount: joined.length, submittedCount: submitted.length }
    },

    async belongsToSession(connectionId, sessionId) {
      const rows = await db
        .select({ id: quizSessionConnections.id })
        .from(quizSessionConnections)
        .where(and(eq(quizSessionConnections.id, connectionId), eq(quizSessionConnections.sessionId, sessionId)))
        .limit(1)
      return rows.length > 0
    },
  }
}
