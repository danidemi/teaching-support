import { pgTable, uuid, text, timestamp, varchar, json, index, uniqueIndex, customType } from 'drizzle-orm/pg-core'

/**
 * Postgres `bytea` — drizzle-orm/pg-core has no built-in binary column
 * type, so this is the minimal `customType` needed for it. Used by
 * `quizzes.fileData` (QUIZ-DASHBOARD-001/QTI-22-IMPORT): the raw QTI file
 * itself, not just a filename, per ADR-0002's "raw QTI files are stored in
 * PostgreSQL binary fields" decision.
 */
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

/**
 * TENANT-001: the `tenants`/`users` schema ADR-0002 calls for. The columns
 * were originally sketched by DB-MIGRATIONS-001 ahead of TENANT-001 being
 * groomed; TENANT-001's own development confirmed this shape is enough —
 * one tenant per registered user (created lazily on first login, see
 * `server/src/db/tenants.ts`), not a multi-user-per-tenant membership
 * model. The DB-MIGRATIONS-001/ORM-SELECTION-001 spike table
 * (`spike_items`) that used to sit here is dropped as of this story's
 * migration — its job (prove the Drizzle+pg+Postgres path works) is done,
 * and this schema is now doing that job for real.
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  // Nullable: a newly registered user is not associated to any tenant yet
  // (TENANT-001's "if I'm not associated to any tenant, create one").
  currentTenantId: uuid('current_tenant_id').references(() => tenants.id),
  // Nullable: Google-OAuth users (LOGIN-001) never set a password.
  // SIGNUP-EXPEDITE-001/SIGN-UP-001 set this on email/password sign-up.
  passwordHash: text('password_hash'),
  // Nullable: null until the account is confirmed. SIGNUP-EXPEDITE-001 sets
  // this immediately on signup; SIGN-UP-001 leaves it null until the
  // confirmation-link flow runs.
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * SIGN-UP-001: one row per confirmation-link email sent. Only the SHA-256
 * digest of the raw token is stored (`token_hash`) — the raw token lives
 * only in the emailed link, so a database leak alone doesn't yield usable
 * tokens (see `server/src/auth/tokens.ts`). `expires_at` is set 24h ahead
 * at creation; `used_at` is set once the link has been visited, so a
 * second visit is rejected as `status=used` rather than re-confirming.
 */
export const confirmationTokens = pgTable('confirmation_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * COURSE-001: courses belong to exactly one tenant from the start
 * (`tenant_id`, per ADR-0002's tenancy-before-courses decision) —
 * "all courses" in this story's DoD never means courses outside the
 * caller's tenant. `courses_tenant_id_title_unique` gives the DoD's
 * "two courses in the same tenant cannot share the same name" a
 * database-level guarantee (scoped to the tenant, not global — two
 * different tenants can both have a course named "Intro to Python").
 * `updatedAt` exists now even though this story never updates a course
 * after creation (no edit action in scope) — it's part of the DoD's own
 * sort criteria ("last update date"), so the column has to exist even
 * before anything sets it to something other than its creation value.
 */
export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    title: text('title').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('courses_tenant_id_title_unique').on(table.tenantId, table.title)],
)

/**
 * QUIZ-DASHBOARD-001: quizzes belong to exactly one course (`course_id`,
 * per that story's dependency on COURSE-001 — "quizzes are scoped to a
 * current course"). `status` is a plain text label, not an enum — nothing
 * in either QUIZ-DASHBOARD-001 or QTI-22-IMPORT's DoD produces more than
 * one value yet (every stored row got there by passing QTI-22-IMPORT's
 * synchronous format check, so it's always "uploaded"); a real state
 * machine can replace this column's meaning later without a shape change.
 * No `create` route ships in QUIZ-DASHBOARD-001 itself — `QuizRepository
 * .create` exists for QTI-22-IMPORT to call (that story owns the only
 * user-facing way to add a quiz row: format-validated upload).
 */
export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id),
  title: text('title').notNull(),
  fileName: text('file_name').notNull(),
  fileData: bytea('file_data').notNull(),
  status: text('status').notNull().default('uploaded'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * AUTH-UX-001 / ADR-0005: session store for `express-session`, managed by
 * `connect-pg-simple`. Column names/types (`sid`/`sess`/`expire`) and the
 * `expire` index match `connect-pg-simple`'s own expected schema exactly —
 * this table is created by this Drizzle migration instead of the library's
 * `createTableIfMissing` option, per ADR-0005 and the sprint's DON'T about
 * migrations happening outside the one applied-at-startup path
 * (`reference/do_and_donts.md`). `connect-pg-simple` is configured with
 * `createTableIfMissing: false` accordingly (`server/src/auth/session.ts`).
 */
export const sessions = pgTable(
  'session',
  {
    sid: varchar('sid').primaryKey(),
    sess: json('sess').notNull(),
    expire: timestamp('expire', { precision: 6 }).notNull(),
  },
  (table) => [index('IDX_session_expire').on(table.expire)],
)
