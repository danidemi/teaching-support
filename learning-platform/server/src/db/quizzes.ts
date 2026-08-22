import { and, eq } from 'drizzle-orm'
import { createDb } from './client.js'
import { quizzes } from './schema.js'

export interface Quiz {
  id: string
  title: string
  fileName: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export interface NewQuiz {
  courseId: string
  title: string
  fileName: string
  fileData: Buffer
}

export interface QuizFileUpdate {
  fileName: string
  fileData: Buffer
}

/**
 * QUIZ-DASHBOARD-001: list/delete/replace-file, all scoped to a course
 * (never global — `courses.findByIdForTenant` is what proves the caller's
 * tenant owns that course before any of these run, see
 * `server/src/routes/quizzes.ts`). `create` has no route of its own in
 * this story — QTI-22-IMPORT calls it after its own format validation
 * passes.
 */
export interface QuizRepository {
  listByCourse(courseId: string): Promise<Quiz[]>
  create(quiz: NewQuiz): Promise<Quiz>
  delete(quizId: string, courseId: string): Promise<boolean>
  replaceFile(quizId: string, courseId: string, file: QuizFileUpdate): Promise<Quiz | null>
}

const SELECT_COLUMNS = {
  id: quizzes.id,
  title: quizzes.title,
  fileName: quizzes.fileName,
  status: quizzes.status,
  createdAt: quizzes.createdAt,
  updatedAt: quizzes.updatedAt,
}

export function createQuizRepository(databaseUrl: string): QuizRepository {
  const { db } = createDb(databaseUrl)

  return {
    async listByCourse(courseId) {
      return db.select(SELECT_COLUMNS).from(quizzes).where(eq(quizzes.courseId, courseId))
    },

    async create(quiz) {
      const rows = await db
        .insert(quizzes)
        .values({ courseId: quiz.courseId, title: quiz.title, fileName: quiz.fileName, fileData: quiz.fileData })
        .returning(SELECT_COLUMNS)
      return rows[0]
    },

    async delete(quizId, courseId) {
      const rows = await db
        .delete(quizzes)
        .where(and(eq(quizzes.id, quizId), eq(quizzes.courseId, courseId)))
        .returning({ id: quizzes.id })
      return rows.length > 0
    },

    async replaceFile(quizId, courseId, file) {
      const rows = await db
        .update(quizzes)
        .set({ fileName: file.fileName, fileData: file.fileData, updatedAt: new Date() })
        .where(and(eq(quizzes.id, quizId), eq(quizzes.courseId, courseId)))
        .returning(SELECT_COLUMNS)
      return rows[0] ?? null
    },
  }
}
