'use client'
import * as React from 'react'
import { Scissors, Copy, Check, Smartphone, MousePointerClick } from 'lucide-react'
import { Button } from '@/components/ui'

/** The bookmarklet that opens /clip in a popup with the current page and selection. Built once per origin. */
export function bookmarkletCode(origin: string): string {
  const js = `(function(){var s=window.getSelection?String(window.getSelection()).slice(0,6000):'';var q='url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title)+'&text='+encodeURIComponent(s)+'&popup=1';var w=window.open('${origin}/clip?'+q,'hkn_clip','width=520,height=680,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes');if(!w){location.href='${origin}/clip?'+q}})();`
  return `javascript:${js}`
}

/** Settings → Clip web pages: bookmarklet, share sheet, shortcut. */
export function ClipperSection({ origin }: { origin: string }) {
  const code = bookmarkletCode(origin)
  const linkRef = React.useRef<HTMLAnchorElement>(null)
  const [copied, setCopied] = React.useState(false)
  // React refuses javascript: URLs in JSX; the bookmarklet is a legitimate one, set on the element directly.
  React.useEffect(() => { linkRef.current?.setAttribute('href', code) }, [code])
  return (
    <section id="clipper">
      <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2"><Scissors className="h-3.5 w-3.5" /> Clip web pages</h2>
      <p className="mb-3 text-[13.5px] text-fg-2">Save an article, a document or a product page as a note with its readable text inside, not just a link. Select text on the page first and it is kept as a quote. Everything clipped lands in the Inbox and is filed like any capture.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border p-3 text-[13px]">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium"><MousePointerClick className="h-3.5 w-3.5 text-accent" /> Desktop browser</div>
          <p className="text-fg-2">Drag this button to your bookmarks bar, then click it on any page:</p>
          <p className="my-2"><a ref={linkRef} className="inline-flex cursor-grab items-center gap-1.5 rounded-lg border border-accent-soft-2 bg-accent-soft px-3 py-1.5 font-medium text-accent" onClick={(e) => { e.preventDefault() }} title="Drag me to the bookmarks bar" data-testid="bookmarklet"><Scissors className="h-3.5 w-3.5" /> Clip to Notes</a></p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* clipboard blocked */ } }}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy the bookmarklet</Button>
          </div>
          <p className="mt-2 text-[12px] text-fg-3">No bookmarks bar? Create a bookmark by hand and paste the copied code as its address.</p>
        </div>
        <div className="rounded-xl border border-border p-3 text-[13px]">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium"><Smartphone className="h-3.5 w-3.5 text-accent" /> Android and desktop Chrome</div>
          <p className="text-fg-2">Install Notes (browser menu → <em>Install app</em> / <em>Add to Home screen</em>). Notes then appears in the system <strong>Share</strong> sheet of every app: share a page from Chrome, a tweet, a video, a PDF link, and it is clipped.</p>
        </div>
        <div className="rounded-xl border border-border p-3 text-[13px]">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium"><Smartphone className="h-3.5 w-3.5 text-accent" /> iPhone and iPad</div>
          <p className="text-fg-2">Safari has no share target for web apps, so use a Shortcut: <em>Receive URLs from Share Sheet</em> → <em>Open URL</em> <code>{origin}/clip?url=</code> + Shortcut Input. Or post to <code>{origin}/api/clip</code> with a capture token (<code>{`{"url": …, "comment": …}`}</code>) to clip without opening the app.</p>
        </div>
      </div>
    </section>
  )
}
