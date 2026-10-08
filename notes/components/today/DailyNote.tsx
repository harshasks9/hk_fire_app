'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PenLine, ArrowUpRight } from 'lucide-react'
import { NoteEditor } from '@/components/editor/NoteEditor'
import { Button, useToast } from '@/components/ui'
import { api } from '@/lib/client'

/** The day's journal, edited in place. Nothing exists in the database until the first entry is started. */
export function DailyNote({ day, isToday, note, contextName }: { day: string; isToday: boolean; note: { id: string; title: string; contentJson: unknown } | null; contextName: string }) {
  const router = useRouter()
  const toast = useToast()
  const [busy, setBusy] = React.useState(false)
  if (!note) {
    return (
      <div className="rounded-xl border border-dashed border-border-2 px-5 py-6">
        <p className="text-[14px] font-medium">{isToday ? 'No entry yet for today.' : 'No entry for this day.'}</p>
        <p className="mt-1 text-[13px] text-fg-2">A daily note is an ordinary note filed under {contextName}: what happened, what you are thinking, what is next. The AI reads it like any other note, so people, decisions and tasks you mention land where they belong.</p>
        <Button variant="primary" className="mt-3" loading={busy} onClick={async () => { setBusy(true); try { await api('/api/today', { method: 'POST', json: { day } }); router.refresh() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(false) } }}>
          <PenLine className="h-3.5 w-3.5" /> {isToday ? "Start today's entry" : 'Write about this day'}
        </Button>
      </div>
    )
  }
  return (
    <div className="-mx-2 rounded-xl border border-border px-4 pb-3 pt-1 sm:px-5">
      <NoteEditor key={note.id} noteId={note.id} initialTitle={note.title} initialContent={note.contentJson} placeholder="How did the day go? Mention people, numbers and decisions and they will be filed." meta={<Link href={`/notes/${note.id}`} className="inline-flex items-center gap-1 hover:text-fg">Open as a note <ArrowUpRight className="h-3 w-3" /></Link>} />
    </div>
  )
}
