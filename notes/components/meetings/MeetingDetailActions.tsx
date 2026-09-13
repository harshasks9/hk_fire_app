'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Radio, Mail, FileText, Trash2, MoreHorizontal, CheckCircle2, Pencil } from 'lucide-react'
import { Button, Menu, useToast, Markdown, CopyButton, AiMark } from '@/components/ui'
import { api } from '@/lib/client'
import { GenerateMenu } from '@/components/entities'
import { MeetingEditor } from '@/components/crud/editors'

export function MeetingDetailActions({ meetingId, status, noteId, followUpEmail, executiveReadout, meeting }: { meetingId: string; status: string; noteId: string | null; followUpEmail: string | null; executiveReadout: string | null; meeting?: { title: string; startsAt: Date | string; endsAt?: Date | string | null; location?: string | null } }) {
  const router = useRouter()
  const [edit, setEdit] = React.useState(false)
  const toast = useToast()
  const [busy, setBusy] = React.useState<string | null>(null)
  const [outputs, setOutputs] = React.useState<{ followUp: string | null; readout: string | null }>({ followUp: followUpEmail, readout: executiveReadout })
  const [show, setShow] = React.useState<'followUp' | 'readout' | null>(null)
  const gen = async (kind: 'follow_up' | 'readout') => {
    setBusy(kind)
    try {
      const r = await api<{ followUpEmail?: string; executiveReadout?: string }>(`/api/meetings/${meetingId}`, { method: 'PATCH', json: { generate: kind } })
      setOutputs((o) => ({ followUp: r.followUpEmail ?? o.followUp, readout: r.executiveReadout ?? o.readout }))
      setShow(kind === 'follow_up' ? 'followUp' : 'readout')
    } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) }
  }
  const openNote = async () => {
    if (noteId) return router.push(`/notes/${noteId}`)
    const r = await api<{ noteId: string }>(`/api/meetings/${meetingId}`, { method: 'PATCH', json: { ensureNote: true } })
    router.push(`/notes/${r.noteId}`)
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {status === 'upcoming' ? <Button variant="primary" size="md" onClick={() => router.push(`/meetings/live?meetingId=${meetingId}`)}><Radio className="h-4 w-4" /> Start live capture</Button> : null}
        <Button variant="secondary" size="md" onClick={openNote}><FileText className="h-4 w-4" /> {noteId ? 'Open notes' : 'Add notes'}</Button>
        {status === 'completed' ? (
          <>
            <Button variant="secondary" size="md" loading={busy === 'follow_up'} onClick={() => (outputs.followUp ? setShow(show === 'followUp' ? null : 'followUp') : gen('follow_up'))}><Mail className="h-4 w-4" /> Follow-up email</Button>
            <Button variant="secondary" size="md" loading={busy === 'readout'} onClick={() => (outputs.readout ? setShow(show === 'readout' ? null : 'readout') : gen('readout'))}><CheckCircle2 className="h-4 w-4" /> Executive readout</Button>
          </>
        ) : null}
        <GenerateMenu target={{ type: 'meeting', id: meetingId }} />
        <Menu trigger={<Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>} items={[
          ...(status !== 'completed' ? [{ label: 'Mark completed', icon: <CheckCircle2 className="h-3.5 w-3.5" />, onSelect: async () => { await api(`/api/meetings/${meetingId}`, { method: 'PATCH', json: { status: 'completed', ensureNote: true } }); router.refresh() } }] : []),
          ...(meeting ? [{ label: 'Edit details', icon: <Pencil className="h-3.5 w-3.5" />, onSelect: () => setEdit(true) }] : []),
          { label: 'Regenerate follow-up email', icon: <Mail className="h-3.5 w-3.5" />, onSelect: () => gen('follow_up') },
          { label: 'Delete meeting', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onSelect: async () => { if (!confirm('Delete this meeting? Its notes remain.')) return; await api(`/api/meetings/${meetingId}`, { method: 'DELETE' }); router.push('/meetings'); router.refresh() } },
        ]} />
      </div>
      {edit && meeting ? <MeetingEditor meeting={{ id: meetingId, ...meeting }} onClose={() => setEdit(false)} /> : null}
      {show && outputs[show] ? (
        <div className="animate-up mt-3 rounded-xl border border-dashed border-accent-soft-2 bg-surface p-4">
          <div className="mb-2 flex items-center justify-between"><AiMark label={show === 'followUp' ? 'Follow-up email' : 'Executive readout'} /><CopyButton text={outputs[show]!} /></div>
          <Markdown text={outputs[show]!} />
        </div>
      ) : null}
    </div>
  )
}
