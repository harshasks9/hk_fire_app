'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileAudio, FileText, Upload, X, CheckCircle2, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react'
import { Button, Input, Textarea, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import { cx } from '@/lib/util'

interface Ctx { id: string; name: string; slug: string }
type Stage = 'uploading' | 'queued' | 'transcribing' | 'structuring' | 'filing' | 'done' | 'failed'
export interface StatusView { meetingId: string; noteId: string | null; title: string; status: Stage | null; error: string | null; stageAt: string | null; hasRecording: boolean }

export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: 'uploading', label: 'Uploading', hint: 'Sending the recording to your notebook' },
  { id: 'transcribing', label: 'Transcribing', hint: 'Turning speech into text with speaker labels' },
  { id: 'structuring', label: 'Structuring', hint: 'Attendees, purpose, decisions, actions, open questions — linked to what you already know' },
  { id: 'filing', label: 'Filing', hint: 'People, companies, tasks, decisions and numbers go into the graph' },
  { id: 'done', label: 'Done', hint: 'The meeting is ready' },
]

const AUDIO_RE = /^audio\/|^video\/(mp4|quicktime)|\.(m4a|mp3|wav|aac|ogg|opus|webm|caf|aiff?|mp4|mov)$/i
const TEXT_RE = /^text\/|json|\.(txt|md|vtt|srt|json|text)$/i

function toLocal(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

async function audioDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file)
      const a = new Audio()
      const done = (v?: number) => { URL.revokeObjectURL(url); resolve(v) }
      a.preload = 'metadata'
      a.onloadedmetadata = () => done(Number.isFinite(a.duration) ? Math.round(a.duration) : undefined)
      a.onerror = () => done(undefined)
      setTimeout(() => done(undefined), 4000)
      a.src = url
    } catch {
      resolve(undefined)
    }
  })
}

/** Stage list shared by the import page and the meeting page banner. */
export function StageList({ status, error, hasRecording, compact }: { status: Stage | null; error?: string | null; hasRecording: boolean; compact?: boolean }) {
  const order = STAGES.filter((s) => hasRecording || s.id !== 'uploading').filter((s) => hasRecording || s.id !== 'transcribing')
  const idx = status === 'queued' ? 0 : order.findIndex((s) => s.id === status)
  const failed = status === 'failed'
  return (
    <ol className={cx('space-y-1.5', compact && 'space-y-1')}>
      {order.map((s, i) => {
        const state = failed ? (i < idx ? 'done' : i === idx ? 'failed' : 'todo') : status === 'done' ? 'done' : i < idx ? 'done' : i === idx ? 'active' : 'todo'
        return (
          <li key={s.id} className={cx('flex items-start gap-2.5 text-[13.5px]', state === 'todo' && 'text-fg-3')}>
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
              {state === 'done' ? <CheckCircle2 className="h-4 w-4 text-success" /> : state === 'active' ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : state === 'failed' ? <AlertTriangle className="h-4 w-4 text-danger" /> : <span className="h-2 w-2 rounded-full bg-border-2" />}
            </span>
            <span><span className={cx('font-medium', state === 'active' && 'text-accent')}>{s.label}</span>{!compact ? <span className="text-fg-3"> — {s.hint}</span> : null}</span>
          </li>
        )
      })}
      {failed && error ? <li className="ml-6 rounded-lg bg-danger/10 px-2.5 py-1.5 text-[12.5px] text-danger">{error}</li> : null}
    </ol>
  )
}

export function usePollStatus(meetingId: string | null, initial?: StatusView | null) {
  const [status, setStatus] = React.useState<StatusView | null>(initial ?? null)
  React.useEffect(() => {
    if (!meetingId) return
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      try {
        const s = await api<StatusView>(`/api/recordings/${meetingId}`)
        if (!alive) return
        setStatus(s)
        if (s.status === 'done' || s.status === 'failed') return
      } catch {
        /* keep polling */
      }
      timer = setTimeout(tick, 2500)
    }
    void tick()
    return () => { alive = false; if (timer) clearTimeout(timer) }
  }, [meetingId])
  return status
}

export function ImportRecording({ contexts, serverTranscription, maxMb, chunkSize }: { contexts: Ctx[]; serverTranscription: boolean; maxMb: number; chunkSize: number }) {
  const router = useRouter()
  const toast = useToast()
  const [file, setFile] = React.useState<File | null>(null)
  const [transcript, setTranscript] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [when, setWhen] = React.useState(() => toLocal(new Date()))
  const [context, setContext] = React.useState('auto')
  const [participants, setParticipants] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [progress, setProgress] = React.useState<number | null>(null)
  const [meetingId, setMeetingId] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const status = usePollStatus(meetingId)

  React.useEffect(() => {
    if (status?.status === 'done' && status.meetingId) {
      const t = setTimeout(() => { router.push(`/meetings/${status.meetingId}`); router.refresh() }, 900)
      return () => clearTimeout(t)
    }
  }, [status, router])

  const isAudio = file ? AUDIO_RE.test(file.type) || AUDIO_RE.test(file.name) : false
  const isText = file ? !isAudio && TEXT_RE.test(file.type || file.name) : false

  const pick = async (f: File | null) => {
    if (!f) return
    if (!(AUDIO_RE.test(f.type) || AUDIO_RE.test(f.name) || TEXT_RE.test(f.type || f.name))) { toast.push({ text: 'Drop an audio file (m4a, mp3, wav…) or a transcript (.txt, .vtt, .srt, .json)', tone: 'danger' }); return }
    if (f.size > maxMb * 1048576) { toast.push({ text: `That file is larger than ${maxMb} MB`, tone: 'danger' }); return }
    setFile(f)
    if (f.lastModified) setWhen(toLocal(new Date(f.lastModified)))
    if (!title) setTitle(f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' '))
  }

  const submit = async () => {
    if (!file && !transcript.trim()) return
    setBusy(true)
    setProgress(null)
    try {
      const common = { title, context, recordedAt: new Date(when).toISOString(), participants: participants.split(/,|;/).map((s) => s.trim()).filter(Boolean), notes }
      if (file && isAudio) {
        const durationSeconds = await audioDuration(file)
        const start = await api<{ meetingId: string; attachmentId: string; chunkSize: number }>('/api/recordings/upload', { method: 'POST', json: { ...common, name: file.name, mime: file.type || 'audio/mp4', size: file.size, transcript: transcript.trim() || undefined } })
        const size = start.chunkSize || chunkSize
        setProgress(0)
        for (let offset = 0; offset < file.size; offset += size) {
          const last = offset + size >= file.size
          const res = await fetch(`/api/recordings/upload/${start.attachmentId}`, { method: 'PUT', body: file.slice(offset, Math.min(offset + size, file.size)), headers: { 'Content-Type': 'application/octet-stream', 'x-chunk-last': last ? '1' : '0' } })
          if (!res.ok) throw new Error((await res.json().catch(() => ({ error: 'Upload failed' }))).error ?? 'Upload failed')
          setProgress(Math.min(100, Math.round(((offset + size) / file.size) * 100)))
        }
        await api(`/api/recordings/upload/${start.meetingId}`, { method: 'POST', json: { durationSeconds } })
        setMeetingId(start.meetingId)
      } else {
        const fd = new FormData()
        for (const [k, v] of Object.entries(common)) fd.set(k, Array.isArray(v) ? v.join(', ') : String(v ?? ''))
        if (file) fd.set('transcript', file)
        else fd.set('transcript', transcript)
        const res = await fetch('/api/recordings', { method: 'POST', body: fd })
        const j = (await res.json()) as { meetingId?: string; error?: string }
        if (!res.ok || !j.meetingId) throw new Error(j.error ?? 'Import failed')
        setMeetingId(j.meetingId)
      }
    } catch (e) {
      toast.push({ text: String((e as Error).message ?? e), tone: 'danger' })
      setBusy(false)
      setProgress(null)
    }
  }

  const retry = async () => {
    if (!meetingId) return
    await api(`/api/recordings/${meetingId}`, { method: 'POST' })
    setMeetingId(null)
    setTimeout(() => setMeetingId(meetingId), 50)
  }

  if (meetingId) {
    const st = (status?.status ?? (progress != null && progress < 100 ? 'uploading' : 'queued')) as Stage
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-3 text-[15px] font-semibold">{status?.title || title || 'Your meeting'}</div>
        <StageList status={st} error={status?.error} hasRecording={Boolean(file && isAudio)} />
        {status?.status === 'failed' ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={retry}><RefreshCw className="h-4 w-4" /> Try again</Button>
            <Link href={`/meetings/${meetingId}`} className="inline-flex h-9 items-center rounded-[9px] px-3 text-[13.5px] text-fg-2 hover:bg-surface-2">Open the meeting anyway</Link>
          </div>
        ) : status?.status === 'done' ? (
          <p className="mt-4 text-[13.5px] text-fg-2">Opening the meeting…</p>
        ) : (
          <p className="mt-4 text-[12.5px] text-fg-3">You can leave this page; the job keeps running. <Link href={`/meetings/${meetingId}`} className="text-accent hover:underline">Open the meeting</Link> to watch it fill in.</p>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
      <div>
        <div
          className={cx('rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors', dragging ? 'border-accent bg-accent-soft/40' : 'border-border-2')}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void pick(e.dataTransfer.files[0] ?? null) }}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2 text-[14px]">
              {isAudio ? <FileAudio className="h-5 w-5 text-accent" /> : <FileText className="h-5 w-5 text-accent" />}
              <span className="max-w-[260px] truncate font-medium">{file.name}</span>
              <span className="text-fg-3">{(file.size / 1048576).toFixed(1)} MB</span>
              <button className="rounded-md p-1 text-fg-3 hover:bg-surface-2 hover:text-fg" onClick={() => setFile(null)} aria-label="Remove file"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <Upload className="mx-auto mb-2 h-6 w-6 text-fg-3" />
              <p className="text-[14px]">Drop a recording or a transcript file here</p>
              <p className="mt-1 text-[12.5px] text-fg-3">m4a, mp3, wav, aac, ogg, webm up to {maxMb} MB · .txt, .vtt, .srt, .json transcripts</p>
              <Button className="mt-3" onClick={() => fileRef.current?.click()}>Choose file</Button>
              <input ref={fileRef} type="file" accept="audio/*,video/mp4,.m4a,.mp3,.wav,.aac,.ogg,.opus,.webm,.caf,.txt,.md,.vtt,.srt,.json" className="hidden" onChange={(e) => void pick(e.target.files?.[0] ?? null)} />
            </>
          )}
        </div>
        {file && isAudio && !serverTranscription ? (
          <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-[12.5px] text-warning">Audio transcription needs a Gemini key (Settings → AI). Paste the transcript below instead, or add the key first.</p>
        ) : null}
        {!file || isAudio ? (
          <div className="mt-4">
            <label className="mb-1 block text-[12.5px] font-medium text-fg-2">{file ? 'Transcript (optional — skips transcription when provided)' : 'Or paste the transcript'}</label>
            <Textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={file ? 5 : 12} placeholder={'Speaker 1: Thanks for making time.\nSpeaker 2: Of course. Where did we land on the buffer?\n\nPlain paragraphs from Voice Memos work too.'} className="font-mono text-[13px]" />
          </div>
        ) : null}
        {isText ? <p className="mt-2 text-[12.5px] text-fg-3">Speaker labels and timestamps are detected automatically.</p> : null}
      </div>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-fg-2">Title <span className="font-normal text-fg-3">(optional — AI names it from the content)</span></label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nissan — Treasury POC review" />
        </div>
        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-fg-2">When</label>
          <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-fg-2">Context</label>
          <select value={context} onChange={(e) => setContext(e.target.value)} className="h-10 w-full rounded-[9px] border border-border-2 bg-surface px-2 text-[16px] sm:h-9 sm:text-[13.5px]">
            <option value="auto">Decide from the content</option>
            {contexts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-fg-2">Who was there <span className="font-normal text-fg-3">(optional, helps name speakers)</span></label>
          <Input value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Thomas Müller, Priya Nair" />
        </div>
        <div>
          <label className="mb-1 block text-[12.5px] font-medium text-fg-2">Your own notes <span className="font-normal text-fg-3">(optional)</span></label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything the recording does not capture" />
        </div>
        <Button variant="primary" size="lg" className="w-full" loading={busy} disabled={!file && !transcript.trim()} onClick={submit}>
          {progress != null && progress < 100 ? `Uploading ${progress}%` : 'Turn into a meeting note'}
        </Button>
        <p className="text-[12px] text-fg-3">The transcript is kept verbatim. Everything generated is marked as AI content and points back at the words it came from.</p>
      </div>
    </div>
  )
}
