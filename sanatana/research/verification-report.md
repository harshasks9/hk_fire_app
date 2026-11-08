# SANATANA: independent verification and editorial review

Agent `verifier` · review date 2026-11-08 · data state as of the 10:46 build (1,229 entities, 3,640 assertions, 340 sources, 31 comparisons, 17 sacred eras, 28 discoveries)

Machine-readable findings: `research/verification-findings.json` (52 findings: 2 high, 26 medium, 24 low).

---

## 1. Scope and method

I produced none of the research under review. I read `research/AGENT-CONTRACT.md` and `schema/types.ts` first and audited the data against them. I edited nothing under `data/` or `src/`.

**Primary texts used.** I downloaded the GRETIL e-texts that the agents cite and checked verses locally with a lookup script:
- Vālmīki Rāmāyaṇa (Baroda CE), all 18 books of the Mahābhārata (BORI CE), Harivaṃśa (CE)
- Ṛgveda (Aufrecht), Śatapatha Brāhmaṇa books 1, 6, 11, 13 and 14, Bṛhadāraṇyaka, Chāndogya, Kaṭha, Śvetāśvatara and Māṇḍūkya Upaniṣads
- Bhāgavata, Viṣṇu (crit.), Matsya, Mārkaṇḍeya, Agni, Liṅga, Kūrma, Śiva, Garuḍa and Brahmāṇḍa Purāṇas
- Manusmṛti, Āryabhaṭīya, Nirukta

**Other sources fetched.** Online I checked:
- Jātaka 461 (ancient-buddhist-texts.net), the Jñāneśvarī ch. 18 and the Rāmcaritmānas (sanskritdocuments.org)
- the Tolkāppiyam with commentary (Project Madurai)
- Epigraphia Indica XI no. 31 (archive.org OCR)
- the Cleveland Museum of Art open-access API
- Wikimedia Commons image metadata, the Wikipedia API (coordinates) and Wikipedia wikitext
- general web search for currency checks (the Phnom Da Kṛṣṇa, the Ayodhyā judgment)

I inspected five user journeys in the running site with Playwright.

| Audit stream | What was sampled | How |
|---|---|---|
| Assertions, manual | **174** (vedic 25, epic 25, purana 25, regional 42, material 22, temple 35) | Seeded stratified random draw: 16 per agent from *high + verified-online + precise locator*, 5 from other high, 4 from the rest. Regional got a second draw because the first was dominated by one source. Material and temple got a second draw of class-3/4/6 claims, since they have few precise-locator assertions. Each claim and locator was checked against the text, catalogue or page. |
| Assertions, automated (quotations) | **247** SourceRefs with a Sanskrit quotation plus a VR/MBh/RV/BhP/ViP/HV locator (vedic 100, purana 76, epic 60, comparisons 11) | Does the quotation occur at the cited verse (±2)? Residual mismatches were reviewed by hand. |
| Assertions, automated (verse supports relation) | **482** epic and purana kinship/appearance/avatāra assertions with verse-precise locators | Does a name stem of either party occur within ±3 verses? All 75 flags reviewed by hand. |
| Entities | about 95 in detail (vedic 12, epic 15, purana 15, regional 15, material 28, temple 12), plus all 103 temple date sets and all 17 inscriptions | Summaries, DateClaims (system, event, certainty, basis, view), limits, identity |
| Coordinates | **191** located entities: 158 compared automatically with the coordinates of the Wikipedia article each record cites, 33 spot-checked by hand | Great-circle distance |
| Images | **60/60** | Commons `extmetadata` licence and artist vs. the record; Cleveland CC0 via API |
| Identity | Name/alias collision scan over all entities, plus targeted checks (Janakas, Bharatas, Nalas, Rādhās, Vasudeva/Vāsudeva, Laṅkā, Murukaṉ/Skanda, Iḍā/Ilā, Manu/Satyavrata) | Graph queries |
| Dates | All **91** `secure` DateClaims; every temple's legend vs. fabric dates; the "earliest material date" placement rule | Data review plus `src/lib/meta.ts` (read only) |
| Comparisons | **9 tables, 24 rows** (Kṛṣṇa portrayal, Kumbhakarṇa, churning, flood story, yuga lengths, Sītā abduction, Sītā parentage, Murukaṉ–Skanda, Manu's fish) | Rows checked against the texts; scanned for privileging language |
| Sacred chronology | All 17 eras; more than 20 numeric and locator checks | Manu 1.69–72, 1.79; ViP 1.3, 4.24; BhP 3.11; MatsP 2, 47; VR 1.44; MBh 12.224 |
| Sources | About **70** bibliographic records reviewed for existence, author, year and publisher; **75** source URLs requested | Expert knowledge plus HTTP status |
| Discoveries | **All 28** | Each claim traced to its assertions, the texts and the graph's own comparison tables |

---

## 2. Results summary

### 2.1 Assertions, by agent (manual sample)

| Agent | Checked | Claim correct | Locator wrong | Status/confidence overstated | Notes |
|---|---|---|---|---|---|
| vedic | 25 | 25 | 0 | 0 | All ŚB/RV/Up. locators and quotations reproduce exactly |
| epic | 25 | 25 | 1 (secondary locator, epic:354) | 0 | The failure belongs to a larger bulk-locator cluster (§3.2) |
| purana | 25 | 25 | 0 | 0 | BhP 1.3 avatāra numbering, ViP 4.10, MatsP 53, MkP 82/85 all reproduce |
| regional | 42 | 42 | 0 | 0 | Jātaka 461, Jñāneśvarī colophons, Mānas, Tolkāppiyam verified online; 1 low institution-label issue (regional:430) |
| material | 22 | 22 | 0 | 2 (Wikipedia-only, verified-online/high) | Cleveland accessions 1930.331 / 1973.106 / 1977.62 exact |
| temple | 35 | 35 | 0 | 17 (Wikipedia-only, verified-online/high) | Facts right; provenance thin |
| **Total** | **174** | **174** | **1** | **19** | |

### 2.2 Automated checks

- **Quotations at locator:** 247 tested, 247 found at the cited place.
  - The 18 raw mismatches were all artefacts on review: sandhi joins, cross-chapter ranges, or GRETIL typos (e.g. *īśayaḥ* for *ṛṣayaḥ* at BhP 1.1.4).
  - One quotation is not verbatim: it trims *cāham* to *ca* (vedic:141).
  - No fabricated quotation was found.
- **Verse names the related figure:** 482 tested, 75 flagged.
  - The 21 purāṇa flags are false positives: avatāras named by form, e.g. *saukaraṃ vapuḥ*.
  - Of the 54 epic flags, about **28 are genuine**. Every one lies in the bulk-generated MEMBER_OF block epic:335–389, where a single verse that does not name the member was copied across a whole lineage. The rest are epithet false positives (Ambikā as *Kausalyā*, Lava and Kuśa as *śiṣyau*, and so on).

### 2.3 Other streams

| Stream | Result |
|---|---|
| Coordinates (191) | 158/158 within 2 km of the cited Wikipedia article (151 identical to 4 decimals; maximum 1.98 km, Hazāra Rāma vs. Hampi). 33 hand checks: no error. Note: agreement with Wikipedia is consistency, not independent survey, but the sites are well established. |
| Images (60) | 57/57 Commons licences and credits match Commons metadata exactly; 3 Cleveland images are CC0 per the CMA API. |
| Identity | No wrong merges found. Janaka (epic) / Janaka of Videha (vedic) are split, with the conflation modelled as `claim:janaka-videha-sita-father`. Two Bharatas, two Nalas, two Rādhās and Vasudeva/Vāsudeva are split. Laṅkā is a narrative place; Murukaṉ and Skanda are two ids joined by IDENTIFIED_WITH. All **180** AVATARA_OF/FORM_OF/IDENTIFIED_WITH assertions carry a `text` or `tradition` qualifier. One over-strong identification (epic:413) and one missing link (Iḍā/Ilā). |
| `secure` dates (91) | 84 justified (dated inscriptions, colophons, UNESCO records, modern events). 7 problematic: Changu Nārāyaṇ, Prambanan and Āryabhaṭīya are mis-scoped or overstated; Tirumala 1517 has a single source; Somnath, Mahākāleśvara and Koṇeśvaram are destruction events that drive map placement. |
| Legend vs. fabric | All 45 temples with founding legends keep a separate `traditional` DateClaim; no legendary founder is stored as a material date. |
| Contested archaeology | Paśupati seal, Dwarka, Rāma Setu, Gudimallam, PGW–Mahābhārata, Purana Qila and Hastinapur flood are all class 7 / disputed, with SUPPORTS and CONTRADICTS evidence and good `limits`. The defects are in **date placement**, not in labelling (§3.3). |
| Comparisons (24 rows) | 24/24 statements accurate. 2 VR rows lack CE locators (supplied in the findings). No version is presented as authentic. 34 of 45 regional rows are still `recall`. |
| Sacred chronology | All 17 eras say "Traditional chronology … not a historical or scientific chronology". Every figure checked reproduces: Manu 1.69–72 and 1.79; ViP 1.3.11–13, 15, 18–21 (852,000 divine = 306,720,000 human years), 1.3.26–28; ViP 4.24.33–34 (360,000; 1,200 divine). **No findings.** |
| Copyright | 523 quotations, maximum 113 characters. The only English quotations are from Kielhorn (1900–01) and Rouse's Jātaka translation (1901), both public domain. The Āryabhaṭīya quotation reproduces GRETIL's sandhi-dissolved e-text faithfully. **No copyright issue**; one citation mis-attribution (Rouse cited as Fausbøll). |
| Language and bias | A regex scan of all summaries, details and rationales found no dismissive or devotional-as-fact language. Somnath, Kāśī and Rāma Setu are neutral and well sourced (Thapar, Eck). The Ayodhyā record omits key facts (§3). |
| Sources | About 70 records reviewed: all real works with correct authors, years and publishers as far as I can determine; I found no fabricated publication. URLs: 60/75 return 200; 10 return 403 (sacred-texts.com, UNESCO, PhilArchive: bot blocks, the sites exist); 1 returns 405; 4 have connection failures (namami.gov.in, museumsofindia.gov.in, shreejagannatha.in, plus a Leiden URL that resolves when percent-encoded). 7 bibliography entries are unused. |
| Discoveries (28) | 15 pass; 2 contain a factual error (high); 6 overclaim or misstate (medium); 5 minor (low). |

### 2.4 Estimated error rates

| Defect | Rate | Basis |
|---|---|---|
| Substantive factual error in an assertion | **0/174** (95% upper bound ≈ 1.7%) | Manual sample; corroborated by 247/247 quotations |
| Locator does not support the claim | 1/174 manual (0.6%); about 28/482 automated (5.8% of verse-precise relational locators, ≈ 0.8% of all assertions) | Concentrated in one cluster, epic:335–389 |
| Status or confidence overstated (Wikipedia-only yet `verified-online`/high) | 19/174 sample (19/57 of material+temple); **347/3,640 dataset-wide (9.5%)**: 180 temple, 167 material (≈ 39% of those two domains) | Full-dataset count |
| Discovery with a factual error / with any substantive problem | 2/28 (7%) / 8/28 (29%) | All 28 audited |

**Overall judgement.** The textual core (Vedic, epic and Purāṇic locators and quotations) is unusually accurate, and I could reproduce it essentially without exception. The weaknesses lie elsewhere:
- **provenance inflation** in the material and temple domains;
- **one bulk-locator cluster** in the epic lineage edges;
- a set of **date records whose numeric `start`** (a disputed early proposal, a destruction, a cult attestation) makes the time machine and the entity headlines show things earlier or more certain than the record's own text says;
- **curated discoveries** that in places say more than the graph supports, or contradict it.

---

## 3. Findings

### 3.1 High severity (all)

| # | Target | Issue | Evidence | Fix |
|---|---|---|---|---|
| H1 | `disc:flood-fish-brahma` | "Only in the Matsya and Bhāgavata Purāṇas does [the fish] become Viṣṇu's first avatāra" is false: the Agni Purāṇa narrates the fish as Hari saving Manu (AgP 2) and opens its ten-avatāra list with Matsya (AgP 49.1). The graph's own `cmp:flood-story` has an AgP row. In BhP 1.3 the fish is 10th, not first. | GRETIL AgP `ap_2.002` *matsyāvatāraṃ vakṣye … hareḥ*, `ap_49.001`; BhP 1.3.15 | "In the Purāṇas (Matsya 1–2, Agni 2, Bhāgavata 8.24) it is Viṣṇu; in ten-avatāra lists such as AgP 49 it stands first." |
| H2 | `disc:oesho` | States that Wima Kadphises' coins bear the Bactrian legend ΟΗϷΟ. They do not: the label begins with Kaniṣka I. The graph's own `art:wima-kadphises-coin` says so. | `data/entities/material.json`; [Oesho](https://en.wikipedia.org/wiki/Oesho) | Limit the ΟΗϷΟ statement to Kaniṣka I and successors; describe Wima's deity as unlabelled. |

No high-severity error was found in the assertion, entity, comparison or sacred-chronology data themselves.

### 3.2 Medium severity (all)

**Provenance and status (systemic)**
- **M1 `temple:258` (and 233 other temple assertions):** 244/439 temple assertions rest only on Wikipedia; 234 are `verified-online` and 180 high, including 51 class-3 (epigraphic) claims. This breaches contract §3.2–3.3. The facts I sampled are right.
- **M2 `material:340` (and 228 others):** the same pattern; 229/454 material assertions, 71 of them class 3, e.g. the Aihole and iron-pillar edges without Kielhorn or Fleet.
- **M3 `text:vikramarjuna-vijaya` (and 92 other regional entities):** `recall` status yet `high` confidence, 25 with precise dates. 34 of 45 regional comparison rows are `recall`.

**Bulk-assigned epic locators (the verse does not name the member; all verified-online/high)**
- **M4 `epic:362`:** MBh (CE) 1.1.8, Janamejaya's snake sacrifice, is cited for all the Pāṇḍavas (epic:362–369).
- **M5 `epic:374`:** MBh 1.104.1, 1.211.8 and 1.61.73 are cited for 12 Yādavas (epic:374–385).
- **M6 `epic:337`:** VR (CE) 1.1.8, which names only Rāma, is cited for Daśaratha, Bharata, Lava and Kuśa (epic:335–341).
- **M7 `epic:349`:** VR 4.25.32 and 4.65.8 are cited for Vālin, Sugrīva, Tārā, Aṅgada and Kesarin (4.65.8 is about Añjanā); epic:349–355.
- **M8 `epic:358`:** MBh 1.61.69 (names Bhīṣma) is cited for the Kurus; MBh 1.128.15 (Pañcāla territory) for Drupada's family (epic:356–361, 386–389).

**Identity and evidence class**
- **M9 `epic:413`:** "Kṛṣṇa IDENTIFIED_WITH Vāsudeva (deity of early inscriptions)" is class 1/high on the basis of name usage. Identity with the *inscriptional* deity is a class-5 inference (cf. epic:414, material:66).
- **M10 `material:66`:** a class-5, Wikipedia-only edge makes the Agathocles coins Kṛṣṇa's headline "earliest dated object" (c. 190–180 BCE) on `#/entity/char:krishna`, with no flag that two identifications are involved.
- **M11 `deity:shiva`:** has no attestation edge to the Śvetāśvatara Upaniṣad, the Mahābhārata or any major Purāṇa. The entity page therefore gives the Vālmīki Rāmāyaṇa's expansion layer as Śiva's "earliest dated text", which breaks journey (b).

**Dates whose numbers mislead**
- **M12 `temple:changu-narayan`:** "construction 464 CE, secure" is a pillar inscription, not construction (the pagoda dates to c. 1702). The material agent's own record treats the 464 equation as conventional, with a disputed 495/496 alternative.
- **M13 `temple:pashupatinath`:** a cult attestation (5th–8th c.) is stored as `surviving-structure`, so the building (1692) appears on the 400 CE map.
- **M14 `art:elephanta-sadashiva`:** the disputed "5th–9th c. (older proposals)" has start 400, so the Sadāśiva appears at 400 CE instead of c. 525–575.
- **M15 `temple:somnath`** (also Mahākāleśvara, Koṇeśvaram): destruction events (1026, 1234, 1622) are the earliest material dates, so destroyed temples are plotted as surviving fabric.
- **M16 `art:gudimallam-linga`:** all dates are disputed, and the earliest (3rd c. BCE, from Doniger's general survey) is the unqualified headline on the Śiva page.
- **M17 `temple:mundeshwari`:** the minority "108 CE (if Śaka)" reading places it as the map's oldest structural temple.
- **M18 `site:dwarka-offshore`** (also `site:hastinapura-excavation`): Rao's disputed c. 1500 BCE date places the offshore remains, against the majority historical-period dating.
- **M19 `temple:prambanan`:** the 856 CE consecration is `secure`, though the Śivagṛha inscription's attribution to the compound is argued (de Casparis).

**Neutrality**
- **M20 `temple:ram-mandir-ayodhya`:** says the Rām Lallā image was "installed in 1949" and the mosque "demolished" in 1992. It omits that the image was placed inside the mosque on 22–23 December 1949. It also omits the 2019 judgment's characterisation of these acts (the demolition "an egregious violation of the rule of law"), and that title was decided on evidence of possession. ([LiveLaw report](https://www.livelaw.in/top-stories/babri-mosque-demolition-an-egregious-violation-of-the-rule-of-law-wrong-committed-must-be-remedied-sc-read-judgment-149643))

**Discoveries**
- **M21 `disc:legend-vs-fabric`:** gives Kāśī Viśvanātha's "surviving fabric" as 1585, but that temple was demolished in 1669 and the present building is 1780. The pre-600 count includes Paśupatinātha (a cult date) and Muṇḍeśvarī (the minority date). "17" is not reproducible: I get 16 or 19 depending on the threshold.
- **M22 `disc:sita-parentage`:** the generalisation "set adrift because of an omen" holds only for the Ramakien. The graph's own Adbhuta, Guṇabhadra and Lao rows say otherwise.
- **M23 `disc:mayon-ceyon`:** "their equation with Viṣṇu and Skanda is a later gloss" is contradicted by Caṅkam texts and by the graph's own `cmp:murugan-skanda` (convergence "by the late Caṅkam period").
- **M24 `disc:ahilyabai`:** "the buildings pilgrims enter are largely hers" is false for Somanātha (1951 temple; hers is a separate 1783 temple) and for Aundha (13th-c. fabric). The scare quotes around "ancient" read as dismissive.
- **M25 `disc:vasudeva-before-the-epic`:** the title asserts worship "from Bactria" on the strength of a class-5 coin identification and a hoard findspot.
- **M26 `disc:proto-shiva`:** claims the atlas never lets a disputed claim set an "earliest attestation", but Śiva's headline earliest object is a disputed Gudimallam date.

### 3.3 Low severity (summary)

24 low findings:
- **Locators** (5):
  - epic:372 cites the son Duḥśala for the daughter Duḥśalā.
  - Missing VR CE locators that I can supply: VR (CE) 3.47.16 for the abduction, 1.65.14 for the furrow.
  - cmp:manu-fish-identity rows are left at `recall` though verified in cmp:flood-story.
  - disc:avatara-lists' Agni claim is true only of AgP 49.
- **Citation** (4):
  - Rouse's 1901 translation is cited as Fausbøll 1871 (regional:265, 268).
  - The GRETIL ŚB directory URL returns 403 though marked checked.
  - One non-verbatim quotation (vedic:141).
  - temple:brihadisvara is accurate but thin: 5 edges, inscriptions not modelled.
- **Dates** (4):
  - Āryabhaṭīya "composition 499, secure": 3.10 gives his age, not the composition date.
  - Tirumala: a 966 gift is stored as "construction"; the 1517 date rests on a single Wikipedia sentence.
  - Mỹ Sơn and Vat Phou are placed at their foundation or site history (4th–5th c.), not their surviving fabric.
  - Śaṅkaradeva's hagiographic 1449–1568 lifespan is given as fact.
- **Identity** (3):
  - inst:unesco is labelled "World Heritage Centre" for ICH records.
  - No IDENTIFIED_WITH between char:ida and char:ila.
  - vedic:305 infers parentage from a matronymic at class 1/high.
- **Geography** (1): narrative Laṅkā carries Sri Lanka coordinates. It is labelled traditional, but the atlas plots it.
- **Bias or overclaim in summaries** (2):
  - Hanumān is "Rāma's foremost devotee" in a Vālmīki-based summary.
  - Śiva is "continuous with the Vedic Rudra" stated without qualification.
- **Factual** (2):
  - concept:padal-petra-sthalam says 276 shrines where text:tevaram says 275.
  - disc:network's counts differ from the entity pages (Kṛṣṇa 21 vs. 20).
- **Discovery wording** (3): disc:grammarians (Pāṇini attests devotion, not performance), disc:jnaneshwari-edition ("critical edition" is anachronistic), disc:angkor-prambanan (unsourced superlative).

### 3.4 Discoveries that passed

The following were traced to their texts or editions and hold as written:
- `disc:spitzer`: Kizil 1906; Berlin (SHT 810) and British Library fragments; radiocarbon 80–230 CE.
- `disc:aihole`: Śaka 556 / 3735 years; Kālidāsa and Bhāravi.
- `disc:devi-mahatmya-on-stone`: EI XI no. 31 confirms the editor's identification at line 11 of MkP 91.9, *sarvamaṅgalamāṅgalye*.
- `disc:draupadi-garment`: CE 2.61.40–41 against star passages *542–*547.
- `disc:ramopakhyana`: 3.271.16 *taṃ brahmāstreṇa saumitrir dadāha*; 3.260.5; 3.275.
- `disc:svetasvatara`.
- `disc:ganga-rigveda`: RV 10.75.5; 6.45.31.
- `disc:sb-frame-figures`: ŚB 13.5.4.
- `disc:five-fires`.
- `disc:maya-sita`: Mānas caupāī verified.
- `disc:triyampawai`.
- `disc:conquest-architecture`.
- `disc:eran`.
- `disc:mahapurana-insertion`: ViP 3.6.23*8 confirmed.
- `disc:jyotirlinga-network`: 7 of the 15 claimants are of 1700 or later, reproducible.

---

## 4. Journey-by-journey assessment

**(a) Vālmīki Rāmāyaṇa → Hanumān → dated depiction → figure timeline: passes.**
- `#/entity/char:hanuman` shows his parentage with verified VR (CE) 4.65 locators and quotations, the Mahābhārata meeting with Bhīma (3.147.4 verified), and 12 text attestations, each dated with its scholar's view.
- The earliest dated object is the Deogarh plinth panels (c. 425–525 CE): Hanumān carrying the herb mountain, per Vats 1952 via Wikipedia.
- `#/time?mode=figure&subject=char:hanuman` explains that a textual date is a composition estimate and a material date is not evidence of events.
- Minor: the summary's "foremost devotee" framing (low).

**(b) Śiva → Rudra/Śvetāśvatara → Purāṇas → temples and inscriptions: partly broken.**
- The Rudra→Śiva identity is correctly modelled: four IDENTIFIED_WITH edges, text- or tradition-qualified.
- Śiva reaches 53 temples and 2 inscriptions (Udayagiri Cave 8, Śivagṛha).
- But the Śiva page lists no Upaniṣad, Mahābhārata or major-Purāṇa attestation, so "earliest dated text" falls back to the Vālmīki expansion layer (M11).
- "Earliest dated object: 3rd century BCE, Gudimallam" presents a disputed minority date without qualification (M16).
- The Kuṣāṇa Oesho is correctly kept separate from Śiva.

**(c) Kṛṣṇa across the Mahābhārata, Harivaṃśa and Bhāgavata: passes.**
- `cmp:krishna-portrayal` checks out row by row: MBh 1.61.90 *tasyāṃśo … vāsudevaḥ*; 1.189.31 the two hairs; HV 48.11; ViP 5.1.60–64; BhP 1.3.28 *kṛṣṇas tu bhagavān svayam*; BhP 2.7.26 *kalayā sitakṛṣṇakeśaḥ*.
- The entity page's narrative locators are correct (2.42.21 Śiśupāla, 16.4–5).
- It states clearly that identity with the inscriptional Vāsudeva is argued.
- Weakness: the headline "earliest dated object c. 190–180 BCE" comes from a class-5 coin identification (M10, with epic:413 at M9).

**(d) Material time machine at 400 CE: misleading in places.**
- 30 of 151 records are visible.
- Correctly shown: Udayagiri (Cave 6 GY 82 = 401/402 CE), the iron pillar and Tigawa.
- Shown anachronistically: Elephanta Sadāśiva (M14), Paśupatinātha (M13), Mỹ Sơn and Vat Phou (low).
- The cause is systematic: the site places every record at the minimum `start` of all its material DateClaims, including disputed early proposals, destructions and cult attestations (`src/lib/meta.ts` `materialDate`). The page caption ("earliest material date of the surviving structure or object") is therefore not true of every point.

**(e) `temple:brihadisvara` as a starting point: accurate but shallow.**
- 1003–1010 construction; 1010 consecration on the 275th day of regnal year 25, from SII II; UNESCO 250 (1987, extended 2004); coordinates correct; CC BY-SA image correctly credited.
- Only five relationships: none of its inscriptions or bronzes is a node, so the user cannot walk to the epigraphic evidence the page describes (low).

---

## 5. Systemic issues and recommendations

1. **Provenance inflation in the material and temple domains.** 347 high-confidence `verified-online` assertions cite only Wikipedia. The facts are generally right, but the status misrepresents how they were checked, and class-3 claims lack an epigraphic edition. *Recommendation:* add the edition or scholarly work cited in the underlying Wikipedia footnote (Fleet CII III, Kielhorn EI, SII, Michell, Harle, Thapar), or downgrade to `source-checked`/`recall` and `medium`. The validator could warn when a class-3 or high-confidence assertion has only `reference`-type sources.
2. **Bulk-assigned locators.** The epic MEMBER_OF block (epic:335–389) reuses one verse per lineage. *Recommendation:* re-locate each member, or use coarse locators with `source-checked`. The name-in-window test used here can serve as a CI check.
3. **DateClaims whose numbers outrun their labels.**
   - Disputed early proposals, destruction or occupation events, and cult attestations carry numeric `start` values under system `material`, and the UI takes the minimum.
   - *Recommendation (data):* put destructions and attestations under `reception`; drop the numbers from minority or "older proposals" claims; give each record one preferred placing date.
   - *Recommendation (site team):* skip `disputed` claims and non-fabric events when choosing placement and headline "earliest" dates, and mark headlines that rest on disputed claims or class-5 identifications.
4. **Discoveries generated ahead of the evidence.** Several discoveries contradict the graph's own records (H1 vs. `cmp:flood-story`, H2 vs. `art:wima-kadphises-coin`, M23 vs. `cmp:murugan-skanda`, M22 vs. `cmp:sita-parentage`, M26 vs. the Śiva page), or use computed numbers that do not match the data (M21, `disc:network`). *Recommendation:* every sentence in a discovery body should map to a cited assertion or comparison row; regenerate counts from the same functions the pages use; route discoveries through the same review as assertions before publication.
5. **Regional status honesty is good but leaves much unverified.** The regional agent marks its work `recall` honestly, but 93 recall entities are rated `high`, and 34 of 45 comparison rows are unchecked. *Recommendation:* lower confidence until checked, and prioritise the rows that discoveries depend on.
6. **Coverage gaps that distort journeys.** Śiva lacks Upaniṣadic, epic and Purāṇic APPEARS_IN edges; Bṛhadīśvara has no inscription nodes. Absence of an edge silently changes the computed "earliest attestation". *Recommendation:* for the major deities and figures, ensure attestation edges for each corpus that the page summary itself mentions.
7. **What is working and should be kept.**
   - The GRETIL-anchored textual work is exemplary: 247/247 quotations at the cited verse.
   - Disagreement is preserved, and the comparison tables are neutral.
   - The legend/fabric separation is applied to all 45 temples with founding legends.
   - Contested archaeology is uniformly class 7 with both supporting and contradicting evidence.
   - The sacred chronology is correctly bracketed as traditional, with the figures right.
   - Image licences are right; no copyright exposure.

---

## 6. What I could not check, and why

- **Print-only scholarly sources** (Witzel, Olivelle, Brockington, Sircar 1973, Kulkarni 1990, Olsson 1968, Pou 1977, Hart & Heifetz 1988, etc.): not accessible. `source-checked` claims that depend only on them were judged for plausibility, not page-verified.
- **Non-GRETIL primary texts:** Kamba Rāmāyaṇam, Paumacariya, Uttarapurāṇa, Adhyātma and Adbhuta Rāmāyaṇas, Ramakien, Reamker, Phra Lak Phra Lam, Hikayat Seri Rama, Tēvāram, Periya Purāṇam. No checkable e-text was fetched in time, so the regional `recall` rows on these remain unverified by me as well.
- **Inscription editions** beyond EI XI no. 31: Fleet CII III, Kielhorn EI VI and SII II readings were compared with standard published readings from memory and with Wikipedia transcriptions, not with page images.
- **Sites that refuse automated access:** sacred-texts.com (403), UNESCO WHC pages (403), PhilArchive (403), namami.gov.in, museumsofindia.gov.in and shreejagannatha.in (connection resets). I verified the UNESCO ICH dates from memory of the lists, not by fetching.
- **Coordinates:** independently confirmed only against Wikipedia and general geographic knowledge, not against ASI or survey data. 151 of 158 records are identical to the Wikipedia values, so a Wikipedia error would propagate undetected.
- **Network metrics** (betweenness, community structure) in `disc:network`: only text counts were recomputed.
- **The 18 GRETIL e-text typographical variants** I encountered (e.g. BhP 1.1.4, HV 47.49) were not collated against printed editions.
