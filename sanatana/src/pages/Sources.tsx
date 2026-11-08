import { useMemo, useState } from 'react'
import { useStore } from '../data/store.tsx'
import type { Route } from '../app/router.ts'
import { navigate } from '../app/router.ts'
import { EVIDENCE, STATUS, SYSTEM_LABEL, FAMILIES, TYPE_LABEL, IN_ARTIFACT } from '../lib/meta.ts'
import { EvidenceBadge, Glyph, Note, StatusBadge } from '../components/ui.tsx'
import { fold } from '../lib/search.ts'
import { Download, ExternalLink } from 'lucide-react'

const TABS = [
  { id: 'bibliography', label: 'Bibliography' },
  { id: 'method', label: 'Methodology' },
  { id: 'audit', label: 'Research audit' },
  { id: 'downloads', label: 'Data & downloads' },
]

export function Sources({ route }: { route: Route }) {
  const tab = route.query.get('tab') ?? 'bibliography'
  return (
    <div className="max-w-[1100px] mx-auto px-4 pt-10 pb-16">
      <div className="eyebrow">Sources & method</div>
      <h1 className="display text-5xl font-semibold mt-1">The evidence behind the atlas</h1>
      <div className="mt-6 flex flex-wrap gap-1.5" role="tablist">
        {TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} className="chip !text-sm !px-3 !py-1" aria-pressed={tab === t.id} onClick={() => navigate('sources', { tab: t.id }, true)}>{t.label}</button>)}
      </div>
      <div className="mt-8">
        {tab === 'bibliography' ? <Bibliography /> : tab === 'method' ? <Method /> : tab === 'audit' ? <Audit /> : <Downloads />}
      </div>
    </div>
  )
}

function Bibliography() {
  const store = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const usage = useMemo(() => {
    const m = new Map<string, number>()
    const add = (id: string) => m.set(id, (m.get(id) ?? 0) + 1)
    for (const e of store.edges) for (const r of e.sources) add(r.source)
    for (const n of store.real) for (const r of n.sources) add(r.source)
    return m
  }, [store])
  const types = [...new Set(store.sources.map((s) => s.type))].sort()
  const list = store.sources
    .filter((s) => !type || s.type === type)
    .filter((s) => !q || fold([s.title, s.author, s.publisher, s.year].join(' ')).includes(fold(q)))
    .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0))
  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        <input className="field w-72" placeholder="Search title, author, publisher" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search sources" />
        <select className="field" value={type} onChange={(e) => setType(e.target.value)} aria-label="Source type"><option value="">all types</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
        <span className="text-sm text-ink-3 ml-auto">{list.length} of {store.sources.length} sources</span>
      </div>
      <div className="mt-3"><Note>Encyclopaedias are used as pointers to primary and scholarly sources, never as the sole support for a contested claim. Temple and tradition publications are cited as evidence of what a tradition holds.</Note></div>
      <ul className="mt-5 divide-y" style={{ borderColor: 'var(--rule)' }}>
        {list.map((s) => (
          <li key={s.id} className="py-3 grid sm:grid-cols-[1fr_auto] gap-2">
            <div>
              <div className="text-[15px]"><span className="font-semibold">{s.author}</span>{s.author ? ', ' : ''}<span className="italic">{s.title}</span>{s.publisher ? `. ${s.publisher}` : ''}{s.year ? `, ${s.year}` : ''}.</div>
              {s.notes ? <div className="text-[12.5px] text-ink-3 mt-0.5">{s.notes}</div> : null}
              <div className="text-[11.5px] text-ink-3 mt-0.5"><code>{s.id}</code> · {s.type}{s.license ? ` · ${s.license}` : ''}</div>
            </div>
            <div className="text-right text-[12px] text-ink-3">
              <div><b className="text-ink tabular-nums">{usage.get(s.id) ?? 0}</b> citations</div>
              {s.url ? <a className="inline-flex items-center gap-1 link" href={s.url} target="_blank" rel="noreferrer">open <ExternalLink size={11} /></a> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Method() {
  const store = useStore()
  return (
    <div className="prose-museum max-w-3xl text-[15.5px]">
      <h2 className="display text-3xl font-semibold mb-3 text-ink">How the graph is built</h2>
      <p>The atlas is a knowledge graph of <b>{store.meta.stats.nodes.toLocaleString()} records</b> and <b>{store.meta.stats.edges.toLocaleString()} assertions</b>. A record is a text, passage, character, deity, concept, narrative, lineage, place, temple, site, artifact, inscription, manuscript, historical person, polity, institution, tradition or debated claim. An assertion is a typed, directed statement about two records — and it is never bare: each carries its sources with exact locators, an evidence class, a confidence level and a verification status.</p>
      <p>Research was divided among specialist agents — Vedic literature; the epics; the Purāṇas; regional, devotional and Southeast Asian traditions; archaeology, inscriptions and manuscripts; and temples and sacred geography — working to a single written contract and a shared registry of canonical identities, so that parallel research links to the same “Kṛṣṇa” rather than creating three. An independent reviewer audited the result. A validator rejects any record with a dangling reference, an unknown source, an impossible date or a missing citation; the site cannot be built while such errors remain.</p>
      <h3 className="display text-2xl font-semibold mt-8 mb-2 text-ink">Identity is not equivalence</h3>
      <p>Identity, appearance, interpretation and theological equivalence are different predicates. That Kṛṣṇa is an avatāra of Viṣṇu is recorded as an <code>AVATARA_OF</code> assertion qualified by the text or tradition that makes it — not by merging the two records. Tamil Murukaṉ and Sanskrit Skanda, the Vāsudeva of early inscriptions and the epic Kṛṣṇa, the Upaniṣadic Janaka and the father of Sītā, the Laṅkā of the epic and Sri Lanka: each pair is kept apart and joined, where sources join them, by an explicit, sourced assertion.</p>
      <h3 className="display text-2xl font-semibold mt-8 mb-2 text-ink">Evidence classes</h3>
      <div className="not-prose space-y-2">{Object.entries(EVIDENCE).map(([k, e]) => <div key={k} className="flex gap-3 items-start text-[14px]"><EvidenceBadge cls={+k} /><div><b className="text-ink">{e.label}.</b> <span className="text-ink-2">{e.blurb}</span></div></div>)}</div>
      <p className="mt-3">These classes describe the nature of the evidence, not the spiritual value of a tradition. A living tradition (class 6) is recorded as exactly what it is.</p>
      <h3 className="display text-2xl font-semibold mt-8 mb-2 text-ink">Verification status</h3>
      <div className="not-prose space-y-2">{Object.entries(STATUS).map(([k, s]) => <div key={k} className="flex gap-3 items-baseline text-[14px]"><span className="w-36 shrink-0"><StatusBadge status={k} /></span><span className="text-ink-2">{s.blurb}</span></div>)}</div>
      <h3 className="display text-2xl font-semibold mt-8 mb-2 text-ink">Four chronologies, never one axis</h3>
      <ul className="list-disc pl-5 space-y-1 text-ink-2">{Object.entries(SYSTEM_LABEL).map(([k, v]) => <li key={k}><b className="text-ink">{v}.</b> {k === 'scholarly-textual' ? 'Estimated composition, compilation and redaction of texts, as ranges with the scholar whose view it is.' : k === 'material' ? 'Dated inscriptions, coins, sculptures, surviving temple fabric and manuscripts, with the dating method.' : k === 'reception' ? 'When a tradition, motif or form of worship appears in a region.' : 'Yugas, manvantaras and genealogies as the traditions state them — shown in their own mode, never on the historical scale.'}</li>)}</ul>
      <p className="mt-3">A temple’s founding legend and the date of its surviving structure are separate dates in separate systems. A date marked <em>secure</em> rests on an inscription, a colophon or a regnal synchronism; everything else is an estimate or disputed.</p>
      <h3 className="display text-2xl font-semibold mt-8 mb-2 text-ink">Network metrics</h3>
      <p>Degree, betweenness, community and cross-corpus counts are computed on the graph at build time. They describe how this dataset is connected — which reflects what has been researched as much as anything about the traditions — and are never presented as measures of religious importance or historical truth.</p>
      <h3 className="display text-2xl font-semibold mt-8 mb-2 text-ink">Families of records</h3>
      <div className="not-prose grid sm:grid-cols-2 gap-2">{FAMILIES.map((f) => <div key={f.id} className="flex items-center gap-2 text-sm"><Glyph family={f.id} size={13} /><b>{f.label}</b><span className="text-ink-3">{f.types.map((t) => TYPE_LABEL[t]).join(', ')}</span></div>)}</div>
    </div>
  )
}

function Bars({ data, label, color }: { data: Record<string, number>; label: (k: string) => React.ReactNode; color?: (k: string) => string }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const max = Math.max(1, ...Object.values(data))
  const rows = Object.entries(data).sort((a, b) => b[1] - a[1])
  return (
    <table className="w-full text-[13px]">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <td className="py-1 pr-3 w-[42%] text-ink-2">{label(k)}</td>
            <td className="py-1">
              <div className="flex items-center gap-2">
                <div className="h-2.5 rounded-r" style={{ width: `${(v / max) * 100}%`, minWidth: 3, background: color ? color(k) : 'var(--gold)' }} />
                <span className="tabular-nums text-ink">{v.toLocaleString()}</span>
                <span className="tabular-nums text-ink-3 text-[11px]">{((100 * v) / total).toFixed(0)}%</span>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Audit() {
  const store = useStore()
  const s = store.meta.stats
  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          ['Records', s.nodes], ['Assertions', s.edges], ['Verified / source-checked', `${s.verifiedEdges} (${((100 * s.verifiedEdges) / Math.max(1, s.edges)).toFixed(0)}%)`], ['Validation errors', s.validation.errors],
        ].map(([l, v]) => <div key={l as string} className="card p-4"><div className="display text-3xl font-semibold tabular-nums">{typeof v === 'number' ? v.toLocaleString() : v}</div><div className="eyebrow mt-1">{l}</div></div>)}
      </div>
      <Note>This audit is computed live from the compiled dataset. The editorial audit — coverage, unresolved questions, areas needing specialist review — is in <code>research/research-audit.md</code> in the repository; the machine audit with warning categories is <code>research/audit/validation-report.md</code>.</Note>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5"><h3 className="display text-xl font-semibold mb-3">Assertions by evidence class</h3><Bars data={s.byEvidence} label={(k) => <span className="inline-flex items-center gap-2"><EvidenceBadge cls={+k} compact />{EVIDENCE[+k]?.label}</span>} color={(k) => `var(--ev-${k})`} /></div>
        <div className="card p-5"><h3 className="display text-xl font-semibold mb-3">Assertions by verification status</h3><Bars data={s.byStatus} label={(k) => STATUS[k]?.label ?? k} /></div>
        <div className="card p-5"><h3 className="display text-xl font-semibold mb-3">Assertions by confidence</h3><Bars data={s.byConfidence} label={(k) => k} /></div>
        <div className="card p-5"><h3 className="display text-xl font-semibold mb-3">Records by type</h3><Bars data={s.byType} label={(k) => TYPE_LABEL[k] ?? k} /></div>
        <div className="card p-5"><h3 className="display text-xl font-semibold mb-3">Assertions by research agent</h3><Bars data={s.byAgent} label={(k) => store.meta.agents[k] ?? k} /></div>
        <div className="card p-5"><h3 className="display text-xl font-semibold mb-3">Coverage</h3>
          <Bars data={{ 'Records with dates': s.dated, 'Records with coordinates': s.located, 'Records with a licensed image': s.imaged, 'Comparison tables': s.comparisons, Discoveries: s.discoveries }} label={(k) => k} />
          <p className="text-[12px] text-ink-3 mt-2">{s.validation.warnings} validator warnings remain (e.g. textual claims without a passage locator, recall-only precise locators). They are listed in the machine audit and shown on records as “awaiting check”.</p>
        </div>
      </div>
    </div>
  )
}

function Downloads() {
  const files = [
    ['graph.json', 'The complete compiled graph: nodes, assertions, sources, comparisons, discoveries, sacred chronology and metrics.'],
    ['nodes.csv', 'Every record (Neo4j-import headers: id:ID, type:LABEL …).'],
    ['edges.csv', 'Every assertion with evidence class, status, qualifiers and sources.'],
    ['sources.csv', 'The bibliography.'],
    ['neo4j-import.cypher', 'A Cypher script to load the CSVs into Neo4j (APOC).'],
  ]
  return (
    <div className="max-w-3xl">
      {IN_ARTIFACT ? <div className="mb-4"><Note>This copy of the site cannot start downloads. The files below are in the repository under <code>sanatana/exports/</code>, and the deployed site at <code>/sanatana</code> offers them as downloads.</Note></div> : null}
      <p className="text-ink-2 leading-relaxed">The data is open for reuse with attribution. Images keep their own licences (recorded per image). Quoted translations are public domain or short excerpts.</p>
      <ul className="mt-5 space-y-2">
        {files.map(([f, d]) => (
          <li key={f} className="card p-4 flex items-center gap-4">
            <Download size={16} className="text-gold shrink-0" />
            <div className="min-w-0">{IN_ARTIFACT ? <code className="font-medium">sanatana/exports/{f}</code> : <a className="link font-medium" href={`${import.meta.env.BASE_URL}data/${f}`} download>{f}</a>}<div className="text-[13px] text-ink-3">{d}</div></div>
          </li>
        ))}
      </ul>
      <div className="mt-6"><Note>To rebuild: edit the research files under <code>data/</code>, run <code>npm run validate</code>, then <code>npm run build</code>. The build refuses to publish while validation errors remain.</Note></div>
    </div>
  )
}
