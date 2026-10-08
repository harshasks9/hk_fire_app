import { PublicShell } from '@/components/public/PublicShell'
import { getPlatformSettings } from '@/lib/platform'
import { getSession } from '@/lib/session'
import { authEnabled } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, session] = await Promise.all([getPlatformSettings(), getSession().catch(() => null)])
  return (
    <PublicShell productName={settings.productName} signedIn={Boolean(session)} supportEmail={settings.supportEmail} authEnabled={authEnabled()}>
      {children}
    </PublicShell>
  )
}
