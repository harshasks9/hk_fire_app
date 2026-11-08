# SANATANA — Research audit (Deliverable G)

Audit date 2026-11-08, after the corrections in `research/verification-resolution.md`. The
machine audit with every warning category is `research/audit/validation-report.md`
(regenerated on each build); the independent review is `research/verification-report.md`.

## 1. What was built

| Measure | Value |
|---|---|
| Records (entities) with full, sourced records | **1,230** |
| Assertions (edges), every one sourced | **3,648** |
| Bibliography | **340** sources (159 scholarly books, 60 translations, 42 primary-text editions/e-texts, 27 journal articles, 14 institutional, 13 epigraphic corpora, 6 catalogues, 5 excavation reports, 5 tradition publications, 9 reference works) |
| Comparison tables (“what each text says”) | **31** tables, 155 rows |
| Research discoveries | **28** |
| Traditional chronology | 17 eras (kalpa → yuga), each labelled traditional |
| Records with dates / coordinates / licensed images | 493 / 192 / 60 |
| Validation errors / warnings | 0 / 5 (all five are duplicate triples asserted independently by two agents; kept as corroboration) |

Records by type: 258 characters, 159 passages, 132 historical persons, 126 texts, 111
narratives, 103 temples, 57 deities, 45 places, 38 polities, 30 traditions, 28 concepts,
27 debated claims, 26 artifacts, 21 corpora, 18 inscriptions, 18 institutions, 15 sites,
13 lineages, 5 manuscripts.

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
| Verified online (checked against an authoritative online source, URL recorded) | 2,109 | 57.8% |
| Source-checked (checked against a named scholarly source) | 821 | 22.5% |
| Reference-checked (checked only against a reference work such as Wikipedia) | 448 | 12.3% |
| Awaiting check (expert recall) | 218 | 6.0% |
| Disputed (the point itself is contested) | 52 | 1.4% |

Confidence: 2,561 high · 1,016 medium · 71 low. Evidence classes: 2,170 textual · 17
manuscript · 207 epigraphic · 250 material · 600 scholarly interpretation · 356 tradition ·
48 disputed.

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

### 3.3 Confidence distribution in practice

The textual core — Vedic, epic and Purāṇic passages — is the strongest layer: most of it is
verse-exact against critical editions. The material and temple layers are factually sound on
the sample but thinner in provenance: about half of their assertions still rest on reference
works, and the epigraphic editions they summarise (EI, CII, SII) are cited directly only for
the most important inscriptions.

## 4. Unresolved questions and areas needing specialist review

1. **Epigraphy.** Add the editions (Epigraphia Indica, Corpus Inscriptionum Indicarum, South
   Indian Inscriptions) to the class-3 assertions now reference-checked — a specialist epigraphist
   should review readings and dates for the Gupta and Chola material.
2. **Epic genealogies.** Restore verse-exact loci for the 55 lineage memberships withdrawn after
   verification (Ādiparvan 1.90–95, 1.114–115; VR 1.69; Kiṣkindhākāṇḍa).
3. **Regional loci.** 42 of 155 comparison rows remain “awaiting check”, mostly regional
   (Kampaṉ, Kṛttivāsa, Raṅganātha, Paumacariya); they need edition locators from specialists in
   Tamil, Bengali, Telugu and Prakrit.
4. **Disputed dates** recorded but not resolved: Kampaṉ (9th vs 12th c.); the Paumacariya; the
   Bhāgavata Purāṇa (6th vs 9th–10th c.); Gudimallam; Muṇḍeśvarī; Changu Nārāyaṇ (464 vs
   495/96); the Heliodorus pillar’s absolute date (Antialkidas’s reign).
5. **Earliest manuscripts** of the Rāmāyaṇa, Mahābhārata and Gītā: no verifiable record was
   found; logged as open questions rather than guessed.
6. **Temples without dated fabric**: Baidyanātha (Deoghar), Palani, Swamimalai, Tiruttani and
   Kedarnath carry only traditional dates.
7. **Śakti pīṭha and jyotirliṅga memberships**: several are disputed between rival sites; the
   graph models the dispute rather than choosing.
8. **Coverage gaps**: the Āgamas and Tantras, Northeast India, the Himalaya beyond Nepal, and
   most of the second-millennium vernacular corpus are represented only by anchor records.

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
