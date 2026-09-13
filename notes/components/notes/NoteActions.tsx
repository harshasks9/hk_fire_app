'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Star, MoreHorizontal, Trash2, RefreshCw, EyeOff, Lock, Unlock, FlaskConical, Download, History, Globe, LayoutTemplate, Share2 } from 'lucide-react'
import { NoteHistory } from './NoteHistory'
import { ShareDialog } from './ShareDialog'
import { SaveTemplateDialog } from './SaveTemplateDialog'
import { Button, Menu, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import { cx } from '@/lib/util'
import { GenerateMenu } from '@/components/entities'

export function NoteActions({ noteId, favorite, privacy, researchProjects, researchProjectId, title }: { noteId: string; favorite: boolean; privacy: string; researchProjects: { id: string; name: string }[]; researchProjectId: string | null; title?: string }) {
  const router = useRouter()
  const toast = useToast()
  const [fav, setFav] = React.useState(favorite)
  const [busy, setBusy] = React.useState(false)
  const [dialog, setDialog] = React.useState<'history' | 'share' | 'template' | null>(null)
  const patch = async (p: Record<string, unknown>) => { await api(`/api/notes/${noteId}`, { method: 'PATCH', json: p }); router.refresh() }
  return (
    <div className="flex items-center gap-1">
      <GenerateMenu target={{ type: 'note', id: noteId }} />
      <Button size="icon" variant="ghost" title={fav ? 'Remove from favorites' : 'Add to favorites'} onClick={() => { setFav(!fav); patch({ favorite: !fav }) }}>
        <Star className={cx('h-4 w-4', fav && 'fill-warning text-warning')} />
      </Button>
      <Menu
        trigger={<Button size="icon" variant="ghost" title="More"><MoreHorizontal className="h-4 w-4" /></Button>}
        items={[
          { label: busy ? 'Re-analyzing…' : 'Re-analyze with AI', icon: <RefreshCw className={cx('h-3.5 w-3.5', busy && 'animate-spin')} />, disabled: busy, onSelect: async () => { setBusy(true); try { await api(`/api/notes/${noteId}/process`, { method: 'POST' }); toast.push({ text: 'Re-analyzed', tone: 'success' }); router.refresh() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(false) } } },
          privacy === 'ai_excluded'
            ? { label: 'Allow AI to read this note', icon: <Unlock className="h-3.5 w-3.5" />, onSelect: () => patch({ privacy: 'normal', process: true }) }
            : { label: 'Exclude from AI', icon: <EyeOff className="h-3.5 w-3.5" />, onSelect: () => patch({ privacy: 'ai_excluded' }) },
          privacy === 'private' ? { label: 'Unmark private', icon: <Unlock className="h-3.5 w-3.5" />, onSelect: () => patch({ privacy: 'normal' }) } : { label: 'Mark private', icon: <Lock className="h-3.5 w-3.5" />, onSelect: () => patch({ privacy: 'private' }) },
          ...(researchProjects.length ? [{ label: researchProjectId ? 'Remove from research project' : `Add to research: ${researchProjects[0]!.name}`, icon: <FlaskConical className="h-3.5 w-3.5" />, onSelect: () => patch({ researchProjectId: researchProjectId ? null : researchProjects[0]!.id }) }] : []),
          { label: 'Share read-only link…', icon: <Globe className="h-3.5 w-3.5" />, onSelect: () => setDialog('share') },
          { label: 'Version history…', icon: <History className="h-3.5 w-3.5" />, onSelect: () => setDialog('history') },
          { label: 'Save as template…', icon: <LayoutTemplate className="h-3.5 w-3.5" />, onSelect: () => setDialog('template') },
          { label: 'See in the graph', icon: <Share2 className="h-3.5 w-3.5" />, href: `/graph?focus=note:${noteId}` },
          { label: 'Export (JSON)', icon: <Download className="h-3.5 w-3.5" />, href: `/api/notes/${noteId}` },
          { label: 'Move to Trash', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true, onSelect: async () => { if (!confirm('Move this note to Trash? You can restore it within 30 days.')) return; await api(`/api/notes/${noteId}`, { method: 'DELETE' }); router.push('/notes'); router.refresh() } },
        ]}
      />
      <NoteHistory noteId={noteId} open={dialog === 'history'} onClose={() => setDialog(null)} />
      <ShareDialog noteId={noteId} open={dialog === 'share'} onClose={() => setDialog(null)} />
      <SaveTemplateDialog noteId={noteId} open={dialog === 'template'} onClose={() => setDialog(null)} defaultName={title?.trim() || 'My template'} />
    </div>
  )
}
