import { Page } from '@/components/shell/AppShell'
import { PageHeader, Badge } from '@/components/ui'
import { settingsData } from '@/lib/queries'
import { aiStatus, aiModels } from '@/lib/ai/provider'
import { dbMode, dbIsEphemeral } from '@/lib/db'
import { authEnabled } from '@/lib/auth'
import { getContexts } from '@/lib/context'
import { getSession, withNotebookAi } from '@/lib/session'
import { SettingsClient } from '@/components/settings/SettingsClient'
import { AccountSection } from '@/components/settings/AccountSection'
import { AiSection } from '@/components/settings/AiSection'
import { TokensSection } from '@/components/settings/TokensSection'
import { TemplatesSection } from '@/components/settings/TemplatesSection'
import { ImportSection } from '@/components/settings/ImportSection'
import { SharingSection } from '@/components/settings/SharingSection'
import { headers } from 'next/headers'
import { decryptSecret, maskSecret } from '@/lib/crypto'
import { getActiveContext } from '@/lib/context'
import Link from 'next/link'
import { dotFor } from '@/lib/ui-helpers'
import { relativeTime } from '@/lib/util'
import { mediaCapabilities } from '@/lib/media'
import { cx } from '@/lib/util'
export const dynamic = 'force-dynamic'
export default async function SettingsPage() {
  const session = await getSession()
  const contexts = await getContexts()
  const s = await settingsData(contexts.map((c) => c.id), session?.notebookId ?? '', session?.user)
  const active = await getActiveContext()
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const origin = `${h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}`
  const nbSettings = session?.notebook.settings ?? {}
  const aiView = { aiMode: nbSettings.aiMode ?? 'shared', aiPreference: nbSettings.aiPreference ?? 'auto', anthropicKey: maskSecret(decryptSecret(nbSettings.anthropicKeyEnc)), geminiKey: maskSecret(decryptSecret(nbSettings.geminiKeyEnc)), allowShareLinks: nbSettings.allowShareLinks !== false, sharedKeys: { anthropic: Boolean(process.env.ANTHROPIC_API_KEY), gemini: Boolean(process.env.GEMINI_API_KEY) } } as const
  const canEdit = session?.role !== 'member'
  const { ai, models, media } = await withNotebookAi(async () => ({ ai: aiStatus(), models: await aiModels().catch(() => null), media: mediaCapabilities() }))
  const shortcuts = [['⌘K', 'Command bar / search'], ['⌘N', 'New note'], ['⌘⇧N', 'Quick capture'], ['⌥ Space', 'Quick capture (in app)'], ['⌘P', 'Search'], ['⌘↵', 'AI action on selection'], ['⌘\\', 'Toggle sidebar'], ['⌘.', 'Toggle intelligence panel'], ['/', 'Slash commands in editor · command bar elsewhere'], ['Esc', 'Close overlays']]
  return (
    <Page>
      <PageHeader title="Settings" subtitle="Privacy, AI, data and the keys under the hood." />
      <div className="mb-10 grid gap-3 sm:grid-cols-3">
        <Card title="AI provider"><div className="text-[15px] font-medium">{ai.provider === 'local' ? 'Local heuristics' : ai.provider === 'anthropic' ? 'Anthropic' : 'Gemini'}</div><div className="text-[12.5px] text-fg-3">{models ? `${models.generation} · embeddings: ${models.embedding} (${models.source})` : `${ai.model} · embeddings: ${ai.embeddings}`}</div>{ai.provider === 'local' ? <p className="mt-1.5 text-[12px] text-fg-2">Set <code className="rounded bg-surface-2 px-1">ANTHROPIC_API_KEY</code> or <code className="rounded bg-surface-2 px-1">GEMINI_API_KEY</code> for model-backed extraction, summaries and Q&A. Everything works without one.</p> : null}</Card>
        <Card title="Database"><div className="text-[15px] font-medium">{dbMode() === 'postgres' ? 'Postgres + pgvector' : 'Embedded Postgres (PGlite + pgvector)'}</div><div className="text-[12.5px] text-fg-3">{s.counts.notes} notes · {s.counts.entities} entities · {s.counts.embeddings} vectors</div>{dbIsEphemeral() ? <Badge tone="warning" className="mt-1.5">Ephemeral demo storage — set DATABASE_URL to persist</Badge> : null}</Card>
        <Card title="Media"><div className="text-[13.5px]">Voice transcription: <strong>{media.serverTranscription ? 'server (Gemini)' : 'browser speech API'}</strong></div><div className="text-[13.5px]">Screenshot understanding: <strong>{media.imageUnderstanding ? 'on' : 'attach only'}</strong></div><div className="mt-1 text-[12px] text-fg-3">Email forwarding and calendar sync are defined as integration boundaries and will land in the Inbox.</div></Card>
      </div>
      <div className="space-y-10">
        <AccountSection name={session?.user.name ?? ''} email={session?.user.email ?? null} role={session?.role ?? 'owner'} notebookName={session?.notebook.name ?? 'Primary'} authEnabled={authEnabled()} hasPassword={Boolean(session?.user.passwordHash)} />
        <AiSection settings={{ ...aiView }} canEdit={canEdit} />
        <SettingsClient userName={s.user?.name ?? 'Harsha'} authEnabled={authEnabled()} settings={(s.user?.settings ?? {}) as Record<string, unknown>} />
        <TemplatesSection />
        <ImportSection contexts={contexts.map((c) => ({ id: c.id, name: c.name }))} activeContextId={active.id} />
        <TokensSection origin={origin} />
        <SharingSection allowed={aiView.allowShareLinks} canEdit={canEdit} />
        <section>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Trash</h2>
          <p className="text-[13.5px] text-fg-2">Deleted notes are kept for 30 days. <Link href="/trash" className="text-accent underline-offset-2 hover:underline">Open Trash</Link></p>
        </section>
      </div>
      <section className="mt-10">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Contexts</h2>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {contexts.map((c) => <li key={c.id} className="flex items-center gap-3 px-4 py-2.5 text-[13.5px]"><span className={cx('h-2 w-2 rounded-full', dotFor(c.kind))} /><span className="w-24 font-medium">{c.name}</span><span className="flex-1 text-fg-2">{c.description}</span><Badge tone="outline">isolated retrieval</Badge></li>)}
        </ul>
        <p className="mt-2 text-[12.5px] text-fg-3">Each context has separate data boundaries and AI retrieval scope. Cross-context search only happens when you tick the box.</p>
      </section>
      <section className="mt-10">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Keyboard shortcuts</h2>
        <dl className="grid gap-x-8 gap-y-1.5 text-[13.5px] sm:grid-cols-2">{shortcuts.map(([k, v]) => <div key={k} className="flex items-center justify-between gap-3 border-b border-border py-1"><dt className="text-fg-2">{v}</dt><dd><kbd className="kbd">{k}</kbd></dd></div>)}</dl>
      </section>
      <section className="mt-10">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">What AI has been doing</h2>
        {s.calls.length ? (
          <ul className="divide-y divide-border rounded-xl border border-border text-[12.5px]">{s.calls.map((c) => <li key={c.id} className="flex items-center gap-3 px-3 py-1.5"><span className={cx('h-1.5 w-1.5 rounded-full', c.ok ? 'bg-success' : 'bg-danger')} /><span className="w-24 text-fg-2">{c.provider}</span><span className="flex-1 truncate">{c.purpose}{c.error ? ` — ${c.error}` : ''}</span><span className="text-fg-3">{c.durationMs ? `${c.durationMs} ms` : ''} · {relativeTime(c.createdAt)}</span></li>)}</ul>
        ) : <p className="text-[13px] text-fg-3">No model calls yet{ai.provider === 'local' ? ' — the local provider runs without an API' : ''}. Every call is logged here so you can see exactly what left the machine.</p>}
        {s.seeded ? <p className="mt-2 text-[12px] text-fg-3">Sample data loaded {relativeTime(s.seeded.at)} ({s.seeded.notes} notes).</p> : null}
      </section>
    </Page>
  )
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface p-4"><div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">{title}</div>{children}</div>
}
