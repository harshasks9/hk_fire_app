import { Page } from '@/components/shell/AppShell'
import { getActiveContext, getContexts } from '@/lib/context'
import { parseShare } from '@/lib/clip/article'
import { ClipForm } from '@/components/clip/ClipForm'

export const dynamic = 'force-dynamic'

/**
 * The web clipper's landing page: the PWA share target (Android, desktop Chrome), the bookmarklet's
 * popup and a plain form. Whatever arrived in the query string is pre-filled; one tap files it.
 */
export default async function ClipPage({ searchParams }: { searchParams: Promise<{ url?: string; title?: string; text?: string; popup?: string }> }) {
  const sp = await searchParams
  const share = parseShare({ url: sp.url, title: sp.title, text: sp.text })
  const [contexts, active] = await Promise.all([getContexts(), getActiveContext()])
  const popup = sp.popup === '1'
  return (
    <Page width="narrow" className={popup ? 'pt-4' : 'pt-6'}>
      <ClipForm initialUrl={share.url ?? ''} initialTitle={share.title} initialText={share.text} contexts={contexts.map((c) => ({ id: c.id, name: c.name }))} activeContextId={active.id} popup={popup} via={sp.popup === '1' ? 'bookmarklet' : sp.url || sp.text || sp.title ? 'share' : 'page'} />
    </Page>
  )
}
