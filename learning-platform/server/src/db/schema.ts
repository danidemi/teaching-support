import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * ORM-SELECTION-001's spike table: one minimal table to prove the
 * Drizzle + pg + Postgres path works end-to-end (connect, define, query).
 *
 * Throwaway — can be dropped once TENANT-001 is fully implemented and this
 * table is no longer needed to sanity-check the setup.
 */
export const spikeItems = pgTable('spike_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * DB-MIGRATIONS-001's first real migration target: the minimal `tenants`/
 * `users` schema ADR-0002 calls for, just enough for a migration to exist
 * and be applied. TENANT-001 is still `DRAFT` and not yet groomed in
 * detail (multi-tenant membership vs. one tenant per user, how a user
 * becomes associated) — these columns are the smallest shape consistent
 * with ADR-0002 and TENANT-001's current draft text ("a single `current
 * tenant`"), not a full TENANT-001 design. A later migration should adjust
 * this once TENANT-001 is groomed to READY.
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
