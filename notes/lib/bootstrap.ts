/* Ensure the database exists, is migrated and (when empty) carries the demo content. */
import { getDb } from './db'
import { isSeeded, runSeed } from './seed/run'

const g = globalThis as unknown as { __hkNotesReady?: Promise<void> }

export function ensureReady(): Promise<void> {
  if (!g.__hkNotesReady) {
    g.__hkNotesReady = (async () => {
      await getDb()
      if (!(await isSeeded())) await runSeed()
    })().catch((err) => {
      g.__hkNotesReady = undefined
      throw err
    })
  }
  return g.__hkNotesReady
}
