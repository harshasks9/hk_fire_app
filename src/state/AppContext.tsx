import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { CurrencyCode, DocStage } from '@/data/types'

export type Mode = 'simple' | 'pro'
export type DateRange = '1M' | '3M' | 'YTD' | '1Y' | 'ALL'

interface AppState {
  mode: Mode
  theme: 'light' | 'dark'
  currency: CurrencyCode
  memberId?: string
  dateRange: DateRange
  authenticated: boolean
  onboarded: boolean
  copilotOpen: boolean
  searchOpen: boolean
  uploadOpen: boolean
  notifOpen: boolean
  readNotifs: string[]
  suggestionStatus: Record<string, string>
  inboxStatus: Record<string, string>
  removedWatch: string[]
  addedToPortfolio: string[]
  /** live upload simulation state */
  uploadSim: { fileName: string; stage: DocStage } | null
  appliedDocs: string[]
}

interface AppApi extends AppState {
  setMode: (m: Mode) => void
  toggleTheme: () => void
  setCurrency: (c: CurrencyCode) => void
  setMemberId: (id?: string) => void
  setDateRange: (r: DateRange) => void
  setAuthenticated: (v: boolean) => void
  setOnboarded: (v: boolean) => void
  setCopilotOpen: (v: boolean) => void
  setSearchOpen: (v: boolean) => void
  setUploadOpen: (v: boolean) => void
  setNotifOpen: (v: boolean) => void
  markNotifRead: (id: string) => void
  setSuggestionStatus: (id: string, status: string) => void
  setInboxStatus: (id: string, status: string) => void
  removeWatch: (id: string) => void
  convertWatchToPosition: (id: string) => void
  startUploadSim: (fileName: string) => void
  setUploadSim: (s: { fileName: string; stage: DocStage } | null) => void
  applyDoc: (id: string) => void
}

const Ctx = createContext<AppApi | null>(null)

function persisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`meridian.${key}`)
    return raw !== null ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => persisted('mode', 'simple'))
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => persisted('currency', 'USD'))
  const [memberId, setMemberId] = useState<string | undefined>(undefined)
  const [dateRange, setDateRange] = useState<DateRange>('1Y')
  const [authenticated, setAuthenticated] = useState(() => persisted('auth', false))
  const [onboarded, setOnboarded] = useState(() => persisted('onboarded', false))
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [readNotifs, setReadNotifs] = useState<string[]>(() => persisted('readNotifs', []))
  const [suggestionStatus, setSugStatus] = useState<Record<string, string>>({})
  const [inboxStatus, setInbStatus] = useState<Record<string, string>>({})
  const [removedWatch, setRemovedWatch] = useState<string[]>([])
  const [addedToPortfolio, setAddedToPortfolio] = useState<string[]>([])
  const [uploadSim, setUploadSim] = useState<AppState['uploadSim']>(null)
  const [appliedDocs, setAppliedDocs] = useState<string[]>([])

  const setMode = useCallback((m: Mode) => {
    setModeState(m)
    localStorage.setItem('meridian.mode', JSON.stringify(m))
  }, [])

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c)
    localStorage.setItem('meridian.currency', JSON.stringify(c))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', next === 'dark')
      localStorage.setItem('meridian.theme', next)
      return next
    })
  }, [])

  useEffect(() => {
    localStorage.setItem('meridian.auth', JSON.stringify(authenticated))
  }, [authenticated])
  useEffect(() => {
    localStorage.setItem('meridian.onboarded', JSON.stringify(onboarded))
  }, [onboarded])
  useEffect(() => {
    localStorage.setItem('meridian.readNotifs', JSON.stringify(readNotifs))
  }, [readNotifs])

  /* Cmd/Ctrl+K opens search */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const markNotifRead = useCallback((id: string) => {
    setReadNotifs((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const setSuggestionStatus = useCallback((id: string, status: string) => {
    setSugStatus((prev) => ({ ...prev, [id]: status }))
  }, [])
  const setInboxStatus = useCallback((id: string, status: string) => {
    setInbStatus((prev) => ({ ...prev, [id]: status }))
  }, [])
  const removeWatch = useCallback((id: string) => {
    setRemovedWatch((prev) => [...prev, id])
  }, [])
  const convertWatchToPosition = useCallback((id: string) => {
    setAddedToPortfolio((prev) => [...prev, id])
  }, [])
  const applyDoc = useCallback((id: string) => {
    setAppliedDocs((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const startUploadSim = useCallback((fileName: string) => {
    const stages: DocStage[] = ['uploaded', 'classified', 'extracting', 'matching', 'reconciling', 'review']
    setUploadSim({ fileName, stage: 'uploaded' })
    stages.forEach((stage, i) => {
      if (i === 0) return
      setTimeout(() => {
        setUploadSim((cur) => (cur && cur.fileName === fileName ? { fileName, stage } : cur))
      }, i * 950)
    })
  }, [])

  const value = useMemo<AppApi>(
    () => ({
      mode, theme, currency, memberId, dateRange, authenticated, onboarded,
      copilotOpen, searchOpen, uploadOpen, notifOpen, readNotifs,
      suggestionStatus, inboxStatus, removedWatch, addedToPortfolio, uploadSim, appliedDocs,
      setMode, toggleTheme, setCurrency, setMemberId, setDateRange,
      setAuthenticated, setOnboarded, setCopilotOpen, setSearchOpen, setUploadOpen,
      setNotifOpen, markNotifRead, setSuggestionStatus, setInboxStatus,
      removeWatch, convertWatchToPosition, startUploadSim, setUploadSim, applyDoc,
    }),
    [mode, theme, currency, memberId, dateRange, authenticated, onboarded, copilotOpen, searchOpen, uploadOpen, notifOpen, readNotifs, suggestionStatus, inboxStatus, removedWatch, addedToPortfolio, uploadSim, appliedDocs, setMode, toggleTheme, setCurrency, setMemberId, setDateRange, markNotifRead, setSuggestionStatus, setInboxStatus, removeWatch, convertWatchToPosition, startUploadSim, applyDoc],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppApi {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp outside AppProvider')
  return ctx
}
