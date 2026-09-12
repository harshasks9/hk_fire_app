'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Square, Check, RotateCcw } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { cx } from '@/lib/util'

type SR = { start: () => void; stop: () => void; continuous: boolean; interimResults: boolean; lang: string; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null }

export function VoiceRecorder({ serverTranscription }: { serverTranscription: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [state, setState] = React.useState<'idle' | 'recording' | 'done' | 'saving'>('idle')
  const [finalText, setFinalText] = React.useState('')
  const [interim, setInterim] = React.useState('')
  const [elapsed, setElapsed] = React.useState(0)
  const [blob, setBlob] = React.useState<Blob | null>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const recRef = React.useRef<SR | null>(null)
  const mediaRef = React.useRef<MediaRecorder | null>(null)
  const chunks = React.useRef<Blob[]>([])
  const raf = React.useRef(0)
  const startAt = React.useRef(0)
  const stopRef = React.useRef(false)

  React.useEffect(() => {
    if (state !== 'recording') return
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startAt.current) / 1000)), 250)
    return () => window.clearInterval(id)
  }, [state])

  const start = async () => {
    stopRef.current = false
    setFinalText(''); setInterim(''); setBlob(null); setElapsed(0)
    startAt.current = Date.now()
    setState('recording')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunks.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data) }
      mr.onstop = () => { setBlob(new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' })); stream.getTracks().forEach((t) => t.stop()) }
      mr.start(500)
      mediaRef.current = mr
      const ac = new AudioContext(); const src = ac.createMediaStreamSource(stream); const an = ac.createAnalyser(); an.fftSize = 512; src.connect(an)
      const data = new Uint8Array(an.frequencyBinCount)
      const draw = () => {
        const c = canvasRef.current; if (!c) return
        const g = c.getContext('2d')!; an.getByteTimeDomainData(data)
        g.clearRect(0, 0, c.width, c.height); g.lineWidth = 2; g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5b5bd6'; g.beginPath()
        for (let i = 0; i < data.length; i++) { const x = (i / data.length) * c.width; const y = (data[i]! / 255) * c.height; i === 0 ? g.moveTo(x, y) : g.lineTo(x, y) }
        g.stroke(); raf.current = requestAnimationFrame(draw)
      }
      draw()
    } catch {
      toast.push({ text: 'Microphone unavailable', tone: 'danger' })
      setState('idle')
      return
    }
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (Ctor) {
      const r = new Ctor(); r.continuous = true; r.interimResults = true; r.lang = 'en-US'
      r.onresult = (e) => { let it = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const res = e.results[i]!; if (res.isFinal) setFinalText((t) => (t + ' ' + res[0].transcript).trim()); else it += res[0].transcript } setInterim(it) }
      r.onend = () => { if (!stopRef.current) { try { r.start() } catch { /* ignore */ } } }
      try { r.start() } catch { /* ignore */ }
      recRef.current = r
    }
  }
  const stop = () => { stopRef.current = true; recRef.current?.stop(); mediaRef.current?.stop(); cancelAnimationFrame(raf.current); setInterim(''); setState('done') }
  const save = async () => {
    setState('saving')
    try {
      const fd = new FormData()
      if (blob) fd.set('audio', blob, 'voice.webm')
      fd.set('transcript', finalText)
      fd.set('duration', String(elapsed))
      const res = await fetch('/api/voice', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Save failed')
      const j = (await res.json()) as { id: string }
      toast.push({ text: 'Voice note saved. Transcript, summary and actions are being generated.', tone: 'success' })
      router.push(`/notes/${j.id}`)
      router.refresh()
    } catch (e) { toast.push({ text: String(e), tone: 'danger' }); setState('done') }
  }
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center px-5 pt-16 text-center">
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Voice note</h1>
      <p className="mt-1 text-[14px] text-fg-2">One tap. Transcript, summary, actions, decisions, topics and people follow automatically.</p>
      <canvas ref={canvasRef} width={520} height={80} className={cx('mt-8 h-20 w-full', state !== 'recording' && 'opacity-30')} />
      <div className={cx('mt-2 text-[28px] font-medium tabular-nums tracking-tight', state === 'recording' ? 'text-danger' : 'text-fg-2')}>{fmt(elapsed)}</div>
      <div className="mt-6 flex items-center gap-3">
        {state === 'idle' ? <button onClick={start} className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white shadow-pop transition hover:scale-105" aria-label="Start recording"><Mic className="h-7 w-7" /></button> : null}
        {state === 'recording' ? <button onClick={stop} className="flex h-16 w-16 items-center justify-center rounded-full bg-fg text-bg shadow-pop transition hover:scale-105" aria-label="Stop"><Square className="h-6 w-6" /></button> : null}
        {state === 'done' || state === 'saving' ? <><Button variant="ghost" onClick={() => { setState('idle'); setFinalText(''); setBlob(null); setElapsed(0) }}><RotateCcw className="h-4 w-4" /> Discard</Button><Button variant="primary" size="lg" loading={state === 'saving'} onClick={save}><Check className="h-4 w-4" /> Save voice note</Button></> : null}
      </div>
      <div className="mt-8 min-h-[80px] w-full rounded-xl border border-border bg-surface px-4 py-3 text-left text-[15px] leading-relaxed">
        {finalText || interim ? <>{finalText} <span className="text-fg-3">{interim}</span></> : <span className="text-fg-3">{state === 'recording' ? 'Listening…' : serverTranscription ? 'Live transcription shows here; the recording is also transcribed server-side when you save.' : 'Live transcription uses your browser’s speech engine (Chrome and Safari). The audio is attached to the note either way.'}</span>}
      </div>
    </div>
  )
}
