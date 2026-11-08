# Itihāsa, Kāvya & Drama — round-2 report (agent `epic`)

Date: 2026-11-08. Files: `data/entities/epic-r2.json` (186), `data/assertions/epic-r2.json` (618),
`data/sources/epic-r2.json` (34), `data/comparisons/epic-r2.json` (7); edits to `data/assertions/epic.json`
(55 assertions). `npm run validate -- --domain epic`: **0 errors, 0 warnings**. The whole-dataset run reports
no errors in epic files. The only epic-related warnings are three round-1 duplicate triples, flagged in
`regional.json`.

Method: I re-used the round-1 verse indexes of the GRETIL critical-edition e-texts (MBh CE, VR CE, HV) and
downloaded and indexed GRETIL e-texts of the Raghuvaṃśa, Kumārasambhava (cantos 1–8), Meghadūta,
Abhijñānaśākuntala, Kirātārjunīya, Bhaṭṭikāvya, Śiśupālavadha, Bhāratamañjarī (books 6–19), Veṇīsaṃhāra,
Dūtavākya, Svapnavāsavadatta, Bāṇa's Harṣacarita and Vāmana's Kāvyālaṃkārasūtravṛtti. I also used the
Würzburg Bhāsa Project e-texts of all nine epic Trivandrum plays. Every quotation in a `verified-online`
record was checked by script against those files: 349 quotation checks, 0 mismatches. Wikipedia was
rate-limited, so it is used only as a pointer for 20 pages.

## 1. Executive findings

1. **All 55 withdrawn genealogy locators were restored with verses that name the member.** In round 1,
   epic:335–389 had been reduced to "passim". Each now cites one to three CE verses, with a Sanskrit
   quotation, `verified-online`. Examples:
   - VR (CE) 1.19.15 *paulastyavaṃśaprabhavo rāvaṇo*.
   - MBh (CE) 1.95.10 *citrāṅgadaṃ kuruśreṣṭhaṃ*.
   - MBh (CE) 3.287.23 *vṛṣṇīnāṃ tvaṃ kule jātā śūrasya dayitā sutā* (Kuntī).
   - MBh (CE) 1.90.69–96, the prose Pūru–Pāṇḍava genealogy, for the five brothers, Abhimanyu, Parikṣit and Janamejaya.

   Fifty-four are now high confidence. Kesarin (epic:355) stays at medium: VR 4.38.17 has him join
   Sugrīva's host, but 6.18.34 places his home on the golden mountain. For Lava and Kuśa no verse uses an
   Ikṣvāku epithet. Their membership rests on 7.88.4 (Rāma acknowledges them as his sons) and 7.97.17 (he
   installs them as kings of Kosala), and the rationale says so.
2. **Kālidāsa names his source.** At Raghuvaṃśa 15.63–64 Kuśa and Lava sing "the Rāmāyaṇa first composed
   by Prācetasa … Vālmīki's work". This is a poet's own attestation of the epic, in a text conventionally
   dated to the 4th–5th c.
3. **The Bhāsa question is now an explicit claim.** The thirteen Trivandrum plays are linked to Bhāsa
   with `ATTRIBUTED_TO`, never `COMPOSED_BY`. The case for the attribution rests on the shared opening
   *nāndyante tataḥ praviśati sūtradhāraḥ* (verified in the Würzburg text) and Bāṇa's praise of Bhāsa's
   plays as *sūtradhārakṛtārambhaiḥ* (Harṣacarita intro v. 15, verified). The case against (Tieken 1993
   and others) is recorded in `claim:bhasa-trivandrum-authorship`.
4. **The dramatists consistently rework the epics' moral cruxes.** The comparisons show four cases:
   - Kālidāsa's curse and ring exonerate a Duḥṣanta who, in MBh 1.68.19 and 1.69.40–41, knowingly
     denies Śakuntalā.
   - Bhāsa's Duryodhana dies repentant on stage. The epic's Duryodhana dies exulting over the night
     massacre (MBh 10.9.53–55).
   - Bhavabhūti restores Sītā to Rāma. Vālmīki (7.88) and Kālidāsa (Raghuvaṃśa 15.81–84) send her into
     the earth.
   - Bhāsa's Karṇa gives his armour without the epic's bargain for the spear.
5. **Two external attestations date Bhavabhūti and Kālidāsa.** Vāmana's Kāvyālaṃkārasūtravṛtti (late 8th c.)
   quotes Uttararāmacarita 1.39 and Kumārasambhava 1.1. I verified both in the GRETIL e-text, which tags
   the quotations. They are recorded as reception dates.

## 2. Dataset summary

- **Entities (186):**
  - 74 passages (MBh upaparvans).
  - 38 narratives.
  - 36 texts.
  - 18 characters.
  - 17 persons.
  - 2 collections.
  - 1 claim.
- **Entity status:** 151 verified-online, 29 source-checked, 5 reference-checked, 1 disputed.
- **Assertions (618):**
  - By predicate: PARTICIPANT_IN 153, APPEARS_IN 116, PART_OF 97, NARRATED_IN 56, RETELLS 42,
    PRECEDES 40, COMPOSED_BY 24, DERIVED_FROM 19, ATTRIBUTED_TO 15, OCCURS_AT 9, SLAYS 8, and smaller
    groups.
  - By status: 498 verified-online, 103 source-checked, 10 disputed, 6 reference-checked, 1 recall.
  - By evidence class: 463 in class 1, 147 in class 5, 8 in class 6.
- **Most connected new nodes:** text:raghuvamsha (26), text:uttararamacarita, text:venisamhara,
  text:urubhanga, narr:virata-cattle-raid, text:kiratarjuniya.
- **Comparisons (7):** listed in §8.

## 3. Evidence ledger

| Source | Supports | Checked |
|---|---|---|
| src:gretil-mbh-ce, src:gretil-vr-ce | 55 restored locators; 74 upaparvan ranges; 33 epic episodes; Paulastya, Śakuntalā, Duryodhana, Kirāta and Karṇa rows | online (round-1 indexes, star passages excluded) |
| src:gretil-raghuvamsha | Raghuvaṃśa structure; 15.63–64 (names Vālmīki); 15.81–84 (Sītā enters the earth); Dilīpa, Aja, Indumatī, Agnivarṇa; 9.72–81 (the ascetic boy) | online |
| src:gretil-kumarasambhava / -meghaduta / -abhijnanashakuntala | Tāraka 2.1, 2.32; Kāma burnt 3.72; Rāmāyaṇa allusions at Meghadūta 1, 12, 97; Durvāsas curse 4.1a; ring 5.21a6; fisherman 6.1a; Mārīca 7.31a; Bharata 7.33 | online |
| src:gretil-kiratarjuniya, src:gretil-shishupalavadha, src:gretil-bhattikavya | canto structures; Bhaṭṭi's Valabhī colophon (22.35); Uddhava at Śiśupālavadha 2.69; Caidya's light entering Kṛṣṇa (20.79) | online |
| src:gretil-bharatamanjari, src:gretil-venisamhara, src:gretil-dutavakya | Kṣemendra colophon ("prakāśendrasūnoḥ kṣemendrasya"); Bhīma's vow 1.21; braid bound 6.42; author named in the prologue | online |
| src:bhasa-project-wuerzburg | nine epic Trivandrum plays: statue-house (PN 3), Vimalā spear (KBh 23.3), Durjaya and Duryodhana's death (UBh), Hiḍimbā (MV 37.6), Kūṭiyāṭṭam performance listing | online |
| src:gretil-harshacarita, src:gretil-vamana-kavyalankarasutra | Bāṇa on Bhāsa and Kālidāsa (intro vv. 15–16); Durvāsas "son of Atri"; Vāmana quoting Uttararāmacarita 1.39 and Kumārasambhava 1.1 | online |
| Keith 1924/1928, Warder, Lienhard, De & Dasgupta, Tieken 1993, Pusalker 1940, Pollock 2007, Törzsök 2006, Handiqui 1956, Peterson 2003, Slaje 1994, Raghavan 1961 | dates, authorship and plots of works not on GRETIL (Uttararāmacarita, Mahāvīracarita, Naiṣadhīya, Anargharāghava, Rājaśekhara, Rāmāyaṇamañjarī, Daśāvatāracarita, Jānakīharaṇa, Yogavāsiṣṭha, Kundamālā, Āścaryacūḍāmaṇi, campūs) | source-checked (named works; not opened online) |
| Wikipedia (20 summaries) | pointers for Bhāsa, Bhavabhūti, Māgha, Śrīharṣa, Kṣemendra, Uttararāmacarita, Mahāvīracarita, Naiṣadhīya and others | reference-checked |

## 4. Uncertainty log

- **Upaparvan boundaries rest on content.** The GRETIL MBh e-text does not carry the CE's upaparvan
  headings. I set each range by reading its opening and closing adhyāyas, and the record says so. Status
  is verified-online for the content range, confidence medium for exact identity with the CE's printed
  divisions. Most likely to differ:
  - Kairāta 3.13–41 versus Indralokābhigamana 3.42–79.
  - Gadāyuddha 9.31–64, which encloses Sārasvata 9.34–53.

  Comparing with the printed CE volumes would settle them. I omitted the Karṇavivāda and Niryāṇa
  upaparvans of the Udyogaparvan and the subdivisions of the Śānti and Āśvamedhika because their
  boundaries were not clear from content.
- **Bhāsa's date and authorship** are disputed. Play dates are recorded as a −400 to 1000 CE range of views.
- **Not on GRETIL.** These works are at source-checked or reference-checked status and need a primary
  e-text: Uttararāmacarita, Mahāvīracarita, Naiṣadhīyacarita, Anargharāghava, Bālarāmāyaṇa, Rāmāyaṇamañjarī,
  Daśāvatāracarita, Jānakīharaṇa, Yogavāsiṣṭha, Vikramorvaśīya, Kundamālā and Āścaryacūḍāmaṇi. Sanskrit
  Wikisource has some of them, but it was rate-limited.
- **Daśāvatāracarita date (1066 CE)** is taken from Warder, not from a checked colophon.
  `text:ramcharitmanas DERIVED_FROM text:prasannaraghava` is the only `recall` assertion.
- **Māgha's genealogy verses** (grandfather Suprabhadeva, minister of Varmalāta) are not in the GRETIL text.
  That point is reference-checked.
- **Kumārasambhava 9–17**: narr:birth-of-skanda is linked to the poem only with a note that the birth falls
  in the continuation cantos.
- **Bhānumatī and Durjaya** are dramatic names; the CE does not attest them, and the records say so.

## 5. Cross-agent links

- **Referenced:**
  - Characters: char:aja (purana; I dropped my duplicate), char:uddhava (purana-r2), char:nahusha.
  - Other agents' records: person:kalidasa, person:bharavi and person:bhoja-paramara (material);
    text:vikramorvashiya (vedic); text:bhattikavya and text:gaha-sattasai (regional); trad:kutiyattam;
    pol:rashtrakuta; concept:dashavatara.
  - Deities: deity:shiva, deity:parvati, deity:indra, deity:brahma, deity:dharma.
  - Sources src:khoroche-tieken-2009, src:zvelebil-1974, src:sen-1960 and src:stein-1900 are cited from
    their existing definitions. I removed my duplicates of the last four after the orchestrator's note.
- **New ids others may use:**
  - person:bhasa and claim:bhasa-trivandrum-authorship.
  - col:trivandrum-plays and col:pancha-mahakavya.
  - char:durvasas.
  - person:shriharsha, who is also the Advaita dialectician. Vedic should reference it, not create a second
    record.
  - person:hala.
  - narr:karna-armour-gift.
  - The 74 `psg:mbh-up-*` upaparvans.
  - text:villi-bharatam and text:kashidasi-mahabharata. They were absent from regional's files when I
    checked; regional should link to them rather than duplicate them.
- **Wished-for:**
  - deity:kamadeva and a narr:kama-dahana (central to the Kumārasambhava; Śiva cycle, purana).
  - char:kashyapa (Mārīca in Śākuntala act 7).
  - person:yashovarman-kanauj (Bhavabhūti's patron; distinct from the Candela).
  - person:vamana-alankarika (Vāmana).
  - inst:bori.

## 6. Graph opportunities

- **Source text to retelling to dramatised episode chains**, e.g. MBh 9.57 → narr:duryodhana-thighs →
  Ūrubhaṅga / Veṇīsaṃhāra / Bhāratamañjarī, with comparison rows on the edges.
- **The MBh's internal skeleton:** 18 parvans → 74 upaparvans → embedded upākhyānas (Nala, Sāvitrī,
  Rāmopākhyāna, Yakṣa) → narratives, browsable as a tree.
- **The Kūṭiyāṭṭam cluster:** Trivandrum plays and Āścaryacūḍāmaṇi linked to trad:kutiyattam.
- **A "dramatist's inventions" layer:** narratives with `limits` stating they are absent from the CE —
  statue-house, Madhyama encounter, braid-binding, the curse and the ring.

## 7. Timeline contributions

- **scholarly-textual:** Kālidāsa's works c. 350–500; Bhāravi 6th c.; Bhaṭṭi c. 500–650; Māgha c. 650–800;
  Bhavabhūti c. 700–750; Bhaṭṭa Nārāyaṇa c. 650–800; Murāri c. 800–1000; Rājaśekhara c. 880–920; Śaktibhadra
  9th c.; Trivikramabhaṭṭa c. 900–940; Kṣemendra c. 1040–1070; Śrīharṣa 12th c.; Mokṣopāya →
  Yogavāsiṣṭha c. 950–1350; Villiputtūrār 14th c.; Kāśīrāma Dāsa c. 1580–1640; Bhāsa disputed (−400 to 400).
- **material:** Trivikramabhaṭṭa's Bagumra plates, 915 CE (as reported).
- **reception:** Bāṇa names Bhāsa (c. 620–650); Vāmana quotes Kumārasambhava and Uttararāmacarita
  (c. 775–800); Trivandrum editio princeps 1912–1915; Jones's Śakuntalā 1789.
- **traditional:** Hāla's reign; Kumāradāsa as king Kumāradhātusena.

## 8. Research gaps and recommended follow-up

- Check the upaparvan ranges against the printed BORI CE volumes, and add the remaining Udyoga, Śānti
  and Āśvamedhika upaparvans.
- Obtain primary e-texts for the works listed in §4 and raise those records to verified-online.
- Add the Rāmāyaṇa sarga-level episodes still missing, such as Śabarī's hospitality and Vibhīṣaṇa's
  coronation.
- Comparisons still to build:
  - Rāvaṇa as Sītā's suitor (Bālarāmāyaṇa vs VR).
  - Mālyavat's plot (Mahāvīracarita vs VR).
  - The Nala story (Naiṣadhīya vs MBh 3.50–78).
- Rāma plays, a Śākuntala recension table, and the Padma Purāṇa Śakuntalā (said to borrow the ring)
  remain to be done.

**What each comparison covers:**
- cmp:sita-fate-uttararamacarita: 4 rows.
- cmp:shakuntala-ring-curse.
- cmp:duryodhana-death-urubhanga: 3 rows.
- cmp:kiratarjuniya-vs-mbh.
- cmp:paulastya-genealogy: VR 7.3/7.9 vs MBh 3.258–259 — Kubera's father and the siblings' mothers differ.
- cmp:karna-armour-gift.
- cmp:bharata-learns-father-death.

## 9. Candidate discoveries

1. **Kālidāsa cites Vālmīki by name.** Raghuvaṃśa 15.63–64 has Kuśa and Lava singing "the Rāmāyaṇa first
   composed by Prācetasa … Vālmīki's work". See epic:r2-4 (REFERS_TO_TEXT) and epic:r2-3. Caveat: this
   attests the Rāmāyaṇa as a named work by Kālidāsa's time, not which recension he knew.
2. **The Mahābhārata's Duḥṣanta lies; Kālidāsa's forgets.** MBh 1.68.19 ("na smarāmi") and 1.69.40–41
   show a deliberate denial for reasons of state. Kālidāsa invents Durvāsas's curse (epic:r2-58) and the
   ring to make it involuntary. See cmp:shakuntala-ring-curse. Caveat: the Śākuntala recensions differ in
   detail; the GRETIL text follows Kale.
3. **Bhāsa's Duryodhana dies before the night massacre and forgives.** The epic's Duryodhana dies
   exulting at Aśvatthāman's slaughter, feeling "equal to Indra" (MBh 10.9.54). The Ūrubhaṅga's hero
   forbids vengeance and tells his son to serve the Pāṇḍavas (seg. 52.5). See cmp:duryodhana-death-urubhanga,
   epic:r2-114, epic:r2-153. Caveat: Bhāsa's authorship and date are disputed.
4. **The Mahābhārata's Rāvaṇa has a different mother and a different relation to Kubera.** In MBh
   3.258–259 Kubera is Pulastya's son, and Rāvaṇa, Vibhīṣaṇa and Śūrpaṇakhā have three different
   rākṣasī mothers given by Kubera. Vālmīki makes Kubera their half-brother and Kaikasī the mother of all
   four. See cmp:paulastya-genealogy and epic:342–348. Caveat: the Rāmopākhyāna may compress an older
   account.
5. **A late-8th-century anthology fixes Bhavabhūti and Kālidāsa.** Vāmana quotes Uttararāmacarita 1.39 and
   Kumārasambhava 1.1. See the reception dates on text:uttararamacarita and text:kumarasambhava. Caveat:
   Vāmana's own date rests on Kalhaṇa's synchronism with Jayāpīḍa.

## What I added

**Upgrades to round-1 files (`data/assertions/epic.json`):** 55 MEMBER_OF assertions (epic:335–389) restored.
Each has verse locators, Sanskrit quotations, status verified-online, a new rationale and lastVerified.
Confidence is high, except epic:355 (Kesarin), which is medium. A note pointing to cmp:paulastya-genealogy
was added to the Paulastya rows (epic:342–348). Nothing else in round-1 files was changed.

**Persons (17):** Bhāsa; Bhavabhūti; Māgha; Bhaṭṭi; Śrīharṣa; Murāri; Rājaśekhara; Kṣemendra; Bhaṭṭa Nārāyaṇa
(Veṇīsaṃhāra); Kumāradāsa; Hāla; Jayadeva (Prasannarāghava); Dhīranāga; Śaktibhadra; Trivikramabhaṭṭa;
Villiputtūrār; Kāśīrāma Dāsa.

**Collections (2) and claim (1):** pañca-mahākāvya; Trivandrum plays; claim that the Trivandrum plays are Bhāsa's.

**Texts (36):**
- Kālidāsa: Raghuvaṃśa, Kumārasambhava, Abhijñānaśākuntalam, Meghadūta. The existing Vikramorvaśīya was linked.
- Trivandrum plays: Pratimānāṭaka, Abhiṣekanāṭaka, Dūtavākya, Dūtaghaṭotkaca, Karṇabhāra, Ūrubhaṅga,
  Madhyamavyāyoga, Pañcarātra, Bālacarita, Svapnavāsavadatta.
- Bhavabhūti: Mahāvīracarita, Uttararāmacarita.
- Other court epics and plays: Kirātārjunīya, Śiśupālavadha, Naiṣadhīyacarita, Anargharāghava, Bālarāmāyaṇa,
  Bālabhārata, Veṇīsaṃhāra, Jānakīharaṇa.
- Kṣemendra: Bhāratamañjarī, Rāmāyaṇamañjarī, Daśāvatāracarita.
- Other Sanskrit works: Yogavāsiṣṭha, Hanumannāṭaka, Prasannarāghava, Kundamālā, Āścaryacūḍāmaṇi,
  Campū Rāmāyaṇa, Nalacampū.
- Vernacular: Villi Pāratam, Kāśīdāsī Mahābhārata.
- Links added to existing texts: Bhaṭṭikāvya (author and colophon) and Gāhā Sattasaī (Hāla).

**Characters (18):** Indumatī; Sudakṣiṇā; Nandinī (cow); Agnivarṇa; Durvāsas; the Meghadūta yakṣa; Āyus;
Durjaya; Candraketu; Mālyavat; Mūka; Bhānumatī; Baka; Kirmīra; Jaṭāsura; Citrasena; Uttara (son of Virāṭa);
Mudgala.

**Narratives (38):**
- Kāvya and drama (8): Dilīpa and Nandinī; Aja and Indumatī; Daśaratha and the ascetic's son; Durvāsas's
  curse and the ring; the statue-house; the Madhyama encounter; Karṇa's armour; the binding of the braid.
- Mahābhārata (25): Baka; Subhadrā's abduction; Kirmīra; Arjuna in Indraloka; Jaṭāsura; Nahuṣa the python;
  Ghoṣayātrā; Jayadratha abducts Draupadī; Mudgala; Virāṭa cattle raid; Abhimanyu and Uttarā; Viśvarūpa;
  Jayadratha's killing; Nārāyaṇāstra; Duḥśāsana's blood; Śalya's death; Balarāma's pilgrimage; Aiṣīka;
  Strīvilāpa; Parikṣit's revival; Yudhiṣṭhira's aśvamedha; Dhṛtarāṣṭra's death; Putradarśana; the Ābhīras;
  Svargārohaṇa.
- Rāmāyaṇa (5): Aśoka-grove meeting; burning of Laṅkā; the herb mountain; Rāvaṇa's death; Rāma's aśvamedha.

  Many major episodes the brief asked about already existed from round 1 and were linked rather than
  re-created: Khāṇḍava, Rājasūya/Śiśupāla, Jarāsaṃdha, Yakṣa, Kīcaka, Bhīṣma's fall, Abhimanyu, Ghaṭotkaca,
  Droṇa, Karṇa, Duryodhana, Sauptika, Bhīṣma's teaching, the great departure, Bharata's sandals, Vālin,
  coronation, Lava–Kuśa.

**Passages (74):** Parvasaṃgraha upaparvans by parvan: Ādi 18, Sabhā 8, Āraṇyaka 15, Virāṭa 4, Udyoga 5,
Bhīṣma 4, Droṇa 8, Śalya 4, Sauptika 2, Strī 3, Āśramavāsika 3. Each is PART_OF its parvan. Existing
upākhyāna passages were attached to their upaparvans.

**Comparisons (7) and sources (34):** see §8 and §3.
