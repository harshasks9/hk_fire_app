'use client'
import * as React from 'react'
import { cx } from '@/lib/util'
export function Transcript({ segments, text }: { segments: { t: number; speaker: string; text: string }[]; text: string }) {
  const [open, setOpen] = React.useState(false)
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  const speakers = [...new Set(segments.map((s) => s.speaker))]
  return (
    <div className="rounded-xl border border-border">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-2.5 text-left">
        <span className="text-[13px] font-medium">Transcript <span className="text-fg-3">· {segments.length || text.split('\n').length} segments{speakers.length ? ` · ${speakers.join(', ')}` : ''}</span></span>
        <span className="text-[12px] text-fg-3">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open ? (
        <div className="max-h-[520px] overflow-y-auto border-t border-border px-4 py-3">
          {segments.length ? segments.map((s, i) => (
            <div key={i} className={cx('flex gap-3 py-1.5 text-[14px] leading-relaxed', i > 0 && segments[i - 1]!.speaker === s.speaker && 'pt-0')}>
              <span className="w-10 shrink-0 pt-0.5 text-right text-[11.5px] tabular-nums text-fg-3">{fmt(s.t)}</span>
              <div className="min-w-0"><span className="mr-2 font-medium text-fg-2">{s.speaker}</span>{s.text}</div>
            </div>
          )) : <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed">{text}</pre>}
        </div>
      ) : null}
    </div>
  )
}
