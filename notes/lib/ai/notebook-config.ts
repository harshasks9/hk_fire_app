/* Resolve a notebook's AI configuration (decrypting stored keys) as a scope to run work in. */
import { eq } from 'drizzle-orm'
import { getDb, schema } from '../db'
import { decryptSecret } from '../crypto'
import type { AiScope } from './scope'
import type { Notebook } from '../db/schema'

export function scopeForNotebook(nb: Notebook, ownerName?: string): AiScope {
  const st = nb.settings ?? {}
  return {
    notebookId: nb.id,
    mode: st.aiMode ?? 'shared',
    preference: st.aiPreference,
    anthropicKey: decryptSecret(st.anthropicKeyEnc) ?? undefined,
    geminiKey: decryptSecret(st.geminiKeyEnc) ?? undefined,
    ownerName,
  }
}

export async function notebookAiScope(notebookId: string, ownerName?: string): Promise<AiScope> {
  const db = await getDb()
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, notebookId)))[0]
  return nb ? scopeForNotebook(nb, ownerName) : { mode: 'shared', ownerName }
}
