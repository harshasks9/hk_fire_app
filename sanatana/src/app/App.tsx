import { lazy, Suspense, useEffect, useState } from 'react'
import { Search, Moon, Menu, X } from 'lucide-react'
import { useRoute, href } from './router.ts'
import { SearchPalette } from '../components/SearchPalette.tsx'
import { Home } from '../pages/Home.tsx'
import { EntityPage } from '../pages/EntityPage.tsx'
import { Characters } from '../pages/Characters.tsx'
import { Narratives } from '../pages/Narratives.tsx'
import { Texts } from '../pages/Texts.tsx'
import { Discoveries } from '../pages/Discoveries.tsx'
import { Sources } from '../pages/Sources.tsx'
import { Compare } from '../pages/Compare.tsx'

const Explore = lazy(() => import('../pages/Explore.tsx'))
const Atlas = lazy(() => import('../pages/Atlas.tsx'))
const TimeMachine = lazy(() => import('../pages/TimeMachine.tsx'))

const NAV = [
  { path: 'graph', label: 'Graph' },
  { path: 'time', label: 'Time Machine' },
  { path: 'characters', label: 'Characters' },
  { path: 'atlas', label: 'Atlas' },
  { path: 'texts', label: 'Texts' },
  { path: 'narratives', label: 'Narratives' },
  { path: 'compare', label: 'Compare' },
  { path: 'discoveries', label: 'Discoveries' },
  { path: 'sources', label: 'Sources' },
]

function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState<string>(() => {
    try { return localStorage.getItem('sanatana-theme') ?? '' } catch { return '' }
  })
  useEffect(() => {
    if (theme) document.documentElement.dataset.theme = theme
    else delete document.documentElement.dataset.theme
  }, [theme])
  const toggle = () => {
    const dark = theme ? theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    const next = dark ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem('sanatana-theme', next) } catch { /* private mode */ }
  }
  return [theme, toggle]
}

export function App() {
  const route = useRoute()
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [, toggleTheme] = useTheme()
  const page = route.path[0] ?? ''
  const immersive = page === 'graph' || page === 'time' || page === 'atlas'

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest('input, textarea, select, [contenteditable]')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])
  useEffect(() => { setMenuOpen(false); if (!immersive) window.scrollTo({ top: 0 }) }, [route.path.join('/')]) // eslint-disable-line react-hooks/exhaustive-deps

  let body
  switch (page) {
    case '': body = <Home onSearch={() => setSearchOpen(true)} />; break
    case 'graph': body = <Explore route={route} />; break
    case 'time': body = <TimeMachine route={route} />; break
    case 'atlas': body = <Atlas route={route} />; break
    case 'entity': body = <EntityPage id={route.path.slice(1).join('/')} />; break
    case 'characters': body = <Characters route={route} />; break
    case 'narratives': body = <Narratives />; break
    case 'texts': body = <Texts route={route} />; break
    case 'discoveries': body = <Discoveries route={route} />; break
    case 'sources': body = <Sources route={route} />; break
    case 'compare': body = <Compare id={route.path[1]} />; break
    default: body = <div className="max-w-3xl mx-auto px-4 py-24 text-center"><p className="display text-4xl">Not found</p><a className="link" href="#/">Return to the beginning</a></div>
  }

  return (
    <div className={immersive ? 'night min-h-screen bg-night text-night-ink' : 'min-h-screen'}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn">Skip to content</a>
      <header className={`sticky top-0 z-40 border-b backdrop-blur ${immersive ? 'border-night-rule bg-night/85' : 'hairline bg-bg/85'}`}>
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center gap-4">
          <a href="#/" className="flex items-baseline gap-2 shrink-0" aria-label="Sanatana — home">
            <span className="display text-[1.55rem] font-semibold tracking-wide">Sanatana</span>
            <span className={`hidden sm:inline text-[10px] tracking-[0.2em] uppercase ${immersive ? 'text-night-ink-2' : 'text-ink-3'}`}>The Living Knowledge Graph</span>
          </a>
          <nav className="hidden xl:flex items-center gap-0.5 ml-2 text-[13px] whitespace-nowrap" aria-label="Primary">
            {NAV.map((n) => (
              <a key={n.path} href={href(n.path)} aria-current={page === n.path ? 'page' : undefined}
                className={`px-2.5 py-1.5 rounded-full transition-colors ${page === n.path ? (immersive ? 'bg-night-3 text-night-ink' : 'bg-accent-bg text-ink') : immersive ? 'text-night-ink-2 hover:text-night-ink' : 'text-ink-2 hover:text-ink'}`}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setSearchOpen(true)} className="btn !py-1.5 !px-3 text-[13px]" aria-label="Search (Ctrl+K)">
              <Search size={14} /> <span className="hidden md:inline whitespace-nowrap">Search</span>
              <kbd className="hidden md:inline text-[10px] opacity-60 ml-1">⌘K</kbd>
            </button>
            <button onClick={toggleTheme} className="btn !p-2" aria-label="Toggle light and dark theme">
              <Moon size={14} />
            </button>
            <button className="btn !p-2 xl:hidden" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((o) => !o)}>
              {menuOpen ? <X size={14} /> : <Menu size={14} />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav className={`xl:hidden border-t px-4 py-3 grid grid-cols-2 gap-1 text-sm ${immersive ? 'border-night-rule' : 'hairline'}`} aria-label="Primary (mobile)">
            {NAV.map((n) => <a key={n.path} href={href(n.path)} className="py-1.5">{n.label}</a>)}
          </nav>
        ) : null}
      </header>
      <main id="main">
        <Suspense fallback={<div className="p-16 text-center eyebrow">Loading view…</div>}>{body}</Suspense>
      </main>
      {immersive ? null : <Footer />}
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t hairline mt-16">
      <div className="max-w-[1200px] mx-auto px-4 py-10 grid gap-6 md:grid-cols-3 text-sm text-ink-3">
        <div>
          <div className="display text-xl text-ink">Sanatana</div>
          <p className="mt-2 leading-relaxed">A research-grade, provenance-first knowledge graph. Every connection carries its evidence class, its sources and how far it has been checked.</p>
        </div>
        <div className="leading-relaxed">
          <div className="eyebrow mb-2">Reading the evidence</div>
          Traditions, texts, scholarship and archaeology are kept distinct. Material evidence of worship or depiction shows that a practice or representation existed — not that narrated events occurred.
        </div>
        <div className="leading-relaxed">
          <div className="eyebrow mb-2">Data</div>
          <a className="link" href={href('sources', { tab: 'downloads' })}>Download the graph</a> as JSON or CSV, or import it into Neo4j. <a className="link" href={href('sources', { tab: 'method' })}>Methodology</a> · <a className="link" href={href('sources', { tab: 'audit' })}>Research audit</a>
        </div>
      </div>
    </footer>
  )
}
