import { and, eq } from 'drizzle-orm'
import { createDb } from './client.js'
import { quizSessions, quizzes, courses } from './schema.js'

/**
 * Raw persisted shape — no derived `status` here (see
 * `server/src/routes/quizSessions.ts`'s `deriveStatus`, which turns these
 * timestamps into `closed` / `running` / `stopped` for a response).
 */
export interface QuizSession {
  id: string
  quizId: string
  timeLimitSeconds: number | null
  startedAt: Date | null
  closesAt: Date | null
  stoppedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * QUIZ-SESSION-CONTROL-001: session create/start/stop(/reopen via start
 * again), all scoped to a tenant by joining `quiz_sessions.quizId ->
 * quizzes.courseId -> courses.tenantId` — never a denormalized tenantId
 * on this table. `null` from any of these means "doesn't exist, or exists
 * but isn't owned by this tenant" — same information-hiding shape
 * `CourseRepository.findByIdForTenant` already uses.
 */
export interface SessionRepository {
  createForQuiz(quizId: string, tenantId: string): Promise<QuizSession | null>
  start(sessionId: string, tenantId: string, timeLimitSeconds: number | null): Promise<QuizSession | null>
  stop(sessionId: string, tenantId: string): Promise<QuizSession | null>
  findByIdForTenant(sessionId: string, tenantId: string): Promise<QuizSession | null>
}

const SELECT_COLUMNS = {
  id: quizSessions.id,
  quizId: quizSessions.quizId,
  timeLimitSeconds: quizSessions.timeLimitSeconds,
  startedAt: quizSessions.startedAt,
  closesAt: quizSessions.closesAt,
  stoppedAt: quizSessions.stoppedAt,
  createdAt: quizSessions.createdAt,
  updatedAt: quizSessions.updatedAt,
}

export function createSessionRepository(databaseUrl: string): SessionRepository {
  const { db } = createDb(databaseUrl)

  async function quizBelongsToTenant(quizId: string, tenantId: string): Promise<boolean> {
    const rows = await db
      .select({ id: quizzes.id })
      .from(quizzes)
      .innerJoin(courses, eq(quizzes.courseId, courses.id))
      .where(and(eq(quizzes.id, quizId), eq(courses.tenantId, tenantId)))
      .limit(1)
    return rows.length > 0
  }

  async function findRowForTenant(sessionId: string, tenantId: string) {
    const rows = await db
      .select(SELECT_COLUMNS)
      .from(quizSessions)
      .innerJoin(quizzes, eq(quizSessions.quizId, quizzes.id))
      .innerJoin(courses, eq(quizzes.courseId, courses.id))
      .where(and(eq(quizSessions.id, sessionId), eq(courses.tenantId, tenantId)))
      .limit(1)
    return rows[0] ?? null
  }

  return {
    async createForQuiz(quizId, tenantId) {
      if (!(await quizBelongsToTenant(quizId, tenantId))) return null
      const rows = await db.insert(quizSessions).values({ quizId }).returning(SELECT_COLUMNS)
      return rows[0]
    },

    async start(sessionId, tenantId, timeLimitSeconds) {
      const existing = await findRowForTenant(sessionId, tenantId)
      if (!existing) return null
      const startedAt = new Date()
      const closesAt = timeLimitSeconds != null ? new Date(startedAt.getTime() + timeLimitSeconds * 1000) : null
      const rows = await db
        .update(quizSessions)
        .set({ timeLimitSeconds, startedAt, closesAt, stoppedAt: null, updatedAt: new Date() })
        .where(eq(quizSessions.id, sessionId))
        .returning(SELECT_COLUMNS)
      return rows[0] ?? null
    },

    async stop(sessionId, tenantId) {
      const existing = await findRowForTenant(sessionId, tenantId)
      if (!existing) return null
      const rows = await db
        .update(quizSessions)
        .set({ stoppedAt: new Date(), updatedAt: new Date() })
        .where(eq(quizSessions.id, sessionId))
        .returning(SELECT_COLUMNS)
      return rows[0] ?? null
    },

    async findByIdForTenant(sessionId, tenantId) {
      return findRowForTenant(sessionId, tenantId)
    },
  }
}
