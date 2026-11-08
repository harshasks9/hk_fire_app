/**
 * Maps the text abbreviation that opens a passage locator ("MBh (CE) 3.40–41",
 * "BhP 8.7.43", "VR (CE) 1.41–43") to the text it cites. Used to derive textual
 * attestations from class-1 assertions whose evidence *is* a passage — e.g. "Śiva takes
 * part in the Kirāta episode, MBh (CE) 3.40–41" attests Śiva in the Mahābhārata.
 * Attestation is never inferred through a narrative, because versions differ: the
 * churning is narrated in the critical Mahābhārata, but Śiva drinking the poison is not.
 */
const MAP: [RegExp, string][] = [
  [/^MBh\b/, 'text:mahabharata'],
  [/^(VR|Rām)\b/, 'text:valmiki-ramayana'],
  [/^(HV|Hariv)/, 'text:harivamsha'],
  [/^(BhG|Gītā)\b/, 'text:bhagavad-gita'],
  [/^BhP\b/, 'text:bhagavata-purana'],
  [/^ViP\b/, 'text:vishnu-purana'],
  [/^MkP\b/, 'text:markandeya-purana'],
  [/^DM\b/, 'text:devi-mahatmya'],
  [/^LiP\b/, 'text:linga-purana'],
  [/^MatsP\b/, 'text:matsya-purana'],
  [/^AgP\b/, 'text:agni-purana'],
  [/^(KūP|KuP)\b/, 'text:kurma-purana'],
  [/^(ŚiP|SiP)\b/, 'text:shiva-purana'],
  [/^GarP\b/, 'text:garuda-purana'],
  [/^(RV|ṚV)\b/, 'text:rigveda'],
  [/^AV\b/, 'text:atharvaveda'],
  [/^(ŚB|SB)\b/, 'text:shatapatha-brahmana'],
  [/^AB\b/, 'text:aitareya-brahmana'],
  [/^TS\b/, 'text:taittiriya-samhita'],
  [/^(BU|BĀU)\b/, 'text:brihadaranyaka-upanishad'],
  [/^(CU|ChU)\b/, 'text:chandogya-upanishad'],
  [/^(ŚvU|SvU)\b/, 'text:shvetashvatara-upanishad'],
  [/^(KU|KaU|KaṭhU)\b/, 'text:katha-upanishad'],
  [/^(Manu|MDh)\b/, 'text:manusmriti'],
]

export function textFromLocator(locator?: string): string | undefined {
  if (!locator) return undefined
  const l = locator.trim()
  for (const [re, id] of MAP) if (re.test(l)) return id
  return undefined
}

/** predicates whose class-1 evidence is a passage that shows both parties in the cited text */
export const NARRATIVE_ROLE_PREDICATES = new Set(['PARTICIPANT_IN', 'SLAYS', 'BLESSES', 'CURSES', 'TEACHER_OF', 'DEVOTEE_OF', 'ALLY_OF', 'ADVERSARY_OF', 'SERVES', 'PARENT_OF', 'SPOUSE_OF', 'SIBLING_OF'])
