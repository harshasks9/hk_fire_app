'use client'
import { Moon, Sun, Monitor } from 'lucide-react'
import { setShell, useShell } from './store'
import { cx } from '@/lib/util'

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme } = useShell()
  const opts = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'system', icon: Monitor, label: 'System' },
    { id: 'dark', icon: Moon, label: 'Dark' },
  ] as const
  if (compact) {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
    return (
      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-2 hover:bg-surface-2 hover:text-fg" onClick={() => setShell({ theme: next })} title={`Theme: ${theme}`} aria-label="Toggle theme">
        <Icon className="h-4 w-4" />
      </button>
    )
  }
  return (
    <div className="inline-flex rounded-lg border border-border p-0.5">
      {opts.map((o) => (
        <button key={o.id} className={cx('flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12.5px]', theme === o.id ? 'bg-surface-2 text-fg' : 'text-fg-2 hover:text-fg')} onClick={() => setShell({ theme: o.id })}>
          <o.icon className="h-3.5 w-3.5" />
          {o.label}
        </button>
      ))}
    </div>
  )
}
