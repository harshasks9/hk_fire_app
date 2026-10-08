'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Link2 } from 'lucide-react'
import { PanelSection } from '@/components/shell/IntelligencePanel'
import { NoteKindIcon } from '@/components/entities'
import { Button, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import { relativeTime } from '@/lib/util'
import type { NoteLinks } from '@/lib/links'

/** Linked notes, backlinks ("Linked from") and unlinked mentions with a one-click Link. */
export function LinksPanel({ noteId, title, links }: { noteId: string; title: string; links: NoteLinks }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = React.useState<string | null>(null)
  const [hidden, setHidden] = React.useState<Set<string>>(new Set())
  const unlinked = links.unlinked.filter((u) => !hidden.has(u.id))
  const linkIt = async (fromId: string) => {
    setBusy(fromId)
    try {
      const r = await api<{ replaced: boolean }>(`/api/notes/${noteId}/links`, { method: 'POST', json: { fromNoteId: fromId } })
      if (!r.replaced) toast.push({ text: 'That mention has changed; open the note to link it by hand.' })
      setHidden((h) => new Set([...h, fromId]))
      router.refresh()
    } catch (e) {
      toast.push({ text: String(e), tone: 'danger' })
    } finally {
      setBusy(null)
    }
  }
  const Row = ({ id, kind, t, excerpt, when, action }: { id: string; kind: string; t: string; excerpt?: string; when?: Date | string; action?: React.ReactNode }) => (
    <li className="flex items-start gap-2">
      <Link href={`/notes/${id}`} className="-mx-2 flex min-w-0 flex-1 items-start gap-2 rounded-md px-2 py-1 row-hover">
        <NoteKindIcon kind={kind} className="mt-[3px] h-3.5 w-3.5 shrink-0 text-fg-3" />
        <span className="min-w-0">
          <span className="block truncate text-[13px]">{t || 'Untitled'}</span>
          {excerpt ? <span className="block text-[11.5px] leading-snug text-fg-3">{excerpt}</span> : null}
          {when ? <span className="block text-[11px] text-fg-3" suppressHydrationWarning>{relativeTime(when)}</span> : null}
        </span>
      </Link>
      {action}
    </li>
  )
  if (!links.outgoing.length && !links.backlinks.length && !unlinked.length) return null
  return (
    <>
      {links.outgoing.length ? (
        <PanelSection title="Links to">
          <ul className="space-y-0.5" data-testid="links-outgoing">{links.outgoing.map((l) => <Row key={l.id} id={l.id} kind={l.kind} t={l.title} />)}</ul>
        </PanelSection>
      ) : null}
      {links.backlinks.length ? (
        <PanelSection title={`Linked from (${links.backlinks.length})`}>
          <ul className="space-y-0.5" data-testid="links-backlinks">{links.backlinks.map((l) => <Row key={l.id} id={l.id} kind={l.kind} t={l.title} excerpt={l.excerpt} when={l.updatedAt} />)}</ul>
        </PanelSection>
      ) : null}
      {unlinked.length && title.trim() ? (
        <PanelSection title="Unlinked mentions">
          <p className="mb-1.5 text-[12px] text-fg-3">Notes that say “{title}” without linking here.</p>
          <ul className="space-y-0.5" data-testid="links-unlinked">
            {unlinked.map((l) => <Row key={l.id} id={l.id} kind={l.kind} t={l.title} excerpt={l.excerpt} action={<Button size="sm" variant="ghost" loading={busy === l.id} onClick={() => linkIt(l.id)} title="Turn the mention into a link"><Link2 className="h-3.5 w-3.5" /> Link</Button>} />)}
          </ul>
        </PanelSection>
      ) : null}
    </>
  )
}
