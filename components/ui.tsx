import type { ReactNode } from 'react'
import Link from 'next/link'

export function Card({ children, tone }: { children: ReactNode; tone?: 'bad' | 'warn' | 'good' }) {
  const bg = tone === 'bad' ? 'var(--bad-bg)' : tone === 'warn' ? 'var(--warn-bg)' : tone === 'good' ? 'var(--good-bg)' : 'var(--card)'
  const border = tone ? `var(--${tone})` : 'var(--border)'
  return (
    <div className="rounded-lg border p-4" style={{ background: bg, borderColor: border }}>
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{children}</h2>
}

/** A figure computed by the math module, not read from a market. */
export function Modelled({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="modelled" title={hint ?? 'modelled — verify on the Fidelity chain'}>
      {children}
    </span>
  )
}

export function Chip({ kind, children }: { kind: 'healthy' | 'watch' | 'close_now' | 'neutral' | 'good' | 'warn' | 'bad'; children: ReactNode }) {
  const map: Record<string, { c: string; bg: string }> = {
    healthy: { c: 'var(--good)', bg: 'var(--good-bg)' },
    good: { c: 'var(--good)', bg: 'var(--good-bg)' },
    watch: { c: 'var(--warn)', bg: 'var(--warn-bg)' },
    warn: { c: 'var(--warn)', bg: 'var(--warn-bg)' },
    close_now: { c: 'var(--bad)', bg: 'var(--bad-bg)' },
    bad: { c: 'var(--bad)', bg: 'var(--bad-bg)' },
    neutral: { c: 'var(--muted)', bg: 'transparent' },
  }
  const s = map[kind]!
  return (
    <span
      className="inline-block rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ color: s.c, borderColor: s.c, background: s.bg }}
    >
      {children}
    </span>
  )
}

export function Btn({
  children,
  tone,
  type = 'submit',
  name,
  value,
}: {
  children: ReactNode
  tone?: 'primary' | 'danger' | 'plain'
  type?: 'submit' | 'button'
  name?: string
  value?: string
}) {
  const style =
    tone === 'danger'
      ? { background: 'var(--bad)', color: '#fff', borderColor: 'var(--bad)' }
      : tone === 'primary'
        ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' }
        : { background: 'var(--card)', color: 'var(--fg)', borderColor: 'var(--border)' }
  return (
    <button type={type} name={name} value={value} className="rounded-md border px-3 py-1.5 text-sm font-medium" style={style}>
      {children}
    </button>
  )
}

export function Fraction({ n, d }: { n: number; d: number }) {
  return (
    <span className="tabular">
      {n} of {d}
    </span>
  )
}

export function money(x: number): string {
  const sign = x < 0 ? '−' : ''
  return `${sign}$${Math.abs(Math.round(x)).toLocaleString()}`
}

export function pct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits)}%`
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm" style={{ color: 'var(--accent)' }}>
      ← {children}
    </Link>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center" style={{ borderColor: 'var(--border)' }}>
      <p className="text-lg font-medium">{title}</p>
      {children ? <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>{children}</div> : null}
    </div>
  )
}
