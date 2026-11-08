# Vedic & Darśana Researcher — round 2 report (agent `vedic`)

Files: `data/entities/vedic-r2.json` (266), `data/assertions/vedic-r2.json` (587, ids `vedic:r2-1` … `vedic:r2-587`), `data/sources/vedic-r2.json` (134), `data/comparisons/vedic-r2.json` (8). Round-1 records upgraded in `data/entities/vedic.json` (listed below). `npm run validate -- --domain vedic` → **0 errors, 0 warnings**, and the whole-dataset `npm run validate` → 0 errors, with no duplicate-id or possible-duplicate warnings involving vedic files (2026-11-08, after the regional agent’s rebuild).

The JSON is produced by a generator kept outside the repo (scratchpad `vr2-gen/`). Its build step refuses to write unless every quotation (230 in all) is found, after normalising spacing and punctuation, in the downloaded GRETIL e-text it cites. Assertion ids are frozen as of this report.

## 1. Executive findings

1. **The six darśanas now exist as a graph, with sub-schools, root texts and commentary chains.**
   - The six schools: `trad:samkhya`, `trad:yoga-darshana`, `trad:nyaya`, `trad:vaisheshika`, `trad:mimamsa` and `trad:vedanta`.
   - Sub-schools:
     - of Vedānta: Advaita, Viśiṣṭādvaita, Dvaita, Bhedābheda, Dvaitādvaita, Śuddhādvaita and Acintya-bhedābheda;
     - of Nyāya: Navya-Nyāya;
     - of Mīmāṃsā: Bhāṭṭa and Prābhākara.
   - The opening of every root text was checked against GRETIL: Yoga Sūtra, Sāṃkhyakārikā, Nyāya Sūtra, Vaiśeṣika Sūtra, Mīmāṃsā Sūtra and Brahma Sūtra. So were the principal commentaries: Yoga Bhāṣya, Nyāyabhāṣya, Praśastapāda, Śabara, Śaṅkara’s commentary on the Brahma Sūtra, Bhāmatī, Gauḍapāda, the Vedārthasaṃgraha, Rāmānuja’s Gītābhāṣya, Madhva’s Anuvyākhyāna and Mahābhāratatātparyanirṇaya, and Jīva’s Ṣaṭsandarbha.
2. **Counts from the e-texts.**
   - Yoga Sūtra: 195 sūtras (51 + 55 + 55 + 34).
   - Brahma Sūtra: 555 sūtras in Śaṅkara’s division against 545 in the Sansknet text.
   - Mīmāṃsā Sūtra: 2,727 sūtra numbers.
   - Vaiśeṣika Sūtra: 316 sūtras in the e-text.
   - Gauḍapāda’s Kārikā: 211 verses (29 + 38 + 48 + 96).
   - Yājñavalkya Smṛti: 1,011 verses (369 + 307 + 335).
3. **The “six categories” of Vaiśeṣika are not a sūtra in the GRETIL recension.** VS 1.1.4 lists only the nine substances. The six-padārtha formula, the count of 24 qualities and the first homage to Īśvara (“praṇamya hetum īśvaram”) are explicit in Praśastapāda (PDhS 1.1–2.2). Annaṃbhaṭṭa’s Tarkasaṃgraha adds abhāva to make seven. Evidence: `concept:padartha`, `vedic:r2` MENTIONED_IN edges, and `text:vaisheshika-sutra` details.
4. **Each school’s root text names the other’s founder, and Kauṭilya names Sāṅkhya before any sūtra does.**
   - The Mīmāṃsā Sūtra cites Bādarāyaṇa (MS 1.1.5, “bādarāyaṇasyānapekṣatvāt”), and the Brahma Sūtra cites Jaimini (BS 1.2.28, 3.4.2).
   - Arthaśāstra 1.2.10 (“sāṃkhyaṃ yogo lokāyataṃ ca”) is the earliest dated grouping of philosophies as ānvīkṣikī. It is recorded in `psg:arthashastra-1-2-10` and the MENTIONED_IN edges.
5. **The Dharmasūtras attest an older āśrama system.**
   - Āpastamba lists four āśramas as alternatives (ĀpDh 2.9.21.1).
   - Gautama (3.1, 3.36) and Baudhāyana (2.6.11.27) report that “the teachers” allow only one āśrama, the householder’s.
   - These were all verified in the e-texts and support Olivelle’s thesis (`cmp:asrama-choice-or-sequence`).
6. **The inheritance split is grounded in verified verses.** Manu 9.104 (brothers divide after both parents die), YSm 2.121 (equal ownership of father and son) and the Mitākṣarā’s “janmanaiva svatvam” are laid against Jīmūtavāhana’s Dāyabhāga (`cmp:inheritance-mitakshara-dayabhaga`).
7. **Disputed identities are kept as claims, not merges.**
   - `claim:patanjali-identity` and `claim:yogasutra-bhashya-single-work`, the latter supported by the colophon “pātañjale sāṃkhyapravacane yogaśāstre … vyāsabhāṣye”.
   - `claim:mandana-sureshvara-identity`.
   - `claim:vivekachudamani-authorship`.
   - `claim:nimbarka-date`. Ramnarace 2014 argues for the 7th c. against the 12th–13th.
8. **Nāṭyaśāstra, added at the orchestrator’s request (`text:natyashastra`).**
   - Verified: the fifth Veda “for all classes” (NŚ 1.12); its making from recitation, song, acting and rasa taken from the four Vedas (1.17); Śiva teaching dance through Taṇḍu (4.17); the 108 karaṇas (4.55); the eight rasas (6.15); and the rasa-sūtra.
   - Pāṇini’s naṭasūtras of Śilālin (P. 4.3.110) are verified as an earlier dramaturgical tradition.
   - Linked to the iconography agent’s `concept:karanas`, to `text:abhinavabharati`, to `concept:rasa` and to `person:bharata-natyashastra`.

## 2. Dataset summary

- **Entities (266):**
  - 125 texts
  - 55 persons
  - 40 concepts
  - 16 traditions
  - 13 passages
  - 12 collections
  - 5 claims
- **Entity status:** 102 verified-online, 128 source-checked, 20 reference-checked, 10 disputed, 6 recall.
- **Dates:** 84 entities carry 103 DateClaims. Competing views are kept separate, for example:
  - Yoga Sūtra: Maas 325–425 CE against the wider 2nd c. BCE – 4th c. CE range.
  - Vācaspati: year 898 read as Vikrama (841 CE) or as Śaka (976 CE).
  - Madhva: 1238–1317 against 1199–1278.
  - Nimbārka: 7th c. against 12th–13th c.
  - Dharmasūtras: Olivelle against Kane.
  - Vedāṅga Jyotiṣa: the extant text against the astronomical epoch.
  - Arthaśāstra: Olivelle and McClish against the traditional date.
- **Assertions (587):**
  - By status: 131 verified-online, 389 source-checked, 42 reference-checked, 21 disputed, 4 recall.
  - By evidence class: 1 → 141, 5 → 348, 6 → 83, 7 → 14, 2 → 1.
  - By predicate: PART_OF 138, MENTIONED_IN 109, CENTRAL_TO 96, COMPOSED_BY 55, COMMENTARY_ON 42, ATTRIBUTED_TO 42, DERIVED_FROM 28, APPEARS_IN 19, CONTRADICTS 13, CONCERNS 12, TEACHER_OF 11, IDENTIFIED_WITH 7, ASSOCIATED_WITH 7, REFERS_TO_TEXT 4, SUPPORTS 2, MEMBER_OF 2.
- **Most connected:** `col:upanishads` 27, `text:muktika-upanishad` 22, `text:brahma-sutra` 19, `text:samkhya-karika` 17, `text:yoga-sutra` 16, `trad:advaita-vedanta` 15, `text:natyashastra` 14, `trad:samkhya` and `trad:vedanta` 13 each, `text:shankara-brahmasutra-bhashya` 13.
- **Comparisons (8):**
  - `cmp:darshanas-on-the-self`: 9 rows.
  - `cmp:brahman-and-the-world`: 9 rows.
  - `cmp:authority-of-the-veda`: 8 rows.
  - `cmp:darshanas-on-liberation`: 10 rows.
  - `cmp:brahma-sutra-1-1-1-4`: Śaṅkara, Rāmānuja and Madhva, plus the bare sūtras.
  - `cmp:number-of-pramanas`: 8 rows.
  - `cmp:inheritance-mitakshara-dayabhaga`: 4 rows.
  - `cmp:asrama-choice-or-sequence`: 4 rows.

## 3. Evidence ledger

| Source | Supports | Online |
|---|---|---|
| GRETIL e-texts (64 new `src:gretil-*` records) | Opening and key sūtras or verses of all root texts and commentaries listed in §1. Also the Dharmasūtras, Yājñavalkya and Mitākṣarā, Nārada, Parāśara, Vedāṅga Jyotiṣa, Kaivalya, Atharvaśiras, Garbha, Brahmabindu, Nādabindu, Śivasaṃkalpa, the Arthaśāstra, the Nāṭyaśāstra and Utpaladeva’s Īśvarapratyabhijñākārikā | yes. Downloaded 2026-11-08; every quotation machine-checked against the file |
| Round-1 GRETIL sources (`src:gretil-ashtadhyayi`, `-shvetashvatara`, `src:gretil` Manu) | P. 4.3.95, 4.3.110; ŚvU 4.10, 6.23; Manu 9.104 | yes |
| Larson & Bhattacharya 1987, 2008; Maas 2006, 2013; Bronkhorst 1981 | Sāṅkhya and Yoga history, Kārikā date, Pātañjalayogaśāstra thesis | no (named scholarship) |
| Potter EIP II, III, VI; Matilal 1977; Phillips 2012; Ingalls 1951 | Nyāya–Vaiśeṣika and Advaita chronology and authors | no |
| Jha 1942; Clooney 1990; Kataoka 2011 | Mīmāṃsā, Kumārila, pramāṇa counts | no |
| Nakamura 1983; King 1995; Comans 2000; Mayeda 1992; Thrasher 1993; Kuppuswami Sastri 1937; Bader 2000 | Early Vedānta, Gauḍapāda, authenticity of Śaṅkara’s works, Maṇḍana and Sureśvara | no |
| Thibaut SBE 34, 38, 48 | Śaṅkara and Rāmānuja on the Brahma Sūtra. The Śrībhāṣya rows rest on SBE 48 because the GRETIL Śrībhāṣya link returned 404 | no |
| Carman 1974; Lipner 1986; van Buitenen 1956; Sharma 1960–61; Stoker 2016; Bose 1940–43; Ramnarace 2014; Barz 1976; Gupta 2007; Okita 2014 | Theistic Vedānta schools | no |
| Olivelle 1992, 1993, 1999, 2000, 2013; Kane; Lingat; Lariviere 1989; Rocher 2002; Davis 2010 | Dharmasūtras and their dates, āśrama, smṛtis, inheritance, Arthaśāstra date | no |
| Gonda 1977; Allen 1953; Deshpande 1997; Plofker 2009; van Nooten 1993; Sarma 1985; Pingree 1981 | Kalpa, Śikṣā, Chandas, Jyotiṣa | no |
| Deussen 1897; Sprockhoff 1976; Bouy 1994; van Buitenen 1962; Varenne 1960 | Minor Upaniṣads and their classes | no. Muktikā membership is reference-checked |
| Wikipedia (pointer only) | Confirms dates reported from scholarship (status `reference-checked` where it was the only check) | yes |

## 4. Uncertainty log

- **Precise numeric ranges.** Those for Olivelle’s Dharmasūtra dates, Śabara, Śālikanātha, Pārthasārathi and Sadānanda are approximations of the scholars’ century-level statements. Page-level checks in Olivelle 1999 (pp. xxxi–xxxiv) and Jha 1942 would settle them.
- **Śrībhāṣya and Śābarabhāṣya.** Both GRETIL files returned 404, so Śaṅkara and Madhva are verified in Sanskrit but Rāmānuja’s BS 1.1.1 reading rests on Thibaut. Śabara was verified through the Pohlus e-text (`sa_jaimini-mImAMsAsUtra-1-7-comm`).
- **Madhva’s Brahma Sūtra bhāṣya** was not available as a separate GRETIL file; the file listed for it holds Śaṅkara with the Ratnaprabhā. The Madhva rows use the Anuvyākhyāna and the Mahābhāratatātparyanirṇaya instead.
- **Minor Upaniṣads.** Dates and Muktikā affiliations are late and disputed. Ten are verified in GRETIL e-texts; the rest are reference-checked (Deussen via Wikipedia). The Mahānārāyaṇa (TĀ 10) is deliberately not placed in the Muktikā list (see `text:mahanarayana-upanishad`).
- **Identities.** Vidyāraṇya = Mādhava (Sarvadarśanasaṃgraha), Kātyāyana (vārttika) = Kātyāyana (śrauta), Kauṭilya = Cāṇakya, Bādarāyaṇa = Vyāsa: all are left unmerged and qualified by tradition.
- **Nāṭyaśāstra.** The GRETIL file does not name its source edition. Its chapter and verse numbers (bhn_) may differ from Ghosh’s.
- **Yoga in AŚ 1.2.10.** Whether “yoga” there means Patañjali’s system is debated; this is recorded in `competing`.

## 5. Cross-agent links

- **Overlap with regional, settled with the orchestrator.**
  - I own `person:vallabha`, `person:vyasatirtha`, `person:utpaladeva` and `src:barz-1976`.
  - Regional owns the Gauḍīya Gosvāmīs, `person:vitthalanatha`, `text:sat-sandarbha` and `text:bhaktirasamrtasindhu`. I removed my variant ids for these (`person:rupa-gosvami`, `person:jiva-gosvami`, `person:gopala-bhatta`, `text:shat-sandarbha`, `text:bhaktirasamritasindhu`) and now cite regional’s.
  - Regional’s builder creates Utpaladeva only if it is missing; its copy dropped on its next build.
  - I also dropped my duplicate edges on the Gosvāmīs and Vallabha (PARENT_OF, TEACHER_OF, COMPOSED_BY, ASSOCIATED_WITH Vṛndāvana).
- **Sources.** `src:ghosh-1950` is cited from iconography’s copy.
- **Ids I reference.**
  - regional: `trad:srivaishnava`, `trad:pancharatra`, `trad:gaudiya`, `trad:pushtimarg`, `trad:kashmir-shaivism`, `trad:jain`, `trad:buddhist`, `person:ramanuja`, `person:chaitanya`, `person:abhinavagupta`
  - purana: `col:dharmashastra`, `text:manusmriti`, `text:bhagavata-purana`, `char:kapila`, `char:narada`, `char:parashara`, `deity:narasimha`, `deity:ganesha`, `trad:pashupata`, `trad:ganapatya`, `trad:vaishnava`
  - temple: `person:bhoja-paramara`, `person:krishnadevaraya`, `temple:srirangam`, `temple:varadaraja-kanchi`
  - iconography: `concept:karanas`
  - material: `pol:vijayanagara`
  - epic: `char:vyasa`, `char:krishna`, `char:rama`, `text:bhagavad-gita`
- **Ids I wish existed:**
  - `pol:chalukya-kalyani` (for Vijñāneśvara’s court)
  - persons Āśmarathya, Auḍulomi and Kāśakṛtsna (teachers cited in BS 1.4.20–22)
  - Lakṣmaṇagupta and Somānanda (the Pratyabhijñā line)
  - Haribhadra (for `text:shaddarshana-samuccaya`)
  - Mādhava (Sarvadarśanasaṃgraha) as a separate person
  - `person:sanatana-goswami`, if regional’s copy is meant for my Gauḍīya edges
- **Earlier overlap with regional, now resolved.** `regional:r2-22` briefly duplicated my round-1 `vedic:343` (`narr:vamana-bali` MENTIONED_IN `text:mahabhashya`); the warning no longer appears.

## 6. Graph opportunities

- **Commentary trees.**
  - SK → Yuktidīpikā and Tattvakaumudī.
  - YS → Bhāṣya → Tattvavaiśāradī and Yogavārttika.
  - NS → Bhāṣya → Vārttika → Tātparyaṭīkā.
  - MS → Śabara → Ślokavārttika, Tantravārttika and Bṛhatī → Prakaraṇapañcikā.
  - BS → eight school commentaries. Within Advaita: Śaṅkara → Pañcapādikā and Bhāmatī. Within Dvaita: Anuvyākhyāna → Nyāyasudhā.
- **Polemic network (CONTRADICTS).**
  - BS ↔ Sāṅkhya and Vaiśeṣika.
  - Vedārthasaṃgraha → Śaṅkara and Bhāskara.
  - Bhāskara → Śaṅkara.
  - Nyāyāmṛta ↔ Advaitasiddhi.
  - Tarkatāṇḍava → Tattvacintāmaṇi.
  - Nyāyakusumāñjali → Ślokavārttika.
  - Dāyabhāga → Mitākṣarā.
- **Paramparā chains.**
  - Kapila → Āsuri → Pañcaśikha.
  - Gauḍapāda → Govinda → Śaṅkara → Sureśvara and Padmapāda.
  - Yāmuna → Rāmānuja.
  - Nimbārka → Śrīnivāsa.
  - Vyāsatīrtha → Kṛṣṇadevarāya.
- **Concept-to-school matrix.** 30+ CENTRAL_TO edges link concepts to schools; a bipartite view would show the shared and disputed concepts (Īśvara, bhakti, kaivalya, māyā).

## 7. Timeline contributions

- **Scholarly-textual dates:**
  - Vedāṅga Jyotiṣa: final centuries BCE, with a disputed astronomical epoch of 1400–1200 BCE.
  - Piṅgala and Chandaḥśāstra: 3rd–2nd c. BCE.
  - Mīmāṃsā Sūtra: 3rd–2nd c. BCE.
  - Dharmasūtras: 3rd c. BCE to 1st c. CE (Olivelle), against Kane’s earlier dates.
  - Vaiśeṣika Sūtra: 2nd c. BCE to the turn of the era.
  - Nyāya Sūtra: 2nd c. BCE – 3rd c. CE.
  - Nāṭyaśāstra: 200 BCE – 200 CE.
  - Arthaśāstra: 1st–3rd c. CE.
  - Yājñavalkya: 3rd–5th c. CE.
  - Sāṃkhyakārikā: 350–450 CE.
  - Pātañjalayogaśāstra: 325–425 CE.
  - Brahma Sūtra (extant form): 400–450 CE.
  - Bhartṛhari: 5th c.
  - Nārada: 5th–6th c.
  - Praśastapāda: later 6th c.
  - Gauḍapāda: 6th–7th c.
  - Kumārila: 600–650.
  - Maṇḍana: late 7th–8th c.
  - Vācaspati: 841 or 976.
  - Udayana: 975–1050.
  - Utpaladeva: 925–975.
  - Mitākṣarā: c. 1076–1127.
  - Dāyabhāga: 12th c.
  - Gaṅgeśa: 14th c.
  - Vidyāraṇya: c. 1330–1386.
  - Haṭhayogapradīpikā: 15th c.
  - Vallabha: 1479–1531.
  - Vyāsatīrtha: c. 1460–1539.
  - Madhusūdana: c. 1540–1640.
  - Gaṇapati Atharvaśīrṣa: 16th–17th c.
- **Reception dates:**
  - Paramārtha’s Chinese Sāṃkhyakārikā: 546–569.
  - Abhinavabhāratī: c. 1000.
  - UNESCO Memory of the World listing of Nāṭyaśāstra manuscripts: 2025.
- **Traditional dates:** the Arthaśāstra as Maurya-era, Yāmuna 918–1038, and the Nāṭyaśāstra as a revealed fifth Veda.

## 8. Research gaps and follow-up

- Retrieve the Śrībhāṣya, Madhva’s Brahma Sūtra bhāṣya and the Śābarabhāṣya beyond 1.1.5 from another e-text source (e.g. TITUS or sanskritdocuments) and upgrade the Rāmānuja comparison rows.
- Pin Olivelle’s Dharmasūtra dates to pages.
- Verify the Muktikā list from a Sanskrit e-text of the Muktikā Upaniṣad.
- Add the Pratyabhijñā line (Somānanda, Lakṣmaṇagupta), Jayanta Bhaṭṭa’s Nyāyamañjarī, Śrīdhara’s Nyāyakandalī, the Vedāntaparibhāṣā, Prakāśātman’s Vivaraṇa, Appayya Dīkṣita, and the Gautama and Hiraṇyakeśin Gṛhya Sūtras.
- Encode BS 2.2 sūtra by sūtra if finer polemic edges are wanted.

## 9. Candidate discoveries

1. **The “six categories” are Praśastapāda’s, not Kaṇāda’s.**
   - *Finding:* the GRETIL Vaiśeṣika Sūtra enumerates substances, qualities and motions only. Praśastapāda’s opening is the first to name the six padārthas and to praise Īśvara as cause.
   - *Ids:* `concept:padartha`, `text:padarthadharmasamgraha`, `text:vaisheshika-sutra`.
   - *Caveat:* recensions of the Sūtra differ; the vulgate (Śaṅkara Miśra) has a six-category sūtra at 1.1.4.
2. **Jaimini and Bādarāyaṇa cite each other.**
   - *Finding:* MS 1.1.5 appeals to Bādarāyaṇa, while the Brahma Sūtra cites Jaimini ten times, so the two “Mīmāṃsās” grew in dialogue.
   - *Ids:* the MENTIONED_IN edges on `person:badarayana` and `person:jaimini`.
   - *Caveat:* the names may designate schools rather than individuals.
3. **Āśrama as choice.**
   - *Finding:* three Dharmasūtras record that “the teachers” recognised only the householder, and Āpastamba lists the four as parallel vocations.
   - *Ids:* `cmp:asrama-choice-or-sequence`, `concept:ashrama`.
   - *Caveat:* this is normative literature, not social practice.
4. **The Yoga treatise calls itself an exposition of Sāṅkhya.**
   - *Finding:* every chapter colophon reads “pātañjale sāṃkhyapravacane yogaśāstre”.
   - *Ids:* `claim:yogasutra-bhashya-single-work`, `trad:yoga-darshana` DERIVED_FROM `trad:samkhya`.
   - *Caveat:* colophons may be later than the text.
5. **Drama claims Vedic descent and openness to all classes.**
   - *Finding:* NŚ 1.12 justifies a fifth Veda because the four may not be recited to śūdras.
   - *Ids:* `psg:natyashastra-1-12-17`, `text:natyashastra`.
   - *Caveat:* this is a legitimating frame story, not history.

## What I added
- **Darśanas and schools (traditions) (16):** Sāṅkhya; Yoga (Pātañjala darśana); Nyāya; Navya-Nyāya; Vaiśeṣika; Pūrva Mīmāṃsā; Bhāṭṭa Mīmāṃsā; Prābhākara Mīmāṃsā; Vedānta; Bhedābheda Vedānta; Viśiṣṭādvaita; Dvaita Vedānta; Dvaitādvaita (Nimbārka sampradāya); Śuddhādvaita; Acintya-bhedābheda; Lokāyata (Cārvāka).
- **Persons (ācāryas, authors, sūtrakāras) (55):** Īśvarakṛṣṇa; Āsuri; Pañcaśikha; Vijñānabhikṣu; Patañjali (author of the Yoga Sūtra); Vyāsa (author of the Yoga Bhāṣya); Svātmārāma; Akṣapāda Gautama; Vātsyāyana Pakṣilasvāmin; Uddyotakara; Vācaspati Miśra; Udayana; Gaṅgeśa; Raghunātha Śiromaṇi; Annaṃbhaṭṭa; Kaṇāda; Praśastapāda; Jaimini; Śabarasvāmin; Kumārila Bhaṭṭa; Prabhākara; Śālikanātha Miśra; Pārthasārathi Miśra; Maṇḍana Miśra; Bādarāyaṇa; Gauḍapāda; Govinda Bhagavatpāda; Sureśvara; Padmapāda; Vidyāraṇya; Sadānanda Yogīndra; Madhusūdana Sarasvatī; Bhāskara (Vedāntin); Yāmuna; Vedānta Deśika; Madhva (Ānandatīrtha); Jayatīrtha; Vyāsatīrtha; Nimbārka; Śrīnivāsa (Nimbārka school); Vallabha (Vallabhācārya); Baladeva Vidyābhūṣaṇa; Bhartṛhari; Kauṭilya; Vijñāneśvara; Jīmūtavāhana; Medhātithi; Piṅgala; Lagadha; Āpastamba; Baudhāyana; Āśvalāyana; Kātyāyana; Utpaladeva; Bharata (author of the Nāṭyaśāstra).
- **Darśana root texts, commentaries and treatises (72):** Sāṃkhyakārikā; Yuktidīpikā; Sāṃkhyatattvakaumudī; Sāṃkhyasūtra; Tattvasamāsa; Sāṃkhyapravacanabhāṣya; Yoga Sūtra of Patañjali; Yoga Bhāṣya (Vyāsabhāṣya); Tattvavaiśāradī; Rājamārtaṇḍa; Yogavārttika; Haṭhayogapradīpikā; Nyāya Sūtra; Nyāyabhāṣya; Nyāyavārttika; Nyāyavārttikatātparyaṭīkā; Nyāyakusumāñjali; Tattvacintāmaṇi; Tarkasaṃgraha; Vaiśeṣika Sūtra; Padārthadharmasaṃgraha; Mīmāṃsā Sūtra; Śābarabhāṣya; Ślokavārttika; Tantravārttika; Bṛhatī; Prakaraṇapañcikā; Śāstradīpikā; Brahmasiddhi; Māṇḍūkya Kārikā (Āgamaśāstra); Śaṅkara’s commentary on the Bhagavad Gītā; Śaṅkara’s commentary on the Taittirīya Upaniṣad; Śaṅkara’s commentary on the Chāndogya Upaniṣad; Śaṅkara’s commentary on the Kaṭha Upaniṣad; Commentary on the Māṇḍūkya Upaniṣad and Kārikā ascribed to Śaṅkara; Upadeśasāhasrī; Vivekacūḍāmaṇi; Naiṣkarmyasiddhi; Pañcapādikā; Bhāmatī; Pañcadaśī; Jīvanmuktiviveka; Sarvadarśanasaṃgraha; Vedāntasāra; Siddhāntabindu; Advaitasiddhi; Aṣṭāvakra Gītā; Śrībhāṣya; Vedārthasaṃgraha; Rāmānuja’s commentary on the Bhagavad Gītā; Gītārthasaṃgraha; Siddhitraya; Tattvamuktākalāpa; Nyāyapariśuddhi; Anuvyākhyāna; Mahābhāratatātparyanirṇaya; Nyāyasudhā; Nyāyāmṛta; Tarkatāṇḍava; Vedāntapārijātasaurabha; Vedāntakaustubha; Daśaślokī (Nimbārka); Aṇubhāṣya; Subodhinī; Govinda-bhāṣya; Vākyapadīya; Arthaśāstra; Ṣaḍdarśanasamuccaya; Īśvarapratyabhijñākārikā; Īśvarapratyabhijñāvimarśinī; Nāṭyaśāstra; Abhinavabhāratī.
- **Vedāṅga, Sūtra and Dharmaśāstra texts (32):** Śaṅkara’s commentary on the Brahma Sūtra; Bhāskara’s commentary on the Brahma Sūtra; Madhva’s commentary on the Brahma Sūtra; Ṛgveda Prātiśākhya; Taittirīya Prātiśākhya; Vājasaneyi Prātiśākhya; Śaunakīyā Caturādhyāyikā (Atharvaveda Prātiśākhya); Pāṇinīya Śikṣā; Chandaḥśāstra of Piṅgala; Vedāṅga Jyotiṣa; Āpastamba Śrauta Sūtra; Baudhāyana Śrauta Sūtra; Kātyāyana Śrauta Sūtra; Āśvalāyana Śrauta Sūtra; Śāṅkhāyana Śrauta Sūtra; Āśvalāyana Gṛhya Sūtra; Pāraskara Gṛhya Sūtra; Āpastamba Gṛhya Sūtra; Āpastamba Dharma Sūtra; Gautama Dharma Sūtra; Baudhāyana Dharma Sūtra; Vasiṣṭha Dharma Sūtra; Baudhāyana Śulba Sūtra; Āpastamba Śulba Sūtra; Yājñavalkya Smṛti; Mitākṣarā; Dāyabhāga; Nārada Smṛti; Parāśara Smṛti; Viṣṇu Smṛti; Kātyāyana Smṛti; Manubhāṣya of Medhātithi.
- **Collections (12):** Śikṣā and Prātiśākhyas; Vyākaraṇa (grammar); Chandas (metrics); Jyotiṣa (calendar and astronomy); Śrauta Sūtras; Gṛhya Sūtras; Dharma Sūtras; Śulba Sūtras; Yoga Upaniṣads; Saṃnyāsa Upaniṣads; Vaiṣṇava Upaniṣads; Śaiva Upaniṣads.
- **Philosophical and śāstric concepts (40):** Muktikā canon of 108 Upaniṣads; Ṣaḍdarśana (the six orthodox darśanas); Āstika and nāstika; Pramāṇa; Prakṛti; Puruṣa (Sāṅkhya); Guṇa; Twenty-five tattvas (Sāṅkhya); Satkāryavāda; Kaivalya; Samādhi; Aṣṭāṅga yoga (eight limbs); Kleśa; Īśvara; Padārtha (Vaiśeṣika categories); Paramāṇu (atomism); Apūrva; Apauruṣeyatva; Māyā; Avidyā; Adhyāsa; Vivarta; Līlā; Jīva; Saccidānanda; Mahāvākyas (the great sayings); Jīvanmukti; Viveka; Sādhana-catuṣṭaya (fourfold qualification); Śarīra–śarīrin relation; Pañcabheda (five differences); Sphoṭa; Bhakti; Turīya; Ahiṃsā; Āśrama (orders of life); Saṃskāra (life-cycle rites); Vyavahāra (legal procedure); Dāya (inheritance); Rasa (aesthetic relish).
- **Upaniṣads (post-principal) (21):** Muktikā Upaniṣad; Maitrāyaṇīya Upaniṣad; Mahānārāyaṇa Upaniṣad; Jābāla Upaniṣad; Paramahaṃsa Upaniṣad; Āruṇeya (Āruṇi) Upaniṣad; Kaivalya Upaniṣad; Atharvaśiras Upaniṣad; Garbha Upaniṣad; Brahmabindu Upaniṣad; Nādabindu Upaniṣad; Amṛtabindu Upaniṣad; Haṃsa Upaniṣad; Paiṅgala Upaniṣad; Subāla Upaniṣad; Vajrasūcī Upaniṣad; Nṛsiṃha-tāpanīya Upaniṣad; Rāma-tāpanīya Upaniṣad; Gopāla-tāpanī Upaniṣad; Gaṇapati Atharvaśīrṣa; Śivasaṃkalpa Upaniṣad.
- **Passages (13):** Brahma Sūtra 1.1.1–4 (catuḥsūtrī); Brahma Sūtra 2.2 (refutation of other systems); Yoga Sūtra 1.2 (definition of yoga); Yoga Sūtra 2.29–3.3 (the eight limbs); Sāṃkhyakārikā 69–72 (lineage and Ṣaṣṭitantra); Nyāya Sūtra 1.1.1–3; Mīmāṃsā Sūtra 1.1.1–5; Vaiśeṣika Sūtra 1.1.1–6; Gauḍapāda Kārikā 2.32 (the highest truth); Arthaśāstra 1.2.10 (ānvīkṣikī); Mahābhāratatātparyanirṇaya 1.68–70 (the five differences); Yājñavalkya Smṛti 2.121 (equal ownership of father and son); Nāṭyaśāstra 1.11–18 (the fifth Veda).
- **Claims (disputed identities and dates) (5):** The author of the Yoga Sūtra is the grammarian Patañjali; The Yoga Sūtra and its Bhāṣya were composed together as one work; Maṇḍana Miśra became Śaṅkara’s pupil Sureśvara; The Vivekacūḍāmaṇi is a work of Śaṅkara; Nimbārka lived before Śaṅkara (7th c. CE).

- **Assertions (587):**
  - literature structure: 138 PART_OF, 42 COMMENTARY_ON, 28 DERIVED_FROM, 4 REFERS_TO_TEXT
  - authorship: 55 COMPOSED_BY, 42 ATTRIBUTED_TO
  - concepts and texts: 109 MENTIONED_IN, 96 CENTRAL_TO, 19 APPEARS_IN
  - paramparā: 11 TEACHER_OF
  - polemic and claims: 13 CONTRADICTS, 12 CONCERNS, 2 SUPPORTS
  - identity: 7 IDENTIFIED_WITH (never merges)
  - places and polities: 7 ASSOCIATED_WITH, 2 MEMBER_OF
- **Comparisons (8):** listed in §2.
- **Sources (134):** 64 GRETIL e-text records and 70 scholarly works, all real and listed in `data/sources/vedic-r2.json`.

### Upgrades to round-1 records (`data/entities/vedic.json`)

- `text:brahma-sutra`:
  - new summary and details: structure, the polemics of BS 2.2, the teachers it names, and sūtra counts by commentator;
  - two added DateClaims: Nakamura’s c. 400–450 CE for the extant form, and the 5th–2nd c. BCE earliest-layer estimates;
  - an attributes block listing eight school commentaries;
  - added traditions and sources (the GRETIL e-text with a quote, Nakamura, Thibaut);
  - status raised from source-checked to verified-online and confidence from medium to high.
- `trad:advaita-vedanta`: subtype added, details extended with its round-2 lineage and concepts, sources added (Potter 1981, Comans 2000).
- No ids were changed and no records deleted. The round-1 generator was not re-run; these two records were patched in place.
