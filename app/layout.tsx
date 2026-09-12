import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Notes', template: '%s · Notes' },
  description: 'Capture anything. Organize nothing. Find everything. Act on what matters.',
  applicationName: 'Notes',
  appleWebApp: { capable: true, title: 'Notes', statusBarStyle: 'default' },
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0e10' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const themeScript = `(function(){try{var t=localStorage.getItem('hkn-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-bg text-fg">{children}</body>
    </html>
  )
}
