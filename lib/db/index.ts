/*
  Database factory.

  - With DATABASE_URL set (production): postgres.js against real Postgres.
    Run migrations explicitly with `npm run db:migrate`.
  - Without it (local dev, tests): embedded PGlite persisted to .data/pglite,
    migrated automatically on first connect. No external services needed.
*/
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

export type Db = PostgresJsDatabase<typeof schema>

const globalForDb = globalThis as unknown as { __fiveDeltaDb?: Promise<Db> }

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL
  if (url) {
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const postgres = (await import('postgres')).default
    // prepare:false keeps this compatible with transaction-mode poolers (Neon, pgbouncer).
    const client = postgres(url, { prepare: false, max: 5 })
    return drizzle(client, { schema })
  }
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const path = await import('node:path')
  // On Vercel without DATABASE_URL the only writable location is /tmp —
  // ephemeral per instance, enough for the app to onboard instead of crash.
  const fallbackDir = process.env.VERCEL
    ? '/tmp/fivedelta-pglite'
    : path.join(process.cwd(), '.data', 'pglite')
  const dataDir = process.env.PGLITE_DIR ?? fallbackDir
  if (!process.env.PGLITE_MEMORY) {
    const fs = await import('node:fs')
    fs.mkdirSync(dataDir, { recursive: true })
  }
  const client = new PGlite(process.env.PGLITE_MEMORY ? undefined : dataDir)
  const db = drizzle(client, { schema })
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') })
  // The two drivers expose the same query API over this schema; unify the type.
  return db as unknown as Db
}

export function getDb(): Promise<Db> {
  if (!globalForDb.__fiveDeltaDb) globalForDb.__fiveDeltaDb = createDb()
  return globalForDb.__fiveDeltaDb
}

export { schema }
