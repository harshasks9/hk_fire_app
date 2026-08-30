import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { fmtMoney, fmtPct, relDate } from '@/lib/format'
import type { CurrencyCode, Provenance } from '@/data/types'
import { Icon, type IconName } from './icons'

/* -- Layout ------------------------------------------------------------------ */

export function Card({
  children,
  className,
  pad = true,
  as: Tag = 'section',
}: {
  children: React.ReactNode
  className?: string
  pad?: boolean
  as?: 'section' | 'div' | 'article' | 'button'
}) {
  return (
    <Tag className={cn('rounded-card border border-line bg-surface shadow-card', pad && 'p-5', className)}>
      {children}
    </Tag>
  )
}

export function SectionHead({
  title,
  sub,
  right,
  className,
}: {
  title: React.ReactNode
  sub?: React.ReactNode
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex items-baseline justify-between gap-3', className)}>
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-[12.5px] text-ink2">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

/* -- Financial text ------------------------------------------------------------ */

export function Money({
  value,
  currency = 'USD',
  compact,
  className,
  sign,
}: {
  value: number
  currency?: CurrencyCode
  compact?: boolean
  className?: string
  sign?: boolean
}) {
  return <span className={cn('tnum', className)}>{fmtMoney(value, currency, { compact, sign })}</span>
}

/** Gain/loss with arrow glyph — never communicated by color alone. */
export function Delta({
  value,
  currency,
  pct,
  className,
  muted,
  arrow = true,
}: {
  value?: number
  currency?: CurrencyCode
  pct?: number
  className?: string
  muted?: boolean
  arrow?: boolean
}) {
  const basis = value ?? pct ?? 0
  const pos = basis > 0.0001
  const neg = basis < -0.0001
  const color = muted ? 'text-ink2' : pos ? 'text-gain' : neg ? 'text-loss' : 'text-ink2'
  return (
    <span className={cn('tnum inline-flex items-center gap-0.5 whitespace-nowrap', color, className)}>
      {arrow && (pos ? <Icon name="arrowUpRight" size={13} /> : neg ? <Icon name="arrowDownRight" size={13} /> : <span className="opacity-60">—</span>)}
      {value !== undefined && fmtMoney(Math.abs(value), currency ?? 'USD', { compact: Math.abs(value) >= 10000 })}
      {value !== undefined && pct !== undefined && ' '}
      {pct !== undefined && `(${fmtPct(pct, { sign: false })})`}
    </span>
  )
}

/* -- Badges & chips -------------------------------------------------------------- */

const badgeTones = {
  neutral: 'bg-surface2 text-ink2 border-line',
  brand: 'bg-brand-soft text-brand border-transparent',
  gain: 'bg-gain-soft text-gain border-transparent',
  loss: 'bg-loss-soft text-loss border-transparent',
  warn: 'bg-warn-soft text-warn border-transparent',
  info: 'bg-info-soft text-info border-transparent',
  violet: 'bg-violet-soft text-violet border-transparent',
  brass: 'bg-brass-soft text-brass border-transparent',
} as const

export type BadgeTone = keyof typeof badgeTones

export function Badge({
  tone = 'neutral',
  children,
  className,
  icon,
}: {
  tone?: BadgeTone
  children: React.ReactNode
  className?: string
  icon?: IconName
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4',
        badgeTones[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}

/* Provenance / confidence model — used everywhere a value's origin matters. */
export const PROVENANCE_META: Record<Provenance, { label: string; tone: BadgeTone; desc: string }> = {
  verified: { label: 'Verified', tone: 'gain', desc: 'Reconciled against two or more sources' },
  confirmed: { label: 'Confirmed', tone: 'brand', desc: 'Reviewed and approved by you' },
  market: { label: 'Market', tone: 'info', desc: 'Live or delayed market feed' },
  imported: { label: 'Imported', tone: 'info', desc: 'Extracted from a document, not yet reviewed' },
  calculated: { label: 'Calculated', tone: 'neutral', desc: 'Derived from other records' },
  estimated: { label: 'Estimate', tone: 'warn', desc: 'Model output — assumptions apply' },
  inferred: { label: 'Inferred', tone: 'warn', desc: 'Guessed from partial data — verify when possible' },
}

export function ProvenanceChip({
  provenance,
  asOf,
  stale,
  className,
}: {
  provenance: Provenance
  asOf?: string
  stale?: boolean
  className?: string
}) {
  const meta = PROVENANCE_META[provenance]
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} title={`${meta.desc}${asOf ? ` · as of ${asOf}` : ''}`}>
      <Badge tone={stale ? 'warn' : meta.tone}>{stale ? 'Stale' : meta.label}</Badge>
      {asOf && <span className="text-[11px] text-ink3">{relDate(asOf)}</span>}
    </span>
  )
}

export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100)
  const tone = pct >= 90 ? 'bg-gain' : pct >= 70 ? 'bg-brass' : 'bg-loss'
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} title={`Extraction confidence ${pct}%`}>
      <span className="flex h-1.5 w-10 overflow-hidden rounded-full bg-line">
        <span className={cn('h-full rounded-full', tone)} style={{ width: `${pct}%` }} />
      </span>
      <span className="tnum text-[11px] text-ink2">{pct}%</span>
    </span>
  )
}

/* -- Controls ---------------------------------------------------------------------- */

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className,
  icon,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'brass'
  size?: 'sm' | 'md' | 'lg'
  icon?: IconName
}) {
  const variants = {
    primary: 'bg-brand text-invert hover:bg-brand2 border-transparent',
    brass: 'bg-brass text-invert hover:opacity-90 border-transparent',
    secondary: 'bg-surface text-ink border-line hover:bg-surface2',
    ghost: 'bg-transparent text-ink2 border-transparent hover:bg-surface2 hover:text-ink',
    danger: 'bg-loss-soft text-loss border-transparent hover:opacity-85',
  }
  const sizes = {
    sm: 'h-8 px-2.5 text-[12.5px] gap-1.5',
    md: 'h-9 px-3.5 text-[13px] gap-2',
    lg: 'h-11 px-5 text-[14px] gap-2',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-ctl border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: { value: T; label: React.ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex items-center rounded-ctl border border-line bg-surface2 p-0.5', className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-[8px] font-medium transition-all',
            size === 'sm' ? 'px-2 py-1 text-[11.5px]' : 'px-3 py-1.5 text-[12.5px]',
            value === o.value ? 'bg-surface text-ink shadow-card' : 'text-ink2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5.5 w-10 rounded-full border transition-colors',
        checked ? 'border-brand bg-brand' : 'border-line2 bg-surface2',
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface shadow-card transition-all',
          checked ? 'left-[calc(100%-18px)]' : 'left-0.5',
        )}
      />
    </button>
  )
}

/* -- Overlays ------------------------------------------------------------------------- */

export function Modal({
  open,
  onClose,
  children,
  title,
  wide,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: React.ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) {
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        className={cn(
          'fade-up relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl',
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-3.5">
            <h3 className="text-[15px] font-semibold">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-ink2 hover:bg-surface2 hover:text-ink">
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Drawer({
  open,
  onClose,
  children,
  title,
  width = 'max-w-md',
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: React.ReactNode
  width?: string
}) {
  useEffect(() => {
    if (open) {
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn('absolute right-0 top-0 flex h-full w-full flex-col border-l border-line bg-surface shadow-pop', width)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-ink2 hover:bg-surface2 hover:text-ink">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

/* -- States ----------------------------------------------------------------------------- */

export function EmptyState({
  icon = 'file',
  title,
  body,
  action,
  className,
}: {
  icon?: IconName
  title: string
  body?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface2 text-ink3">
        <Icon name={icon} size={22} />
      </div>
      <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-ink2">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

export function ProgressBar({
  pct,
  tone = 'brand',
  className,
  height = 'h-1.5',
}: {
  pct: number
  tone?: 'brand' | 'gain' | 'loss' | 'warn' | 'brass'
  className?: string
  height?: string
}) {
  const tones = { brand: 'bg-brand', gain: 'bg-gain', loss: 'bg-loss', warn: 'bg-warn', brass: 'bg-brass' }
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-line', height, className)}>
      <div className={cn('h-full rounded-full transition-all', tones[tone])} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  )
}

export function KV({ k, v, className }: { k: React.ReactNode; v: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4 py-1.5', className)}>
      <span className="text-[12.5px] text-ink2">{k}</span>
      <span className="tnum text-right text-[13px] font-medium text-ink">{v}</span>
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-line', className)} />
}
