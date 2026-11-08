/** Labels, colours, shapes and formatting shared by every view. */
import type { DateClaim } from '../../schema/types.ts'
import type { Family, GNode } from '../data/store.tsx'

export const FAMILIES: { id: Family; label: string; types: string[]; shape: string; cssVar: string; dark: string; light: string }[] = [
  { id: 'literature', label: 'Texts & passages', types: ['collection', 'text', 'passage'], shape: 'round-rectangle', cssVar: '--f-literature', dark: '#c98500', light: '#eda100' },
  { id: 'deity', label: 'Deities, concepts & traditions', types: ['deity', 'concept', 'tradition'], shape: 'star', cssVar: '--f-deity', dark: '#d95926', light: '#eb6834' },
  { id: 'figure', label: 'Characters & lineages', types: ['character', 'lineage'], shape: 'ellipse', cssVar: '--f-figure', dark: '#d55181', light: '#e87ba4' },
  { id: 'narrative', label: 'Narratives', types: ['narrative'], shape: 'diamond', cssVar: '--f-narrative', dark: '#9085e9', light: '#6250d6' },
  { id: 'geography', label: 'Places & temples', types: ['place', 'temple'], shape: 'round-triangle', cssVar: '--f-geography', dark: '#199e70', light: '#1baf7a' },
  { id: 'material', label: 'Material evidence', types: ['artifact', 'inscription', 'manuscript', 'site'], shape: 'hexagon', cssVar: '--f-material', dark: '#3987e5', light: '#2a78d6' },
  { id: 'history', label: 'Historical people & polities', types: ['person', 'polity', 'institution'], shape: 'round-pentagon', cssVar: '--f-history', dark: '#008300', light: '#008300' },
  { id: 'claim', label: 'Debated claims', types: ['claim'], shape: 'vee', cssVar: '--f-claim', dark: '#e66767', light: '#e34948' },
]
export const FAMILY_BY_ID = Object.fromEntries(FAMILIES.map((f) => [f.id, f])) as Record<Family, (typeof FAMILIES)[number]>

export const TYPE_LABEL: Record<string, string> = {
  collection: 'Corpus', text: 'Text', passage: 'Passage', character: 'Character', deity: 'Deity', concept: 'Concept',
  narrative: 'Narrative', lineage: 'Lineage', place: 'Place', temple: 'Temple', site: 'Archaeological site',
  artifact: 'Artifact', inscription: 'Inscription', manuscript: 'Manuscript', person: 'Historical person',
  polity: 'Polity / dynasty', institution: 'Institution', tradition: 'Tradition', claim: 'Debated claim',
}

export const EVIDENCE: Record<number, { short: string; label: string; blurb: string }> = {
  1: { short: 'Text', label: 'Direct textual attestation', blurb: 'An identifiable passage in a specified text and edition.' },
  2: { short: 'Manuscript', label: 'Manuscript evidence', blurb: 'A catalogued manuscript with a repository and a dating assessment.' },
  3: { short: 'Inscription', label: 'Epigraphic evidence', blurb: 'A published inscription with its reading, date and provenance.' },
  4: { short: 'Material', label: 'Archaeological / material evidence', blurb: 'A documented, dated object or archaeological context.' },
  5: { short: 'Scholarship', label: 'Scholarly interpretation', blurb: 'A reasoned conclusion in identifiable academic research.' },
  6: { short: 'Tradition', label: 'Religious or local tradition', blurb: 'Preserved in religious practice, oral history, or local tradition (sthala-purāṇa, temple legend).' },
  7: { short: 'Disputed', label: 'Disputed or speculative', blurb: 'A proposed relationship lacking scholarly consensus or sufficient evidence.' },
}

export const STATUS: Record<string, { label: string; blurb: string }> = {
  'verified-online': { label: 'Verified online', blurb: 'Checked during research against an accessible authoritative source (link recorded).' },
  'source-checked': { label: 'Source-checked', blurb: 'Checked against a named scholarly source.' },
  'reference-checked': { label: 'Reference-checked', blurb: 'Checked only against a reference work such as Wikipedia; awaiting a primary or scholarly source.' },
  recall: { label: 'Awaiting check', blurb: 'Supplied from expert recall; plausible but not yet checked against a source.' },
  unresolved: { label: 'Unresolved', blurb: 'Could not be verified. Shown so the gap is visible.' },
  disputed: { label: 'Disputed', blurb: 'The point itself is contested; competing views are recorded.' },
}

export const SYSTEM_LABEL: Record<DateClaim['system'], string> = {
  'scholarly-textual': 'Scholarly textual chronology',
  material: 'Material / archaeological chronology',
  reception: 'Reception & regional development',
  traditional: 'Traditional (sacred) chronology',
}

export function yearLabel(y: number): string {
  if (y < 0) return `${Math.abs(y)} BCE`
  if (y === 0) return '1 BCE'
  return `${y} CE`
}
export function centuryLabel(y: number): string {
  const bce = y < 0
  const c = bce ? Math.floor((Math.abs(y) - 1) / 100) + 1 : Math.floor((y - 1) / 100) + 1
  const sfx = (n: number) => (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th')
  return `${c}${sfx(c)} c. ${bce ? 'BCE' : 'CE'}`
}

export function familyColor(f: Family, dark = false): string {
  const fam = FAMILY_BY_ID[f]
  return dark ? fam.dark : fam.light
}

export function displayName(n: GNode): string {
  return n.name
}

export function earliestYear(n: GNode): number | undefined {
  const ys = (n.dates ?? []).filter((d) => d.system !== 'traditional' && typeof d.start === 'number').map((d) => d.start!)
  return ys.length ? Math.min(...ys) : undefined
}

/** The date that places a record in material time: the earliest material date, preferring
 *  non-disputed claims. Destructions and cult attestations live in the reception system. */
export function materialDate(n: GNode): DateClaim | undefined {
  const ds = (n.dates ?? []).filter((d) => d.system === 'material' && typeof d.start === 'number')
  const firm = ds.filter((d) => d.certainty !== 'disputed')
  return (firm.length ? firm : ds).sort((a, b) => a.start! - b.start!)[0]
}

export const ERAS: { label: string; start: number; end: number }[] = [
  { label: 'Indus (Harappan) period', start: -2600, end: -1900 },
  { label: 'Early Vedic', start: -1500, end: -1000 },
  { label: 'Later Vedic', start: -1000, end: -500 },
  { label: 'Mauryan & post-Mauryan', start: -322, end: 0 },
  { label: 'Kuṣāṇa & Sātavāhana', start: 0, end: 320 },
  { label: 'Gupta', start: 320, end: 550 },
  { label: 'Early medieval', start: 550, end: 1000 },
  { label: 'Cōḻa & regional kingdoms', start: 850, end: 1280 },
  { label: 'Late medieval & Vijayanagara', start: 1280, end: 1650 },
  { label: 'Early modern & colonial', start: 1650, end: 1947 },
  { label: 'Modern', start: 1947, end: 2026 },
]
