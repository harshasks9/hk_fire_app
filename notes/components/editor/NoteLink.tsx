'use client'
import * as React from 'react'
import { Node, InputRule, mergeAttributes, type Editor } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import Suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance } from 'tippy.js'
import { FileText, Plus } from 'lucide-react'
import { cx, relativeTime } from '@/lib/util'

export interface NoteLinkItem { id: string; title: string; kind: string; updatedAt: string }
export interface NoteLinkClick { id: string | null; label: string; pos: number; editor: Editor }

export interface NoteLinkOptions {
  /** The note being edited, left out of the suggestions. */
  currentNoteId: string | null
  /** Called when a link is clicked: open it, or create the note when `id` is null. */
  onClick: ((c: NoteLinkClick) => void) | null
  /** Resolve or create a note by title after "New note" is chosen; returns its id. */
  createNote: ((title: string) => Promise<string | null>) | null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteLink: { insertNoteLink: (attrs: { id: string | null; label: string }) => ReturnType; resolveNoteLink: (label: string, id: string) => ReturnType }
  }
}

const noteLinkKey = new PluginKey('noteLinkSuggestion')

/**
 * [[Wiki link]] to another note: an inline atom { id, label }. Type `[[` to search titles,
 * or type `[[Title]]` outright; the title is resolved on save or when the link is followed.
 */
export const NoteLink = Node.create<NoteLinkOptions>({
  name: 'noteLink',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  addOptions() {
    return { currentNoteId: null, onClick: null, createNote: null }
  },
  addAttributes() {
    return {
      id: { default: null, parseHTML: (el) => el.getAttribute('data-id') || null, renderHTML: (attrs) => ({ 'data-id': attrs.id ?? '' }) },
      label: { default: '', parseHTML: (el) => el.getAttribute('data-label') || el.textContent || '', renderHTML: (attrs) => ({ 'data-label': attrs.label }) },
    }
  },
  parseHTML() {
    return [{ tag: 'a[data-type="note-link"]' }, { tag: 'span[data-type="note-link"]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    const id = node.attrs.id as string | null
    return ['a', mergeAttributes(HTMLAttributes, { 'data-type': 'note-link', href: id ? `/notes/${id}` : '#', class: cx('note-link', !id && 'note-link-unresolved'), title: id ? 'Open note' : 'No note with this title yet — click to create it' }), String(node.attrs.label ?? '')]
  },
  renderText({ node }) {
    return String(node.attrs.label ?? '')
  },
  addCommands() {
    return {
      insertNoteLink: (attrs) => ({ chain }) => chain().insertContent([{ type: this.name, attrs }, { type: 'text', text: ' ' }]).run(),
      resolveNoteLink: (label, id) => ({ tr, state, dispatch }) => {
        let done = false
        state.doc.descendants((n, pos) => {
          if (done || n.type.name !== this.name || n.attrs.id || String(n.attrs.label).trim().toLowerCase() !== label.trim().toLowerCase()) return
          if (dispatch) tr.setNodeMarkup(pos, undefined, { ...n.attrs, id })
          done = true
        })
        return done
      },
    }
  },
  addInputRules() {
    // The whole `[[Title]]` becomes the node (TipTap's nodeInputRule would keep the brackets around it).
    return [
      new InputRule({
        find: /\[\[([^[\]\n]{1,200})\]\]$/,
        handler: ({ range, match, chain }) => {
          const label = (match[1] ?? '').trim()
          if (!label) return null
          chain().deleteRange(range).insertContent([{ type: this.name, attrs: { id: null, label } }, { type: 'text', text: ' ' }]).run()
        },
      }),
    ]
  },
  addProseMirrorPlugins() {
    const options = this.options
    const type = this.type
    return [
      new Plugin({
        key: new PluginKey('noteLinkClick'),
        props: {
          handleClickOn: (view, _pos, node, nodePos, event) => {
            if (node.type !== type) return false
            if (event.button !== 0) return false
            event.preventDefault()
            options.onClick?.({ id: (node.attrs.id as string | null) || null, label: String(node.attrs.label ?? ''), pos: nodePos, editor: this.editor })
            return true
          },
        },
      }),
      Suggestion<NoteLinkItem | { id: 'new'; title: string; kind: 'new'; updatedAt: '' }>({
        editor: this.editor,
        pluginKey: noteLinkKey,
        char: '[[',
        allowSpaces: true,
        startOfLine: false,
        allowedPrefixes: null,
        items: async ({ query }) => {
          try {
            const res = await fetch(`/api/links?q=${encodeURIComponent(query)}${options.currentNoteId ? `&exclude=${encodeURIComponent(options.currentNoteId)}` : ''}`)
            return (await res.json()) as NoteLinkItem[]
          } catch {
            return []
          }
        },
        command: ({ editor, range, props }) => {
          // A stray closing bracket typed after the query is swallowed with the trigger text.
          const after = editor.state.doc.textBetween(range.to, Math.min(range.to + 2, editor.state.doc.content.size), '')
          const to = after.startsWith(']]') ? range.to + 2 : after.startsWith(']') ? range.to + 1 : range.to
          if (props.kind === 'new') {
            const label = props.title.trim()
            editor.chain().focus().deleteRange({ from: range.from, to }).insertNoteLink({ id: null, label }).run()
            void options.createNote?.(label).then((id) => { if (id) editor.commands.resolveNoteLink(label, id) })
            return
          }
          editor.chain().focus().deleteRange({ from: range.from, to }).insertNoteLink({ id: props.id, label: props.title }).run()
        },
        render: () => {
          let component: ReactRenderer<{ onKeyDown: (p: SuggestionKeyDownProps) => boolean }> | null = null
          let popup: Instance[] | null = null
          return {
            onStart: (props) => {
              component = new ReactRenderer(NoteLinkList, { props, editor: props.editor })
              if (!props.clientRect) return
              popup = tippy('body', { getReferenceClientRect: props.clientRect as () => DOMRect, appendTo: () => document.body, content: component.element, showOnCreate: true, interactive: true, trigger: 'manual', placement: 'bottom-start', arrow: false, offset: [0, 6] })
            },
            onUpdate: (props) => {
              component?.updateProps(props)
              if (props.clientRect) popup?.[0]?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect })
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') { popup?.[0]?.hide(); return true }
              return component?.ref?.onKeyDown(props) ?? false
            },
            onExit: () => { popup?.[0]?.destroy(); component?.destroy() },
          }
        },
      }),
    ]
  },
})

type ListItem = NoteLinkItem | { id: 'new'; title: string; kind: 'new'; updatedAt: '' }

const NoteLinkList = React.forwardRef<{ onKeyDown: (p: SuggestionKeyDownProps) => boolean }, SuggestionProps<ListItem>>(function NoteLinkList({ items, command, query }, ref) {
  const [index, setIndex] = React.useState(0)
  const q = query.replace(/\]+$/, '').trim()
  const all: ListItem[] = [...items, ...(q && !items.some((i) => i.title.toLowerCase() === q.toLowerCase()) ? [{ id: 'new' as const, title: q, kind: 'new' as const, updatedAt: '' as const }] : [])]
  React.useEffect(() => setIndex(0), [items, q])
  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') { setIndex((i) => (i + all.length - 1) % Math.max(all.length, 1)); return true }
      if (event.key === 'ArrowDown') { setIndex((i) => (i + 1) % Math.max(all.length, 1)); return true }
      if (event.key === 'Enter' || event.key === 'Tab') { const it = all[index]; if (it) { command(it); return true } }
      return false
    },
  }))
  if (!all.length) return <div className="rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-fg-3 shadow-pop" data-testid="note-link-menu">Type a title to link or create a note</div>
  return (
    <div className="max-h-[300px] w-[300px] overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-pop" data-testid="note-link-menu">
      {all.map((it, i) => (
        <button key={it.id === 'new' ? 'new' : it.id} onMouseDown={(e) => e.preventDefault()} onClick={() => command(it)} onMouseEnter={() => setIndex(i)} className={cx('flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left', i === index && 'bg-surface-2')}>
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-fg-3">{it.kind === 'new' ? <Plus className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}</span>
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-medium">{it.kind === 'new' ? `New note “${it.title}”` : it.title || 'Untitled'}</span>
            <span className="block truncate text-[11.5px] text-fg-3">{it.kind === 'new' ? 'Create and link it' : `${it.kind} · ${relativeTime(it.updatedAt)}`}</span>
          </span>
        </button>
      ))}
    </div>
  )
})
