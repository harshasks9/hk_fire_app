import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { PageHeader } from '@/components/ui'
import { getContexts } from '@/lib/context'
import { withNotebookAi } from '@/lib/session'
import { mediaCapabilities } from '@/lib/media'
import { ImportRecording } from '@/components/meetings/ImportRecording'
import { CHUNK_SIZE, MAX_AUDIO_BYTES } from '@/lib/recordings/ingest'

export const dynamic = 'force-dynamic'

export default async function ImportRecordingPage() {
  const contexts = await getContexts()
  const caps = await withNotebookAi(async () => mediaCapabilities())
  return (
    <Page>
      <PageHeader
        title="Import a recording"
        subtitle="A phone recording or its transcript becomes a structured meeting note — attendees, decisions, actions, open questions — filed next to everything you already know about the people in it."
        actions={<Link href="/settings#capture" className="text-[13px] text-accent hover:underline">Send from an iPhone Shortcut →</Link>}
      />
      <ImportRecording contexts={contexts.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} serverTranscription={caps.serverTranscription} maxMb={Math.round(MAX_AUDIO_BYTES / 1048576)} chunkSize={CHUNK_SIZE} />
    </Page>
  )
}
