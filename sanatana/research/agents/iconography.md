# Iconography & Temple Architecture — research report (agent `iconography`, round 2)

Files:
- `data/entities/iconography.json`: 185 entities
- `data/assertions/iconography.json`: 691 assertions, `iconography:1`–`iconography:691`
- `data/sources/iconography.json`: 33 sources
- `data/comparisons/iconography.json`: 8 comparison tables with 31 rows

Validator: `npm run validate -- --domain iconography` → **0 errors · 0 warnings** (2026-11-08, run against the whole dataset as it stood, including the other agents' round-2 files).

Generator (scratch, not part of the dataset): `scratchpad/iconography/build.py` with `p1_*.py`–`p11_*.py`.
- It refuses to create an id or source that already exists in another agent's file.
- It skips any (s, p, o, text, tradition) edge that another agent has already made.
- It adds links to other agents' round-2 records only if those records exist when it runs.

---

## 1. Executive findings

1. **The two oldest prescriptive texts can now be cited verse by verse.** I fetched the GRETIL e-texts of the *Bṛhat Saṃhitā* (Tripathi edition) and the *Agni Purāṇa* (Mitra edition) and read the image and temple chapters in full. Every iconographic prescription drawn from them is class 1 and `verified-online`, with the Sanskrit quoted.
   - **BS 57** (= Kern/Bhat 58): Viṣṇu with 8, 4 or 2 arms; Baladeva; Ekānaṃśā; Sāmba and Pradyumna; Brahmā; Skanda; Indra; Śiva with the optional "half of the Mountain's daughter" (the textual seed of Ardhanārīśvara); the Buddha; the Jina; Sūrya in northern dress; the liṅga; the Mothers; Revanta; Yama, Varuṇa and Kubera.
   - **AP 48–53**: the 24 forms of Viṣṇu; the avatāra images; the Goddess and her circle; Sūrya, the planets and the lokapālas; the 64 yoginīs; the liṅga.
   - Supporting texts read the same way: the Devī Māhātmya (as MkP 81–93) and the Toḍala Tantra, both from GRETIL.
2. **The two oldest texts agree almost word for word on the eight-armed Viṣṇu** (`cmp:vishnu-image-texts`).
   - Both give: right hands sword, mace, arrow plus a fourth hand; left hands bow, shield, discus, conch.
   - They differ in two details. BS's fourth right hand is *śāntida* ("peace-giving"); AP's is *varada* ("boon-giving"). AP also seats Viṣṇu on Garuḍa.
   - They differ outright on **Varuṇa's mount**: a goose in BS 57.57, a makara in AP 51.15 (`cmp:varuna-vahana`). Medieval images follow the makara.
3. **The Bṛhat Saṃhitā's Gaṇeśa verse is textually insecure.** It is found only in Kern's text (his 58.58); the GRETIL e-text prints it in brackets. So it cannot date Gaṇeśa's iconography to c. 550 (`claim:bs-ganesha-verse`). The earliest Gaṇeśa images in the dataset are the niche images of Udayagiri Caves 7, 17 and 18 (early 5th c.).
4. **Earliest dated representations are linked wherever a record exists.** Highlights:
   - Bhū-Varāha, Anantaśayana, the ekamukhaliṅga, Mahiṣāsuramardinī, the Mothers, Gaṅgādhara and Gaṇeśa: Udayagiri (c. 401–415).
   - Yajña-Varāha: Eran (c. 510).
   - Harihara and Trivikrama: Bādāmi Cave 3 (578).
   - Ṣaṇmukha: Yaudheya coins.
   - Vaikuṇṭha Caturmūrti: Khajuraho, Lakṣmaṇa temple (954), with the inscription REFERS_TO the form.
   - Bhikṣāṭana: Kailāsanātha, Kanchipuram (early 8th c.).
   - **Gaṅgādhara** is attested at Udayagiri Cave 6 (c. 401), a century before Elephanta.
   - Where the key early example is missing (Kuṣāṇa Mathurā images, Bharhut Gaja-Lakṣmī, the Jain Sarasvatī), it is named in the record's `attributes.earliestRepresentation` and listed in §5 for the material agent.
5. **Temple architecture is now a navigable layer.** There are 30 style/type/plan concepts and 14 elements. 161 MEMBER_OF edges link 119 temple records (round 1 and the temple agent's round 2) to their styles, matched to each temple's `attributes.architecture`. Each style is tied to its treatises (Mayamata, Mānasāra, Samarāṅgaṇa Sūtradhāra, Aparājitapṛcchā, Śilpa Prakāśa, Prāsādamaṇḍana, Tantrasamuccaya). The textual meaning of *vesara* is kept apart from its modern regional use (`claim:vesara-meaning`).

## 2. Dataset summary

| Type | Count | Notes |
|---|---|---|
| deity | 75 | 53 iconographic forms, 9 Mahāvidyās, 13 groups/planets/guardians/classes |
| concept | 73 | 30 temple styles/types/plans, 14 elements, 17 attributes, 4 sculptural schools, 8 vāstu/iconometry/conventions |
| passage | 15 | BS 52/55/57/59; AP 42–43, 44–47, 48, 49, 50, 51, 52, 53–55; VDhP III.35–43 and 44–85; MP 258–263 |
| text | 12 | treatises (see "What I added") |
| character | 6 | vāhanas |
| person | 2 | Varāhamihira, Maṇḍana |
| claim | 2 | `claim:bs-ganesha-verse`, `claim:vesara-meaning` |

**Assertions (691), by predicate:** MEMBER_OF 224 · DEPICTED_IN 102 · ASSOCIATED_WITH 83 · APPEARS_IN 70 · FORM_OF 59 · PART_OF 48 · MENTIONED_IN 42 · VAHANA_OF 14 · WORSHIPPED_AT 13 · IDENTIFIED_WITH 13 · DERIVED_FROM 7 · CONCERNS 4 · ATTRIBUTED_TO 3 · CONTRADICTS 2 · CENTRAL_TO, TEACHER_OF, PARENT_OF, DEVOTEE_OF, REFERS_TO, COMPOSED_BY and REFERS_TO_TEXT 1 each.

**Evidence class:** 5: 398 · 1: 165 · 4: 105 · 6: 21 · 3: 1 · 7: 1.

**Status:**

| | verified-online | reference-checked | source-checked | recall | disputed |
|---|---|---|---|---|---|
| Assertions | 140 | 327 | 183 | 38 | 3 |
| Entities | 61 | 76 | 43 | 4 | 1 |

**Most connected:**
- concept:nagara and concept:dravida (42 each)
- psg:bs-57-pratimalakshana (31)
- deity:shiva (22)
- concept:hindu-temple-architecture (21)
- psg:ap-50-devi-images (19)
- concept:kalinga-style (15)
- deity:mahavidyas (14)
- deity:ashta-dikpala (12)
- deity:navagraha (11)
- concept:rock-cut-temple (11)
- deity:ardhanarishvara, deity:anantashayana, deity:mahishasuramardini and deity:matrikas (10 each)

**Comparisons (8):**
- `cmp:ganesha-gupta-pala-chola`
- `cmp:nataraja-badami-vs-chola`
- `cmp:mahishasuramardini-across-periods`
- `cmp:vishnu-image-texts` (Bṛhat Saṃhitā vs Agni Purāṇa vs Viṣṇudharmottara vs Mayamata)
- `cmp:varuna-vahana`
- `cmp:surya-image`
- `cmp:linga-proportions`
- `cmp:matrika-lists`

Row status: verified-online 15 · reference-checked 7 · source-checked 3 · recall 6.

## 3. Evidence ledger

**Checked online (primary e-texts, GRETIL):**
- **Bṛhatsaṃhitā** (Yano & Sugita, from Tripathi with Kern's variants), chapters 52, 55, 57 and 59 read in full.
  - Verses used: 52.2–3 and 52.42–49 (Vāstupuruṣa, 81 squares, 45 deities); 55.10–31 (64-square temple, proportions, door guardians and mithunas, twenty temple types, Maya, Viśvakarman and Garga).
  - Also 57.1–57 (aṅgula scale, proportions, all deity prescriptions); the bracketed k.58.58 (Gaṇeśa); 59.19 (sectarian installers).
  - Numbering note: chapters from 36 on run one lower than in Kern and Bhat.
- **Agnipurāṇa** (Mitra, Bibliotheca Indica; input Takashima), chapters 42–55 read: 48.1–14 (all 24 names confirmed); 49.1–27; 50.1–42; 51.1–17; 52.1–16; 53.1–4; 54.1–6.
- **Mārkaṇḍeyapurāṇa 1–93**: DM 8.12–20 (MkP 88.12–20: the seven śaktis with mounts and weapons; 8.13 "each with the form, ornaments and mount of its god"); DM 7 (MkP 87.26: Cāmuṇḍā named); MkP 78.24 and 78.31 (Revanta born armed and mounted).
- **Toḍalatantra** 10.9–11: the ten Mahāvidyās equated with the ten avatāras.
- **Citralakṣaṇa** of Nagnajit (Sastri's edition): text and header.

**Checked online (bibliographic existence):** archive.org search API listings and metadata confirmed these editions:
- Dagens' Mayamata (Motilal); its OCR text is unusable, so it was not used for locators.
- Ganapati Sastri's Mayamata (TSS 65, 1919).
- Acharya's Mānasāra (1933–34).
- Ganapati Sastri's Samarāṅgaṇa Sūtradhāra (GOS 25/32).
- Boner & Śarmā's Śilpa Prakāśa (1966).
- Kramrisch's *The Hindu Temple* (1946).
- Shah's Viṣṇudharmottara III.
- Gopinatha Rao (1914–16) and Banerjea (1956).

**Reference-checked (Wikipedia raw wikitext, used as pointers):**
- Iconographic forms: Ardhanarishvara, Harihara, Dakshinamurti, Somaskanda, Lingodbhava, Bhikshatana, Kalyanasundara, Gajasurasamhara, Tripurantaka, Bhairava, Virabhadra, Ravananugraha, Kiratarjuniya, Sadashiva, Lingam, Mukhalinga, Nataraja, Karana (dance), Trivikrama, Vaikuntha Chaturmurti, Vishvarupa, Lakshmi Narayan, Narasimha, Varaha, Venugopala.
- Goddesses: Mahishasuramardini, Gaja Lakshmi, Matrikas, Chamunda, Lajja Gauri, Yogini, Mahavidya and the individual Mahāvidyās, Annapurna, Saraswati.
- Other deities and beings: Ganesha, Heramba, Kartikeya, Surya, Navagraha, Dikpala, Garuda, Nandi, Hanuman, Nāga, Yaksha, Kubera, Kamadeva, Revanta, Lakulisa, Umamaheshvara.
- Architecture: Nagara architecture, Dravidian architecture, Vesara, Kalinga architecture, Architecture of Kerala, Khmer architecture, Candi of Indonesia, Bengal temple architecture, Hindu temple architecture, Garbhagriha, Shikhara.
- Treatises and Purāṇas: Bṛhat Saṃhitā, Varāhamihira, Manasara, Samarangana Sutradhara, Aparajitaprccha, Vastu shastra, Matsya Purana, Vishnudharmottara Purana.
- Sites: Udayagiri Caves (cave-by-cave: Gaṇeśa in Caves 7, 17 and 18; Mātṛkās in Caves 4, 6 and 7; Gaṅgādhara and Mahiṣāsuramardinī in Cave 6; river goddesses at Cave 19; Anantaśayana in Cave 13); Elephanta Caves (Mātṛkā panel, Andhaka panel).

The Wikipedia action API was rate-limited, so raw pages were fetched slowly, and some page titles do not exist.

**Secondary outline (online):** Jeste, *Arts in the Purāṇas* (Wisdom Library), used for the Matsya Purāṇa image chapters 258–263.

**Scholarly sources cited without being re-read online (`source-checked` where I am confident):**
- Iconography: Gopinatha Rao 1914–16, Banerjea 1956, Harle 1974 and 1994, Williams 1982, Huntington 1985, Dehejia 1990 and 1986, Collins 1988, Kinsley 1986 and 1997, Bolon 1992, Getty 1936, Brown 1991, Lutgendorf 2007, Sivaramamurti 1974.
- Architecture: Hardy 1995 and 2007, Michell 1977 and 2000, Donaldson 1985, Kramrisch 1946, Meister–Dhaky (EITA), Dhaky 1977, McCutchion 1972, Sarkar 1978, Kak 1933, Slusser 1982, Jacques & Freeman 1997, Jessup 2004, Dumarçay 1986, Guillon 2001.

## 4. Uncertainty log

- **Mayamata and Mānasāra** chapter locators are not verified: the archive.org OCR is unusable. The nāgara/drāviḍa/vesara definitions are `source-checked` at work level. The Mayamata row in `cmp:vishnu-image-texts` is `recall`. *To settle:* consult Dagens 1994 (the chapters on temple classes and on images).
- **Viṣṇudharmottara III.44–85 and III.35–43**: the ranges come from Shah's edition as summarised in reference works (`reference-checked`). The VDhP row of the Viṣṇu comparison is `recall`.
- **Matsya Purāṇa 258–263**: the chapter outline comes from a secondary study, and GRETIL stops at chapter 176. The verse-level assignment of Ardhanārīśvara (260) and Bhairava (259) is `reference-checked`, medium confidence.
- **The 108 karaṇas**: the count of 81 completed panels at Thanjavur and the labelled series at Chidambaram are from reference works (openQuestion on `concept:karanas`).
- **Kaṅkālī Ṭīlā Jain Sarasvatī**: the year 54 is cited, but the accession number (often given as J.24) and the reading of the date are not verified (openQuestion on `deity:jain-sarasvati`).
- **Elephanta "Trimūrti"**: whether it is Sadāśiva, Maheśamūrti or a Trimūrti is recorded as `disputed` (`iconography:69`, DEPICTED_IN with `competing`).
- **Vesara**: textual vs modern meaning is held in `claim:vesara-meaning`, with Mayamata and Mānasāra CONTRADICTS.
- **Lajjā Gaurī = Aditi**: class 7, `disputed`.
- **Recall-level depictions** (38 assertions), mostly standard programmes I am confident of but have not checked object by object:
  - Cōḻa koṣṭha Dakṣiṇāmūrti at Thanjavur, Gangaikondacholapuram and Darasuram
  - Pallava Somāskanda panels
  - Dikpālas at Khajuraho and Rājarāṇī
  - Navagraha slab at Konark
  - Ellora caves 14, 21 and 29 panels
  - Lakulīśa at Bhubaneswar
  - Āyudhapuruṣas at Udayagiri

  Each would be settled by the relevant monograph or ASI site description.
- **Hemāḍpanthī** membership of the Maharashtra jyotirliṅga temples is `low` confidence: the label follows the temple records, and most of that fabric is 18th-century.

## 5. Cross-agent links

**Referenced from other domains:**
- **Purāṇa:** deities Śiva, Viṣṇu, Durgā, Lakṣmī, Gaṇeśa, Skanda, Varāha, Narasiṃha, Vāmana, Śeṣa, Garuḍa, Nandin, Cāmuṇḍā, Kālī, Vīrabhadra, Vindhyavāsinī; narratives; texts.
- **Purāṇa round 2:** the seven Mātṛkās (`deity:brahmani` … `deity:aindri`), `deity:kamadeva`, `narr:tripura-dahana`, `narr:andhaka-slaying`, `narr:gajasura-krittivasa`, `narr:ardhanarishvara-origin`. I had drafted my own Mātṛkā and Kāmadeva records; I dropped them once the purana agent's appeared and added only the Agni Purāṇa prescriptions and mounts.
- **Vedic:** Indra, Agni, Yama, Varuṇa, Vāyu, Sūrya, Soma, Rudra, Aditi, Sarasvatī.
- **Epic:** Kubera, Hanumān, Rāma, Balarāma, Sāmba, Pradyumna, Bali, Rāhu, Śukra, Budha; `text:bhagavad-gita`; and from epic round 2, `text:kiratarjuniya` and `text:kumarasambhava`.
- **Regional:** Murukaṉ, Vaḷḷi, the Pāñcarātra saṃhitās (Jayākhya, Ahirbudhnya), Periya Purāṇam, Maṅgalkāvya.
- **Material:** Udayagiri Varāha, Eran boar, the Deogarh panels, the Bādāmi Naṭarāja, the Elephanta Sadāśiva, the Mamallapuram reliefs, the Ellora Rāvaṇānugraha, Cōḻa Naṭarājas, Gudimallam, Phnom Da Kṛṣṇa, Govardhanadhara (BKB). From material round 2: `art:yaudheya-karttikeya-coins`, `art:huvishka-skanda-coins`, `ins:khajuraho-lakshmana`.
- **Temple:** about 110 round-1 temples. From temple round 2: Vaitāl Deuḷ, Paraśurāmeśvara, Brahmeśvara, Rājarāṇī, Ananta Vāsudeva, the Bishnupur temples, Kāntajī, Tripura Sundarī, Avantisvāmin, Pandrethan, Śaṅkarācārya, Masrur, Baijnath, Rani ki Vav, Kiradu, Baroli, Bateshwar, Osian, Lakkundi, Itagi, Doddagaddavalli, Ellora caves 14, 21 and 29, the Mitaoli and Bhedaghat yoginī temples, Kāl Bhairav (Ujjain), Lepakshi, Tārāpīṭh, Ugratārā, Ahobilam, Hiḍimbā Devī, Bhīmakālī.
- One existing assertion duplicated by temple round 2 was skipped automatically: Vīrabhadra WORSHIPPED_AT Lepakshi.

**Wished-for records — for the material agent (key early examples):**
- Kuṣāṇa Mathurā images in the Government Museum, Mathurā: Ardhanārīśvara stele; Mahiṣāsuramardinī; Mātṛkā panels; Sūrya; Kārttikeya (inscribed); Umā-Maheśvara; Chhargaon Nāga.
- Bharhut Gaja-Lakṣmī medallion (Indian Museum, Kolkata) and the "Kupiro yakho" pillar; Sanchi Stūpa 2 railing; Azilises Gaja-Lakṣmī coin. These are Buddhist and Indo-Scythian contexts.
- Kaṅkālī Ṭīlā Jain Sarasvatī (State Museum, Lucknow), year 54.
- Parkham yakṣa; Didarganj yakṣī.
- Bhita liṅga; Bhumara Gaṇeśa and ekamukhaliṅga; Khoh liṅga.
- Gupta three-headed Viṣṇu from Mathurā (Boston MFA); a Kashmir Vaikuṇṭha bronze; the Gupta Viśvarūpa stele.
- Asram Maha Rosei Harihara (Musée Guimet).
- Licchavi Trivikrama of 467 CE (to verify).
- Lajjā Gaurī plaques from Nāgārjunakoṇḍa and Aihole.
- Valuvur Gajasaṃhāra bronze.
- Pāla Mahiṣāsuramardinī and Gaṇeśa steles; a Cōḻa Kāliyamardana bronze.

**Wished-for records — for the temple agent:**
- Tiruchirappalli Rock Fort upper cave (Pallava Gaṅgādhara inscription of Mahendravarman I)
- Hampi Lakṣmī-Narasiṃha monolith (1528)
- Sanchi Temple 17
- Teli-kā Mandir (Valabhī type)

**Wished-for records — other domains:**
- `pol:pala` (no Pāla polity exists yet)
- `text:natyashastra` (for `concept:karanas`), `text:kamikagama`, `text:mahabhagavata-purana`

## 6. Graph opportunities

- **Form → text → earliest object chains.** For example: Ardhanārīśvara → BS 57.43 / VDhP / MP 260 → Elephanta. Or Gaṅgādhara → Udayagiri Cave 6 (401) → Elephanta → Ellora. These could be drawn as a "prescription vs practice" timeline per form.
- **Style map.** MEMBER_OF edges from 119 temples to 30 styles, with coordinates already on the temples, give a ready choropleth of Nāgara, Drāviḍa, Kaliṅga, Karṇāṭa Drāviḍa, Bengal, Kashmiri, Khmer, Javanese and Cham.
- **Attribute network.** The 17 attribute concepts link to deities through ASSOCIATED_WITH, and to BS and AP verses through MENTIONED_IN. A bipartite view (who holds what) shows, for example, that the śrīvatsa is shared by Viṣṇu and the Jina (BS 57.31, 57.45).
- **Mount network.** VAHANA_OF edges, including the Mātṛkās' borrowed mounts from DM 8.
- **Goddess clusters.** Mahāvidyā ↔ avatāra IDENTIFIED_WITH edges (Toḍala Tantra) and Mātṛkā ↔ god.

## 7. Timeline contributions

**Scholarly-textual (15 DateClaims):**

| Text or person | Date | Basis or view |
|---|---|---|
| Bṛhat Saṃhitā and Varāhamihira | 505–587 | |
| Mayamata | 9th–12th c. | Dagens (disputed) |
| Mayamata | 5th–7th c. | reference works (disputed) |
| Mānasāra | 500–700 | Acharya |
| Mānasāra | 7th–8th c. | Michell |
| Samarāṅgaṇa Sūtradhāra | 1000–1055 | |
| Aparājitapṛcchā | 1000–1200 | |
| Śilpa Prakāśa | 900–1200 | disputed |
| Rūpamaṇḍana, Prāsādamaṇḍana and Maṇḍana | 1433–1468 | |
| Śilparatna | 16th c. | |
| Tantrasamuccaya | c. 1427 | |
| Toḍala Tantra | late medieval | disputed |

**Material (1):** a Bṛhat Saṃhitā manuscript of 1279 (CUL Add. 1706; reference-checked).

**Earliest-representation dating** is carried by DEPICTED_IN edges to dated material and temple records rather than by new DateClaims: Udayagiri 401–415, Eran c. 510, Bādāmi 578, Pallava c. 700–728, Khajuraho 954, Thanjavur c. 1010, Gaṅgaikoṇḍacōḻapuram c. 1035.

## 8. Research gaps and recommended follow-up

1. Obtain readable texts of the Mayamata (Dagens) and the Mānasāra (Acharya). Then upgrade the style definitions and the Viṣṇu comparison to verse level.
2. Verify the Viṣṇudharmottara III chapters and the Matsya Purāṇa 258–263 verse ranges against Shah and the Ānandāśrama edition. Add the VDhP prescriptions (Gaurīśvara, Vaikuṇṭha, the planets) as class-1 rows.
3. Have the material agent create the Kuṣāṇa Mathurā, Bharhut/Sanchi and Kaṅkālī Ṭīlā records listed in §5, so that the earliest representations can be linked by DEPICTED_IN rather than only named in attributes.
4. Check the 38 recall-level depictions object by object. The most valuable are the Cōḻa koṣṭha programme and the Pallava Somāskanda panels.
5. Add the Āgamic image prescriptions (Kāmika, Aṃśumadbheda, Uttarakāmika) once regional creates those texts.
6. Extend coverage to Jain and Buddhist iconographic cross-overs (Ambikā, Padmāvatī, Hārītī–Pāñcika) and to Southeast Asian icon types (Javanese Agastya/Śiva Guru, Khmer Harihara).

## 9. Candidate discoveries

1. **Two treatises, one Viṣṇu.** BS 57.33 and AP 49.16 list the same eight weapons in the same order. The only differences: AP turns the "peace-giving" hand into a boon-giving one and adds Garuḍa. This suggests a shared iconographic source or direct dependence. *Ids:* `cmp:vishnu-image-texts`, `psg:bs-57-pratimalakshana`, `psg:ap-49-avatara-images`. *Caveat:* the Agni Purāṇa's date is uncertain, and the direction of dependence is not shown.
2. **Varuṇa rode a goose before he rode a makara.** BS 57.57 gives Varuṇa a haṃsa; AP 51.15 gives the makara that medieval temples adopt. *Ids:* `cmp:varuna-vahana`, the corresponding VAHANA_OF assertions. *Caveat:* two texts are not a chronology of practice.
3. **The Bṛhat Saṃhitā's Gaṇeśa may be an interpolation**, while Udayagiri already has Gaṇeśa images (Caves 7, 17 and 18). The image tradition is attested on the ground as early as, or earlier than, any secure Sanskrit description. *Ids:* `claim:bs-ganesha-verse`, the deity:ganesha DEPICTED_IN temple:udayagiri-caves assertion. *Caveat:* the Wikipedia cave descriptions need confirming against Willis or Williams.
4. **Two lists of seven Mothers.** The Devī Māhātmya's seven include Nārasiṃhī (DM 8.12–20). The Agni Purāṇa's seven drop her and end with Cāmuṇḍā (AP 50.18–23), which is the sculptural Saptamātṛkā row. *Ids:* `cmp:matrika-lists`. *Caveat:* other Purāṇas give other lists.
5. **The Mahāvidyās as avatāras.** Toḍala Tantra 10.9–11 maps the ten Mahāvidyās onto the ten avatāras: Kālī as Kṛṣṇa, Durgā as Kalki, Mahālakṣmī as the Buddha. It is a Śākta inversion of the Vaiṣṇava scheme. *Ids:* the IDENTIFIED_WITH assertions from the Mahāvidyās to the avatāras, and concept:dashavatara IDENTIFIED_WITH deity:mahavidyas. *Caveat:* the date is uncertain, and other tantras pair them differently.
6. **Sun images and their priests.** BS 57.46 prescribes northern dress for Sūrya, and BS 59.19 assigns his installation to the Magas. The text itself thus links the "booted Sūrya" to an Iranian-derived priesthood. *Ids:* `deity:surya-udichya`, the BS 59.19 MENTIONED_IN assertions. *Caveat:* the text links the two; it does not explain the dress historically.

---

## What I added

**Entities (185):**

- **Iconographic forms — Śiva (24):**
  - Ardhanārīśvara; Harihara; Dakṣiṇāmūrti; Somāskanda; Liṅgodbhavamūrti; Bhikṣāṭana; Kalyāṇasundara
  - Gajāsurasaṃhāra; Tripurāntaka; Gaṅgādhara; Bhairava; Andhakāsuravadhamūrti; Caṇḍeśānugrahamūrti; Rāvaṇānugrahamūrti; Kirātamūrti; Sadāśiva
  - Liṅga; Mukhaliṅga; Ekamukhaliṅga; Caturmukhaliṅga; Pañcamukhaliṅga; Umā-Maheśvara; Kālāntaka; Lakulīśa
- **Iconographic forms — Viṣṇu (12):** Anantaśayana; Trivikrama; Vaikuṇṭha Caturmūrti; Viśvarūpa; Lakṣmī-Nārāyaṇa; Yoga-Narasiṃha; Bhū-Varāha; Yajña-Varāha; Veṇugopāla; Kāliyamardana; Govardhanadhara; Sudarśana.
- **Iconographic forms — Goddesses (5):** Mahiṣāsuramardinī; Gaja-Lakṣmī; Lajjā Gaurī; Annapūrṇā; Sarasvatī (Jain Śrutadevatā).
- **Iconographic forms — Gaṇeśa (3):** Heramba; Ucchiṣṭa; Nṛtta.
- **Iconographic forms — Skanda/Murukaṉ (4):** Ṣaṇmukha; Devasenāpati; Daṇḍāyudhapāṇi; Svāminātha.
- **Iconographic forms — Sun (2):** Udīcyaveṣa Sūrya; Revanta.
- **Iconographic forms — Hanumān (3):** Pañcamukha; Vīra; Dāsa.
- **Groups, planets, guardians, classes (13):** Catuḥṣaṣṭi Yoginī; Daśa Mahāvidyās; Navagraha; Maṅgala; Bṛhaspati; Śani; Ketu; Aṣṭa-dikpāla; Nirṛti; Īśāna; Nāga; Yakṣa; Yakṣī.
- **Mahāvidyās (9):** Tārā; Tripurasundarī; Bhuvaneśvarī; Bhairavī; Chinnamastā; Dhūmāvatī; Bagalāmukhī; Mātaṅgī; Kamalā.
- **Vāhanas (6):** Airāvata; Yamunā's tortoise; Yama's buffalo; Agni's ram; Vāyu's deer; Kāma's parrot.
- **Treatises, texts, authors (14):**
  - Bṛhat Saṃhitā; Varāhamihira; Citralakṣaṇa; Mayamata; Mānasāra; Samarāṅgaṇa Sūtradhāra; Aparājitapṛcchā
  - Śilpa Prakāśa; Rūpamaṇḍana; Prāsādamaṇḍana; Maṇḍana; Śilparatna; Tantrasamuccaya; Toḍala Tantra
- **Passages (15):**
  - BS 52, 55, 57, 59
  - AP 42–43, 44–47, 48, 49, 50, 51, 52, 53–55
  - VDhP III.35–43, III.44–85
  - MP 258–263
- **Vāstu, iconometry, conventions (8):** Vāstuśāstra; Śilpaśāstra; Vāstupuruṣa-maṇḍala; Tālamāna; Caturviṃśatimūrti; Āyudhapuruṣa; Gaṅgā and Yamunā as door guardians; the 108 karaṇas.
- **Temple styles, types, plans (30):**
  - Hindu temple architecture (hub)
  - Northern: Nāgara; Latina; Śekharī; Bhūmija
  - Southern and Deccan: Drāviḍa; Vesara; Karṇāṭa Drāviḍa
  - Odisha: Kaliṅga; Rekhā deuḷa; Pīḍhā deuḷa; Khākharā deuḷa
  - Other Indian regions: Kerala; Kashmiri; Bengal; Cālā; Ratna; Māru-Gurjara; Hemāḍpanthī; Newar pagoda; Western Himalayan timber
  - Southeast Asia: Khmer; Central Javanese; Cham; Balinese
  - Types and plans: Rock-cut; Gupta flat-roofed shrine; Pañcāyatana; Sāndhāra; Gajapṛṣṭha
- **Architectural elements (14):** Garbhagṛha; Vimāna; Śikhara; Gopura; Maṇḍapa; Āmalaka; Kalaśa; Prākāra; Antarāla; Jagamohana; Gavākṣa; Pradakṣiṇāpatha; Dvārapāla; Mithuna.
- **Sculptural schools (4):** Mathurā (Śaka–Kuṣāṇa); Gupta; Pāla–Sena; Cōḻa bronzes.
- **Attributes (17):**
  - Gestures: abhaya, varada, vyākhyāna/cin-mudrā
  - Postures: tribhaṅga, utkuṭikāsana
  - Held attributes: triśūla, śaṅkha, gadā, paraśu, pāśa, aṅkuśa, vajra, ḍamaru, akṣamālā, kamaṇḍalu, śakti/vel
  - Bodily mark: śrīvatsa
- **Claims (2):** the BS Gaṇeśa verse; the meaning of "vesara".

**Assertions (691):**
- 224 style/group memberships, including 161 temple → style edges (119 temples).
- 102 DEPICTED_IN edges, form → dated object or temple.
- 70 APPEARS_IN prescriptions; across all predicates, 135 class-1 assertions are verse-level verified on GRETIL. The prescriptions also cover existing deities: Indra, Yama, Varuṇa, Kubera, Brahmā, Skanda, Sarasvatī, Gaṅgā, Yamunā, Gaṇeśa, Cāmuṇḍā, the Mātṛkās, Nandin, Garuḍa, Vīrabhadra, Vindhyavāsinī/Ekānaṃśā, Balarāma, Sāmba, Pradyumna, Rāma and Bali.
- 59 FORM_OF; 14 VAHANA_OF; 13 IDENTIFIED_WITH, including the Toḍala Tantra Mahāvidyā = avatāra equations.

**Comparisons (8):** Gaṇeśa (Gupta / Pāla / Cōḻa / AP / BS); Naṭarāja (Bādāmi / Elephanta / Cōḻa / Thanjavur); Mahiṣāsuramardinī (Kuṣāṇa / Udayagiri / Mamallapuram / Pāla / AP / DM); the Viṣṇu image (BS / AP 49 / AP 48 / VDhP / Mayamata); Varuṇa's mount; the Sūrya image; liṅga divisions; Mātṛkā lists.

**Sources (33 new):**
- GRETIL e-texts: BS, AP, MkP, Toḍala, Citralakṣaṇa.
- Translations and editions: Kern, Bhat, A. M. Shastri; Dagens; Ganapati Sastri (Mayamata, Samarāṅgaṇa); Acharya; Mankad; Boner & Śarmā; Shah; Ghosh (Nāṭyaśāstra).
- Architecture: Kramrisch 1946; Meister–Dhaky EITA; Dhaky 1977; Bhattacharyya 1963; Sarkar 1978; Jessup; Guillon.
- Iconography: Kinsley 1997; Bolon; Getty; Brown; Harle 1974; Sivaramamurti; Coomaraswamy 1918; Pal 1986; L'Hernault; Jeste.
- Four sources I had drafted (Dehejia 1986, Kinsley 1986, McCutchion 1972, Kak 1933) were dropped in favour of identical records already in other agents' files.

**Upgrades to other files:** none. This agent has no round-1 files, and no other agent's file was edited.
