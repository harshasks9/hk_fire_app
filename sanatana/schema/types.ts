/**
 * SANATANA knowledge-graph schema — the single contract every research agent,
 * script and UI component shares.
 *
 * Three principles are encoded in the types rather than left to convention:
 *
 *  1. Every edge is an *assertion* with provenance. There is no such thing as a
 *     bare relationship: an edge carries its evidence class, its sources (with
 *     exact locators), a confidence level, and a verification status.
 *  2. Identity, appearance, interpretation and theological equivalence are
 *     different predicates. "Krishna is an avatāra of Vishnu" is an AVATARA_OF
 *     assertion qualified by tradition and source — never a merge of two nodes.
 *  3. Time is plural. A date belongs to one of four chronological systems
 *     (scholarly-textual, material, reception, traditional) and those systems are
 *     never drawn on the same axis without being labelled.
 */

// ───────────────────────────── node types ─────────────────────────────

export const NODE_TYPES = [
  'collection', // a body of literature: Vedic Saṃhitās, Itihāsa, Mahāpurāṇas …
  'text', // an individual work, recension or retelling: Rigveda, Kamba Rāmāyaṇam …
  'passage', // an addressable unit of a text: maṇḍala/sūkta, kāṇḍa/sarga, parvan/adhyāya
  'character', // a narrative figure: Rāma, Draupadī, Hanumān, Nachiketas, Rāvaṇa
  'deity', // a deity as worshipped/theologised: Vishnu, Shiva, Devī, Indra, Agni
  'concept', // a theological/philosophical concept: Brahman, Ātman, Ṛta, Yuga
  'narrative', // an event or story: Samudra Manthana, Kurukshetra War
  'lineage', // a mythic/genealogical lineage: Sūryavaṃśa, Candravaṃśa, Yādavas
  'place', // narrative or sacred geography: Ayodhyā, Kurukṣetra, Kāśī, Laṅkā
  'temple', // a temple or shrine complex (a built, worshipped place)
  'site', // an archaeological site or excavation
  'artifact', // sculpture, relief, coin, seal, painting, bronze
  'inscription', // a published epigraphic record
  'manuscript', // an individually catalogued textual witness
  'person', // a historical figure: author, patron, ruler, commentator, scholar
  'polity', // a historical dynasty or state: Gupta, Pallava, Cōḻa, Khmer
  'institution', // a museum, archive, library or research body holding/editing material
  'tradition', // a religious tradition or school: Śaiva Siddhānta, Pāñcarātra, Śrīvaiṣṇava
  'claim', // a scholarly or popular assertion treated as a first-class, debatable object
] as const
export type NodeType = (typeof NODE_TYPES)[number]

// ───────────────────────────── predicates ─────────────────────────────

/**
 * Controlled predicate vocabulary. Direction is always subject → object and the
 * sentence "<subject> <PREDICATE> <object>" should read correctly in English.
 */
export const PREDICATES = {
  // structure of literature
  PART_OF: 'is part of', // text→collection, passage→text, text→text (Gita→Mahabharata)
  RECENSION_OF: 'is a recension/version of',
  RETELLS: 'retells', // Kamba Ramayanam RETELLS Valmiki Ramayana (literary derivation)
  DERIVED_FROM: 'draws on / is derived from', // looser textual dependence
  COMMENTARY_ON: 'is a commentary on',
  TRANSLATION_OF: 'is a translation of',
  WITNESS_OF: 'is a textual witness of', // manuscript→text
  ATTRIBUTED_TO: 'is traditionally attributed to', // text→person/character (authorship as tradition states)
  COMPOSED_BY: 'was composed by (historically)', // only where historically secure (e.g. Tulsidas)
  EDITED_BY: 'was critically edited by', // text→institution/person
  REFERS_TO_TEXT: 'refers to the text', // a dated source naming a work (external attestation)

  // appearance in literature
  APPEARS_IN: 'appears in', // character/deity → text or passage (qualifier.role: hymn-addressee, protagonist …)
  MENTIONED_IN: 'is mentioned in', // a passing reference
  NARRATED_IN: 'is narrated in', // narrative → text/passage
  TEACHES_IN: 'teaches/speaks in', // character → text (Krishna TEACHES_IN Gita)

  // kinship and lineage (tradition-qualified where sources disagree)
  PARENT_OF: 'is parent of',
  SPOUSE_OF: 'is spouse of',
  SIBLING_OF: 'is sibling of',
  ADOPTIVE_PARENT_OF: 'is adoptive/foster parent of',
  MEMBER_OF: 'belongs to', // character→lineage, person→polity, temple→tradition is NOT this
  DESCENDANT_OF: 'is a descendant of',

  // social and narrative relations
  TEACHER_OF: 'is teacher of',
  ALLY_OF: 'is ally of',
  ADVERSARY_OF: 'is adversary of',
  DEVOTEE_OF: 'is a devotee of',
  SERVES: 'serves',
  SLAYS: 'slays',
  CURSES: 'curses',
  BLESSES: 'grants a boon to / blesses',
  PARTICIPANT_IN: 'takes part in', // character/deity → narrative
  OCCURS_AT: 'takes place at', // narrative → place
  PRECEDES: 'precedes (in narrative order)',

  // theology — always tradition-qualified, never an identity merge
  AVATARA_OF: 'is regarded as an avatāra of',
  FORM_OF: 'is regarded as a form/aspect of',
  IDENTIFIED_WITH: 'is identified with (by a tradition or scholar)',
  CENTRAL_TO: 'is central to', // deity/text → tradition
  VAHANA_OF: 'is the vāhana (mount) of',

  // geography and material evidence
  LOCATED_AT: 'is located at', // temple/artifact/site → place
  ASSOCIATED_WITH: 'is traditionally associated with', // place/temple ↔ narrative/character
  WORSHIPPED_AT: 'is worshipped at', // deity/character → temple
  DEPICTED_IN: 'is depicted in', // character/deity/narrative → artifact/temple
  FOUND_AT: 'was found at', // artifact/inscription/manuscript → site/place
  HELD_AT: 'is held at', // artifact/manuscript → institution
  INSCRIBED_AT: 'is inscribed at/on', // inscription → temple/artifact/site
  COMMISSIONED_BY: 'was commissioned/patronised by', // temple/artifact/inscription → person/polity
  BUILT_DURING: 'was built during the rule of', // temple → polity
  RULED_BY: 'was ruled by', // polity ↔ person (person MEMBER_OF polity preferred)
  REFERS_TO: 'refers to / invokes', // inscription/coin → deity/character
  DOCUMENTED_BY: 'was excavated/documented by', // site/artifact → person/institution

  // scholarly argument
  INTERPRETED_AS: 'is interpreted (by some) as', // artifact → deity/character, with competing views
  SUPPORTS: 'supports', // evidence → claim
  CONTRADICTS: 'contradicts / weighs against', // evidence → claim, or text ↔ text on a point
  CONCERNS: 'concerns', // claim → entity it is about
} as const
export type Predicate = keyof typeof PREDICATES

// ───────────────────────────── evidence ─────────────────────────────

/**
 * Evidence classes describe the *nature* of the evidence for an assertion, not
 * the spiritual value of a tradition.
 */
export const EVIDENCE_CLASSES = {
  1: 'Direct textual attestation', // an identifiable passage in a specified text/edition
  2: 'Manuscript evidence', // a catalogued manuscript with repository and dating assessment
  3: 'Epigraphic evidence', // a published inscription with reading, date and provenance
  4: 'Archaeological / material evidence', // a documented, dated object or context
  5: 'Scholarly interpretation', // a reasoned conclusion in identifiable academic research
  6: 'Religious or local tradition', // preserved in practice, oral history, sthala-purāṇa
  7: 'Disputed or speculative', // no consensus or insufficient evidence
} as const
export type EvidenceClass = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type Confidence = 'high' | 'medium' | 'low'

/**
 * How far the record has been checked.
 *  verified-online  — the locator/fact was checked against an accessible primary or
 *                     authoritative online source during research (URL recorded)
 *  source-checked   — checked against a named scholarly source, not online
 *  recall           — supplied from expert recall; plausible, awaiting a check
 *  unresolved       — could not be verified; shown with a warning
 *  disputed         — the fact itself is contested; competing views recorded
 */
export type VerificationStatus = 'verified-online' | 'source-checked' | 'recall' | 'unresolved' | 'disputed'

export interface SourceRef {
  /** id in the source registry (data/sources/*.json) */
  source: string
  /** exact locator: "RV 1.154.1–6", "MBh (CE) 6.23–40", "Catalogue no. 1984.488", "p. 112" */
  locator?: string
  /** edition or version if it matters: "BORI Critical Edition", "Vulgate", "Gita Press" */
  edition?: string
  /** a short quotation (public-domain translation or original) — never invented */
  quote?: string
  /** deep link if more specific than the source's own url */
  url?: string
}

// ───────────────────────────── time ─────────────────────────────

export type ChronologySystem =
  | 'scholarly-textual' // estimated composition / compilation / redaction of texts
  | 'material' // dated objects, inscriptions, structures, manuscripts
  | 'reception' // when a tradition / motif / form of worship appears in a region
  | 'traditional' // chronology as stated within the tradition (yugas, genealogies)

export interface DateClaim {
  system: ChronologySystem
  /** what is being dated: composition, compilation, earliest-manuscript, construction,
   *  surviving-structure, consecration, reign, floruit, excavation-layer, minting … */
  event: string
  /** Years in the common era; BCE is negative (500 BCE = -500). For 'traditional'
   *  dates use the tradition's own reckoning converted to years only where the
   *  tradition itself gives a CE equivalent (e.g. Kali-yuga epoch 3102 BCE); otherwise
   *  leave start/end undefined and use `label`. */
  start?: number
  end?: number
  /** human label exactly as it should display: "c. 1500–1200 BCE", "1010 CE" */
  label: string
  certainty: 'secure' | 'estimated' | 'disputed'
  /** how the date was established: "dated inscription", "radiocarbon", "linguistic & internal evidence", "palaeography", "regnal synchronism" */
  basis: string
  /** whose view, if one among several: "Witzel", "Olivelle", "Hazra", "traditional" */
  view?: string
  sources: SourceRef[]
}

// ───────────────────────────── entities ─────────────────────────────

export interface GeoLocation {
  lat: number
  lon: number
  precision: 'exact' | 'approximate' | 'region'
  /** present-day location label: "Thanjavur, Tamil Nadu, India" */
  label: string
  country: string
}

export interface ImageRef {
  /** direct image URL (Wikimedia Commons upload.wikimedia.org preferred) */
  url: string
  /** the Commons (or museum) file page where licence was checked */
  page: string
  credit: string
  license: string
}

export interface Entity {
  id: string // type-prefixed slug, e.g. "char:krishna", "text:rigveda", "temple:brihadisvara"
  type: NodeType
  name: string // canonical display name (common English transliteration)
  iast?: string // scholarly transliteration (IAST)
  devanagari?: string // Devanāgarī form where meaningful
  /** other scripts: { lang: 'ta', script: 'Taml', text: 'கம்பராமாயணம்' } */
  scripts?: { lang: string; script: string; text: string }[]
  aliases?: string[] // regional names, titles, alternate spellings
  subtype?: string // 'Upaniṣad', 'Mahāpurāṇa', 'sculpture', 'coin', 'rock-cut cave temple' …
  traditions?: string[] // tradition entity ids
  roles?: string[] // for figures: 'deity', 'avatāra', 'ṛṣi', 'king', 'asura', 'vānara', 'devotee'
  summary: string // 1–3 neutral sentences: what this is and why it matters
  details?: string // longer neutral description (plain text, paragraphs separated by \n\n)
  dates?: DateClaim[]
  location?: GeoLocation
  /** free attributes: iconography, architecture, repository, accession, material, dimensions, language, script, author … */
  attributes?: Record<string, string | string[]>
  /** for material/textual evidence items: the nature of the evidence the item itself provides */
  evidenceClass?: EvidenceClass
  image?: ImageRef
  sources: SourceRef[]
  confidence: Confidence
  status: VerificationStatus
  agent: string
  /** what the evidence does *not* establish — e.g. "establishes worship of Vāsudeva by 2nd c. BCE, not the historicity of the epic" */
  limits?: string
  openQuestions?: string[]
  lastVerified?: string // ISO date
}

/** Identity-only record in the core registry; the owning agent supplies the full entity. */
export interface CoreIdentity {
  id: string
  type: NodeType
  name: string
  iast?: string
  devanagari?: string
  aliases?: string[]
  owner: AgentId
}

// ───────────────────────────── assertions (edges) ─────────────────────────────

export interface Assertion {
  id: string // "<agent>:<n>" unique within the dataset
  s: string // subject entity id
  p: Predicate
  o: string // object entity id
  qualifiers?: {
    tradition?: string // tradition entity id or free label: the assertion holds *within* this tradition
    text?: string // text entity id: the assertion holds *according to* this text
    role?: string // e.g. 'hymn-addressee', 'protagonist', 'narrator', 'antagonist'
    note?: string
  }
  evidenceClass: EvidenceClass
  sources: SourceRef[] // ≥1 required
  confidence: Confidence
  status: VerificationStatus
  rationale?: string // why this confidence
  competing?: string // competing interpretations, if any
  agent: AgentId
  lastVerified?: string
}

// ───────────────────────────── sources ─────────────────────────────

export type SourceType =
  | 'primary-text' // a critical edition or primary text (incl. online e-text of an edition)
  | 'translation'
  | 'scholarly-book'
  | 'journal-article'
  | 'catalogue' // museum/archive catalogue entry
  | 'epigraphic-corpus' // Epigraphia Indica, CII, Sircar …
  | 'excavation-report'
  | 'institutional' // UNESCO, ASI, government heritage portal
  | 'reference' // encyclopaedia (Wikipedia, Britannica) — starting point only, never sole support for a contested claim
  | 'tradition' // temple website, sthala-purāṇa publication — evidence of tradition only

export interface Source {
  id: string // "src:jamison-brereton-2014"
  type: SourceType
  title: string
  author?: string
  year?: string
  publisher?: string
  url?: string
  /** whether the URL was reachable and checked during research */
  urlChecked?: boolean
  license?: string // for e-texts / translations: 'public domain', 'CC BY-SA' …
  notes?: string
  agent: AgentId
}

// ───────────────────────────── comparisons ─────────────────────────────

/**
 * A comparison table shows exactly what each source states on a single point —
 * without reconciling them.
 */
export interface Comparison {
  id: string // "cmp:rama-sita-abduction-ravana-touch"
  title: string
  subject: string // entity id the comparison is about (character or narrative)
  question: string // the point being compared
  rows: {
    text: string // text entity id
    locator?: string
    statement: string // what this text says on the point, neutrally paraphrased
    sources: SourceRef[]
    status: VerificationStatus
  }[]
  note?: string
  agent: AgentId
}

// ───────────────────────────── discoveries ─────────────────────────────

export interface Discovery {
  id: string
  title: string // a finding, stated as a finding
  kicker: string // short category label
  body: string // 2–4 short paragraphs (\n\n separated)
  entities: string[] // entity ids the finding links to
  assertions?: string[] // assertion ids that substantiate it
  sources: SourceRef[]
  confidence: Confidence
  caveat: string // what the finding does NOT show
}

// ───────────────────────────── traditional chronology ─────────────────────────────

export interface SacredEra {
  id: string
  name: string
  iast?: string
  kind: 'kalpa' | 'manvantara' | 'mahayuga' | 'yuga' | 'narrative-sequence'
  /** duration in human years as computed in the cited system, if the system gives one */
  humanYears?: number
  /** duration in divine years where the source states it so */
  divineYears?: number
  order: number
  description: string
  narratives?: string[] // narrative / character ids the tradition places in this era
  sources: SourceRef[]
  note?: string
}

// ───────────────────────────── agents ─────────────────────────────

export const AGENTS = {
  orchestrator: 'Chief Historian & Research Orchestrator',
  vedic: 'Vedic Literature Researcher',
  epic: 'Itihāsa & Epic Literature Researcher',
  purana: 'Purāṇic Literature Researcher',
  regional: 'Regional Traditions & Living Heritage Researcher',
  material: 'Archaeology, Inscriptions & Material Evidence Researcher',
  temple: 'Temple & Sacred Geography Researcher',
  verifier: 'Independent Verification & Editorial Review',
} as const
export type AgentId = keyof typeof AGENTS
