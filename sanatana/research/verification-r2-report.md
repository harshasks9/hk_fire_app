# SANATANA round 2: independent verification and editorial review

Agent `verifier` · review date 2026-11-08 · data state at HEAD `88c9159`

The round-2 additions under review:

| Records | Round 2 | Dataset total |
|---|---|---|
| Entities | 1,503 | 2,733 |
| Assertions | 4,559 | 8,207 |
| Sources | 353 | 693 |
| Comparison tables (rows) | 42 (182) | 73 |
| Discoveries | 10 new | 38 |

Upgraded round-1 records were also reviewed. `npm run validate` reports 0 errors and 5 warnings, all in round-1 regional files.

Machine-readable findings: `research/verification-r2-findings.json` (25 findings: 0 high, 11 medium, 14 low).

---

## 1. Scope and method

I produced none of the research under review. I read `research/AGENT-CONTRACT.md`, `research/AGENT-CONTRACT-R2.md`, `schema/types.ts`, the seven round-2 agent reports and the round-1 audit. Round-1 baselines were taken from commit `157471b` (round 1 with all findings resolved) and diffed against HEAD to identify the upgrades. I edited nothing under `data/`, `src/` or `scripts/`.

**Primary texts.** I downloaded 100 GRETIL plaintext e-texts afresh, covering every GRETIL source that a round-2 quotation cites. I reused my round-1 copies of the MBh CE, VR CE, HV and Purāṇas. I also fetched:
- the Würzburg Bhāsa Project e-texts of the Ūrubhaṅga, Karṇabhāra, Pratimānāṭaka act 3, Madhyamavyāyoga and Dūtavākya;
- the Project Madurai Maduraikkāñci;
- Sanskrit Wikisource pages (Brahmavaivarta 3.12, Devībhāgavata 1.5).

**Other sources fetched:**
- Museum APIs: Met Collection API, Art Institute of Chicago, Cleveland Open Access, V&A v2.
- DHARMA/Dharmalekha editions: Bilsad, Eran pillar, Eran boar, Udayagiri Cave 8, Aihole.
- archive.org OCR of Sircar, *Select Inscriptions* (1965), and Kane, *HDS* V.1 (1958), with page headers mapped to lines.
- OpenStreetMap Nominatim for coordinates.
- Wikimedia Commons file pages and Wikipedia, through WebFetch.

**Blocked sources.**
- The Wikimedia APIs (Wikipedia, Wikidata, Commons) returned HTTP 429 to scripts all session. The automated coordinate comparison against Wikipedia that I ran in round 1 was therefore replaced by OpenStreetMap and hand checks.
- UNESCO ICH pages serve a CAPTCHA, so inscription years were checked against news reports and my knowledge of the lists.

| Audit stream | Sample | How |
|---|---|---|
| Assertions, manual | **154**: 22 per agent × 7 | Seeded stratified draw per agent: 14 from verified-online/high with a precise locator or quotation, 5 from the other high-confidence assertions, 3 from the rest. Each claim and locator was checked against the e-text, museum API, epigraphic edition or page. |
| Quotations, automated | **1,210** SourceRefs with a `quote`: all round-2 assertions, entities (incl. DateClaims) and comparison rows, plus epic:335–389 | Normalised search in the cited e-text, then: is the quotation at the cited locator? GRETIL vowel-sandhi-dissolved texts (Bṛhat Saṃhitā) were matched on a consonant skeleton. Every mismatch was reviewed by hand. |
| Name-in-window | **443** round-2 epic and Purāṇa kinship, participation and appearance edges with verse-precise MBh/VR/BhP/ViP/HV locators, plus the 49 testable restored genealogy edges | Does a name stem of the subject (or related figure) occur within ±3 verses? All 85 flags reviewed. |
| Restored genealogy locators | **55/55** quotations machine-checked; **15** read in full | epic:339, 342, 344, 349, 353, 362, 368, 369, 375, 376, 378, 384, 385, 386, 388 |
| Upgrades | **15** material (of 58) and **10** temple (of 107) | Read against Sircar OCR, DHARMA editions and the agent's added sources |
| Entities | **77** read in full (11 per agent), plus **all** 79 round-2 `secure` DateClaims, **all** 29 records placed only by disputed material dates, and a legend/fabric scan of all round-2 dates | System, event, certainty, view, basis, limits |
| Museum objects | **65** links: 55 Met/AIC/CMA via API, 10 V&A | Accession number, date and public-domain status vs. the record |
| Coordinates | **70**: 40 judged by hand, 30 compared with OpenStreetMap | Distance; precision label |
| Images | 43 museum images (CC0 confirmed in API) + 5 of 40 Commons files | Licence and credit |
| Identity | Name/alias collision scan over **all 2,733** entities; shared-Wikipedia-article and identical-coordinate scans; targeted searches | Duplicates across agents |
| Comparisons | **26 rows** in 9 of the 42 new tables | Rows vs. texts |
| Discoveries | **All 10** new | Claims traced to assertions, texts and the graph's own records |
| Sensitive material | Festivals' origin edges (all 35 trad→narrative/figure ASSOCIATED_WITH; 102 →trad edges), the Ayodhyā excavation, diaspora and sect records, a loaded-language regex over all round-2 prose | |

---

## 2. Results

### 2.1 Assertions, by agent (manual sample)

| Agent | Checked | Claim correct | Locator does not support the subject | Status/confidence overstated | Notes |
|---|---|---|---|---|---|
| vedic | 22 | 22 | 0 | 0 | YS, BS, SK, MS, ĀpDh, KaivU, ĪPK locators all reproduce |
| epic | 22 | 22 | 2 (epic:r2-486, r2-574) | 0 | Both are instances of the anchor-verse pattern (§3.1, M1) |
| purana | 22 | 22 | 0 | 0 | BhP 9.9.18 Damayantī, BhP 9.7.4, ViP 4.4.26, MkP 88.14, Wikisource BVP/DBhP confirmed |
| regional | 22 | 22 | 0 | 1 (regional:r2-411, Wikipedia-only/high) | Kane HDS V.1 page numbers (pp. 199, 205, 222, 239) confirmed in the OCR |
| material | 22 | 22 | 0 | 0 | All accessions exact; Sircar bk. II no. 67 pp. 175–79 confirmed |
| temple | 22 | 22 | 0 | 0 | Honest `reference-checked`/medium throughout; provenance thin |
| iconography | 22 | 22 | 0 | 4 (iconography:667, 37, 41, 101: Wikipedia-only/high) | BS and AP verses reproduce |
| **Total** | **154** | **154** | **2** | **5** | |

### 2.2 Automated checks

**Quotations (1,210):**

| Agent | Quotations | Confirmed | Not checked |
|---|---|---|---|
| epic | 582 | 568 | 14 Bhāsa quotations from plays not downloaded |
| vedic | 276 | 271 | 5 sanskritdocuments |
| purana | 216 | 186 | 28 Wikisource, 2 others |
| iconography | 134 | 134 | 0 |
| regional | 2 | 0 | 2 (Shah 1917) |
| **Total** | **1,210** | **1,159** | **51** |

**No quotation is fabricated or misplaced.**
- **Machine-confirmed at the locator: 1,027.**
- **77 apparent mismatches were all artefacts:**
  - cross-chapter ranges (e.g. "BhP 10.29.1–10.33.39");
  - prologue or colophon locators;
  - e-texts without verse markers (MBTN, BSBh, Āpastamba, Mitākṣarā). For these, 12 vedic locators were confirmed by hand, e.g. MBTN 1.68, ĀpDh 2.9.21.1, BDh 2.6.11.27, NS 2.1.69.
- **9 "not found" were GRETIL typos or sandhi normalisations by the agents**, all present at the locator: AP 48.13 *ādimūttir*, AP 49.16 *tārkṣe*, VāmP 44.95 *īsena*, BS 57.41 *paṇkaja*, BS 57.53 bracketed variant.
- **Bhāsa Project: 42/42 quotations found** in the Würzburg e-texts.
- **Wikisource: 4/4 spot-checked lines found**: BVP 3.12.6, 3.12.17; DBhP 1.5.2, 1.5.25.

**Name-in-window (443 tested, 83 flagged):**
- All 38 Purāṇa flags are false positives: the prose of ViP 4.2–4.4, where the names appear after the marker, and *māṃdhātā* spelt with ṃ.
- **About 36 of the 45 epic flags are genuine.** All are PARTICIPANT_IN edges that cite one verse of a narrative for every participant (M1).

**The 55 restored genealogy locators: pass.**
- 109/109 quotations at locator.
- 49/49 testable edges name the member within the window. The two flags (epic:368, 369) are prose lines with uppercase A/B markers, and do name Parikṣit and Janamejaya.
- 15 read in full, e.g. VR 1.19.15 *paulastyavaṃśaprabhavo rāvaṇo*; 4.45.8 *tārā ca rumayā saha*; MBh 1.104.1 *śūro nāma yaduśreṣṭho vasudevapitābhavat*; 1.121.10; 5.168.1; 3.287.23.
- The round-1 defect M4–M8 is fixed in these 55 records. It recurs, however, in the epic agent's new PARTICIPANT_IN edges (M1).

### 2.3 Other streams

| Stream | Result |
|---|---|
| **Material upgrades** (15 of 58) | **15/15 correct.** Checked against the DHARMA editions and the Sircar 1965 OCR: <ul><li>Eran pillar: *mahārāja-mātṛviṣṇunā … anujena … dhanya-viṣṇunā*.</li><li>Eran boar: *… śilā-prāsādaḥ … airikiṇe kāritaḥ* by Dhanyaviṣṇu.</li><li>Udayagiri 8: *kautsaś śāba … vīrasenaḥ*.</li><li>Bilsad: *ṣaṇ-ṇavate … svāmi-mahāsenasyāyatane*.</li><li>Aihole: the bibliography gives Fleet 1876 (IA 5, pp. 175–177) and 1879 (IA 8, pp. 237–245).</li><li>Sircar: "Cf. Mbh., V, 43, 22" (Heliodorus B); "From a well at Mora, 7 miles from Mathura"; Nāṇeghāṭ pp. 192–197.</li></ul> These upgrades fix the round-1 class-3 provenance problem for the core early inscriptions. |
| **Temple upgrades** (10 of 107) | 10/10 claims correct, but the status basis is weak: the books were "not opened" (M5). The 47 verified-online→reference-checked downgrades are honest. |
| **Museum accessions** (65 links) | **0 errors.** All 55 Met/AIC/CMA accession numbers match the APIs exactly, e.g. Met 1982.220.10 Somāskanda, AIC 1985.1108, CMA 1960.53, CMA 2025.7. All 10 V&A numbers match the V&A API: IS.121-1955 (Banwari the Younger), CIRC.243-1922, IM.88-1930, IS.2-1970, IS.7-1970, IM.75-1927, IS.77-1965. Dates agree with the museum dating; one internal inconsistency is noted (L, art:vasudeva-i-coin-cma). |
| **Images** (48 checked) | 43/43 museum images are public domain or CC0 per the API. 5/5 Commons licences and authors match the file pages, including the two "Public domain" releases (Nathdwara, Phanom Rung). Every round-2 image has url, page, credit and licence. |
| **Coordinates** (70) | **0 errors.** 22 of 30 OpenStreetMap hits fall within 0.7 km, among them Simhachalam 0.01 km, Akshardham Delhi 0.01, BAPS Abu Dhabi 0.04, Taleju 0.01, Phnom Bakheng 0.05, Vaiṣṇo Devī 0.15 and Har kī Pauṛī 0.00. Kanaka Durgā is 1.6 km off but labelled approximate. The remaining OpenStreetMap hits were wrong geocodes, not data errors. The 40 hand checks found no misplacement. One low finding: Rāsmañca carries Jor Bangla's coordinates. |
| **Identity** | **2 cross-agent duplicates** (M2, M3): <ul><li>char:maya-asura (purana-r2) = char:maya-danava (epic).</li><li>char:vasishtha-cow (purana-r2) = char:nandini-cow (epic-r2).</li></ul> One ambiguous naming: Amṛtabindu / Amṛtanāda / Brahmabindu. Disambiguated correctly: <ul><li>three Ambarīṣas, four Bharatas, two Patañjalis, two Jayadevas;</li><li>Sañjaya (MBh) vs Sañjaya of Mataram; Vasudeva vs Vāsudeva (deity) vs Vāsudeva I (Kuṣāṇa);</li><li>the two Revākhaṇḍas, Raṅganātha ↔ Anantaśayana (IDENTIFIED_WITH), Yamunā river ↔ goddess (IDENTIFIED_WITH).</li></ul> No wrong merge found. |
| **Dates** (79 `secure`) | 72 are justified: dated inscriptions with era conversion checked (Canggal Śaka 654 = 732; Dinoyo Śaka 682 = 760; Sdok Kak Thom Śaka 974 = 1052; Lakṣmaṇa Khajuraho VS 1011 = 954; Mandsaur Kṛta 461 = 404/05; Bilsad GE 96; Mathurā GE 61), UNESCO inscription years, modern consecrations, and the Bhāratayuddha chronogram (Śaka 1079 = 1157). 6 temple dates are "as reported" or from recall (L). SV Pittsburgh's "begun 1975" should be 1976 (L). No destruction is stored outside `reception`. The legend/fabric split holds everywhere, except where traditional antiquity claims are given numeric material starts (M6). |
| **Comparisons** (26 rows / 9 tables) | **26/26 accurate:** paulastya-genealogy, karna-armour-gift, syamantaka-origin (HV 21 days; BhP 28 days at 10.56.24 vs 27 at 10.83.10 *tri-navāhāni*, verified), madhu-kaitabha-slayer, dvipa-lists (ViP vs BhP milk/curd reversal; MatsP's Gomedaka), dipavali-reasons, onam-mahabali-vs-puranic-bali, number-of-pramanas, matrika-lists. No version is privileged. 149/182 round-2 rows are verified-online; 7 are `recall`, honestly labelled. |
| **Sensitive material** | <ul><li>All 35 festival→narrative/figure ASSOCIATED_WITH edges are class 6; 92 of 102 edges into festival records are class 6 and the rest class 5.</li><li>The Ayodhyā excavation is class 7 / disputed, its 2019-judgment summary is accurate, and the language is neutral. The SUPPORTS and CONTRADICTS edges are unequally weighted and sourced (M11).</li><li>A loaded-language scan of all round-2 prose found no dismissive or devotional-as-fact wording.</li><li>The exceptions are two temple summaries that state a Gaṇeśa legend as fact (M7), and one caste label (L).</li><li>Diaspora records (Indo-Caribbean, Fiji, Mauritius, BAPS, ISKCON, Ravidassia) are neutral and dated correctly: 1838/1845/1873 arrivals; ISKCON 13 July 1966.</li></ul> |
| **Copyright** | No English quotation in a `quote` field outside the public domain; Ahmad Shah 1917 and Kielhorn are public domain. Three short Kane (1958) sentences appear in `qualifiers.note` (L). |

### 2.4 Discoveries (10)

| Discovery | Verdict | Basis |
|---|---|---|
| disc:revakhanda-vayu | **Pass** | GRETIL RKV header, Neuss: "all available manuscriptual evidence … proves that the text was … part of the Vāyupurāṇa". Caveat apt. |
| disc:vaisheshika-categories | **Pass** | GRETIL VS (kvs_) has no six-padārtha sūtra; PDhS 2.1 lists the six; the caveat on the vulgate recension (VS 1.1.4 with Śaṅkara Miśra) is right. |
| disc:bharatayuddha-1157 | **Pass** | Chronogram Śaka 1079; Mpu Sedah and Mpu Panuluh for Jayabhaya; Virāṭaparwa recital in 996. |
| disc:bhasa | **Pass** | Found in 1909, published 1912–15; *nāndyante tataḥ praviśati sūtradhāraḥ* (Würzburg); Harṣacarita intro v. 15 *sūtradhārakṛtārambhaiḥ*. Both sides recorded. |
| disc:gangadhara-udayagiri | **Pass** (low note) | Wikipedia: "figures of Vishnu and of Shiva Gangadhara" flank the Cave 6 door; GE 82 = 401 CE. The identification rests on reference works (iconography:691, high, L). |
| disc:devi-mahatmya-manuscript | **Pass** (low note) | 608 CE vs 11th c. holds within the graph. Confidence should be medium, given the agent's own uncertainty about the Schøyen date. |
| disc:holi-two-stories | **Pass** (low note) | NārP 1.124.80 *holikā rākṣasī ceyaṃ prahlādabhayadāyinī*; .81 *kāmadāho matāntare*. "From the start of the textual record" overstates. |
| disc:onam-mayon | **Overclaim (M8)** | Maduraikkāñci 590–591 verified. "Not of Mahābali" is not supported: the line credits Māyōṉ with defeating asuras. Body and caveat are inconsistent. |
| disc:kalidasa-source | **Overclaim (M9)** | Raghuvaṃśa 15.63–64 narrate the twins singing Vālmīki's Rāmāyaṇa; the poet does not name it as his source. Aśvaghoṣa is an earlier witness to Vālmīki. |
| disc:varuna-mount | **Overclaim (M10)** | The substance is verified (BS 57.57 haṃsa; AP 51.15 makara; BS 57.33 ≈ AP 49.16). "The two oldest image manuals" contradicts the graph's own dates for the Agni, Viṣṇudharmottara and Matsya. |

The 10 new discoveries have no factual error in their core evidence, and every quotation in them reproduces. 3 overclaim (medium), 3 carry low notes and 4 pass clean. This is an improvement on round 1, where 8 of 28 had a substantive problem.

### 2.5 Estimated error rates

| Defect | Rate | Basis |
|---|---|---|
| Substantive factual error in an assertion | **0/154** (95% upper bound ≈ 1.9%) | Manual sample, corroborated by 1,159/1,159 confirmed quotations and 26/26 comparison rows |
| Locator does not support the subject | 2/154 manual (1.3%). Automated: ≈ 36/443 verse-precise relational locators in epic+purana r2 (8%), ≈ 0.8% of all round-2 assertions | All in epic PARTICIPANT_IN (M1); the restored genealogy edges now pass |
| Quotation fabricated or misplaced | **0/1,159** confirmed (51 not checkable) | Automated, with hand review |
| Museum accession wrong | **0/65** | Museum APIs |
| Coordinates wrong (> 2 km for an exact point) | **0/70** | OpenStreetMap + hand |
| High confidence on Wikipedia alone | 5/154 sample; **159/4,559 (3.5%) dataset-wide**: regional 55, material 46, iconography 58 | Full count. Round 1: 347/3,640 (9.5%) verified-online on Wikipedia; round 2 has **no** Wikipedia-only `verified-online` |
| Duplicate identity | 2 pairs among 1,503 new entities | Full collision scan |
| Discovery with any substantive problem | 3/10 (30%), none factual in core evidence | All 10 audited |

---

## 3. Findings

### 3.1 High severity

**None.** I found no fabricated quotation, wrong accession, fabricated edition, wrong identity merge or traditional claim presented as historical fact at assertion level in round 2. M7 is a summary-level wording lapse, graded medium because the legend is self-evidently mythic and is not dated as fabric.

### 3.2 Medium severity (all)

**M1 · `epic:r2-440` and about 35 others: the anchor-verse locator pattern recurs.**
- *Scale.* 149 of 153 epic PARTICIPANT_IN assertions share one locator per narrative. For about 30 narratives that locator is a single verse, cited verified-online/high for every participant though it names only one or two.
- *Examples.*
  - MBh (CE) 3.231.6 names Duryodhana and Citrasena; it is cited for Yudhiṣṭhira, Arjuna, Karṇa and Śakuni (r2-440–443).
  - VR (CE) 7.82.6 names only Rāghava; it is cited for Bharata, Vasiṣṭha, Vālmīki, Lava and Kuśa (r2-610, 612–615).
  - MBh 7.170.15 names only Drauṇi; it is cited for Kṛṣṇa, Bhīma and Arjuna (r2-493–495).
  - Also 3.154.59, 14.72.1, 18.3.34 and 7.51.20.
- *A weak claim.* Vidura (r2-552) is cited at 15.45.31 for the forest-fire death, though he dies at 15.33.20–25.
- *Fix.* Cite a verse in which each participant acts (e.g. MBh 3.232.1 for Yudhiṣṭhira at the Ghoṣayātrā), or use chapter ranges at source-checked/medium. Add the name-in-window test to CI.

**M2 · `char:maya-asura`: duplicate of `char:maya-danava`.**
- The purana-r2 record's own summary credits him with the Pāṇḍavas' hall, and purana:r2-298 puts him in the Mahābhārata.
- The epic record already carries the Khāṇḍava episode (epic:775) and Mandodarī's paternity (epic:174).
- *Fix.* Merge, or link them with IDENTIFIED_WITH.

**M3 · `char:vasishtha-cow`: duplicate of `char:nandini-cow`.**
- Both records are Vasiṣṭha's cow, daughter of Surabhi. The purana record carries the Viśvāmitra feud; the epic record carries Dilīpa (Raghuvaṃśa).
- *Fix.* Merge, or link them with IDENTIFIED_WITH.

**M4 · `material:r2-142` and 158 others: high confidence on Wikipedia alone.**
- *Scale.* Regional 55, material 46, iconography 58.
- *Examples.* material:r2-142 is class-3, high, Wikipedia only: the Po Nagar stele COMMISSIONED_BY Satyavarman. Others are regional:r2-94/95 (Onam–Bali) and iconography:37/41 (forms of Śiva).
- *Facts.* All sampled were correct, and the statuses are honest (`reference-checked`).
- *Fix.* Lower these to medium or add the scholarly source.

**M5 · `temple:162`: 107 temple upgrades to `source-checked` rest on books that were not opened.**
- Every rationale reads "checked from the researcher's knowledge of the works (page numbers not given)".
- Class-3 claims still have no epigraphic edition: 24 of the temple agent's 26 class-3 round-2 assertions cite none.
- *Fix.* Revert to `reference-checked` and keep the added bibliography. Use DHARMA for the epigraphy.

**M6 · `temple:mahaganapati-ranjangaon` (also chandranath, dakshinkali and the four Pañca Kedāras): traditional or "unsupported" antiquity stored as numeric material dates.**
- `materialDate()` falls back to disputed dates, so these claims place the temples on the material map:
  - Ranjangaon at 800 CE ("unsupported statement in the reference");
  - Chandranath at 1000 ("believed to date back");
  - Dakshinkali at 1600 ("traditionally claimed");
  - the undated Garhwal shrines at 800.
- *Fix.* Move the claimed antiquity to the `traditional` system with no numbers; leave undated fabric without a numeric start.

**M7 · `temple:vighnahar-ozar` and `temple:chintamani-theur`: legend stated as fact in the summary.**
- The summaries read "where Gaṇeśa defeated the obstacle-demon Vighnāsura" and "where Gaṇeśa recovered the wish-granting jewel".
- Neither record has a traditional DateClaim, and neither limits field mentions the legend.
- *Fix.* Rephrase as "where, by temple tradition, …".

**M8 · `disc:onam-mayon`: overclaim.** See §2.4.
- *Fix.* Retitle to say the oldest Tamil reference makes Ōṇam Māyōṉ's festival, in Madurai. Note that the "asura-conqueror" epithet is compatible with the later Vāmana–Bali reading. Reconcile the body with the caveat.

**M9 · `disc:kalidasa-source`: misdescribes Raghuvaṃśa 15.63–64.**
- In those verses the twins sing Vālmīki's Rāmāyaṇa inside the story; the poet does not state it as his source.
- "One of the earliest acknowledgements" should also cite Buddhacarita 1.43.

**M10 · `disc:varuna-mount`: "the two oldest image manuals" contradicts the graph's own dates.**
- The graph dates the Agni Purāṇa post-7th c., the Viṣṇudharmottara 5th–6th c. (Citrasūtra 7th c.) and the Matsya c. 250–500.
- *Fix.* Retitle to "two early image manuals".

**M11 · `claim:ayodhya-temple-beneath-mosque`: competing evidence edges unequally weighted.**
- SUPPORTS (material:r2-298) is medium and cites the ASI report.
- CONTRADICTS (material:r2-299) is low and cites only Wikipedia.
- *Fix.* Set both edges to medium. Cite the critics' work on the CONTRADICTS edge: Mandal & Ratnagar 2007; Varma & Menon, EPW 2010.

### 3.3 Low severity (summary of 14)

**Dates (5)**
- **temple:thousand-pillar-hanamkonda and others:** `secure` is used where the basis is "recall" or "as reported". This applies to Hanamkonda, Itagi, Baijnath, Brahmeśvara ("c. 1058" yet secure) and Pandharpur.
- **art:kankali-tila-sarasvati:** both Kaniṣka-era equations are marked disputed, so placement uses the 78 CE epoch (132 CE). Huviṣka, in whose reign year 54 falls, is dated 150–190 in the graph.
- **art:vasudeva-i-coin-cma:** the coin is dated 142–177 (museum), before the graph's own Vāsudeva I reign of 190–230.
- **temple:sv-temple-pittsburgh:** "begun 1975" should be 1976.
- **disc:devi-mahatmya-manuscript:** confidence should be medium.

**Geography (1)**
- **temple:rasmancha-bishnupur:** carries Jor Bangla's coordinates, labelled exact; it is 0.6 km off.

**Citation, overclaim and predicates (5)**
- **iconography:691:** the Gaṅgādhara identification is high on reference works only.
- **src:gretil-natyashastra:** the URL returns 404.
- **disc:holi-two-stories:** "from the start of the textual record" overstates.
- **vedic:r2-357:** "Mahāvākyas DERIVED_FROM Māṇḍūkya" is over-general.
- **material:r2-317:** COMMISSIONED_BY is used for painters (4 edges); MEMBER_OF is used for 217 temple→style edges.

**Identity (1)**
- **text:amritabindu-upanishad:** add the alias Amṛtanāda and a note distinguishing it from the Brahmabindu.

**Copyright (1)**
- **regional:r2-92:** three short verbatim Kane (1958) sentences in notes.

**Sensitivity (1)**
- **trad:ravidassia:** the caste label "camār" should be replaced by the community's self-designations.

---

## 4. Pass/fail by agent

| Agent | Sample (asr / ent) | Verdict | Main issues |
|---|---|---|---|
| vedic | 22 / 11 | **Pass** | <ul><li>276 quotations, 271 confirmed, none wrong.</li><li>Only low items: Amṛtabindu naming, Mahāvākyas edge, Nāṭyaśāstra URL.</li></ul> |
| epic | 22 / 11 + 55 genealogy | **Pass with a medium systemic defect** | <ul><li>Genealogy restoration fully fixed.</li><li>568/582 quotations confirmed.</li><li>New PARTICIPANT_IN anchor-verse locators (M1).</li><li>Kālidāsa discovery overclaim (M9).</li></ul> |
| purana | 22 / 11 | **Pass** | <ul><li>186/216 quotations confirmed, none wrong; comparisons exact.</li><li>Created two duplicates of epic figures (M2, M3).</li></ul> |
| regional | 22 / 11 | **Pass** | <ul><li>Kane page cites exact.</li><li>55 high/Wikipedia-only (M4).</li><li>Onam discovery overclaim (M8).</li><li>Kane quotations in notes.</li></ul> |
| material | 22 / 11 + 65 museum + 15 upgrades | **Pass (strongest provenance)** | <ul><li>0 accession errors; upgrades verified.</li><li>46 high/Wikipedia-only (M4).</li><li>Ayodhyā edge asymmetry (M11).</li><li>Kuṣāṇa date placements (L).</li></ul> |
| temple | 22 / 11 + 70 coords + 10 upgrades | **Conditional pass** | <ul><li>Facts and coordinates right; statuses honest.</li><li>80% of assertions rest on Wikipedia alone.</li><li>Upgrades without consulting the books (M5).</li><li>Traditional antiquity placed numerically (M6).</li><li>Two legend-as-fact summaries (M7).</li><li>`secure` on unchecked readings (L).</li></ul> |
| iconography | 22 / 11 | **Pass** | <ul><li>134/134 quotations confirmed, despite GRETIL's sandhi-dissolved BS.</li><li>58 high/Wikipedia-only (M4).</li><li>Varuṇa discovery overclaim (M10).</li></ul> |

---

## 5. Systemic issues and recommendations

1. **Bulk locators keep coming back.** Round 1's MEMBER_OF cluster is fixed, but the same shortcut reappears in new PARTICIPANT_IN edges: one verse cited for every participant. The name-in-window check used here (and in round 1) should run in `npm run validate` as a warning for every edge with a verse-precise MBh/VR/BhP/ViP/HV locator.
2. **Confidence now lags behind status honesty.** Round 2 has no Wikipedia-only `verified-online` (round 1 had 347), but 159 Wikipedia-only assertions are still `high`. Add a validator warning for `confidence: high` with only `reference`-type sources. The temple agent's "source-checked from knowledge of the works" should not count as `source-checked`.
3. **Placement uses disputed dates when nothing else exists.** `materialDate()` falls back to disputed claims, so "claimed", "believed" and "unsupported" antiquity, and wide stylistic brackets such as 800–1900, put buildings on the early map. Recommendation for data: put claims under `traditional` without numbers. Recommendation for the site: skip disputed dates whose basis says claimed/unsupported/tradition, and do not plot ranges wider than about 300 years.
4. **Cross-agent identity.** Two duplicates slipped past `npm run find`, both purana-r2 records of figures the epic agent already had. Run the name/alias collision scan, with alias folding, as a validator warning across agents.
5. **Discoveries still run slightly ahead of the evidence.** None has a wrong core fact this time. Three, however, frame a correct observation with a superlative or an exclusion the evidence does not carry ("not of Mahābali", "names his source", "two oldest"). Each title should be a sentence the cited assertion would itself support.
6. **What is working and should be kept:**
   - quotation discipline: 1,159/1,159 confirmed;
   - museum and epigraphic work: 0/65 accession errors, DHARMA and Sircar readings reproduced;
   - honest statuses;
   - neutral, well-caveated handling of contested sites and festivals: class 6 throughout, and both sides of the Bhāsa and Ayodhyā questions recorded;
   - comparison tables that preserve disagreement, e.g. ViP vs BhP oceans, the BhP's own 28 vs 27 days.

---

## 6. What I could not check, and why

- **Wikimedia APIs:** rate-limited (HTTP 429) for scripts all session. Coordinates were checked with OpenStreetMap and by hand. Only 5 of the 40 Commons image licences were opened, through WebFetch.
- **UNESCO ICH pages:** CAPTCHA-protected. Inscription years were checked from news reports (Deepavali 2025) and my knowledge of the lists.
- **Print-only scholarship** (Zoetmulder 1983 pages, Hazra, Rocher, Williams 1982, Foekema, Michell, Dagens, Acharya, etc.): judged for plausibility only.
- **51 quotations:**
  - 28 Wikisource;
  - 14 Bhāsa plays not downloaded: Dūtaghaṭotkaca, Bālacarita, Abhiṣeka, Pañcarātra, other Pratimā acts;
  - 5 sanskritdocuments;
  - 2 Shah 1917;
  - 2 others.
- **Manuscript claims:** the Schøyen Devī Māhātmya and the Cambridge "Add. 1706" Bṛhat Saṃhitā of 1279. Both are labelled as unverified by the agents themselves.
- **Mahābhārata upaparvan boundaries:** checked only against the Parvasaṃgraha order (MBh CE 1.2.34–62), which they follow, not against the printed CE headings.
