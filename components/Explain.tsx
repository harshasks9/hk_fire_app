'use client'

/*
  Hover explainers. Desktop: hover or keyboard focus opens the card.
  Mobile (no hover): tap toggles it. Escape and tapping elsewhere close it.
  Content comes from lib/glossary.ts and is passed in as plain data.
*/
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import type { GlossaryEntry } from '@/lib/glossary'

export function Explain({
  entry,
  children,
  wide,
}: {
  entry: GlossaryEntry
  /** The text being explained. Omit to render a standalone ⓘ trigger. */
  children?: ReactNode
  wide?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const show = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    const rect = rootRef.current?.getBoundingClientRect()
    if (rect) setAlignRight(rect.left > window.innerWidth / 2)
    setOpen(true)
  }
  const hideSoon = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <span
      ref={rootRef}
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hideSoon}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => (open ? setOpen(false) : show())}
        onFocus={show}
        onBlur={hideSoon}
        className="cursor-help border-0 bg-transparent p-0 text-left font-inherit"
        style={{ font: 'inherit', color: 'inherit' }}
      >
        {children ? (
          <span
            style={{
              textDecoration: 'underline dotted',
              textUnderlineOffset: '3px',
              textDecorationColor: 'var(--accent)',
            }}
          >
            {children}
          </span>
        ) : (
          <span
            aria-label={`Explain: ${entry.title}`}
            className="inline-flex h-[1.15em] w-[1.15em] items-center justify-center rounded-full border text-[0.7em] font-semibold align-middle"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            i
          </span>
        )}
      </button>
      {open ? (
        <span
          id={id}
          role="note"
          onMouseEnter={show}
          onMouseLeave={hideSoon}
          className="absolute z-50 mt-1 block rounded-lg border p-3 text-sm font-normal normal-case shadow-lg"
          style={{
            background: 'var(--card)',
            borderColor: 'var(--accent)',
            color: 'var(--fg)',
            width: wide ? 'min(28rem, 88vw)' : 'min(20rem, 85vw)',
            top: '100%',
            ...(alignRight ? { right: 0 } : { left: 0 }),
            letterSpacing: 'normal',
            textAlign: 'left',
            lineHeight: 1.5,
          }}
        >
          <span className="mb-1 block font-semibold">{entry.title}</span>
          {entry.paragraphs.map((p, i) => (
            <span key={i} className="mb-2 block last:mb-0" style={{ color: 'var(--fg)' }}>
              {p}
            </span>
          ))}
          {entry.example ? (
            <span className="mt-1 block rounded-md border p-2 text-xs" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
              {entry.example}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  )
}

/** Page-level explainer: an ⓘ next to a heading with the full "how this page works" card. */
export function PageHelp({ entry }: { entry: GlossaryEntry }) {
  return <Explain entry={entry} wide />
}
