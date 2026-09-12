import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { decryptSecret, encryptSecret, maskSecret } from '@/lib/crypto'
import type { NotebookSettings } from '@/lib/db/schema'
export const dynamic = 'force-dynamic'

function view(st: NotebookSettings) {
  return { aiMode: st.aiMode ?? 'shared', aiPreference: st.aiPreference ?? 'auto', anthropicKey: maskSecret(decryptSecret(st.anthropicKeyEnc)), geminiKey: maskSecret(decryptSecret(st.geminiKeyEnc)), allowShareLinks: st.allowShareLinks !== false, sharedKeys: { anthropic: Boolean(process.env.ANTHROPIC_API_KEY), gemini: Boolean(process.env.GEMINI_API_KEY) } }
}

export async function GET() {
  try {
    const s = await requireSession()
    return NextResponse.json({ notebook: { id: s.notebookId, name: s.notebook.name }, settings: view(s.notebook.settings ?? {}) })
  } catch (e) {
    return apiError(e)
  }
}

/** Owner (or admin) updates the notebook's AI configuration and sharing policy. Keys are encrypted at rest. */
export async function PATCH(req: NextRequest) {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can change this' }, { status: 403 })
    const b = (await req.json().catch(() => ({}))) as { aiMode?: 'shared' | 'own' | 'local'; aiPreference?: 'auto' | 'anthropic' | 'gemini'; anthropicKey?: string; geminiKey?: string; clearAnthropic?: boolean; clearGemini?: boolean; allowShareLinks?: boolean; name?: string }
    const st: NotebookSettings = { ...(s.notebook.settings ?? {}) }
    if (b.aiMode && ['shared', 'own', 'local'].includes(b.aiMode)) st.aiMode = b.aiMode
    if (b.aiPreference && ['auto', 'anthropic', 'gemini'].includes(b.aiPreference)) st.aiPreference = b.aiPreference
    if (typeof b.anthropicKey === 'string' && b.anthropicKey.trim()) st.anthropicKeyEnc = encryptSecret(b.anthropicKey.trim())
    if (typeof b.geminiKey === 'string' && b.geminiKey.trim()) st.geminiKeyEnc = encryptSecret(b.geminiKey.trim())
    if (b.clearAnthropic) delete st.anthropicKeyEnc
    if (b.clearGemini) delete st.geminiKeyEnc
    if (typeof b.allowShareLinks === 'boolean') st.allowShareLinks = b.allowShareLinks
    const db = await getDb()
    const set: Record<string, unknown> = { settings: st, updatedAt: new Date() }
    if (typeof b.name === 'string' && b.name.trim()) set.name = b.name.trim()
    await db.update(schema.notebooks).set(set).where(eq(schema.notebooks.id, s.notebookId))
    return NextResponse.json({ ok: true, settings: view(st) })
  } catch (e) {
    return apiError(e)
  }
}
