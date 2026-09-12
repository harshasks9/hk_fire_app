'use client'
import { useSyncExternalStore } from 'react'

export interface ShellState {
  sidebarCollapsed: boolean
  panelOpen: boolean
  panelAvailable: boolean
  commandOpen: boolean
  commandQuery: string
  captureOpen: boolean
  theme: 'system' | 'light' | 'dark'
  mobileMenuOpen: boolean
  /** Intelligence panel shown as a bottom sheet (screens below xl). */
  panelSheet: boolean
}

const listeners = new Set<() => void>()
let state: ShellState = { sidebarCollapsed: false, panelOpen: true, panelAvailable: false, commandOpen: false, commandQuery: '', captureOpen: false, theme: 'system', mobileMenuOpen: false, panelSheet: false }

function load() {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem('hkn-shell')
    if (raw) {
      const saved = JSON.parse(raw) as Partial<ShellState>
      state = { ...state, sidebarCollapsed: saved.sidebarCollapsed ?? false, panelOpen: saved.panelOpen ?? true }
    }
    state.theme = (localStorage.getItem('hkn-theme') as ShellState['theme']) ?? 'system'
  } catch {
    /* ignore */
  }
}
let loaded = false

export function setShell(patch: Partial<ShellState> | ((s: ShellState) => Partial<ShellState>)) {
  const p = typeof patch === 'function' ? patch(state) : patch
  state = { ...state, ...p }
  try {
    localStorage.setItem('hkn-shell', JSON.stringify({ sidebarCollapsed: state.sidebarCollapsed, panelOpen: state.panelOpen }))
    if (p.theme) {
      localStorage.setItem('hkn-theme', p.theme)
      applyTheme(p.theme)
    }
  } catch {
    /* ignore */
  }
  for (const l of listeners) l()
}

export function applyTheme(theme: ShellState['theme']) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

const serverSnapshot: ShellState = { ...state }

export function useShell(): ShellState {
  return useSyncExternalStore(
    (cb) => {
      if (!loaded) {
        loaded = true
        load()
        queueMicrotask(cb)
      }
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
    () => serverSnapshot,
  )
}
