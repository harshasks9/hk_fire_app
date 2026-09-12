import { Node, Extension, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { SheetView } from '@/components/sheet/SheetView'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: { setCallout: (kind?: string) => ReturnType; toggleCallout: (kind?: string) => ReturnType; insertCallout: (kind: string, text: string) => ReturnType }
    highlightRange: { highlightText: (text: string) => ReturnType; clearHighlight: () => ReturnType }
  }
}

/** Callout block: info | decision | warning | ai. AI-generated content is inserted as kind="ai" so it is visually distinct. */
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return { kind: { default: 'info', parseHTML: (el) => el.getAttribute('data-kind') || 'info', renderHTML: (attrs) => ({ 'data-kind': attrs.kind }) } }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout', class: 'callout' }), 0]
  },
  addCommands() {
    return {
      setCallout: (kind = 'info') => ({ commands }) => commands.wrapIn(this.name, { kind }),
      toggleCallout: (kind = 'info') => ({ commands }) => commands.toggleWrap(this.name, { kind }),
      insertCallout: (kind, text) => ({ chain }) => {
        const paragraphs = text.split(/\n{2,}|\n(?=[-•*]|\d+\.)/).filter((p) => p.trim())
        const content = paragraphs.map((p) => ({ type: 'paragraph', content: [{ type: 'text', text: p.replace(/^[-•*]\s+/, '• ').replace(/\n/g, ' ').trim() }] }))
        return chain().insertContent({ type: this.name, attrs: { kind }, content: content.length ? content : [{ type: 'paragraph' }] }).run()
      },
    }
  },
})

const highlightKey = new PluginKey<DecorationSet>('search-highlight')

/** Temporary highlight of a passage (used by "View source" links). */
export const HighlightRange = Extension.create({
  name: 'highlightRange',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: highlightKey,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const meta = tr.getMeta(highlightKey) as { from: number; to: number } | 'clear' | undefined
            if (meta === 'clear') return DecorationSet.empty
            if (meta) return DecorationSet.create(tr.doc, [Decoration.inline(meta.from, meta.to, { class: 'search-highlight' })])
            return old.map(tr.mapping, tr.doc)
          },
        },
        props: { decorations: (state) => highlightKey.getState(state) },
      }),
    ]
  },
  addCommands() {
    return {
      highlightText: (text) => ({ state, tr, dispatch, view }) => {
        const needle = text.trim().toLowerCase().slice(0, 80)
        if (!needle) return false
        let found: { from: number; to: number } | null = null
        state.doc.descendants((node, pos) => {
          if (found || !node.isText || !node.text) return
          const idx = node.text.toLowerCase().indexOf(needle)
          if (idx >= 0) found = { from: pos + idx, to: pos + idx + needle.length }
        })
        if (!found) {
          // Fallback: match by the first 6 words
          const words = needle.split(/\s+/).slice(0, 6).join(' ')
          state.doc.descendants((node, pos) => {
            if (found || !node.isText || !node.text) return
            const idx = node.text.toLowerCase().indexOf(words)
            if (idx >= 0) found = { from: pos + idx, to: pos + idx + words.length }
          })
        }
        if (!found) return false
        const f = found as { from: number; to: number }
        if (dispatch) {
          tr.setMeta(highlightKey, f).setSelection(TextSelection.create(tr.doc, f.from, f.to)).scrollIntoView()
          dispatch(tr)
          setTimeout(() => {
            const dom = view.domAtPos(f.from).node as HTMLElement
            ;(dom.nodeType === 3 ? dom.parentElement : dom)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
          }, 30)
        }
        return true
      },
      clearHighlight: () => ({ tr, dispatch }) => {
        if (dispatch) dispatch(tr.setMeta(highlightKey, 'clear'))
        return true
      },
    }
  },
})

/* ------------------------------------------------------------------ sheet */
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sheet: { insertSheet: (sheet?: Record<string, unknown>) => ReturnType }
  }
}

/** Spreadsheet block: a grid with Excel-style formulas and charts, stored as JSON in the node's attrs. */
export const Sheet = Node.create({
  name: 'sheet',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      sheet: {
        default: { rows: 8, cols: 5, cells: {}, formats: {}, charts: [] },
        parseHTML: (el) => { try { return JSON.parse(el.getAttribute('data-sheet') || '{}') } catch { return {} } },
        renderHTML: (attrs) => ({ 'data-sheet': JSON.stringify(attrs.sheet ?? {}) }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="sheet"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'sheet', class: 'hkn-sheet-html' })]
  },
  addCommands() {
    return {
      insertSheet: (sheet) => ({ chain }) => chain().insertContent([{ type: this.name, attrs: { sheet: sheet ?? { rows: 8, cols: 5, cells: {}, formats: {}, charts: [] } } }, { type: 'paragraph' }]).run(),
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(SheetView)
  },
})
