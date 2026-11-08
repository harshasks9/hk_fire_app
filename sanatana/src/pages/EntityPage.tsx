/**
 * The profile page for any record. Sections appear only when the graph has
 * something for them; every statement on the page links to its assertion and sources.
 */
import { lazy, Suspense, useMemo, useState } from 'react'
import { Network, MapPin, Clock, AlertTriangle, ExternalLink } from 'lucide-react'
import { useStore, type GEdge, type GNode } from '../data/store.tsx'
import { href, entityHref } from '../app/router.ts'
import { TYPE_LABEL, EVIDENCE } from '../lib/meta.ts'
import { DateRow, EntityLink, EvidenceBadge, Glyph, Note, Section, SourceList, StatusBadge, ConfidenceDots, TypeTag, Disclosure, Empty } from '../components/ui.tsx'
import { FamilyTree, kinOf } from '../components/FamilyTree.tsx'
import { ComparisonTable } from '../components/ComparisonTable.tsx'
import { AttestationChart } from '../components/AttestationChart.tsx'
import { MapView, type MapPoint } from '../components/MapView.tsx'
import { gatherAttestations } from '../lib/attest.ts'

const EgoGraph = lazy(() => import('../components/EgoGraph.tsx'))

type Rel = { edge: GEdge; other: GNode; dir: 'out' | 'in' }
const TEXTUAL = new Set(['APPEARS_IN', 'MENTIONED_IN', 'NARRATED_IN', 'TEACHES_IN'])
const GROUPS: { key: string; title: string; preds: string[] }[] = [
  { key: 'structure', title: 'Place in the literature', preds: ['PART_OF', 'RECENSION_OF', 'RETELLS', 'DERIVED_FROM', 'COMMENTARY_ON', 'TRANSLATION_OF', 'ATTRIBUTED_TO', 'COMPOSED_BY', 'EDITED_BY', 'REFERS_TO_TEXT', 'WITNESS_OF'] },
  { key: 'theology', title: 'Theological identifications', preds: ['AVATARA_OF', 'FORM_OF', 'IDENTIFIED_WITH', 'CENTRAL_TO', 'VAHANA_OF'] },
  { key: 'social', title: 'Teachers, allies & adversaries', preds: ['TEACHER_OF', 'ALLY_OF', 'ADVERSARY_OF', 'DEVOTEE_OF', 'SERVES', 'SLAYS', 'CURSES', 'BLESSES'] },
  { key: 'narratives', title: 'Narratives & sequence', preds: ['PARTICIPANT_IN', 'OCCURS_AT', 'PRECEDES'] },
  { key: 'material', title: 'Temples, places & material evidence', preds: ['LOCATED_AT', 'ASSOCIATED_WITH', 'WORSHIPPED_AT', 'DEPICTED_IN', 'FOUND_AT', 'HELD_AT', 'INSCRIBED_AT', 'COMMISSIONED_BY', 'BUILT_DURING', 'REFERS_TO', 'INTERPRETED_AS', 'DOCUMENTED_BY', 'RULED_BY'] },
  { key: 'kin', title: 'Kinship & lineage (all assertions)', preds: ['PARENT_OF', 'SPOUSE_OF', 'SIBLING_OF', 'ADOPTIVE_PARENT_OF', 'MEMBER_OF', 'DESCENDANT_OF'] },
  { key: 'argument', title: 'Evidence for and against', preds: ['SUPPORTS', 'CONTRADICTS', 'CONCERNS'] },
]

function RelRow({ r, self }: { r: Rel; self: GNode }) {
  const store = useStore()
  const [open, setOpen] = useState(false)
  const e = r.edge
  const pred = store.meta.predicates[e.p] ?? e.p
  const loc = e.sources.find((s) => s.locator)?.locator
  const textQ = e.qualifiers?.text ? store.byId.get(e.qualifiers.text) : undefined
  const tradQ = e.qualifiers?.tradition ? store.byId.get(e.qualifiers.tradition)?.name ?? e.qualifiers.tradition : undefined
  return (
    <li className="py-2.5 border-b hairline last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[14.5px]">
        {r.dir === 'out' ? (
          <><span className="text-ink-3">{self.name.replace(/\s*\((.*)\)$/, '')}</span><span className="text-ink-2">{pred}</span><EntityLink id={r.other.id} className="font-medium" /></>
        ) : (
          <><EntityLink id={r.other.id} className="font-medium" /><span className="text-ink-2">{pred}</span><span className="text-ink-3">{self.name.replace(/\s*\((.*)\)$/, '')}</span></>
        )}
        {e.qualifiers?.role ? <span className="text-[12px] text-ink-3">({e.qualifiers.role})</span> : null}
        {loc ? <span className="font-mono text-[12px] text-ink">{loc}</span> : null}
        <span className="ml-auto flex items-center gap-2">
          <EvidenceBadge cls={e.evidenceClass} />
          <button className="text-[12px] link" onClick={() => setOpen((o) => !o)} aria-expanded={open}>{open ? 'Hide' : 'Evidence'}</button>
        </span>
      </div>
      {textQ || tradQ || e.qualifiers?.note ? (
        <div className="text-[12px] text-ink-3 mt-0.5">
          {textQ ? <>according to <a className="link" href={entityHref(textQ.id)}>{textQ.name}</a>{tradQ ? ' · ' : ''}</> : null}
          {tradQ ? <>within {tradQ}</> : null}
          {e.qualifiers?.note ? <> · {e.qualifiers.note}</> : null}
        </div>
      ) : null}
      {open ? (
        <div className="mt-2 ml-1 pl-3 border-l-2 space-y-2 fade-in" style={{ borderColor: 'var(--rule-2)' }}>
          <div className="flex flex-wrap items-center gap-3"><StatusBadge status={e.status} /><ConfidenceDots c={e.confidence} /><span className="text-[11px] text-ink-3">{EVIDENCE[e.evidenceClass]?.label}</span></div>
          {e.rationale ? <p className="text-[13px] text-ink-2">{e.rationale}</p> : null}
          {e.competing ? <p className="text-[13px] text-ink-2"><b className="text-ink">Competing views: </b>{e.competing}</p> : null}
          <SourceList refs={e.sources} />
          <div className="text-[11px] text-ink-3">Assertion {e.id} · {store.meta.agents[e.agent] ?? e.agent}</div>
        </div>
      ) : null}
    </li>
  )
}

function RelList({ rels, self, max = 12 }: { rels: Rel[]; self: GNode; max?: number }) {
  const [all, setAll] = useState(false)
  const list = all ? rels : rels.slice(0, max)
  return (
    <>
      <ul>{list.map((r) => <RelRow key={r.edge.id + r.dir} r={r} self={self} />)}</ul>
      {rels.length > max && !all ? <button className="btn mt-3" onClick={() => setAll(true)}>Show all {rels.length}</button> : null}
    </>
  )
}

export function EntityPage({ id }: { id: string }) {
  const store = useStore()
  const n = store.byId.get(id)
  const rels = useMemo(() => (n ? store.neighbours(n.id) : []), [n, store])
  const attest = useMemo(() => (n ? gatherAttestations(store, n.id, true) : []), [n, store])
  if (!n) return <div className="max-w-3xl mx-auto px-4 py-24"><Empty title="No such record">The id <code>{id}</code> is not in the graph. It may not have been researched yet.</Empty></div>

  const textual = rels.filter((r) => TEXTUAL.has(r.edge.p) && r.dir === 'out')
  const contents = rels.filter((r) => TEXTUAL.has(r.edge.p) && r.dir === 'in')
  const passages = rels.filter((r) => r.edge.p === 'PART_OF' && r.dir === 'in')
  const comparisons = store.comparisonsFor(n.id)
  const claims = rels.filter((r) => r.other.type === 'claim')
  const isFigure = ['character', 'deity'].includes(n.type)
  const kin = isFigure ? kinOf(store, n.id) : null
  const hasKin = kin && kin.parents.length + kin.children.length + kin.spouses.length + kin.siblings.length > 0

  // places to map: itself, or connected places/temples/sites/artifacts with coordinates
  const mapPts: MapPoint[] = []
  const pushPt = (x: GNode, sub?: string) => { if (x.location && !mapPts.some((p) => p.id === x.id)) mapPts.push({ id: x.id, lat: x.location.lat, lon: x.location.lon, label: x.name, family: x.family, sub }) }
  if (n.location) pushPt(n, n.location.label)
  for (const r of rels) if (r.other.location) pushPt(r.other, store.meta.predicates[r.edge.p])

  // group appearances by text
  const byText = new Map<string, Rel[]>()
  for (const r of textual) { const t = store.textOf(r.other.id) ?? r.other; (byText.get(t.id) ?? byText.set(t.id, []).get(t.id)!).push(r) }
  const textRows = [...byText.entries()].sort((a, b) => (store.dateOf(a[0])?.start ?? 9999) - (store.dateOf(b[0])?.start ?? 9999))

  const sections: { id: string; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    ...(n.dates?.length ? [{ id: 'dates', label: 'Dating' }] : []),
    ...(textRows.length ? [{ id: 'texts', label: 'Across texts' }] : []),
    ...(contents.length || passages.length ? [{ id: 'contents', label: 'In this text' }] : []),
    ...(attest.length ? [{ id: 'time', label: 'Attestations in time' }] : []),
    ...(hasKin ? [{ id: 'genealogy', label: 'Genealogy' }] : []),
    { id: 'network', label: 'Network' },
    ...(comparisons.length ? [{ id: 'versions', label: 'Versions compared' }] : []),
    ...(mapPts.length ? [{ id: 'places', label: 'Places' }] : []),
    { id: 'relations', label: 'All relationships' },
    ...(claims.length || n.openQuestions?.length || n.limits ? [{ id: 'debates', label: 'Debates & limits' }] : []),
    { id: 'sources', label: 'Sources' },
  ]

  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-8 pb-16 grid lg:grid-cols-[180px_1fr] gap-10">
      <nav className="hidden lg:block sticky top-20 self-start text-[13px]" aria-label="On this page">
        <div className="eyebrow mb-2">On this page</div>
        <ul className="space-y-1.5">{sections.map((s) => <li key={s.id}><a className="text-ink-2 hover:text-gold" href={`#/entity/${encodeURIComponent(n.id)}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }) }}>{s.label}</a></li>)}</ul>
      </nav>
      <article className="min-w-0">
        <header id="overview" className="pb-8 scroll-mt-24">
          <div className="flex flex-wrap items-center gap-2"><TypeTag n={n} />{(n.roles ?? []).map((r) => <span key={r} className="chip">{r}</span>)}<StatusBadge status={n.status} /><ConfidenceDots c={n.confidence} /></div>
          <div className="mt-4 grid gap-6 md:grid-cols-[1fr_auto] items-start">
            <div>
              <h1 className="display text-[2.8rem] sm:text-[3.4rem] leading-[1.02] font-semibold">{n.name}</h1>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-ink-2">
                {n.iast && n.iast !== n.name ? <span className="italic text-lg">{n.iast}</span> : null}
                {n.devanagari ? <span className="deva text-2xl">{n.devanagari}</span> : null}
                {(n.scripts ?? []).map((s) => <span key={s.text} className="text-xl" lang={s.lang}>{s.text}</span>)}
              </div>
              {n.aliases?.length ? <div className="mt-2 text-sm text-ink-3">Also: {n.aliases.join(' · ')}</div> : null}
              <p className="mt-5 text-[17px] leading-relaxed text-ink max-w-3xl">{n.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a className="btn" href={href('graph', { focus: n.id })}><Network size={14} /> Explore in the graph</a>
                {mapPts.length ? <a className="btn" href={href('atlas', { focus: n.location ? n.id : mapPts[0].id })}><MapPin size={14} /> Show on the atlas</a> : null}
                <a className="btn" href={href('time', { mode: isFigure || n.type === 'narrative' ? 'figure' : n.type === 'text' || n.type === 'collection' ? 'literature' : 'material', subject: n.id })}><Clock size={14} /> Travel through time</a>
              </div>
            </div>
            {n.image ? (
              <figure className="md:w-[300px]">
                <img src={n.image.url} alt={n.name} loading="lazy" className="w-full rounded-xl border hairline object-cover max-h-[320px]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <figcaption className="text-[11px] text-ink-3 mt-1.5 leading-snug">{n.image.credit} · {n.image.license} · <a className="link" href={n.image.page} target="_blank" rel="noreferrer">source</a></figcaption>
              </figure>
            ) : null}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {n.m.earliestText ? <Fact label="Earliest dated text attesting it (in graph)" value={n.m.earliestText.label} sub={store.byId.get(n.m.earliestText.via)?.name} subId={n.m.earliestText.via} /> : null}
            {n.m.earliestMaterial ? <Fact label="Earliest dated object or structure" value={n.m.earliestMaterial.label} sub={store.byId.get(n.m.earliestMaterial.via)?.name} subId={n.m.earliestMaterial.via} /> : null}
            {n.location ? <Fact label="Location" value={n.location.label} sub={`${n.location.lat.toFixed(3)}, ${n.location.lon.toFixed(3)} · ${n.location.precision}`} /> : null}
            {n.evidenceClass ? <Fact label="Kind of evidence this item is" value={EVIDENCE[n.evidenceClass].label} /> : null}
            <Fact label="Connections" value={`${n.m.degree}`} sub={n.m.texts ? `in ${n.m.texts} text${n.m.texts > 1 ? 's' : ''} across ${n.m.corpora.length} corpus${n.m.corpora.length === 1 ? '' : 'es'}` : undefined} />
          </div>
          {n.traditions?.length ? <div className="mt-4 text-sm text-ink-2">Traditions: {n.traditions.map((t, i) => <span key={t}>{i ? ', ' : ''}<EntityLink id={t} /></span>)}</div> : null}
          {n.limits ? <div className="mt-5"><Note><b>What this does and does not establish. </b>{n.limits}</Note></div> : null}
          {n.details ? <div className="prose-museum mt-6 max-w-3xl text-[15.5px]">{n.details.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}</div> : null}
          {n.attributes && Object.keys(n.attributes).length ? (
            <dl className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-2 max-w-3xl">
              {Object.entries(n.attributes).map(([k, v]) => (
                <div key={k} className="border-b hairline py-1.5"><dt className="eyebrow">{k.replace(/([A-Z])/g, ' $1')}</dt><dd className="text-sm text-ink mt-0.5">{Array.isArray(v) ? v.join(' · ') : v}</dd></div>
              ))}
            </dl>
          ) : null}
        </header>

        {n.dates?.length ? (
          <Section id="dates" kicker="Chronology" title="How it is dated" aside={<span className="text-xs text-ink-3 max-w-xs">Each date belongs to one chronological system. Competing views are listed separately, not averaged.</span>}>
            <div className="card px-5 py-2">{[...n.dates].sort((a, b) => (a.system === 'traditional' ? 1 : 0) - (b.system === 'traditional' ? 1 : 0) || (a.start ?? 0) - (b.start ?? 0)).map((d, i) => <DateRow key={i} d={d} />)}</div>
          </Section>
        ) : null}

        {textRows.length ? (
          <Section id="texts" kicker="Appearance across texts" title={`Attested in ${textRows.length} text${textRows.length > 1 ? 's' : ''}`}>
            <div className="space-y-3">
              {textRows.map(([tid, rs]) => {
                const t = store.byId.get(tid)!
                const d = store.dateOf(tid)
                return (
                  <div key={tid} className="card p-4">
                    <div className="flex flex-wrap items-baseline gap-x-3"><EntityLink id={tid} className="display text-xl font-semibold" />{d ? <span className="text-xs text-ink-3">{d.label}{d.view ? ` (${d.view})` : ''}</span> : null}<span className="text-xs text-ink-3">{TYPE_LABEL[t.type]}</span></div>
                    <ul className="mt-2">{rs.map((r) => <RelRow key={r.edge.id} r={r} self={n} />)}</ul>
                  </div>
                )
              })}
            </div>
          </Section>
        ) : null}

        {contents.length || passages.length ? (
          <Section id="contents" kicker="Contents" title="What this text contains">
            {passages.length ? (
              <div className="mb-6">
                <div className="eyebrow mb-2">Parts & passages ({passages.length})</div>
                <div className="flex flex-wrap gap-1.5">{passages.sort((a, b) => a.other.name.localeCompare(b.other.name, undefined, { numeric: true })).map((r) => <a key={r.other.id} href={entityHref(r.other.id)} className="chip hover:border-gold"><Glyph family={r.other.family} size={9} />{r.other.name}</a>)}</div>
              </div>
            ) : null}
            {['character', 'deity', 'narrative', 'concept', 'place'].map((ty) => {
              const xs = contents.filter((r) => r.other.type === ty)
              if (!xs.length) return null
              return (
                <div key={ty} className="mb-5">
                  <div className="eyebrow mb-1">{TYPE_LABEL[ty]}s ({xs.length})</div>
                  <RelList rels={xs} self={n} max={10} />
                </div>
              )
            })}
          </Section>
        ) : null}

        {attest.length ? (
          <Section id="time" kicker="Temporal attestations" title="When the record shows it" aside={<a className="btn" href={href('time', { mode: n.type === 'text' ? 'literature' : 'figure', subject: n.id })}><Clock size={14} /> Open in the Time Machine</a>}>
            <AttestationChart id={n.id} />
            <p className="text-[12.5px] text-ink-3 mt-3 max-w-3xl">The gap between an estimated textual date and the earliest surviving object is not evidence that a tradition did not exist earlier: oral transmission, perishable media and the accidents of survival all intervene. Items reached through an identification (e.g. Vāsudeva for Kṛṣṇa) are included and labelled.</p>
          </Section>
        ) : null}

        {hasKin ? (
          <Section id="genealogy" kicker="Genealogy" title="Family and lineage">
            <FamilyTree id={n.id} />
          </Section>
        ) : null}

        <Section id="network" kicker="Interactive relationship network" title="Its neighbourhood in the graph">
          <Suspense fallback={<div className="h-[420px] rounded-xl bg-night" />}><EgoGraph id={n.id} /></Suspense>
          <p className="text-[12px] text-ink-3 mt-2">Gold lines connect directly to this record; dashed lines are traditional associations or disputed claims. Click a node to open it.</p>
        </Section>

        {comparisons.length ? (
          <Section id="versions" kicker="Different versions and interpretations" title="How the sources differ">
            <div className="space-y-5">{comparisons.map((c) => <ComparisonTable key={c.id} c={c} />)}</div>
          </Section>
        ) : null}

        {mapPts.length ? (
          <Section id="places" kicker="Geography" title="Associated places, temples and findspots">
            <MapView points={mapPts} height={420} fitTo={mapPts.length > 1 ? 'points' : 'points'} showLabels="all" label={`Places connected to ${n.name}`} onSelect={(pid) => { if (pid && pid !== n.id) window.location.hash = entityHref(pid) }} selected={n.location ? n.id : null} />
            <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 text-sm">{mapPts.map((p) => <li key={p.id} className="py-1 border-b hairline flex items-center gap-2"><Glyph family={p.family} size={10} /><a className="link" href={entityHref(p.id)}>{p.label}</a><span className="text-ink-3 text-xs ml-auto">{p.sub}</span></li>)}</ul>
          </Section>
        ) : null}

        <Section id="relations" kicker="Direct textual references and every other connection" title={`All ${rels.length} relationships`}>
          {GROUPS.map((g) => {
            const xs = rels.filter((r) => g.preds.includes(r.edge.p))
            if (!xs.length) return null
            return (
              <div key={g.key} className="mb-7">
                <h3 className="display text-xl font-semibold mb-1">{g.title} <span className="text-ink-3 text-base">({xs.length})</span></h3>
                <RelList rels={xs} self={n} />
              </div>
            )
          })}
          {!rels.length ? <Empty title="No connections yet">This record exists in the registry but has not yet been connected by research.</Empty> : null}
        </Section>

        {claims.length || n.openQuestions?.length || n.limits ? (
          <Section id="debates" kicker="Open scholarly debates" title="What is contested or unknown">
            {claims.length ? (
              <div className="grid gap-3 md:grid-cols-2 mb-5">
                {claims.map((r) => (
                  <a key={r.edge.id} href={entityHref(r.other.id)} className="card p-4 hover:border-gold">
                    <div className="flex items-center gap-2 text-xs text-ink-3"><AlertTriangle size={13} style={{ color: 'var(--ev-7)' }} />Debated claim · {store.meta.predicates[r.edge.p]}</div>
                    <div className="display text-lg font-semibold mt-1">{r.other.name}</div>
                    <p className="text-[13px] text-ink-2 mt-1 line-clamp-3">{r.other.summary}</p>
                  </a>
                ))}
              </div>
            ) : null}
            {n.openQuestions?.length ? (
              <div><div className="eyebrow mb-2">Open questions</div><ul className="list-disc pl-5 space-y-1 text-[14.5px] text-ink-2">{n.openQuestions.map((q) => <li key={q}>{q}</li>)}</ul></div>
            ) : null}
          </Section>
        ) : null}

        <Section id="sources" kicker="Bibliography for this record" title="Sources">
          <SourceList refs={n.sources} max={20} />
          <Disclosure summary={<span>Sources cited by its {rels.length} connections</span>}>
            <SourceList refs={[...new Map(rels.flatMap((r) => r.edge.sources).map((s) => [`${s.source}|${s.locator ?? ''}`, s])).values()]} max={40} />
          </Disclosure>
          <div className="text-[11px] text-ink-3 mt-4">Record <code>{n.id}</code> · researched by {store.meta.agents[n.agent] ?? n.agent}{n.lastVerified ? ` · last verified ${n.lastVerified}` : ''} · <a className="link inline-flex items-center gap-1" href={href('sources', { tab: 'method' })}>how records are verified <ExternalLink size={10} /></a></div>
        </Section>
      </article>
    </div>
  )
}

function Fact({ label, value, sub, subId }: { label: string; value: string; sub?: string; subId?: string }) {
  return (
    <div className="card p-3.5">
      <div className="eyebrow">{label}</div>
      <div className="display text-xl font-semibold mt-1 leading-snug">{value}</div>
      {sub ? <div className="text-xs text-ink-3 mt-0.5">{subId ? <a className="link" href={entityHref(subId)}>{sub}</a> : sub}</div> : null}
    </div>
  )
}
