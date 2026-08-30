import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Five Delta',
  description: 'An execution system for a weekly options income programme. Adherence, not analysis.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

const NAV = [
  { href: '/', label: 'Today' },
  { href: '/scoreboard', label: 'Scoreboard' },
  { href: '/deviations', label: 'Deviations' },
  { href: '/valuations', label: 'Valuation' },
  { href: '/owl', label: 'OWL' },
  { href: '/log', label: 'Log' },
  { href: '/settings', label: 'Settings' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              Five Delta
            </Link>
            <nav aria-label="Primary" className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {NAV.slice(1).map((n) => (
                <Link key={n.href} href={n.href} style={{ color: 'var(--muted)' }}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">{children}</main>
      </body>
    </html>
  )
}
