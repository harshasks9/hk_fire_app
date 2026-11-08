import { ArrowRight, Network, Clock, Users, Landmark, BookOpen, Sparkles, Search } from 'lucide-react'
import { useStore } from '../data/store.tsx'
import { Constellation } from '../components/Constellation.tsx'
import { href, entityHref } from '../app/router.ts'
import { Glyph, Note } from '../components/ui.tsx'
import { FAMILIES } from '../lib/meta.ts'

const JOURNEYS = [
  { title: 'From the Rāmāyaṇa to archaeology', steps: 'Rāmāyaṇa → Hanumān → dated depictions → timeline', to: entityHref('text:valmiki-ramayana') },
  { title: 'The evolution of Śiva', steps: 'Rigvedic Rudra → Śvetāśvatara → Purāṇas → temples & inscriptions', to: href('time', { mode: 'figure', subject: 'deity:shiva' }) },
  { title: 'Kṛṣṇa across the sources', steps: 'Mahābhārata · Harivaṃśa · Bhāgavata — compared passage by passage', to: entityHref('char:krishna') },
  { title: 'Travel through time', steps: 'Pick a century; watch dated temples and objects appear', to: href('time', { mode: 'material' }) },
  { title: 'A temple as the starting point', steps: 'Bṛhadīśvara → Rājarāja I → inscriptions → Naṭarāja', to: entityHref('temple:brihadisvara') },
]

export function Home({ onSearch }: { onSearch: () => void }) {
  const { meta, real, discoveries } = useStore()
  const s = meta.stats
  const counts = [
    { label: 'Texts indexed', value: (s.byType.text ?? 0) + (s.byType.collection ?? 0), hint: 'texts and corpora with full records' },
    { label: 'Characters connected', value: (s.byType.character ?? 0) + (s.byType.deity ?? 0), hint: 'characters and deities' },
    { label: 'Narratives mapped', value: s.byType.narrative ?? 0 },
    { label: 'Temples documented', value: s.byType.temple ?? 0 },
    { label: 'Artifacts catalogued', value: (s.byType.artifact ?? 0) + (s.byType.inscription ?? 0) + (s.byType.manuscript ?? 0), hint: 'artifacts, inscriptions and manuscripts' },
    { label: 'Sourced relationships', value: s.edges, hint: `${s.verifiedEdges} of them verified online or source-checked` },
  ]
  return (
    <div>
      <section className="night relative overflow-hidden bg-night text-night-ink" style={{ minHeight: 'min(88vh, 820px)' }}>
        <Constellation />
        <div className="relative z-10 max-w-[1300px] mx-auto px-4 pt-20 pb-16 pointer-events-none">
          <div className="max-w-xl pointer-events-auto">
            <div className="eyebrow mb-5" style={{ color: 'var(--gold-soft)' }}>An interactive atlas of Hindu literature, narrative & heritage</div>
            <h1 className="display text-[3.1rem] sm:text-[4.2rem] leading-[0.98] font-semibold">5,000 Years of Stories.<br />One Connected Universe.</h1>
            <p className="mt-6 text-[17px] leading-relaxed" style={{ color: 'var(--night-ink-2)' }}>
              Explore sacred texts, legendary characters, historical temples, and the evidence of a civilization’s evolving traditions — across geography and time.
            </p>
            <p className="mt-3 text-[12px] leading-relaxed" style={{ color: 'var(--night-ink-2)', opacity: 0.8 }}>
              The headline is evocative, not a dating claim: every date inside carries its own source, method and uncertainty.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={href('graph')} className="btn btn-primary !bg-[var(--gold-soft)] !border-[var(--gold-soft)] !text-[#12162b]">Explore the Knowledge Graph <ArrowRight size={15} /></a>
              <button onClick={onSearch} className="btn"><Search size={14} /> Search in any script</button>
            </div>
          </div>
          <dl className="pointer-events-auto mt-16 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl">
            {counts.map((c) => (
              <div key={c.label} title={c.hint}>
                <dd className="display text-[2.4rem] font-semibold tabular-nums leading-none">{c.value.toLocaleString()}</dd>
                <dt className="eyebrow mt-2" style={{ color: 'var(--night-ink-2)' }}>{c.label}</dt>
              </div>
            ))}
          </dl>
          <p className="pointer-events-auto mt-4 text-[11px]" style={{ color: 'var(--night-ink-2)' }}>Counts are computed live from the verified dataset ({real.length.toLocaleString()} records, compiled {new Date(s.generated).toLocaleDateString()}). They grow as research expands; coverage is not yet exhaustive.</p>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Network, title: 'Explore the Knowledge Graph', body: 'Start from a corpus and expand outward — texts, narratives, characters, temples, objects. Every edge opens its evidence.', to: href('graph') },
            { icon: Clock, title: 'Travel Through Time', body: 'Five time machines: literature, a figure’s attestations, dated temples & artifacts, the traditional yuga cosmology, and geographic spread.', to: href('time') },
            { icon: Users, title: 'Explore Characters', body: 'Profiles grounded in passages: appearances across texts, genealogy, versions, places and dated representations.', to: href('characters') },
            { icon: Landmark, title: 'Discover Temples & Artifacts', body: 'A geographic atlas of temples, inscriptions, sculptures and manuscripts — each linked back to the graph.', to: href('atlas') },
            { icon: BookOpen, title: 'Explore the Ancient Texts', body: 'From the Rigveda to the Rāmcaritmānas: corpora, scholarly date ranges, manuscripts and retellings.', to: href('texts') },
            { icon: Sparkles, title: 'Research Discoveries', body: `${discoveries.length || 'Curated'} findings that emerge only when texts, objects and places are connected.`, to: href('discoveries') },
          ].map((c) => (
            <a key={c.title} href={c.to} className="card p-6 group hover:border-gold transition-colors">
              <c.icon size={20} className="text-gold" />
              <div className="display text-2xl font-semibold mt-3 group-hover:text-gold transition-colors">{c.title}</div>
              <p className="text-sm text-ink-2 mt-2 leading-relaxed">{c.body}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 pb-8">
        <div className="eyebrow mb-3">Guided journeys</div>
        <div className="grid gap-3 md:grid-cols-5">
          {JOURNEYS.map((j, i) => (
            <a key={j.title} href={j.to} className="card p-4 hover:border-gold transition-colors">
              <div className="text-xs text-ink-3 tabular-nums">Journey {i + 1}</div>
              <div className="display text-lg font-semibold leading-snug mt-1">{j.title}</div>
              <div className="text-xs text-ink-3 mt-2 leading-relaxed">{j.steps}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-4 py-12 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="eyebrow mb-2">How to read this atlas</div>
          <h2 className="display text-4xl font-semibold leading-tight">Tradition, text, scholarship and archaeology — kept distinct, connected openly.</h2>
          <div className="prose-museum mt-4 text-[15px]">
            <p>Each relationship is an <em>assertion</em> with a source and an evidence class: a passage in an edited text, a manuscript, an inscription, a dated object, a scholarly argument, a living tradition — or a claim that remains disputed.</p>
            <p>The atlas will say plainly: <em>this appears in a particular textual tradition; the text’s dating is disputed; this temple has a traditional association with the narrative; the surviving structure is dated to a later period; this artifact establishes a representation, not the occurrence of the narrated event; the evidence is insufficient to decide.</em></p>
          </div>
        </div>
        <div className="card p-5">
          <div className="eyebrow mb-3">The eight families of records</div>
          <ul className="space-y-2.5">
            {FAMILIES.map((f) => (
              <li key={f.id} className="flex items-center gap-3 text-sm">
                <Glyph family={f.id} size={14} />
                <span className="font-medium">{f.label}</span>
                <span className="ml-auto tabular-nums text-ink-3">{(s.byFamily[f.id] ?? 0).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4"><Note>Colour and shape together identify a family everywhere in the atlas, so nothing depends on colour alone.</Note></div>
        </div>
      </section>
    </div>
  )
}
