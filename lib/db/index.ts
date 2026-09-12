/*
  Database factory.
  - DATABASE_URL set (production): postgres.js against Postgres with pgvector.
  - Otherwise: embedded PGlite (with its vector extension) persisted to .data/pglite,
    or /tmp on Vercel. Migrations are applied on first connect; the demo seed is
    loaded automatically when the database is empty.
*/
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

export type Db = PostgresJsDatabase<typeof schema>

const g = globalThis as unknown as { __hkNotesDb?: Promise<Db>; __hkNotesMode?: 'postgres' | 'pglite' }

/** Connection string from DATABASE_URL, or the names the Vercel Postgres / Neon / Supabase integrations write. */
export function databaseUrl(): string | undefined {
  for (const k of ['DATABASE_URL', 'POSTGRES_URL', 'POSTGRES_PRISMA_URL', 'NEON_DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING', 'SUPABASE_DB_URL']) {
    const v = process.env[k]
    if (v && /^postgres(ql)?:\/\//.test(v)) return v
  }
  return undefined
}

export function dbMode(): 'postgres' | 'pglite' {
  return databaseUrl() ? 'postgres' : 'pglite'
}

export function dbIsEphemeral(): boolean {
  return !databaseUrl() && Boolean(process.env.VERCEL)
}

async function createDb(): Promise<Db> {
  const path = await import('node:path')
  const migrationsFolder = path.join(process.cwd(), 'drizzle')
  const url = databaseUrl()
  if (url) {
    const { drizzle } = await import('drizzle-orm/postgres-js')
    const postgres = (await import('postgres')).default
    const client = postgres(url, { prepare: false, max: 5 })
    const db = drizzle(client, { schema })
    const { migrate } = await import('drizzle-orm/postgres-js/migrator')
    await migrate(db, { migrationsFolder })
    g.__hkNotesMode = 'postgres'
    return db
  }
  const { PGlite } = await import('@electric-sql/pglite')
  const { vector } = await import('@electric-sql/pglite/vector')
  const { drizzle } = await import('drizzle-orm/pglite')
  const fallbackDir = process.env.VERCEL ? '/tmp/hknotes-pglite' : path.join(process.cwd(), '.data', 'pglite')
  const dataDir = process.env.PGLITE_DIR ?? fallbackDir
  const memory = Boolean(process.env.PGLITE_MEMORY)
  if (!memory) {
    const fs = await import('node:fs')
    fs.mkdirSync(dataDir, { recursive: true })
  }
  const client = new PGlite({ ...(memory ? {} : { dataDir }), extensions: { vector } })
  const db = drizzle(client, { schema })
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  await migrate(db, { migrationsFolder })
  g.__hkNotesMode = 'pglite'
  return db as unknown as Db
}

export function getDb(): Promise<Db> {
  if (!g.__hkNotesDb) {
    g.__hkNotesDb = createDb().catch((err) => {
      g.__hkNotesDb = undefined
      throw err
    })
  }
  return g.__hkNotesDb
}

export { schema }
