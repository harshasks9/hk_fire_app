/**
 * Deliverable F — research discoveries. Authored by the orchestrator from the six agents'
 * candidate findings and the computed graph; every discovery names the assertions that carry
 * it, and its sources are *taken from those assertions* (never typed in separately), so a
 * discovery can be no better sourced than the graph beneath it. Counts quoted in the text are
 * computed from the dataset at seed time.
 *
 *   npm run seed:discoveries   → data/discoveries.json  (then npm run validate)
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadDataset } from './lib/load.ts'
import { checkDataset } from './lib/check.ts'
import type { Discovery, SourceRef, Confidence } from '../schema/types.ts'

const ds = loadDataset()
const { entities, assertions } = checkDataset(ds)
const A = new Map(assertions.map((a) => [a.id, a]))

// ── computed figures ──
const temples = [...entities.values()].filter((e) => e.type === 'temple')
const mat = (e: (typeof temples)[number]) => Math.min(...(e.dates ?? []).filter((d) => d.system === 'material' && typeof d.start === 'number').map((d) => d.start!))
const withLegend = temples.filter((t) => (t.dates ?? []).some((d) => d.system === 'traditional') && Number.isFinite(mat(t)))
const legendLate = withLegend.filter((t) => mat(t) >= 1500)
const datedTemples = temples.filter((t) => Number.isFinite(mat(t)))
const pre600 = datedTemples.filter((t) => mat(t) < 600)
const texts = (id: string) => {
  const set = new Set<string>()
  for (const a of assertions) if (a.s === id && ['APPEARS_IN', 'MENTIONED_IN', 'NARRATED_IN', 'TEACHES_IN'].includes(a.p)) set.add(a.o)
  return set.size
}

type D = Omit<Discovery, 'sources'> & { extraSources?: SourceRef[] }
const D: D[] = [
  {
    id: 'disc:vasudeva-before-the-epic',
    kicker: 'Earliest attestations',
    title: 'Vāsudeva and Saṅkarṣaṇa were worshipped from Bactria to the Deccan before the epics reached their final form',
    body: 'Four independent kinds of evidence cluster within roughly a century and a half: coins of the Greco-Bactrian king Agathocles found at Aï Khanoum (c. 190–180 BCE) showing two deities with a plough and a wheel; the Besnagar pillar on which Heliodorus, envoy of an Indo-Greek king, calls himself a Bhāgavata and Vāsudeva the “god of gods”; the Hāthībāḍā–Ghosuṇḍī inscriptions in Rajasthan naming Saṅkarṣaṇa and Vāsudeva together; and the Nāṇeghāṭ inscription of the Sātavāhana queen Nāganikā invoking them in the western Deccan.\n\nThe patrons were a Greek king, a Greek envoy, a local ruler and a Deccan queen. Whatever the date of the Mahābhārata’s final redaction, devotion to these two figures was already geographically and socially wide.',
    entities: ['art:agathocles-coins', 'ins:heliodorus', 'ins:hathibada-ghosundi', 'ins:nanaghat', 'deity:vasudeva', 'deity:sankarshana', 'char:krishna', 'char:balarama'],
    assertions: ['material:60', 'material:63', 'material:64', 'material:1', 'material:11', 'material:22', 'material:23', 'material:32', 'material:33'],
    confidence: 'high',
    caveat: 'The inscriptions name Vāsudeva and Saṅkarṣaṇa, not “Kṛṣṇa”; identifying the coin figures and the inscriptional gods with the epic Kṛṣṇa and Balarāma is scholarly interpretation (class 5). None of this dates the Kṛṣṇa narratives or proves any event in them.',
  },
  {
    id: 'disc:grammarians',
    kicker: 'Earliest attestations',
    title: 'Two grammarians are among the earliest witnesses that Kṛṣṇa’s and Bali’s stories were told and performed',
    body: 'Pāṇini’s rule 4.3.98 (vāsudevārjunābhyāṃ vun) forms words for devotees of Vāsudeva and of Arjuna — evidence that both were objects of bhakti when the rule was framed, usually dated c. 5th–4th c. BCE. Two centuries or so later, Patañjali’s Mahābhāṣya on 3.1.26 describes performers who “have Kaṃsa killed” and “have Bali bound” before the audience’s eyes, and on 2.2.24 and 2.2.34 alludes to Kṛṣṇa with Saṅkarṣaṇa and to a prāsāda of Rāma and Keśava.\n\nRead alongside the Ṛgveda’s three strides of Viṣṇu (1.154) and the Śatapatha’s dwarf who wins the earth (ŚB 1.2.5, with no Bali), the grammarians supply a textual stage of the Vāmana–Bali story between the Veda and the Purāṇas.',
    entities: ['text:ashtadhyayi', 'text:mahabhashya', 'deity:vasudeva', 'char:arjuna', 'narr:kamsa-vadha', 'narr:vamana-bali', 'char:bali', 'char:krishna', 'deity:sankarshana'],
    assertions: ['epic:104', 'epic:105', 'epic:106', 'vedic:343', 'vedic:414', 'vedic:342', 'vedic:415', 'vedic:416'],
    confidence: 'high',
    caveat: 'These are grammatical examples: they attest that stories and cults were current, not the contents or date of any surviving epic or Purāṇa. Patañjali names neither Viṣṇu nor Vāmana in the Bali example, and reading “Rāma” as Balarāma is interpretation.',
  },
  {
    id: 'disc:spitzer',
    kicker: 'Manuscripts',
    title: 'The oldest physical witness to the Mahābhārata is a table of contents found in a Buddhist anthology on the Silk Road',
    body: 'The Spitzer manuscript — Sanskrit fragments recovered at Kizil in the Tarim Basin in 1906 and now divided between Berlin and London — contains a list of the Mahābhārata’s parvans. Radiocarbon dating puts it around 130 CE (80–230 CE); palaeography suggests c. 200–230. It is roughly a millennium older than any surviving manuscript of the epic’s text.\n\nThe list was copied far from the Gaṅgā plain, in a Buddhist philosophical compilation, which says something about how widely the epic’s structure was known by the 2nd–3rd century.',
    entities: ['ms:spitzer', 'text:mahabharata', 'site:kizil-caves'],
    assertions: ['epic:101', 'material:374', 'material:375', 'material:376', 'material:377', 'material:378'],
    confidence: 'high',
    caveat: 'A parvan list shows that a work of that shape existed, not the wording of its text; the list’s gaps may reflect the purpose of the list rather than the epic’s contents.',
  },
  {
    id: 'disc:aihole',
    kicker: 'Epigraphy & time',
    title: 'A 7th-century inscription dates itself by the Bhārata war — and fixes the latest possible date of Kālidāsa',
    body: 'The Aihole praśasti of Pulakeśin II, composed by Ravikīrti, is dated both in the Śaka era (556, i.e. 634/635 CE) and as 3,735 years after the Bhārata war — a reckoning that corresponds to the traditional Kali-yuga epoch of 3102 BCE, which Āryabhaṭa had already used in 499 CE. The same poem names Kālidāsa and Bhāravi as poets of renown.\n\nOne stone thus shows a traditional cosmological era in practical use by a Deccan court, and gives literary history a firm terminus ante quem for two poets.',
    entities: ['ins:aihole-ravikirti', 'person:kalidasa', 'person:bharavi', 'claim:kali-epoch-3102', 'text:aryabhatiya', 'temple:meguti-aihole'],
    assertions: ['material:333', 'material:334', 'purana:616', 'purana:617', 'purana:618'],
    confidence: 'high',
    caveat: 'The epoch is a traditional, astronomically computed reckoning. Its use in 634 CE is evidence for how 7th-century elites counted time, not for when — or whether — the war took place.',
  },
  {
    id: 'disc:devi-mahatmya-on-stone',
    kicker: 'Epigraphy & texts',
    title: 'A verse of the Devī Māhātmya was carved in stone in 608 CE',
    body: 'The Dadhimatī Mātā inscription (Gupta year 289, 608 CE) quotes a verse beginning sarva-maṅgala-māṅgalye, found in the Devī Māhātmya (Mārkaṇḍeya Purāṇa 91.9). It gives that hymn a secure latest date — rare for a Purāṇic text. Nearly two centuries earlier the Gangdhar inscription (423/424 CE) records a “terrifying abode of the divine Mothers” built beside a temple of Viṣṇu.\n\nTogether they put organised Goddess worship on the epigraphic record well before the oldest manuscripts of the texts that celebrate it.',
    entities: ['ins:dadhimati-mata', 'ins:gangdhar', 'text:devi-mahatmya', 'deity:matrikas', 'deity:devi'],
    assertions: ['material:267', 'purana:623', 'material:250', 'material:251'],
    confidence: 'high',
    caveat: 'The quotation shows that one verse existed by 608 CE, not that the whole Devī Māhātmya did in its present form.',
  },
  {
    id: 'disc:oesho',
    kicker: 'Contested identities',
    title: 'The Kuṣāṇa “Śiva” on coins is labelled with an Iranian name',
    body: 'Gold coins of Wima Kadphises and Kaniṣka show a deity with a bull and Śaiva-looking attributes, but the Bactrian legend reads ΟΗϷΟ (Oesho), which many numismatists derive from the name of the Iranian wind god Vāyu (Vēš). The graph keeps Oesho as its own record with two disputed IDENTIFIED_WITH assertions — to Śiva and to Vāyu — and the evidence for and against.\n\nThe case shows why identity must be an assertion rather than a merge: the same image can belong to two traditions at once, or be a deliberate synthesis.',
    entities: ['deity:oesho', 'art:kushan-oesho-coins', 'art:wima-kadphises-coin', 'claim:oesho-shiva-identity', 'deity:shiva'],
    assertions: ['material:133', 'material:136', 'material:137', 'material:138', 'material:139'],
    confidence: 'medium',
    caveat: 'This is a live scholarly dispute; the dataset records both readings and does not decide it.',
  },
  {
    id: 'disc:proto-shiva',
    kicker: 'Archaeological interpretation',
    title: 'The most-cited “earliest image of Śiva” is the least secure item in the graph',
    body: 'The Mohenjo-daro seal that John Marshall in 1931 called “proto-Śiva” is the oldest object in the dataset associated with Śiva — c. 2350–2000 BCE. It is also modelled as a disputed claim: Doris Srinivasan’s iconological assessment and later work argue that the horned, seated figure does not support the identification, and the Indus script remains undeciphered.\n\nFor this reason the atlas never lets a disputed link set an “earliest attestation”: Śiva’s earliest dated material record in the computed profile is the Gudimallam liṅga, itself carrying a range of dates.',
    entities: ['art:pashupati-seal', 'claim:proto-shiva', 'deity:shiva', 'deity:rudra', 'person:john-marshall', 'art:gudimallam-linga'],
    assertions: ['material:91', 'material:92', 'material:105', 'material:106'],
    confidence: 'high',
    caveat: 'Absence of a secure identification is not evidence that no continuity exists; it means the seal cannot carry the weight popular accounts place on it.',
  },
  {
    id: 'disc:flood-fish-brahma',
    kicker: 'Versions compared',
    title: 'In the Mahābhārata the fish that saves Manu is Brahmā, not Viṣṇu',
    body: 'The flood story runs from the Śatapatha Brāhmaṇa (1.8.1, where an unnamed fish saves Manu) to the Purāṇas. In the critical Mahābhārata (3.185.48) the fish reveals itself as Prajāpati Brahmā. Only in the Matsya and Bhāgavata Purāṇas does it become Viṣṇu’s first avatāra, and the Bhāgavata adds the demon Hayagrīva who steals the Veda.\n\nThe theological identity of the rescuer changed as the story moved between bodies of literature; the graph keeps each version separate and joins them with a DERIVED_FROM assertion rather than a merge.',
    entities: ['narr:manu-fish', 'narr:matsya-flood', 'deity:matsya', 'deity:brahma', 'deity:vishnu', 'char:manu', 'text:shatapatha-brahmana', 'text:mahabharata', 'text:bhagavata-purana'],
    assertions: ['purana:227', 'purana:534'],
    confidence: 'high',
    caveat: 'A later Vaiṣṇava reading may preserve older oral tradition; textual sequence is not proof of origin.',
  },
  {
    id: 'disc:avatara-lists',
    kicker: 'Versions compared',
    title: 'There is no single early list of Viṣṇu’s ten avatāras',
    body: 'The constituted text of the Mahābhārata’s Nārāyaṇīya lists Varāha, Narasiṃha, Vāmana, Paraśurāma, Rāma and others — but no Fish, no Tortoise and no Kalki. The Agni Purāṇa’s ten include Balarāma rather than Kṛṣṇa; the Bhāgavata counts twenty-two; the Matsya includes figures such as Māndhātṛ and Vyāsa.\n\nThe familiar ten is a convention that crystallised late. Every AVATARA_OF edge in the graph is qualified by the text that makes it, so the lists can be compared rather than flattened.',
    entities: ['concept:avatara', 'deity:vishnu', 'deity:matsya', 'deity:kurma', 'char:kalki', 'char:balarama', 'text:mahabharata', 'text:agni-purana', 'text:bhagavata-purana'],
    assertions: ['purana:200', 'purana:201', 'purana:202', 'purana:203', 'purana:204', 'purana:205', 'purana:186'],
    confidence: 'high',
    caveat: 'Vulgate texts and other passages of the same works sometimes count differently; the comparison uses the critical or e-text editions cited.',
  },
  {
    id: 'disc:mahapurana-insertion',
    kicker: 'Textual criticism',
    title: 'In the critical Viṣṇu Purāṇa, the word “mahāpurāṇa” is an insertion',
    body: 'The critical text of the Viṣṇu Purāṇa (3.6.21–23) lists eighteen purāṇas. The half-verse that calls them mahāpurāṇas and adds the upapurāṇas appears only as a starred insertion (3.6.23*8), recorded in the apparatus rather than the constituted text.\n\nThe category “the Eighteen Mahāpurāṇas” — the frame through which the corpus is usually introduced — is itself something the manuscripts show being added.',
    entities: ['claim:mahapurana-term-late', 'col:mahapuranas', 'text:vishnu-purana'],
    assertions: ['purana:621', 'purana:622'],
    confidence: 'medium',
    caveat: 'An insertion in one text attests manuscript variation, not a date for the term; other Purāṇas use it.',
  },
  {
    id: 'disc:draupadi-garment',
    kicker: 'Textual criticism',
    title: 'The critical Mahābhārata has no prayer to Kṛṣṇa when Draupadī is disrobed',
    body: 'In the constituted text (2.61.40–41) Draupadī’s garments simply keep appearing as Duḥśāsana pulls. Her famous appeal to Govinda “who dwells in Dvārakā” survives only in star passages (*542–*547) relegated to the apparatus of the Critical Edition.\n\nThe graph records Draupadī DEVOTEE_OF Kṛṣṇa at this point as disputed, with the comparison table showing exactly what each source states.',
    entities: ['narr:draupadi-humiliation', 'char:draupadi', 'char:krishna', 'char:duhshasana', 'text:mahabharata'],
    assertions: ['epic:437'],
    confidence: 'high',
    caveat: 'The Critical Edition reconstructs the archetype shared by the manuscripts it used; it does not show the prayer is late everywhere, and many living tellings centre on it.',
  },
  {
    id: 'disc:ramopakhyana',
    kicker: 'Versions compared',
    title: 'The Mahābhārata tells its own Rāma story — with Lakṣmaṇa killing Kumbhakarṇa and no fire ordeal',
    body: 'The Rāmopākhyāna (MBh (CE) 3.257–275) retells the Rāma story differently from Vālmīki: Lakṣmaṇa, not Rāma, kills Kumbhakarṇa (3.271.16, against VR (CE) 6.55.128–129); Sītā is cleared by the gods’ testimony and a curse on Rāvaṇa rather than by entering fire; there is no banishment. Yet it already presents Rāma as Viṣṇu descended (3.260.5).\n\nTwo Sanskrit tellings of the same story, in two great texts, disagree on who kills whom — exactly the kind of difference the comparison tables exist to show.',
    entities: ['text:ramopakhyana', 'text:valmiki-ramayana', 'char:kumbhakarna', 'char:lakshmana', 'char:rama', 'char:sita', 'narr:sita-ordeal'],
    assertions: ['epic:686', 'epic:681', 'epic:400', 'epic:399'],
    confidence: 'high',
    caveat: 'Whether the Rāmopākhyāna abridges Vālmīki or preserves an independent version is disputed.',
  },
  {
    id: 'disc:svetasvatara',
    kicker: 'Evolution of deities',
    title: 'The Upaniṣad that first makes Śiva the supreme lord is built from older Rudra verses',
    body: 'The Śvetāśvatara Upaniṣad reuses Ṛgvedic and Yajurvedic material verbatim — the Śatarudrīya of the Taittirīya Saṃhitā (ŚvU 3.5), a Ṛgvedic verse to Rudra (RV 1.114.8 = ŚvU 4.22) and the Puruṣa hymn (RV 10.90.1–2 = ŚvU 3.14–15) — while applying śiva and maheśvara to one supreme lord.\n\nThe passage from Vedic Rudra to the Śiva of devotion is visible here in the texture of a single text, not only in a sequence of texts.',
    entities: ['text:shvetashvatara-upanishad', 'deity:rudra', 'deity:shiva', 'psg:ts-4-5', 'psg:rv-10-90'],
    assertions: ['vedic:144', 'vedic:145', 'vedic:146', 'vedic:215'],
    confidence: 'high',
    caveat: 'Whether śiva is a name or an epithet in these verses is debated; the identification of Rudra with Śiva is recorded as the Upaniṣad’s assertion.',
  },
  {
    id: 'disc:ganga-rigveda',
    kicker: 'Geography in the texts',
    title: 'The Gaṅgā is almost absent from the Ṛgveda',
    body: 'The river at the heart of later sacred geography appears once by name in the Ṛgveda, in the river list of 10.75.5 (with the adjective gāṅgya at 6.45.31). The Sarasvatī has hymns of its own. In the Śatapatha Brāhmaṇa (1.4.1) Agni’s eastward journey runs from the Sarasvatī to Videha beyond the Sadānīrā.\n\nThe sacred map of the earliest texts and the sacred map of the temple atlas are different maps.',
    entities: ['place:ganga-river', 'place:sarasvati-river', 'deity:sarasvati', 'text:rigveda', 'place:videha'],
    assertions: ['vedic:473', 'vedic:207', 'vedic:406', 'vedic:407'],
    confidence: 'high',
    caveat: 'Absence of mention in one corpus is not absence of the river from the composers’ world; the migration reading of ŚB 1.4.1 is interpretive.',
  },
  {
    id: 'disc:sb-frame-figures',
    kicker: 'Cross-corpus links',
    title: 'Vedic prose already names the Mahābhārata’s frame figures',
    body: 'The Śatapatha Brāhmaṇa (13.5.4) names Janamejaya Pārikṣita, who performed the horse sacrifice, with brothers Bhīmasena, Ugrasena and Śrutasena — the trio the epic names at its opening — and Bharata Dauḥṣanti, “whom the apsaras Śakuntalā bore”.\n\nThe epic’s royal frame draws on names already present in Vedic memory of the Kuru realm.',
    entities: ['psg:sb-13-5-4', 'char:janamejaya', 'char:shakuntala', 'char:parikshit', 'text:shatapatha-brahmana', 'text:mahabharata'],
    assertions: ['vedic:325', 'vedic:326'],
    confidence: 'medium',
    caveat: 'That the Brāhmaṇa’s Janamejaya and the epic’s are the same figure is inferred from names and lineage, not proven; and a shared name says nothing about the historicity of the epic’s war.',
  },
  {
    id: 'disc:five-fires',
    kicker: 'Philosophy',
    title: 'Both oldest Upaniṣads credit the doctrine of rebirth to a king — and tell it differently',
    body: 'The “five fires” teaching on the fate of the dead is given to the brahmin Uddālaka Āruṇi by the Pañcāla king Pravāhaṇa Jaivali in both the Bṛhadāraṇyaka (6.2) and the Chāndogya (5.3–5.10). Only the Chāndogya ties rebirth to conduct and to birth in a social class; the Bṛhadāraṇyaka quotes a Ṛgvedic verse instead.',
    entities: ['narr:five-fires', 'char:pravahana-jaivali', 'char:uddalaka-aruni', 'text:chandogya-upanishad', 'text:brihadaranyaka-upanishad', 'concept:karma', 'concept:samsara'],
    assertions: ['vedic:279', 'vedic:399', 'vedic:400'],
    confidence: 'high',
    caveat: 'This is a literary attribution, not evidence that the doctrine originated among kṣatriyas.',
  },
  {
    id: 'disc:sita-parentage',
    kicker: 'Many Rāmāyaṇas',
    title: 'Whose daughter is Sītā? The answer depends on the tradition',
    body: 'In Vālmīki she is found in a furrow and raised by Janaka. In the Buddhist Dasaratha Jātaka she is Rāma’s sister and becomes his queen. In Vimalasūri’s Jain Paumacariya she is Janaka’s natural daughter with a twin brother, Bhāmaṇḍala. In Guṇabhadra’s Jain telling, the Adbhuta Rāmāyaṇa, the Thai Ramakien and the Lao Phra Lak Phra Lam she is born to Rāvaṇa’s household and set adrift because of an omen.\n\nThe graph records each parentage as a separate kinship assertion qualified by its text, so the genealogy view shows all of them at once.',
    entities: ['char:sita', 'char:janaka', 'char:ravana', 'text:valmiki-ramayana', 'text:dasaratha-jataka', 'text:paumacariya', 'text:adbhuta-ramayana', 'text:ramakien'],
    assertions: ['regional:265', 'regional:267', 'regional:268', 'regional:270', 'regional:272', 'regional:274', 'regional:276'],
    confidence: 'medium',
    caveat: 'Several rows still carry “awaiting check” locators; no line of descent between the tellings is implied, and no version is treated as the authentic one.',
  },
  {
    id: 'disc:maya-sita',
    kicker: 'Many Rāmāyaṇas',
    title: 'In later devotional tellings, the Sītā whom Rāvaṇa abducts is a reflection',
    body: 'Vālmīki’s Rāvaṇa seizes Sītā. Kampaṉ’s Rāvaṇa lifts the earth on which her hermitage stands, so as not to touch her. In the Adhyātma Rāmāyaṇa and Tulsīdās’s Rāmcaritmānas the real Sītā enters fire before the abduction and an illusory Sītā (Māyā-Sītā) is taken; the ordeal by fire restores the original.\n\nThe change follows the theology: as Rāma becomes Brahman itself, his consort cannot be touched by the demon.',
    entities: ['char:maya-sita', 'char:sita', 'char:ravana', 'narr:abduction-of-sita', 'text:adhyatma-ramayana', 'text:ramcharitmanas', 'text:kamba-ramayanam'],
    assertions: ['regional:285'],
    confidence: 'high',
    caveat: 'The motif is older than the Mānas and is not unique to it; the theological explanation is a scholarly reading.',
  },
  {
    id: 'disc:triyampawai',
    kicker: 'Southeast Asia',
    title: 'A Thai royal ceremony is named after two Tamil temple hymns',
    body: 'The Bangkok court Brahmans’ new-year rite Triyampawai–Trippawai takes its name from Māṇikkavācakar’s Tiruvempāvai and Āṇṭāḷ’s Tiruppāvai — Tamil hymns to Śiva and to Viṣṇu sung in the month of Mārkaḻi. Tamil texts in Thai and Grantha scripts survive, and the hymns have been recorded being chanted.\n\nIt is a living thread from South Indian bhakti to a Southeast Asian court, distinct from the better-known Rāmāyaṇa route.',
    entities: ['trad:triyampawai', 'text:tiruvempavai', 'text:tiruppavai', 'person:andal'],
    assertions: ['regional:134', 'regional:135', 'regional:92', 'regional:96'],
    confidence: 'medium',
    caveat: 'This does not date the transmission, or show that the officiants understand the Tamil they recite.',
  },
  {
    id: 'disc:jnaneshwari-edition',
    kicker: 'Manuscripts & editions',
    title: 'A 16th-century poet produced a critical edition of a Marathi classic',
    body: 'The Jñāneśvarī carries its own dated colophon (Śaka 1212, 1290 CE, under the Yādava king Rāmacandra) and a second note, dated 1584, in which Eknāth says he restored the text because variant readings had corrupted it.\n\nThe problem of textual corruption — and an attempt to solve it — appears in a vernacular tradition three centuries before modern critical editions.',
    entities: ['text:jnaneshwari', 'person:jnaneshwar', 'person:eknath'],
    assertions: ['regional:64', 'regional:123'],
    confidence: 'high',
    caveat: 'The e-text used is a modern edition; the colophons themselves should be checked against early manuscripts.',
  },
  {
    id: 'disc:mayon-ceyon',
    kicker: 'Regional traditions',
    title: 'The oldest Tamil grammar names Māyōṉ and Cēyōṉ as lords of landscapes — their equation with Viṣṇu and Skanda is a later gloss',
    body: 'The Tolkāppiyam names Māyōṉ (“the dark one”) and Cēyōṉ (“the red one”) as presiding over the forest and mountain landscapes of love poetry. The commentator Nacciṉārkkiṉiyar glosses them as Viṣṇu and Murukaṉ, and Murukaṉ’s identification with the Sanskrit Skanda is a further convergence.\n\nThe graph keeps Murukaṉ and Skanda as two records joined by an assertion qualified by tradition — the convergence is part of the history, not an assumption.',
    entities: ['deity:mayon', 'deity:murugan', 'deity:skanda', 'deity:vishnu', 'char:krishna', 'text:tolkappiyam'],
    assertions: ['regional:243', 'regional:244', 'regional:298', 'regional:300', 'regional:301'],
    confidence: 'medium',
    caveat: 'The date of the relevant part of the Tolkāppiyam is itself disputed.',
  },
  {
    id: 'disc:legend-vs-fabric',
    kicker: 'Temples',
    title: `${legendLate.length} of the ${withLegend.length} temples with founding legends have no surviving fabric older than 1500 CE`,
    body: `Of the ${withLegend.length} temples in the atlas whose tradition gives a founding story, ${legendLate.length} have no surviving fabric dated before 1500 CE — among them ${['temple:kashi-vishwanath', 'temple:kalighat', 'temple:vishnupad-gaya', 'temple:badrinath'].filter((id) => legendLate.some((t) => t.id === id)).map((id) => `${entities.get(id)!.name.split(',')[0]} (${mat(entities.get(id)!)})`).join(', ')}. Across all ${datedTemples.length} dated temples, ${pre600.length} have a surviving phase from before 600 CE, and several of those — Deogarh, Udayagiri, Bhitargaon, Tigawa — are monuments no longer in regular worship.\n\nMany of the places most central to living practice have been rebuilt repeatedly, while some of the oldest fabric survives where worship lapsed. The atlas therefore keeps two dates on every temple: the tradition’s and the building’s.`,
    entities: ['temple:kashi-vishwanath', 'temple:somnath', 'temple:kalighat', 'temple:deogarh-dashavatara', 'temple:udayagiri-caves', 'temple:badami-caves'],
    assertions: ['temple:215', 'temple:209'],
    confidence: 'medium',
    caveat: 'A late building is not a late cult: inscriptions, texts and earlier phases may attest worship long before the surviving fabric. The counts describe the 103 temples of this dataset only, and one early date (Muṇḍeśvarī) is disputed.',
  },
  {
    id: 'disc:ahilyabai',
    kicker: 'Temples',
    title: 'One 18th-century queen stands behind the present fabric of several “ancient” shrines',
    body: 'Ahilyābāī Holkar of Indore built the present Kāśī Viśvanātha temple (1780) and the Viṣṇupada at Gaya (1787), renovated Aundha Nāganātha, built a separate Somanātha temple (1783), and is credited — disputedly — with rebuilding Grishneshwar.\n\nFour of these are counted among the twelve jyotirliṅgas; the buildings pilgrims enter are largely hers.',
    entities: ['person:ahilyabai-holkar', 'temple:kashi-vishwanath', 'temple:vishnupad-gaya', 'temple:aundha-nagnath', 'temple:somnath', 'temple:grishneshwar'],
    assertions: ['temple:215', 'temple:209', 'temple:160', 'temple:156', 'temple:220'],
    confidence: 'high',
    caveat: 'These are rebuildings and renovations of existing sacred sites, not foundations; the Grishneshwar attribution is disputed.',
  },
  {
    id: 'disc:jyotirlinga-network',
    kicker: 'Sacred geography',
    title: 'The twelve jyotirliṅgas are a fixed list with unfixed places',
    body: 'Four of the twelve positions have rival claimant temples — Vaidyanātha (Deoghar or Parli), Nāgeśvara (Dwarka, Aundha or Jageshwar), and others — and at least seven of the fifteen claimant temples in the atlas are buildings of 1700 or later.\n\nThe network is real as a devotional list; its geography is contested in ways the map makes visible.',
    entities: ['claim:jyotirlinga-site-identifications', 'concept:jyotirlinga', 'temple:baidyanath-deoghar', 'temple:parli-vaijnath', 'temple:nageshwar-dwarka', 'temple:aundha-nagnath', 'temple:jageshwar'],
    assertions: ['temple:370', 'temple:371', 'temple:372', 'temple:373', 'temple:374', 'temple:375'],
    confidence: 'medium',
    caveat: 'Several memberships rest on recall-level sources; a late building does not mean a late cult.',
  },
  {
    id: 'disc:conquest-architecture',
    kicker: 'Temples & history',
    title: 'Conquest carried a temple design from Kanchi to Pattadakal',
    body: 'After the Cālukya king Vikramāditya II took the Pallava capital Kanchi, his queen Lokamahādevī built the Virūpākṣa at Pattadakal (c. 740–745), whose Drāviḍa design follows Kanchi’s Kailāsanātha. A century earlier the Pallava Narasiṃhavarman I had taken the Cālukya capital Vātāpi.\n\nThe atlas’s DERIVED_FROM edge between two temples records an argument about influence, with its evidence class.',
    entities: ['temple:virupaksha-pattadakal', 'temple:kailasanatha-kanchi', 'person:lokamahadevi', 'person:vikramaditya-ii'],
    assertions: ['temple:110'],
    confidence: 'medium',
    caveat: 'Stylistic dependence is a scholarly argument (class 5), not a documented commission.',
  },
  {
    id: 'disc:eran',
    kicker: 'Epigraphy',
    title: 'One Vaiṣṇava family at Eran kept its cult under a change of empire',
    body: 'At Eran, Dhanyaviṣṇu’s family raised a pillar under the Gupta Budhagupta (484/85 CE) and then the colossal Varāha under the Hūṇa ruler Toramāṇa (c. 510), dating the new foundation by Toramāṇa’s first regnal year.\n\nThe inscriptions show local patrons sustaining a Vaiṣṇava cult across a political rupture.',
    entities: ['ins:eran-budhagupta', 'ins:eran-toramana', 'art:eran-varaha', 'person:dhanyavishnu', 'person:toramana', 'deity:varaha'],
    assertions: ['material:179', 'material:180', 'material:183', 'material:187', 'material:188'],
    confidence: 'medium',
    caveat: 'The family link for the Budhagupta pillar rests on an edition cited from recall (material:188).',
  },
  {
    id: 'disc:angkor-prambanan',
    kicker: 'Southeast Asia',
    title: 'The epics were carved in stone in Java and Cambodia as monumental programmes',
    body: 'Prambanan’s Rāmāyaṇa and Kṛṣṇa reliefs belong to a temple tied to the Śivagṛha inscription of 856 CE — the same period as the Old Javanese Kakawin Rāmāyaṇa (c. 856–930). Angkor Wat, built under Sūryavarman II (c. 1113–1150), carries the churning of the ocean, the Kurukṣetra battle and the war in Laṅkā in its galleries.\n\nThe largest surviving narrative programmes of these stories in stone stand outside South Asia.',
    entities: ['temple:prambanan', 'temple:angkor-wat', 'ins:shivagrha', 'text:kakawin-ramayana', 'narr:samudra-manthana', 'narr:kurukshetra-war', 'narr:lanka-war'],
    assertions: ['temple:279', 'temple:282', 'purana:395', 'temple:288', 'temple:289', 'temple:290'],
    confidence: 'high',
    caveat: 'The link between Prambanan and the Śivagṛha inscription is an argument (de Casparis), since the inscription was found apart from the temple; “largest” is a statement about what survives.',
  },
  {
    id: 'disc:network',
    kicker: 'Network analysis',
    title: `Rāma and Sītā are attested in more distinct texts in this graph than any deity`,
    body: `Counting distinct texts in which a figure is directly attested, Rāma (${texts('char:rama')}), Sītā (${texts('char:sita')}) and Kṛṣṇa (${texts('char:krishna')}) lead; Śiva and Viṣṇu are the strongest bridges in the network (highest betweenness), connecting otherwise separate corpora, temples and inscriptions.\n\nNarrative figures travel across languages and religions — Hindu, Jain, Buddhist, Southeast Asian — where a deity’s cult is more often carried by temples and inscriptions than by retellings.`,
    entities: ['char:rama', 'char:sita', 'char:krishna', 'deity:shiva', 'deity:vishnu'],
    assertions: [],
    confidence: 'low',
    caveat: 'Network counts measure this dataset — which reflects what was researched — and are never evidence of religious importance or of historical truth.',
    extraSources: [{ source: 'src:richman-1991' }, { source: 'src:ramanujan-1991' }],
  },
]

const out: Discovery[] = D.map(({ extraSources, ...d }) => {
  const refs: SourceRef[] = []
  const seen = new Set<string>()
  for (const aid of d.assertions ?? []) {
    const a = A.get(aid)
    if (!a) throw new Error(`${d.id}: unknown assertion ${aid}`)
    for (const r of a.sources) { const k = `${r.source}|${r.locator ?? ''}`; if (!seen.has(k)) { seen.add(k); refs.push(r) } }
  }
  for (const r of extraSources ?? []) refs.push(r)
  for (const id of d.entities) if (!entities.has(id)) throw new Error(`${d.id}: unknown entity ${id}`)
  if (!refs.length) throw new Error(`${d.id}: no sources`)
  return { ...d, sources: refs.slice(0, 10), confidence: d.confidence as Confidence }
})
writeFileSync(join(import.meta.dirname, '..', 'data', 'discoveries.json'), JSON.stringify(out, null, 1) + '\n')
console.log(`discoveries: ${out.length}`)
