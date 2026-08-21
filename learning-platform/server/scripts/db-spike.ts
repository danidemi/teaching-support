import 'dotenv/config'
import { createDb } from '../src/db/client.js'
import { spikeItems } from '../src/db/schema.js'

/**
 * ORM-SELECTION-001's spike: connect to the local Postgres (started via
 * `docker compose up -d` against server/docker-compose.yml), insert one row
 * into the one table defined in src/db/schema.ts, read it back.
 *
 * Deliberately a standalone script, not a vitest test — `npm test` must
 * stay green with no Postgres running (see story DoD: "existing
 * client/server unit tests still pass").
 *
 * Run with: npm run db:spike
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set — copy server/.env.example to server/.env first')
  }

  const { db, pool } = createDb(databaseUrl)

  try {
    const [inserted] = await db
      .insert(spikeItems)
      .values({ label: 'orm-selection-001 spike' })
      .returning()
    console.log('inserted:', inserted)

    const rows = await db.select().from(spikeItems)
    console.log('queried back', rows.length, 'row(s):', rows)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('db spike failed:', err)
  process.exitCode = 1
})
