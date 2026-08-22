import { pgTable, uuid, text, timestamp, varchar, json, index } from 'drizzle-orm/pg-core'

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
