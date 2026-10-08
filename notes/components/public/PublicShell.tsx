import Link from 'next/link'

/** The marketing/account shell for signed-out pages: a small header, the page, a footer. */
export function PublicShell({ children, productName, signedIn, supportEmail, authEnabled }: { children: React.ReactNode; productName: string; signedIn: boolean; supportEmail: string; authEnabled: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1080px] items-center justify-between px-5 sm:px-8">
          <Link href="/welcome" className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[14px] font-bold text-accent-fg">N</span><span className="text-[15px] font-semibold">{productName}</span></Link>
          <nav className="flex items-center gap-1 text-[13.5px]">
            {signedIn || !authEnabled ? (
              <Link href="/" className="ml-1 rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-fg">Open my notebook</Link>
            ) : (
              <>
                <Link href="/login" className="rounded-md px-2.5 py-1.5 text-fg-2 hover:bg-surface-2 hover:text-fg">Sign in</Link>
                <Link href="/signup" className="ml-1 rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-fg">Get started</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-[12.5px] text-fg-3 sm:px-8">
          <span>© {new Date().getFullYear()} {productName}. Capture anything. Organize nothing. Find everything.</span>
          <span className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-fg">Terms</Link>
            <Link href="/privacy" className="hover:text-fg">Privacy</Link>
            {supportEmail ? <a href={`mailto:${supportEmail}`} className="hover:text-fg">Support</a> : null}
          </span>
        </div>
      </footer>
    </div>
  )
}

export const field = 'h-11 w-full rounded-[9px] border border-border-2 bg-surface px-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'
export const primaryButton = 'h-11 w-full rounded-[9px] bg-accent text-[15px] font-medium text-accent-fg disabled:opacity-50'
