'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Mic, MicOff, Square, Users, Hash, Sparkles, AlertTriangle } from 'lucide-react'
import { Button, Input, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import { cx } from '@/lib/util'

interface Segment { t: number; speaker: string; text: string }
type SR = { start: () => void; stop: () => void; abort: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null }

const SAMPLE = [
  'Thanks for making time. We want to lock the three Treasury POC use cases today.',
  'Cash forecasting first. Hirokawa-san wants a named success metric for each use case before kickoff.',
  'Agreed. For invoice matching we will measure exception rate; target under 4% in week four.',
  'The O365 connector needs Tokyo region confirmed in writing. I will send the SKU list by Wednesday.',
  'Decision: the POC starts the week of the 21st with four weeks scope.',
  'One risk: Microsoft has offered a 20% bundle discount. Kenji will compare the economics separately.',
  'Action: Kavya to draft success metrics per use case by Friday.',
]

export function LiveMeeting({ meetingId, initialTitle, knownPeople }: { meetingId?: string; initialTitle?: string; knownPeople: string[] }) {
  const router = useRouter()
  const toast = useToast()
  const [title, setTitle] = React.useState(initialTitle ?? '')
  const [participants, setParticipants] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [segments, setSegments] = React.useState<Segment[]>([])
  const [interim, setInterim] = React.useState('')
  const [recording, setRecording] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [supported, setSupported] = React.useState<boolean | null>(null)
  const [simulating, setSimulating] = React.useState(false)
  const [ending, setEnding] = React.useState(false)
  const startRef = React.useRef<number>(0)
  const recRef = React.useRef<SR | null>(null)
  const mediaRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const rafRef = React.useRef<number>(0)
  const transcriptEnd = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition))
  }, [])
  React.useEffect(() => {
    if (!recording) return
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 500)
    return () => window.clearInterval(id)
  }, [recording])
  React.useEffect(() => { transcriptEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [segments, interim])

  const topics = React.useMemo(() => {
    const text = segments.map((s) => s.text).join(' ') + ' ' + notes
    const counts = new Map<string, number>()
    for (const m of text.matchAll(/\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2})\b/g)) {
      const w = m[1]!
      if (/^(I|We|The|This|That|Action|Decision|One|Thanks|Agreed|For|Cash|Tokyo)$/.test(w)) continue
      counts.set(w, (counts.get(w) ?? 0) + 1)
    }
    for (const t of ['POC', 'discount', 'pricing', 'connector', 'success metric', 'economics', 'risk', 'timeline', 'budget', 'renewal', 'marketplace', 'capacity'].filter((k) => text.toLowerCase().includes(k))) counts.set(t, (counts.get(t) ?? 0) + 2)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t)
  }, [segments, notes])

  const speakerFor = () => (participants.split(',').map((p) => p.trim()).filter(Boolean)[0] ? 'Speaker' : 'Speaker')

  const start = async () => {
    startRef.current = Date.now() - elapsed * 1000
    setRecording(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.start(1000)
      mediaRef.current = mr
      drawWave(stream)
    } catch {
      toast.push({ text: 'Microphone unavailable — you can still type notes or simulate a transcript.' })
    }
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (Ctor) {
      const r = new Ctor()
      r.continuous = true
      r.interimResults = true
      r.lang = 'en-US'
      r.onresult = (e) => {
        let interimText = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i]!
          if (res.isFinal) setSegments((s) => [...s, { t: Math.floor((Date.now() - startRef.current) / 1000), speaker: speakerFor(), text: res[0].transcript.trim() }])
          else interimText += res[0].transcript
        }
        setInterim(interimText)
      }
      r.onend = () => { if (recRef.current === r && recording) { try { r.start() } catch { /* ignore */ } } }
      r.onerror = () => undefined
      try { r.start() } catch { /* ignore */ }
      recRef.current = r
    }
  }

  const stop = () => {
    setRecording(false)
    recRef.current?.stop()
    recRef.current = null
    mediaRef.current?.stop()
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop())
    cancelAnimationFrame(rafRef.current)
    setInterim('')
  }

  function drawWave(stream: MediaStream) {
    const ctx = new AudioContext()
    const src = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    src.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    const draw = () => {
      const c = canvasRef.current
      if (!c) return
      const g = c.getContext('2d')!
      analyser.getByteFrequencyData(data)
      const w = c.width, h = c.height
      g.clearRect(0, 0, w, h)
      const bars = 48
      const step = Math.floor(data.length / bars)
      g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5b5bd6'
      for (let i = 0; i < bars; i++) {
        const v = data[i * step]! / 255
        const bh = Math.max(2, v * h)
        g.globalAlpha = 0.35 + v * 0.65
        g.fillRect(i * (w / bars) + 1, (h - bh) / 2, w / bars - 2, bh)
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
  }

  const simulate = () => {
    if (simulating) return
    setSimulating(true)
    if (!recording) { startRef.current = Date.now(); setRecording(true) }
    let i = 0
    const tick = () => {
      if (i >= SAMPLE.length) { setSimulating(false); return }
      const line = SAMPLE[i]!
      setSegments((s) => [...s, { t: Math.floor((Date.now() - startRef.current) / 1000), speaker: i % 2 === 0 ? 'Harsha' : 'Kenji Hirokawa', text: line }])
      i++
      window.setTimeout(tick, 1800)
    }
    tick()
  }

  const end = async () => {
    if (ending) return
    setEnding(true)
    stop()
    try {
      let finalSegments = segments
      if (!finalSegments.length && chunksRef.current.length) {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const fd = new FormData()
        fd.set('audio', blob, 'meeting.webm')
        const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
        const j = (await res.json()) as { text: string | null }
        if (j.text) finalSegments = j.text.split('\n').filter(Boolean).map((l, i) => { const m = l.match(/^(Speaker \d+|[A-Z][\w ]+):\s*(.*)$/); return { t: i * 10, speaker: m?.[1] ?? 'Speaker', text: m?.[2] ?? l } })
      }
      const r = await api<{ meetingId: string; noteId: string }>('/api/meetings', { method: 'POST', json: { meetingId, title: title || `Meeting — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, startsAt: new Date(startRef.current || Date.now()).toISOString(), endsAt: new Date().toISOString(), notesMarkdown: notes, transcript: finalSegments, participants: participants.split(',').map((p) => p.trim()).filter(Boolean) } })
      toast.push({ text: 'Meeting saved. Summary, decisions and actions are being generated.', tone: 'success' })
      router.push(`/meetings/${r.meetingId}`)
      router.refresh()
    } catch (e) {
      toast.push({ text: String(e), tone: 'danger' })
      setEnding(false)
    }
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="flex h-[calc(100dvh-48px)] flex-col md:h-dvh">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting title" className="min-w-[200px] flex-1 bg-transparent text-[18px] font-semibold tracking-[-0.01em] outline-none placeholder:text-fg-3" />
        <div className="flex items-center gap-2">
          <canvas ref={canvasRef} width={160} height={28} className="hidden h-7 w-40 sm:block" />
          <span className={cx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] tabular-nums', recording ? 'bg-danger/10 text-danger' : 'bg-surface-2 text-fg-2')}>
            <span className={cx('h-2 w-2 rounded-full', recording ? 'animate-pulse bg-danger' : 'bg-fg-3')} />{fmt(elapsed)}
          </span>
          {!recording ? <Button variant="primary" onClick={start}><Mic className="h-4 w-4" /> {elapsed ? 'Resume' : 'Start'}</Button> : <Button variant="secondary" onClick={stop}><MicOff className="h-4 w-4" /> Pause</Button>}
          <Button variant="danger" onClick={end} loading={ending} disabled={!segments.length && !notes.trim() && !chunksRef.current.length}><Square className="h-3.5 w-3.5" /> End meeting</Button>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_1fr_260px]">
        <section className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
          <div className="flex items-center justify-between px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">
            <span>Running transcript</span>
            {supported === false ? <span className="inline-flex items-center gap-1 normal-case tracking-normal text-warning"><AlertTriangle className="h-3 w-3" /> No browser speech API — audio is transcribed at the end</span> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {segments.length === 0 && !interim ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[13.5px] text-fg-3">
                <p>Transcript appears here as people speak.</p>
                <button onClick={simulate} className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] text-fg-2 hover:bg-surface-2">Simulate a transcript</button>
              </div>
            ) : (
              <div className="space-y-2">
                {segments.map((s, i) => (
                  <div key={i} className="flex gap-3 text-[14px] leading-relaxed">
                    <span className="w-10 shrink-0 pt-0.5 text-right text-[11px] tabular-nums text-fg-3">{fmt(s.t)}</span>
                    <div><span className="mr-2 font-medium text-fg-2">{s.speaker}</span>{s.text}</div>
                  </div>
                ))}
                {interim ? <div className="flex gap-3 text-[14px] text-fg-3"><span className="w-10 shrink-0" /><div>{interim}…</div></div> : null}
                <div ref={transcriptEnd} />
              </div>
            )}
          </div>
        </section>
        <section className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
          <div className="px-4 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">Live notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={'Type while the transcript runs. Markdown works.\n\n- Decision: …\n- [ ] Action: …'} className="min-h-[160px] flex-1 resize-none bg-transparent px-4 pb-4 text-[15px] leading-relaxed outline-none placeholder:text-fg-3" />
        </section>
        <aside className="flex min-h-0 flex-col overflow-y-auto px-4 py-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3"><Users className="h-3 w-3" /> Participants</div>
          <Input list="known-people" value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="Kenji Hirokawa, Kavya Menon" className="mb-4" />
          <datalist id="known-people">{knownPeople.map((p) => <option key={p} value={p} />)}</datalist>
          <div className="mb-1 flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3"><Hash className="h-3 w-3" /> AI-detected topics</div>
          {topics.length ? <div className="mb-4 flex flex-wrap gap-1">{topics.map((t) => <span key={t} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[12px] text-fg-2">{t}</span>)}</div> : <p className="mb-4 text-[12.5px] text-fg-3">Topics surface as the conversation develops.</p>}
          <div className="mt-auto rounded-lg border border-dashed border-accent-soft-2 bg-accent-soft/40 p-3 text-[12.5px] text-fg-2">
            <div className="mb-1 flex items-center gap-1 font-medium text-accent"><Sparkles className="h-3.5 w-3.5" /> After the meeting</div>
            Summary, decisions, actions, follow-up email and an executive readout are generated automatically, and every company and person page updates.
          </div>
        </aside>
      </div>
    </div>
  )
}
