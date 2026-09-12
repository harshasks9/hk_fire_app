/* Resolve a notebook's AI configuration (decrypting stored keys) as a scope to run work in. */
import { eq } from 'drizzle-orm'
import { getDb, schema } from '../db'
import { decryptSecret } from '../crypto'
import type { AiScope } from './scope'
import type { Notebook } from '../db/schema'
import { aiBudgetExhausted } from '../plans'

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
  return nb ? applyAiBudget(nb, scopeForNotebook(nb, ownerName)) : { mode: 'shared', ownerName }
}

/** When the plan's monthly model budget is spent the notebook runs on the local provider until next month. */
export async function applyAiBudget(nb: Notebook, scope: AiScope): Promise<AiScope> {
  if (scope.mode === 'local') return scope
  try {
    if (await aiBudgetExhausted(nb)) return { ...scope, mode: 'local', budgetExhausted: true }
  } catch {
    /* never block on the usage query */
  }
  return scope
}
