# Purāṇic Literature Researcher — report (agent `purana`)

Files: `data/entities/purana.json` (258), `data/assertions/purana.json` (632), `data/sources/purana.json` (43 new sources),
`data/comparisons/purana.json` (9 tables), `data/sacred-chronology.json` (17 eras). `npm run validate -- --domain purana`: **0 errors, 0 warnings**.
Assertion ids cited below refer to the file as written on 2026-11-08 (the generator drops triples already present in
files that sort before `purana.json`, so ids can shift if those files change before a rebuild).

## 1. Executive findings

1. **The Purāṇas are layered, and the critical texts show it.** Rocher's caution — no Purāṇa can be dated as a whole — is written
   into every text entity (`details`/`limits`) with several `view`-tagged DateClaims (Hazra, Rocher, Doniger, Wilson, Hardy, Bryant,
   Coburn, Pingree, Kramrisch, Olivelle). The most striking text-critical point: in M. M. Pathak's critical edition of the Viṣṇu
   Purāṇa the half-verse that calls the eighteen "*mahāpurāṇas*" and adds "upapurāṇas" is a starred insertion (ViP 3.6.23*8),
   not constituted text (`claim:mahapurana-term-late`, purana:621–622).
2. **Earliest dated witnesses.** The early Skandapurāṇa (`text:skandapurana-early`, late 6th–early 7th c.) is kept separate from the
   printed Skanda Purāṇa; its MS of 810 CE is the oldest dated Purāṇa manuscript (Leiden project page, checked). The Devī Māhātmya
   has a secure terminus ante quem: the Dadhimatī-mātā inscription (608 CE, EI XI) quotes "sarvamaṅgalamāṅgalye…", which is MkP 91.9
   (DM 11) in the GRETIL text (purana:623–624; inscription entity owned by `material`).
3. **Avatāra lists differ radically by text** (`cmp:avatara-lists`; 78 AVATARA_OF assertions, each qualified by text or tradition): the Nārāyaṇīya's
   constituted text (MBh CE 12.326.71–94) has Varāha, Narasiṃha, Vāmana, two Rāmas, Kṛṣṇa, Haṃsa and Hayaśiras but **no Matsya,
   Kūrma or Kalki**; HV (CE) 31 has nine prādurbhāvas with Dattātreya; BhP 1.3 has 22 (Kṛṣṇa "Bhagavān himself", 1.3.28); Matsya 47
   explains seven *human* births by Bhṛgu's curse (Dattātreya, Māndhātṛ, Jāmadagnya, Rāma, Vyāsa, Buddha, Kalki); Agni 49's ten put
   **Balarāma** (plough and pestle) in place of Kṛṣṇa; Garuḍa 1.1 copies BhP 1.3 almost verbatim (Buddha "jinasuta").
4. **The flood fish is Brahmā in the Mahābhārata** (MBh CE 3.185.48 "ahaṃ prajāpatir brahmā", purana:227), Janārdana in the Matsya
   (1.28), Viṣṇu with Satyavrata and the demon Hayagrīva in the Bhāgavata (8.24) (`cmp:flood-story`; DERIVED_FROM `narr:manu-fish`, purana:534).
5. **The churning without poison.** Both epic critical texts lack the hālāhala episode: MBh CE 1.15–17 has the tortoise-king
   Akūpāra (not Viṣṇu) bear Mandara; VR CE 1.44 has neither tortoise nor poison; ViP 1.9 gives the poison to the nāgas; only BhP 8.7.43
   has Śiva drink it (`cmp:churning-versions`).
6. **Genealogies disagree.** ViP 4.4.49 and BhP 9.10.1 give Raghu → Aja → Daśaratha; Vālmīki (VR CE 1.69.26–30) puts Raghu much
   earlier and makes Aja the son of Nābhāga, son of a Yayāti, son of a Nahuṣa — all inside the Solar line. These homonyms are kept as
   separate ids (`char:nahusha-vr`, `char:yayati-vr`, `char:nabhaga-vr`); ViP 3.1.34 gives Manu nine sons, BhP 8.13.3 ten.
7. **Yuga arithmetic is plural.** Manu 1.68–73 gives 4,800/3,600/2,400/1,200 "years", a 12,000-year "yuga of the gods", with no
   conversion; ViP 1.3.19–21 gives the manvantara as 852,000 divine = 306,720,000 human years (ratio 360); ViP 4.24.33 gives Kali as
   360,000 human years; Āryabhaṭa (AB 3.7–10) uses equal yuga-quarters and 1,008 yugas per day of Brahmā and implies the 3102 BCE Kali
   epoch, which the 634 CE Aihole inscription reflects (3,735 years after the Bhārata war) (`cmp:yuga-lengths`, `claim:kali-epoch-3102`).

## 2. Dataset summary

- Entities 258: 92 owned (all core ids with `owner: purana`) + 166 new. By type: character 76, passage 46, text 32, deity 29,
  narrative 21, place 18, concept 13, tradition 8, claim 6, lineage 5, collection 3, person 1.
- Assertions 632: PART_OF 88, PARTICIPANT_IN 84, AVATARA_OF 78, NARRATED_IN 53, PARENT_OF 52, CENTRAL_TO 39, MEMBER_OF 38,
  MENTIONED_IN 25, IDENTIFIED_WITH 18, SLAYS 15, TEACHES_IN 14 … Status: verified-online 457, source-checked 164, recall 9, disputed 2.
  Evidence class: 1 (textual) 477, 5 (scholarly) 100, 6 (tradition) 40, 4 (material) 9, 3 (epigraphic) 5, 2 (manuscript) 1.
- Most connected: `deity:vishnu` (109 edges), `text:bhagavata-purana` (28), `col:mahapuranas` (23), `deity:shiva` (22),
  `lin:suryavamsha` (20), `text:vishnu-purana`, `narr:samudra-manthana` (19 each), `text:matsya-purana`, `deity:devi` (14).
- Comparisons (9): avatāra lists; flood story; Śiva's portrayal (RV 2.33 → ŚvU → MBh → LiP/ŚivP → early SP); the Goddess (Kena →
  HV 47 → DM → DBhP); yuga lengths (Manu / MBh 12.224 / ViP / BhP / Āryabhaṭa); churning (MBh / VR / ViP / BhP); lists of the
  eighteen Purāṇas and verse counts; Rāma's ancestors (ViP / BhP / VR, Manu's sons); origins of the śakti pīṭhas.
- Sacred chronology (17 eras, every description prefixed "Traditional chronology:"): Pādma and Vārāha kalpas, night of Brahmā;
  Svāyambhuva, Cākṣuṣa, Vaivasvata (current, ViP 3.1.7 / BhP 8.13.1), Sāvarṇika manvantaras; the mahāyuga; the 28th mahāyuga of
  Vaivasvata; Kṛta, Tretā, Dvāpara, Kali (divine + human years); Tretā–Dvāpara and Dvāpara–Kali junctions (Rāma; Kṛṣṇa and the war);
  Kalki's advent; Āryabhaṭa's equal-quarter mahāyuga as an alternative system.

## 3. Evidence ledger

Checked online (GRETIL e-texts downloaded and grepped; URLs are in each SourceRef):
- **Bhāgavata** (Stiehl e-text): 1.1.2, 1.1.4, 1.3.1–29, 2.7.1–53, 3.11.18–25, 3.13.18, 3.19.26, 4.5.2–3, 4.8.42, 4.12.25, 7.8.17–19,
  8.2.1–2, 8.3.2, 8.4.3–7, 8.7.38–43, 8.8.24, 8.12.18, 8.13.1–6, 8.19.20, 8.20.34, 8.22.35, 8.24.1–61, 9.7.7, 9.8.10, 9.9.2, 9.10.1,
  9.14.33, 9.15.14, 9.18.3, 9.18.33, 12.2.16–20, 12.7.9–25, 12.13.3–10.
- **Viṣṇu Purāṇa** (Pathak critical edition, Schreiner e-text): 1.3.1–28, 1.4.4–46, 1.9 (whole churning), 1.20.32, 3.1.5–40,
  3.6.15–27 (incl. *8 insertion), 4.1.10–13, 4.3.17–24, 4.4.1–49, 4.6–4.10, 4.20.4, 4.24.7–34, 5.38.6–9.
- **Mahābhārata CE** (GRETIL chapter pages): 1.15–17, 3.185, 3.189.14, 12.224, 12.321–339 (searched; 12.326 read in full).
- **Vālmīki CE**: 1.37–44 (Sagara, Gaṅgā, churning), 1.69.19–31 (genealogy). **Harivaṃśa CE**: 31 (prādurbhāvas), 47.24–55 (Nidrā/Vindhya).
- **Mārkaṇḍeya/Devī Māhātmya**: MkP 81–93 colophons, 82.8–34, 85.40–44, 87.4–26, 91.9. **Matsya** (1954 text): 1.10–2.19, 13.11–60,
  47.29–251, 53.12–72, 103–112. **Manusmṛti** 1.64–86. **Garuḍa** 1.1.13–35, 1.86.9–13. **Agni** 1.8–18, chapter titles 2–16, 16.5–13,
  49.1–12. **Liṅga** 1.17.31–45, 1.39.59–64, 1.76.60–61. **Kūrma** 1.1.12–15. **Nārada** 1.92.25–27. **Śiva** 1.2.49–61, 1.5–9,
  1.7.19–27, 7.1.1.42–65. **Śvetāśvatara** 3.1–11, 6.23. **Āryabhaṭīya** 1.5, 3.7–11. **Amarakośa** 1.6.5. **Devī Gītā** = DBhP 7.31–40.
  **Narasiṃha P** 40–44; **Vāmana P** 18–21 (Mahiṣa).
- Non-GRETIL pages checked: Leiden Skandapurāṇa project page (810 CE MS; volumes); Epigraphia Indica XI scans (jainqq.org, Dadhimatī
  inscription: editor Ram Karna, find-spot, Gupta 289 = 608 CE, verse text); Wikipedia pointers for date views (Puranas, Vishnu, Bhagavata,
  Devi Bhagavata, Kalika, Garuda, Agni, Varaha, Brahma, Narada, Matsya, Kurma, Vayu, Skanda, Padma, Brahmavaivarta, Bhavishya,
  Brahmanda, Linga, Narasimha, Vamana, Vishnudharmottara, Manusmriti; Aihole inscription). Date views are marked `source-checked`
  with the scholarly source plus the Wikipedia pointer, never Wikipedia alone.
- Not reachable: sacred-texts.com (Cloudflare block; Wilson VP, Griffith, Eggeling cited without deep links), UNESCO WHC pages (403).

Key scholarly sources: Rocher 1986; Hazra 1940 and 1958–63; Pathak 1997–99; Coburn 1984/1991; Brown 1990/1998; Bakker 2014 and
Skandapurāṇa vol. I; Sircar 1973; van Kooij 1972; Kramrisch 1928/1981; Hacker 1960; Jaiswal 1981; Bhandarkar 1913; Pargiter
1913/1922; Olivelle 2005; González-Reimann 2002; Pingree 1981; Fleet 1911; Kielhorn 1901 (EI VI).

## 4. Uncertainty log

- **Bhāgavata date** (9th–10th c. per Hardy and many; 6th c. per Hazra — Hazra's figure is from recall, check Hazra 1940; Gupta-era
  per arguments summarised by Bryant). Settled only by a stratified study of the BhP critical edition (Ahmedabad) — not consulted.
- **Kālikā Purāṇa ch. 18 and DBhP 7.30** (corpse-dismemberment and pīṭha lists) are `recall` locators; neither text is on GRETIL.
- **Kūrma 1.1.15**: "vāyavīyam anantaram / aṣṭādaśaṃ samuddiṣṭaṃ brahmāṇḍam iti saṃjñitam" can be read as a nineteenth title or as
  identifying the Vāyavīya with the Brahmāṇḍa; recorded both ways in notes, not resolved.
- **Matsya 47.237** places the Narasiṃha manifestation in "the fourth yuga-period" — ambiguous; the Kṛta placement of Narasiṃha in
  `sac:krita-yuga` is labelled traditional.
- **ViP 4.24.33** gives Kali as 360,000 human years beside "1,200 divine years" (4.24.34); recorded as the e-text reads.
- **Kena 3.12** (Umā Haimavatī) and **RV 2.33** comparison rows are `recall` (vedic domain owns those texts).
- **Skandapurāṇa colophon era** (810 vs 811 CE) — small uncertainty noted on `text:skandapurana-early`.
- **Devī Bhāgavata status** recorded as `claim:devi-bhagavata-mahapurana` (`disputed`) with the Matsya 53.20–21 description as the Śākta argument.
- **SkP "Viṣṇu is Śiva" (1.8)** — quoted from a Wikipedia pointer only; `low`/`recall`.

## 5. Cross-agent links

- Referenced (not defined): vedic — `deity:rudra, deity:indra, deity:agni, deity:soma, deity:surya, deity:aditi, deity:vayu, deity:prajapati,
  char:bhrigu, char:pururavas, char:urvashi, narr:manu-fish, narr:three-strides, narr:pururavas-urvashi, text:kena-upanishad,
  text:shvetashvatara-upanishad, text:shatapatha-brahmana, text:rigveda`; epic — `text:mahabharata, text:harivamsha, text:valmiki-ramayana,
  text:bhagavad-gita, char:rama, char:krishna, char:balarama, char:dasharatha, char:vyasa, char:shantanu, lin:yadava, lin:kuru,
  place:naimisha, place:kurukshetra, narr:lanka-war, narr:kurukshetra-war, narr:destruction-of-yadavas`; material — `ins:heliodorus,
  ins:hathibada-ghosundi, ins:mora-well, ins:aihole-ravikirti, ins:dadhimati-mata, art:agathocles-coins, art:gudimallam-linga,
  art:wima-kadphises-coin, deity:vasudeva, deity:sankarshana, ms:skandapurana-810`; regional — `deity:murugan, trad:pancharatra,
  trad:gaudiya, trad:shaiva-siddhanta`; temple — `temple:kamakhya, temple:angkor-wat, temple:mamallapuram, temple:badami-caves,
  temple:deogarh-dashavatara, temple:badrinath, temple:konark, temple:jagannath-puri, temple:somnath, temple:mahakaleshwar,
  temple:kedarnath, temple:kashi-vishwanath`.
- New shared-looking ids created here: `deity:garuda, deity:nandin, deity:shesha, deity:mohini, deity:dhanvantari, deity:hayagriva,
  deity:dattatreya, deity:virabhadra, deity:chamunda, deity:kaushiki, deity:vindhyavasini, deity:kamakhya` (also defined by `temple` —
  their copy is the one flagged), `char:buddha-avatara` (Purāṇic figure only), `text:skandapurana-early`, `text:aryabhatiya`,
  `person:aryabhata`, `place:vindhya, place:badari, place:kamarupa`, `concept:jyotirlinga, concept:shakti-pitha, concept:tirtha`.
- Duplicate source ids now also defined by later-sorting files (their copies are flagged): `src:gonda-1954, src:bhandarkar-1913` (vedic),
  `src:clothey-1978, src:mann-2012` (regional), `src:eck-1982, src:eck-2012, src:sircar-1973, src:clothey-1978` (temple).
- Material had already defined `ins:dadhimati-mata` and `src:ram-karna-ei11`; I dropped mine and reference theirs.
- Wished-for ids: `text:harshacarita` (Bāṇa's reference to a Vāyu-proclaimed Purāṇa), `text:surya-siddhanta`, `text:kumarasambhava`,
  `text:pashupata-sutra`, `ins:mandasor`/Gupta Vaiṣṇava inscriptions quoting Purāṇic verses, `person:lakulisha`.

## 6. Graph opportunities

- Avatāra × text matrix (`AVATARA_OF` with `qualifiers.text`): rows = 20 figures, columns = MBh, HV, ViP, BhP, Garuḍa, Matsya, Agni,
  tradition-level "standard ten".
- Solar/Lunar genealogy trees with text-coloured edges (ViP vs BhP vs VR), Ilā/Budha as the junction (`narr:ila-sudyumna`).
- Theology web: Devī ↔ Durgā / Kālī / Cāmuṇḍā / Kauśikī / Pārvatī / Vindhyavāsinī / Satī with `FORM_OF`/`IDENTIFIED_WITH` text qualifiers.
- "Who speaks which Purāṇa" (Matsya 53): TEACHES_IN edges from Matsya, Kūrma, Varāha, Vāyu, Agni, Skanda, Brahmā, Śiva, Mārkaṇḍeya, Nārada, Viṣṇu.
- Narrative → depiction links into the temple/material layers (Angkor churning, Deogarh Gajendramokṣa, Mamallapuram Mahiṣamardinī,
  Varāha and the contested "Descent of the Gaṅgā / Arjuna's Penance" relief, Badami Trivikrama).

## 7. Timeline contributions

- scholarly-textual: composition/redaction DateClaims for all 18 Mahāpurāṇas, 7 Upapurāṇas, Devī Māhātmya, Devī Bhāgavata, Manusmṛti,
  Āryabhaṭīya (499 CE), Amarakośa — each with `view`.
- material: Skandapurāṇa MS 810 CE (on `text:skandapurana-early`); Devī Māhātmya quoted 608 CE (on `text:devi-mahatmya`).
- traditional: `data/sacred-chronology.json` (17 eras; human and divine years where the cited system gives or implies them; Kali epoch
  3102 BCE recorded only in descriptions/notes as an astronomical-traditional computation).

## 8. Research gaps and follow-up

- Consult the Bhāgavata critical edition (B. J. Institute, Ahmedabad) and Tagare's translation to re-check BhP loci in vulgate vs CE numbering.
- Obtain Kālikā and Devī Bhāgavata e-texts to verify the pīṭha chapters; Padma Uttarakhaṇḍa for the guṇa classification (recall only).
- Map the printed Skanda Purāṇa's khaṇḍas to the tīrtha entities of the temple agent (Kāśī-, Avantī-, Prabhāsa-khaṇḍa).
- Add the Pargiter (1913) Kali-age dynasty lists (Matsya/Vāyu/Brahmāṇḍa/ViP) as a comparison linked to `pol:` ids (Mauryas, Śuṅgas, Guptas).
- Upapurāṇa lists (Kūrma 1.1.17–20, Bṛhaddharma 1.25) as a comparison.

## 9. Candidate discoveries

1. **"Mahāpurāṇa" is an insertion in the critical Viṣṇu Purāṇa.** ViP (crit.) 3.6.21–23 lists eighteen *purāṇas*; the half-verse
   naming them mahāpurāṇas and adding upapurāṇas is starred (3.6.23*8). Ids: `claim:mahapurana-term-late`, `psg:vip-3-6`, purana:621–622.
   Caveat: an insertion attests manuscript variation, not a date for the term; other Purāṇas do use it.
2. **The epic flood-fish is Brahmā, not Viṣṇu.** MBh CE 3.185.48; Matsya 1.28 and BhP 8.24 later make it Viṣṇu, and the BhP adds the
   demon Hayagrīva. Ids: `deity:matsya`, purana:227, purana:534, `cmp:flood-story`. Caveat: the Vaiṣṇava reading may have older oral roots.
3. **The critical Nārāyaṇīya has no fish, tortoise or Kalki; Agni 49's ten include Balarāma, not Kṛṣṇa; the Matsya counts Māndhātṛ and
   Vyāsa.** Ids: purana:200–205, purana:186, purana:194, purana:197, `cmp:avatara-lists`. Caveat: vulgate texts and other passages of the
   same works may count differently.
4. **Vālmīki's Ikṣvāku genealogy contains a Nahuṣa → Yayāti → Nābhāga → Aja sequence** that the Purāṇas place in the Lunar line, and
   puts Raghu many generations before Aja. Ids: `char:nahusha-vr`, `char:yayati-vr`, `char:nabhaga-vr`, purana:281–283, 286, 307,
   `cmp:solar-line-raghu-aja`. Caveat: homonymy, not identity, is all the text shows.
5. **Neither epic critical text has Śiva drink the poison at the churning**; the tortoise in MBh CE 1.16 is Akūpāra, king of tortoises.
   Ids: purana:385, 389, 378, `cmp:churning-versions`. Caveat: the episode is present in vulgate texts; CE relegation reflects manuscript evidence.
6. **The Matsya's Satī names 108 tīrthas herself (13.26–53) — no dismemberment**; the corpse-division origin of the pīṭhas appears later
   (Kālikā, Devī Bhāgavata). Ids: `psg:matsya-13`, purana:610, purana:246, purana:544, `cmp:shakti-pitha-origins`. Caveat: the later
   loci are recall; chronology of the Matsya chapter itself is uncertain.
