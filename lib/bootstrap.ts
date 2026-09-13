/*
  Ensure the database exists and is migrated, that the Primary notebook and
  its owner exist, and that the demo dataset the early builds shipped with is
  gone from the owner's notebook. A fresh install starts empty; sample data is
  only ever loaded on request (sign-up checkbox, Settings → Reset to sample data).
*/
import { eq } from 'drizzle-orm'
import { getDb, schema } from './db'
import { isSeeded, bootstrapEmpty, DEFAULT_NOTEBOOK } from './seed/run'
import { removeSampleData } from './seed/remove'

const g = globalThis as unknown as { __hkNotesReady?: Promise<void> }
const PURGE_KEY = 'demo-purged'

/**
  One-time cleanup for installations that were seeded with the demo content:
  everything the seed put into the Primary notebook is removed, everything the
  owner wrote stays. Recorded in app_meta so it never runs twice.
*/
async function purgeDemoData(): Promise<void> {
  const db = await getDb()
  const done = (await db.select({ key: schema.appMeta.key }).from(schema.appMeta).where(eq(schema.appMeta.key, PURGE_KEY)))[0]
  if (done) return
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, DEFAULT_NOTEBOOK.id)))[0]
  let result: unknown = null
  if (nb && nb.settings.sampleData !== false) {
    result = await removeSampleData(nb.id)
    console.log('[bootstrap] removed the demo dataset from the Primary notebook', result)
  }
  await db.insert(schema.appMeta).values({ key: PURGE_KEY, value: { at: new Date().toISOString(), result } }).onConflictDoNothing()
}

export function ensureReady(): Promise<void> {
  if (!g.__hkNotesReady) {
    g.__hkNotesReady = (async () => {
      await getDb()
      if (!(await isSeeded())) await bootstrapEmpty()
      await purgeDemoData()
    })().catch((err) => {
      g.__hkNotesReady = undefined
      throw err
    })
  }
  return g.__hkNotesReady
}
