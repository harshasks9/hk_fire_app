# SANATANA — Research audit (Deliverable G)

Audit date 2026-11-08, after two research rounds and two independent verifications, with every
finding resolved (`research/verification-resolution.md`, `research/verification-r2-resolution.md`).
The machine audit with every warning category is `research/audit/validation-report.md`
(regenerated on each build); the independent reviews are `research/verification-report.md` and
`research/verification-r2-report.md`. What round 2 added is listed in
`research/round-2-additions.md`.

## 1. What was built

| Measure | Round 1 | Now (after round 2) |
|---|---|---|
| Records (entities) with full, sourced records | 1,230 | **2,731** |
| Assertions (edges), every one sourced | 3,648 | **8,207** |
| Bibliography | 340 | **695** sources (320 scholarly books, 141 primary-text editions/e-texts, 107 translations, 47 journal articles, 23 epigraphic corpora, 16 institutional, 15 catalogues, 12 excavation reports, 5 tradition publications, 9 reference works) |
| Comparison tables (“what each text says”) | 31 tables, 155 rows | **73** tables, 338 rows |
| Research discoveries | 28 | **38** |
| Traditional chronology | 17 eras | 17 eras (kalpa → yuga), each labelled traditional |
| Records with dates / coordinates / licensed images | 493 / 192 / 60 | **1,138 / 441 / 143** |
| Validation errors / warnings | 0 / 5 | 0 / 5 (all five are duplicate triples asserted independently by two agents; kept as corroboration) |

Records by type: 388 characters, 365 texts, 318 historical persons, 267 temples, 262
passages, 202 narratives, 148 deities, 146 concepts, 125 places, 112 traditions (schools,
festivals, sampradāyas), 94 artifacts, 70 polities, 45 inscriptions, 44 debated claims,
39 corpora, 38 sites, 38 institutions, 17 manuscripts, 13 lineages.

Round 2 added a seventh research role, the Iconography & Temple-Architecture Researcher, and
extended the six original agents: the Vedic agent into the darśanas, sūtra literature and the
Upaniṣad canon; the epic agent into kāvya, drama and the vernacular Mahābhāratas; the Purāṇa
agent into cosmography, the Kṛṣṇa cycle and the māhātmyas; the temple agent across India,
Nepal, Sri Lanka, Southeast Asia and the diaspora; the material agent into Gupta and Kuṣāṇa
coinage and epigraphy, museum objects and Southeast Asian inscriptions; and the regional agent
into festivals, bhakti saints and the Old Javanese literature.

## 2. Primary-source coverage

| Corpus | Edition actually read (via GRETIL or equivalent) | Depth |
|---|---|---|
| Ṛgveda | Aufrecht (GRETIL) — structure counted from the e-text (1,028 hymns) | anchoring hymns verse-exact |
| Śatapatha Brāhmaṇa, Aitareya Brāhmaṇa, Taittirīya Saṃhitā | GRETIL / TITUS e-texts | key sections verse-exact |
| Principal Upaniṣads (BU, CU, Kaṭha, Kena, Śvetāśvatara, Māṇḍūkya …) | GRETIL | verse-exact |
| Pāṇini, Patañjali | GRETIL; Kielhorn page references | sūtra-exact |
| Mahābhārata | BORI Critical Edition (GRETIL e-text, all 18 parvans) | 1,083 assertions verse-exact |
| Vālmīki Rāmāyaṇa | Baroda Critical Edition (GRETIL) | verse-exact |
| Harivaṃśa | Critical Edition (GRETIL) | chapter/verse |
| Purāṇas | GRETIL e-texts of the Bhāgavata, critical Viṣṇu, Matsya, Mārkaṇḍeya/Devī Māhātmya, Agni, Liṅga, Kūrma, Nārada, Śiva, Garuḍa | key loci verse-exact; other Purāṇas at chapter level or from Rocher/Hazra |
| Manusmṛti, Āryabhaṭīya, Amarakośa | GRETIL | verse-exact |
| Rāmcaritmānas, Jñāneśvarī, Tolkāppiyam, Jātaka 461 | sanskritdocuments.org, Project Madurai, translations | passage-level |
| Inscriptions | Epigraphia Indica XI (scans), Dharmalekha (Udayagiri), Sircar; many others via Wikipedia pointers | see §4 |
| Museum objects | Cleveland Museum of Art open-access API; Rijksmuseum; Mathurā Museum; SHT (Berlin); NAK (Kathmandu) | accession-exact where listed |

Missing or inaccessible: sacred-texts.com and whc.unesco.org refused automated fetching
throughout; Wilson’s Viṣṇu Purāṇa and Ganguli’s Mahābhārata section numbers could not be
checked online; no accessible edition was found for several regional texts (Kampaṉ, Kṛttivāsa,
Ranganātha), so their loci are passage-level from scholarship.

## 3. Verification

### 3.1 How far each assertion has been checked

| Status | Assertions | Share |
|---|---|---|
| Verified online (checked against an authoritative online source, URL recorded) | 4,383 | 53.4% |
| Source-checked (checked against a named scholarly source) | 1,682 | 20.5% |
| Reference-checked (checked only against a reference work such as Wikipedia) | 1,748 | 21.3% |
| Awaiting check (expert recall) | 293 | 3.6% |
| Disputed (the point itself is contested) | 101 | 1.2% |

Confidence: 5,640 high · 2,319 medium · 248 low; no high-confidence assertion rests on a
reference work alone. Evidence classes: 3,918 textual · 32 manuscript · 359 epigraphic · 792
material · 1,841 scholarly interpretation · 1,192 tradition · 73 disputed.

### 3.2 Independent verification results

An independent reviewer, who produced none of the research, checked a stratified sample:

- **174 assertions by hand** (25–42 per agent): **174 factually correct** (0 errors; 95%
  upper bound ≈1.7%). One secondary locator was wrong.
- **247 Sanskrit quotations** tested at their cited verse: **247 found** (one trimmed a word
  mid-sandhi; corrected). No fabricated quotation was found.
- **482 verse-precise relation locators** tested for whether the verse names the figure:
  about **28 genuine failures (5.8%)**, all in one bulk-generated block of epic lineage
  memberships. Those locators have been withdrawn (status lowered, rationale recorded).
- **191 coordinates**: all within 2 km of the cited reference (consistency, not survey).
- **60 images**: all licences and credits match their Commons / museum metadata.
- **Identity**: no wrong merges; the deliberate splits (two Janakas, two Bharatas, two Nalas,
  two Rādhās, Vasudeva/Vāsudeva, narrative Laṅkā, Murukaṉ/Skanda) hold.
- **Status inflation**: 347 assertions were marked verified-online on Wikipedia alone. All
  such records (448 assertions, 30 entities, by the stricter rule applied in the fix) now carry
  the new status *reference-checked* and medium confidence.
- **Discoveries**: 8 of 28 had a substantive problem (2 high: a factual slip about the Agni
  Purāṇa’s fish, and the Oesho legend placed on Wima Kadphises’ coins). All 8 were rewritten,
  and 4 further low-severity wording issues fixed.

All 52 findings (2 high, 26 medium, 24 low) have a recorded resolution in
`research/verification-resolution.md`.

### 3.3 Round-2 verification

A second independent reviewer audited only the round-2 additions (1,501 records, 4,559
assertions); the report is `research/verification-r2-report.md`.

- **154 assertions by hand** (22 per agent): **154 factually correct** (0 errors; 95% upper
  bound ≈1.9%).
- **1,210 quotations** tested by script against the cited e-texts: 1,159 confirmed, none
  fabricated or misplaced; 51 could not be tested (no machine-readable edition).
- **The 55 epic lineage locators withdrawn in round 1** were restored in round 2; all 55 pass
  (109/109 quotations at the cited verse, every testable verse names the member).
- **65 museum accession links** match the museums’ APIs exactly; **70 coordinates** checked,
  one copied from a neighbouring temple (fixed); **48 image licences** match.
- **25 findings** (0 high, 11 medium, 14 low), all resolved in
  `research/verification-r2-resolution.md`: 47 epic participation locators re-pointed to a verse
  in the episode that names the participant; two duplicate figures merged (Maya; Vasiṣṭha’s
  cow); 184 assertions resting on a reference work alone lowered from high to medium
  confidence; 107 temple “upgrades” that cited books not opened reverted to reference-checked;
  17 temple dates resting on claims or on style alone kept as labels but no longer placed on
  the time map; the Ayodhyā excavation’s two evidence edges given equal weight and the critics’
  publications cited; five discoveries reworded where they said more than the evidence.

### 3.4 Confidence distribution in practice

The textual core — Vedic, epic and Purāṇic passages — is the strongest layer: most of it is
verse-exact against critical editions. The material and temple layers are factually sound on
the sample but thinner in provenance: about half of their assertions still rest on reference
works, and the epigraphic editions they summarise (EI, CII, SII) are cited directly only for
the most important inscriptions.

## 4. Unresolved questions and areas needing specialist review

1. **Epigraphy.** Add the editions (Epigraphia Indica, Corpus Inscriptionum Indicarum, South
   Indian Inscriptions) to the class-3 assertions now reference-checked — a specialist epigraphist
   should review readings and dates for the Gupta and Chola material.
2. **Temple provenance.** About 80% of the round-2 temple agent’s assertions rest on Wikipedia;
   their facts held on the sample, but each needs the survey volume, inscription edition or
   monograph behind it.
3. **Regional loci.** 42 of 155 comparison rows remain “awaiting check”, mostly regional
   (Kampaṉ, Kṛttivāsa, Raṅganātha, Paumacariya); they need edition locators from specialists in
   Tamil, Bengali, Telugu and Prakrit.
4. **Disputed dates** recorded but not resolved: Kampaṉ (9th vs 12th c.); the Paumacariya; the
   Bhāgavata Purāṇa (6th vs 9th–10th c.); Gudimallam; Muṇḍeśvarī; Changu Nārāyaṇ (464 vs
   495/96); the Heliodorus pillar’s absolute date (Antialkidas’s reign).
5. **Earliest manuscripts** of the Rāmāyaṇa, Mahābhārata and Gītā: no verifiable record was
   found; logged as open questions rather than guessed.
6. **Temples without dated fabric**: Baidyanātha (Deoghar), Palani, Swamimalai, Tiruttani,
   Kedarnath, the Pañca Kedāra shrines, Ranjangaon, Chandranath, Dakshinkali and a dozen others
   carry only traditional dates or an undated label.
7. **Śakti pīṭha and jyotirliṅga memberships**: several are disputed between rival sites; the
   graph models the dispute rather than choosing.
8. **Coverage gaps**: round 2 added the darśanas, the kāvya and drama tradition, the
   vernacular Mahābhāratas, festivals, bhakti saints, Southeast Asian epigraphy and the
   diaspora, but the Āgamas and Tantras, the Himalaya beyond Nepal and Garhwal, and much of the
   second-millennium vernacular corpus (Marathi, Kannada and Odia above all) remain thin.

## 5. Methodological limitations

- **Coverage bias.** The dataset is deep on selected journeys, not exhaustive. Well-edited
  Sanskrit texts and monumental, published sites dominate; oral, local and vernacular traditions
  are under-represented relative to their importance.
- **Network metrics** describe this dataset — which reflects what was researched — and are never
  evidence of religious importance or historical truth.
- **Dates** are estimates with views; the site shows the most conservative recorded view of a
  text by default and lists every view on the record. A textual date estimates composition, not
  the oldest manuscript; a material date establishes a representation, not an event.
- **Identifications** (Vāsudeva = Kṛṣṇa, Rudra = Śiva, Murukaṉ = Skanda, Oesho = Śiva) are
  assertions with evidence classes, never merges; attestation timelines follow only historical
  precursors and forms, never another major deity’s record through a theological equation.
- **AI-assisted research.** The research was carried out by AI agents working to a written
  contract, with online verification and an independent audit. It has not yet been reviewed by
  human specialists; that review (§4) is the most valuable next step.
