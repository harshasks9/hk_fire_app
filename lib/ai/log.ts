import { getDb, schema } from '../db'
import { uid } from '../util'

export async function logAiCall(entry: { provider: string; model: string; purpose: string; inputChars?: number; outputChars?: number; ok: boolean; error?: string; durationMs?: number }) {
  try {
    const db = await getDb()
    await db.insert(schema.aiCalls).values({ id: uid('ai'), ...entry, inputChars: entry.inputChars ?? 0, outputChars: entry.outputChars ?? 0 })
  } catch {
    /* logging must never break the request */
  }
}
