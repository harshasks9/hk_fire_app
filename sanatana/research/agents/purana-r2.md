# Purāṇic Literature Researcher — round 2 report (agent `purana`)

Files: `data/entities/purana-r2.json` (245), `data/assertions/purana-r2.json` (993, ids `purana:r2-1` … `purana:r2-993`),
`data/sources/purana-r2.json` (18 new sources), `data/comparisons/purana-r2.json` (15 tables). Upgrades to six round-1 records in
`data/entities/purana.json` (listed in "What I added"). `npm run validate -- --domain purana`: **0 errors, 0 warnings**; the whole-dataset
run shows no issue in any `purana*` file. Assertion ids are assigned by the generator after dropping triples already present anywhere in the
dataset (four such duplicates of round-1 assertions were dropped), so they are stable only as long as the dataset is unchanged.

Method: every narrative locator was checked by downloading the e-text and grepping it — GRETIL (Bhāgavata, Viṣṇu crit. ed., Harivaṃśa CE,
MBh CE, VR CE, Matsya, Liṅga, Kūrma, Mārkaṇḍeya, Nārada, Śiva books 1 and 7, Vāmana, Brahmāṇḍa, Brahma, Agni, both Revākhaṇḍas, the Vāmana
Saromāhātmya) and, where GRETIL has no text, Sanskrit Wikisource (Śiva Purāṇa Rudrasaṃhitā khaṇḍas 3–5, Brahmavaivarta Gaṇapatikhaṇḍa 8–13,
Varāha 22–23, Devī Bhāgavata 1.5, Kalki Purāṇa, Skanda Purāṇa Kāśīkhaṇḍa and Vaiṣṇavakhaṇḍa indexes). 958 of 993 assertions are
`verified-online`, each with the e-text URL and edition in the SourceRef.

## 1. Executive findings

1. **The Harivaṃśa's critical text is the bare skeleton that the Purāṇas fill out.** Its rāsa (HV CE 63.15–35) has no disappearance, no
   footprints and not even the word *rāsa*; the Viṣṇu Purāṇa (5.13) adds the vanishing, the footprints and the rāsa-maṇḍala; the Bhāgavata
   (10.29–33) adds the flute, the Gopī-gīta and Kṛṣṇa multiplied between each pair of women (`cmp:rasa-lila-versions`). The HV also puts the cart
   *before* Pūtanā, whom it makes a night-bird (HV 50), and has no Tṛṇāvarta, Agha or Brahmā episode (`cmp:krishna-infancy-order`).
2. **Where the Syamantaka came from is a textual variable.** The critical HV (28.12) has *Prasena* find the jewel "from the ocean"; the Sun's
   gift to Satrājit is an inserted passage there, but constituted text in the Viṣṇu (4.13.6), Brahma (16.12) and Bhāgavata (10.56.3). The fight
   with Jāmbavān lasts 21 days (HV, ViP), 28 (BhP 10.56.24) or 27 (Jāmbavatī in BhP 10.83.10) (`cmp:syamantaka-origin`).
3. **Nīlakaṇṭha is not in the epic critical text.** In MBh CE 1.16 Śiva drinks the poison only in apparatus passages (App. I after 1.16.15 and
   1.16.27; *268, *274); the Viṣṇu Purāṇa gives the poison to the nāgas (1.9.95); the Bhāgavata (8.7) and Brahmāṇḍa (1.25) tell the full
   story (`cmp:nilakantha-poison`).
4. **What triggers Narasiṃha differs:** a boon-proud tyrant and the gods' plea (HV 31, Matsya 161–163, where Prahlāda only *recognises* the god);
   Prahlāda's persecution (ViP 1.17–20, which only alludes to the killing, 1.20.32; BhP 7); in the **Kūrma (1.15.52–62) Prahlāda is first sent to
   fight Narasiṃha** and recognises Vāsudeva only after defeat; the Liṅga adds Śiva's Śarabha (`cmp:narasimha-cause`).
5. **Gaṇeśa's birth: five incompatible accounts, kept separate** — unguent figure thrown into the Gaṅgā (Matsya 154.501–505), Śiva himself in
   elephant form (Liṅga 1.104–105), born of Śiva's laughter and cursed (Varāha 23), Pārvatī's door-keeper beheaded by Śiva (Śiva P 2.4.13–18,
   which itself cites the Śani version as "another kalpa", 2.4.13.5), Śani's glance (Brahmavaivarta 3.12) (`cmp:ganesha-birth`). The scribe frame
   is absent from the CE constituted text of MBh book 1 (checked online) (`claim:ganesha-scribe-interpolation`).
6. **Purāṇic cosmography is not one system.** The Matsya's continents run Jambu–Śāka–Kuśa–Krauñca–Śālmala–*Gomedaka*–Puṣkara with no Plakṣa;
   the Bhāgavata swaps the milk and curd oceans relative to the Viṣṇu Purāṇa (`cmp:dvipa-lists`); the netherworld lists differ (Nitala and
   Gabhastimat in ViP 2.5.2 vs Talātala and Rasātala in BhP 5.24.7) (`cmp:patala-lists`).

## 2. Dataset summary

- **Entities (245):** character 105, place 57 (all cosmological or narrative places, no coordinates), narrative 52, text 13, deity 13, claim 3,
  concept 1, passage 1. Status: verified-online 238, reference-checked 4, source-checked 2, recall 1.
- **Assertions (993):** PARTICIPANT_IN 336, NARRATED_IN 134, PARENT_OF 111, PART_OF 95, MEMBER_OF 57, SLAYS 43, LOCATED_AT 29, PRECEDES 19,
  ASSOCIATED_WITH 18, SPOUSE_OF 17, FORM_OF 17, OCCURS_AT 15, IDENTIFIED_WITH 12, APPEARS_IN 12, MENTIONED_IN 12 … Status: verified-online 958,
  reference-checked 20, source-checked 10, recall 5. Evidence class 1: 949; 5: 15; 6: 25; 2: 3; 4: 1. The total exceeds the 400–700 aim because
  each version's participants are recorded separately per text; nothing was padded.
- **Most connected (in r2):** `char:krishna` 64, `deity:shiva` 59, `lin:suryavamsha` 57, `text:bhagavata-purana` 42, `place:bhumandala` 29,
  `narr:syamantaka` 26, `narr:bana-usha-aniruddha` 26, `place:jambudvipa` 26, `narr:tripura-dahana` 25.
- **Comparisons (15):** rāsa-līlā; Syamantaka origin; Kṛṣṇa's infancy; Tripura (MBh/Matsya/Liṅga/Śiva/BhP); Madhu–Kaiṭabha's slayer;
  Ardhanārīśvara's origin; the poison; Gaṇeśa's birth; cause of Narasiṃha; Hayagrīva's origin; dvīpa/ocean lists (ViP/BhP/Matsya); pātāla lists;
  Solar line Ikṣvāku→Sagara; Solar line Bhagīratha→Khaṭvāṅga; Lunar line Pūru→Duṣyanta.

## 3. Evidence ledger

- **GRETIL e-texts, grepped verse by verse** (URLs in SourceRefs): BhP (3.15–16, 3.21–33, 4.1, 4.13–18, 5.3–8, 5.16–26, 6.1–3, 7.1–10, 8.7–12,
  9.4–9.10, 9.20, 10.6–10.63, 10.78–83, 11.6–29); ViP crit. (1.7, 1.9, 1.13, 1.17–20, 2.1–7, 2.13–16, 3.1.41, 3.17–18, 4.2–4.4, 4.13, 4.19, 5.5–5.33);
  HV CE (6, 9–10, 28–31, 42, 45–76, 84–113); MBh CE (1.16 incl. apparatus, 1.165, 3.192–195, 8.24, 12.323–335); VR CE (1.42, 1.51–59); Matsya
  (103–112, 122–123, 129–140, 154, 161–163); Liṅga (1.41, 1.71–72, 1.86, 1.93, 1.95–98, 1.104–105); Kūrma (1.11, 1.15); MkP (7–9, 50, 87–88); Nārada
  (1.83, 1.124); Śiva books 1 and 7 (7.1.15–16); Vāmana (6, 43–44); Brahmāṇḍa (1.25, 2.43); Brahma (16–17, 184–206); Agni (12); RKV and RKS headers
  and chapters; Vāmana Saromāhātmya.
- **Sanskrit Wikisource** (new source `src:sa-wikisource`; vulgate transcriptions, edition unstated): Śiva P Rudrasaṃhitā 2.3–2.5 (Pārvatī,
  Kumāra, Yuddha khaṇḍas incl. their indexes), Brahmavaivarta 3.11–12, Varāha 23, Devī Bhāgavata 1.5, Kalki P 1.2, Skanda P 2 and 4 indexes,
  Kāśīkhaṇḍa 1, Veṅkaṭācala-māhātmya 1 (colophon).
- **Reference pointers (Wikipedia raw pages, marked `reference-checked`)**: dates for Kalki, Saura, Sāmba, Gaṇeśa, Mudgala; Kāśīkhaṇḍa's
  mid-13th-c. date (Parry 1994); the CE placement of the Gaṇeśa scribe passage (Rocher 1991; Krishan 1999).
- Not reachable or not consulted: Ekāmra-, Gayā- and Kāśīkhaṇḍa Wikipedia pages returned errors; Hazra vol. II, Jacques 1962 and Kane vol. IV
  were not read directly (cited `source-checked`/`recall` only for their existence and topic, never for a date).

## 4. Uncertainty log

- **Ekāmra Purāṇa date** (c. 11th–13th c.) is a `recall` placeholder; settle with Hazra, *Studies in the Upapurāṇas* II, and Rocher 1986.
- **Gayā- and Veṅkaṭācala-māhātmya** have no date asserted (openQuestions recorded); need Jacques 1962, Kane HoD IV, and the Tirumala epigraphy.
- **Wikisource texts** are unidentified vulgate editions; locators follow the page numbering and may differ from Gita Press/Veṅkaṭeśvara prints.
- **BhP book-5 prose numbering**: the GRETIL file attaches the verse marker *after* each prose unit; loci follow that file (e.g. the naraka
  list is BhP 5.26.6 there). A check against the BhP critical edition would settle off-by-one differences.
- **ViP 4.3.13–14** carries a misplaced marker (4.3.20) in the e-text; the Anaraṇya → Triśaṅku chain is cited as 4.3.13–14.
- **Mātṛkā goddesses** (Brāhmī … Aindrī) and Kāma/Rati are created here as narrative deities; the iconography agent may model the same
  figures as iconographic forms — merge candidates if so.
- `char:vrinda` IDENTIFIED_WITH `char:tulasi` is low/`reference-checked`: the Śiva Purāṇa keeps them apart; the identification is popular.
- `deity:dattatreya` TEACHER_OF `char:kartavirya-arjuna` (MkP 18–19) and `narr:harishchandra-trial` OCCURS_AT Kāśī are `recall`.

## 5. Cross-agent links

- Referenced from other domains: epic — `char:krishna, char:balarama, char:kamsa, char:rukmini, char:satyabhama, char:pradyumna, char:samba,
  char:jambavan, char:jarasandha, char:shishupala, char:durvasas (epic-r2), char:nala, char:vyasa, char:rama, char:ravana, char:kumbhakarna,
  text:harivamsha, text:mahabharata, text:valmiki-ramayana, text:kumarasambhava, psg:mbh-narayaniya, narr:kamsa-vadha, narr:rukmini-abduction,
  place:vrindavan, place:mathura, place:dvaraka, place:ayodhya, place:kurukshetra`; vedic — `char:vasishtha, char:vishvamitra, char:atri,
  char:shunahshepa, narr:shunahshepa, narr:pururavas-urvashi, deity:indra, deity:aditi, deity:yama, deity:sankarshana (material)`; regional —
  `char:holika, trad:holi, char:radha, trad:gaudiya, trad:jain`; temple — `temple:angkor-wat, temple:lingaraja, temple:kashi-vishwanath,
  temple:tirumala, deity:venkateshvara, temple:jagannath-puri, temple:badrinath, temple:vishnupad-gaya, temple:omkareshwar, temple:konark,
  temple:mayureshwar-morgaon (temple-r2)`; material — `deity:matrikas`.
- Links I wanted but did not create (outside my ownership): `place:narmada-river` (for both Revākhaṇḍas and Purukutsa), `deity:shani`
  (Brahmavaivarta Gaṇeśa version), `place:shravasti`, `place:champa`, `deity:sudarshana` (Jalandhara, Ambarīṣa), Paurava kings between Pūru and
  Duṣyanta, `trad:naraka-chaturdashi` is now linked only through `claim:naraka-dipavali-link` (regional already links the festival to Kṛṣṇa).

## 6. Graph opportunities

- Version graphs: one narrative node with NARRATED_IN edges to HV / ViP / BhP / Brahma / Agni, coloured by text, beside the comparison tables.
- The cosmographic rings (`place:bhumandala` → dvīpas → oceans by text) are naturally a concentric diagram; the fourteen lokas a vertical stack.
- Jaya–Vijaya's three births link Vaikuṇṭha to the Narasiṃha, Rāmāyaṇa and Śiśupāla cycles (6 IDENTIFIED_WITH edges, BhP 7.1).
- The Ikṣvāku line as two parallel chains (ViP vs BhP) that merge and split.

## 7. Timeline contributions

- scholarly-textual: Kalki P (c. 1500–1700, Doniger), Saura P (950–1050, Hazra), Ekāmra P (placeholder, recall), Kāśīkhaṇḍa (mid-13th c.),
  Uddhava Gītā (with BhP), and new views on Sāmba (650–850, Hazra), Gaṇeśa (Bailey; Stietencron; Hazra) and Mudgala (Courtright; Hazra).
- material: Kalki P manuscripts (18th c., terminus ante quem).
- traditional: none added (sacred-chronology.json unchanged).

## 8. Research gaps and follow-up

- Lunar dynasty king entities (Pūru → Śantanu; Yadu → Vṛṣṇis) — only a comparison table this round.
- Post-Rāma Ikṣvākus (Kuśa → Bṛhadbala, ViP 4.4.104ff., BhP 9.12) not yet entered.
- Padma Purāṇa (Jalandhara/Vṛndā; guṇa classification), Brahmavaivarta Goloka, Devī Bhāgavata Hariścandra (7.18–27) need e-texts.
- Bhaviṣyottara 132 and 140 (Holī, Dīpāvalī) would complete the festival links regional has begun.

## 9. Candidate discoveries

1. **The critical Harivaṃśa's Syamantaka jewel comes from the sea, not the Sun.** HV CE 28.12 (Prasena "samudrād upalabdhavān") vs ViP 4.13.6,
   BrP 16.12, BhP 10.56.3. Ids: `narr:syamantaka`, purana:r2-148, purana:r2-151, `cmp:syamantaka-origin`. Caveat: the Sun episode survives in part of
   the HV manuscript tradition; the CE reflects stemmatic choice.
2. **In the Kūrma Purāṇa Prahlāda first fights Narasiṃha.** KūrmP 1.15.52–62. Ids: purana:r2-659, purana:r2-660, purana:r2-655, `cmp:narasimha-cause`.
   Caveat: one passage; the Kūrma's own redaction history is complex.
3. **The Matsya's earth has a "Gomedaka" continent and no Plakṣa; the Bhāgavata swaps the milk and curd oceans.** MatsP 122–123; BhP 5.20.18–24
   vs ViP 2.4.57–71. Ids: purana:r2-684, purana:r2-715–717, `cmp:dvipa-lists`. Caveat: Kirfel (1920) groups such variants into recensional families;
   they are textual, not "competing geographies".
4. **A Purāṇic rubric already names Holikā as Prahlāda's tormentor and offers Kāma-dahana as an alternative meaning of the Holī fire.** NārP
   1.124.76–81. Ids: purana:r2-650, purana:r2-651, purana:r2-653, `narr:holika-burning`. Caveat: the pyre-and-immunity plot itself is not told there;
   the Nārada Purāṇa's date is late.
5. **The long Revākhaṇḍa printed as Skanda Purāṇa 5.3 belongs, on manuscript evidence, to the Vāyu Purāṇa.** GRETIL headers (J. Neuss). Ids:
   `claim:revakhanda-vayu`, purana:r2-812, purana:r2-813, purana:r2-815. Caveat: reported on the editor's authority; manuscripts not re-examined.
6. **The rāsa grows by layers:** HV CE 63 (no rāsa terminology) → ViP 5.13 → BhP 10.29–33. Ids: purana:r2-74–77, `cmp:rasa-lila-versions`.
   Caveat: relative chronology of HV and ViP is itself debated.

## What I added

**Kṛṣṇa cycles (15 narratives, 23 characters, 3 places, 1 text, 1 claim):** narratives — Pūtanā; the cart (Śakaṭa); Tṛṇāvarta; Dāmodara and the
twin arjuna trees (with the butter theft); Aghāsura; Brahmā's theft of the calves; Dhenuka; the gopīs' garments; the rāsa-līlā; Akrūra's journey;
Kālayavana and Mucukunda; the Syamantaka jewel; Naraka; Uṣā–Aniruddha and Bāṇa; Sudāmā/Kucela. Characters — Pūtanā, Tṛṇāvarta, Aghāsura, Dhenuka,
Cāṇūra, Muṣṭika, Kuvalayāpīḍa, Akrūra, Kālayavana, Mucukunda, Satrājit, Prasena, Śatadhanvan, Jāmbavatī, Naraka, Bāṇa, Uṣā, Aniruddha, Citralekhā,
Sudāmā, Uddhava, Nalakūbara and Maṇigrīva, the gopīs. Places — Tālavana, Prāgjyotiṣa, Śoṇitapura. Text — Uddhava Gītā. Claim — Naraka/Dīpāvalī
link. Extended existing epic narratives (Kaṃsa-vadha with the wrestlers and elephant; Rukmiṇī with ViP 5.26 and BhP 10.52–54).
**Śiva and Devī cycles (11 narratives, 12 characters, 10 deities):** Tripura; Andhaka; Jalandhara; Śaṅkhacūḍa and Tulasī; Gajāsura (Kṛttivāsa);
Kāma burned; Pārvatī's tapas and marriage; Ardhanārīśvara's origin; Nīlakaṇṭha; Caṇḍa–Muṇḍa (Cāmuṇḍā); Raktabīja and the Mothers; plus new versions
of Madhu–Kaiṭabha (MBh 3.194, 12.335, HV 42, BhP 7.9), the Śaiva Bāṇa (ŚivP 2.5.51–56) and Gaṅgā in Śiva's hair (VR CE 1.42, BhP 9.9). Characters —
Tārakākṣa, Kamalākṣa, Vidyunmālin, Maya, Bhṛṅgin, Jalandhara, Vṛndā, Śaṅkhacūḍa, Tulasī, Gajāsura, Himavat, Menā. Deities — Kāma, Rati, Brāhmī,
Māheśvarī, Kaumārī, Vaiṣṇavī, Vārāhī, Nārasiṃhī, Aindrī, Śivadūtī.
**Gaṇeśa (7 narratives, 2 deities, 1 claim):** birth per Śiva P, Brahmavaivarta (Śani), Matsya, Liṅga, Varāha; the race around the world; the scribe
frame; Siddhi and Buddhi; `claim:ganesha-scribe-interpolation`.
**Viṣṇu and others (16 narratives, 14 characters, 1 deity):** Mohinī and the nectar; Śiva and Mohinī; Hayagrīva's origin; Dattātreya's birth;
Kapila and Devahūti; Ṛṣabha's renunciation; Jaḍa Bharata; Pṛthu milks the Earth; Ajāmila; Ambarīṣa and Durvāsas; Jaya–Vijaya's curse; Triśaṅku's
heaven; Viśvāmitra and Vasiṣṭha's cow; the āḍi–baka battle; Hariścandra's ordeal; Holikā and Prahlāda; plus four more Narasiṃha versions (HV, Matsya,
Kūrma, Liṅga) and the BhP Śunaḥśepa version. Characters — Anasūyā, Kardama, Devahūti, Nābhi, Bharata son of Ṛṣabha, Ṛṣabhanātha (Jain), Vena, Ajāmila,
Ambarīṣa, Jaya and Vijaya, the four Kumāras, Dantavakra, Vasiṣṭha's cow, Śaibyā. Deity — Bhūmi.
**Upapurāṇas and māhātmyas (12 texts, 1 passage, 1 claim):** Kalki P; Saura P; Ekāmra P; Kāśīkhaṇḍa; Revākhaṇḍa (Vāyu attribution) and Revākhaṇḍa
of the Skanda; Veṅkaṭācala-, Puruṣottamakṣetra-, Badarikāśrama- and Ayodhyā-māhātmyas; Gayā-māhātmya; Vāmana Saromāhātmya; Matsya 103–112
(Prayāga-māhātmya); `claim:revakhanda-vayu`; links to Liṅgarāja, Kāśī Viśvanātha, Tirumala/Veṅkaṭeśvara, Puri, Badrinath, Ayodhyā, Viṣṇupada (Gaya),
Oṃkāreśvara, Kurukṣetra, Prayāga, Konark (Sāmba P), Morgaon (Gaṇeśa P).
**Cosmography (55 places/concepts):** Bhūmaṇḍala; seven dvīpas plus Gomedaka; six oceans (with the existing Kṣīroda placed by text); Meru;
nine varṣas of Jambudvīpa (with the form of Viṣṇu worshipped in each, BhP 5.17–19); Mānasottara; Lokāloka; the fourteen worlds — seven upper lokas,
eight named talas and Pātāla; Naraka with seven named hells; Vaikuṇṭha; Goloka; Śvetadvīpa.
**King-lists (56 characters incl. Dhundhu, 3 narratives):** the Ikṣvāku line Ikṣvāku → Sagara and Bhagīratha → Khaṭvāṅga, each link qualified by ViP or BhP where
they differ and citing both where they agree; Dhundhumāra, Māndhātṛ's birth, Kalmāṣapāda's curse.
**Comparisons (15):** listed in §2. **Sources (18 new):** Sanskrit Wikisource; Shastri (Śiva P trans.); Hawley 1983; Schweig 2005; Thapan 1997;
Winternitz 1898; Jaini 1979; Kirfel 1920; Gombrich 1975; Neuss 2012; Jacques 1962; Stietencron 1966; Söhnen & Schreiner 1989; Rocher 1991
(Gaṇeśa); Krishan 1999; Parry 1994; Bailey 1995; Bakker 1986.
**Upgrades to round-1 records (`data/entities/purana.json`, 6):** `text:samba-purana` (Hazra 650–850 DateClaim; Stietencron source);
`text:ganesha-purana` (recall → reference-checked; three date views); `text:mudgala-purana` (recall → reference-checked; Courtright and Hazra views,
Thapan note); `place:kshirasagara` (cosmographic position, three verified loci); `place:mandara` (ViP 2.2.17cd); `char:rishabha` (BhP 5.3–6, 5.6.9).
No id changed, nothing deleted; `data/sacred-chronology.json` unchanged.
