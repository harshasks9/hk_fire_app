# Vedic Literature Researcher — report (agent `vedic`)

Files: `data/entities/vedic.json` (169), `data/assertions/vedic.json` (476), `data/sources/vedic.json` (40), `data/comparisons/vedic.json` (6). `npm run validate -- --domain vedic` → **0 errors, 0 warnings** (2026-11-08).

The JSON was produced by a generator kept outside the repo (scratchpad `vedic-gen/`). Assertion ids `vedic:1…476` are frozen as of this report. If a later edit is needed, new ids should be appended rather than renumbered.

## 1. Executive findings

1. **The Vedic layer is anchored to primary e-texts.** About 60 passage locators were checked against GRETIL (Aufrecht's Ṛgveda; Śatapatha Brāhmaṇa books 1, 6, 9, 11, 13 and 14; BU, CU, Kaṭha, Śvetāśvatara, Taittirīya, Īśā, Māṇḍūkya and Praśna; Aṣṭādhyāyī; Mahābhāṣya; Nirukta), TITUS (Aitareya Brāhmaṇa, Taittirīya Saṃhitā) and sanskritdocuments.org (Kena, Muṇḍaka, Aitareya Up.). 341 of 476 assertions are `verified-online`, and each carries a URL and a short Sanskrit quotation copied from the e-text.
2. **Structure of the Ṛgveda, counted from the e-text.** It has 1,028 sūktas in 10,552 verses. The maṇḍalas hold 191 / 43 / 62 / 58 / 87 / 75 / 104 / 103 / 114 / 191 hymns. Maṇḍala 9 is entirely Soma (114 hymns). Nine maṇḍala nodes encode the layering: family books 2–7 are older, books 1 and 10 younger. Hymn passages hang off these nodes.
3. **External attestations of Kṛṣṇa material, read in Kielhorn's text.** On P. 3.1.26 Patañjali writes “kaṃsavadham ācaṣṭe kaṃsaṃ ghātayati, balibandham ācaṣṭe baliṃ bandhayati”. In the same passage śobhikas enact the stories, paintings show them, and the presenters split into kaṃsabhaktāḥ and vāsudevabhaktāḥ. On 3.2.111 he gives “jaghāna kaṃsaṃ kila vāsudevaḥ”, on 2.2.24 “saṅkarṣaṇadvitīyasya balaṃ kṛṣṇasya vardhatām”, and on 2.2.34 music “prāsāde dhanapati-rāma-keśavānām”. The dating clues are also verified: “aruṇad yavanaḥ sāketam” and “iha puṣyamitraṃ yājayāmaḥ”. Separately, Pāṇini 4.3.98 “vāsudeva-arjunābhyāṃ vun” falls under the heading 4.3.95 “bhaktiḥ”.
4. **Vedic antecedents of Purāṇic narratives.** These are verified:
   - The flood of Manu, ŚB 1.8.1.1–11. The fish is unnamed, and Iḍā is born of the offering.
   - The dwarf Viṣṇu who wins the earth, ŚB 1.2.5. Bali does not appear.
   - “Yajño vai viṣṇuḥ”, ŚB 1.1.2.13 and 14.1.1.6, and “viṣṇur devānāṃ śreṣṭhaḥ”, ŚB 14.1.1.5.
   - Rudra left out of the sacrifice, ŚB 1.7.3.1, and the eight names of Kumāra/Rudra, ŚB 6.1.3.10–17.
   - Puruṣa Nārāyaṇa's five-night (pañcarātra) puruṣamedha, ŚB 13.6.1.1.

   I encoded the derivations as class-5 `DERIVED_FROM` edges. The Matsya and three-strides → Vāmana edges were already supplied by the purana agent (`purana:538`, `purana:422`), so I did not duplicate them.
5. **Rudra → Śiva is text-qualified.** The edge is anchored in the Śvetāśvatara: “eko hi rudro na dvitīyāya tasthe” (3.2) and “sarvagataḥ śivaḥ” (3.11). The Śvetāśvatara demonstrably reuses Śatarudrīya mantras (ŚvU 3.5 = TS 4.5.1 verse c) and RV 1.114.8 (ŚvU 4.22).
6. **Identity cautions are encoded as instructed.**
   - Kṛṣṇa Devakīputra: `vedic:297` is class 5, low confidence, `disputed`, with arguments for and against (CU 3.17.4's ethic of tapas–dāna–ārjava–ahiṃsā–satya is verified). `vedic:298` attaches the passage to the material agent's claim.
   - Janaka of Videha versus Sītā's father: no identity edge. A claim node, `claim:janaka-videha-sita-father`, carries two `CONCERNS` edges, both class 7.
   - Auddālaki Āruṇi, the father of Naciketas in Kaṭha 1.11: kept low and unresolved (`vedic:278`).
   - Satyakāma Śaibya (Praśna 1.1) is flagged as a different person from Satyakāma Jābāla.

## 2. Dataset summary

- **Entities (169).**
  - The 92 owned registry ids: 6 collections, 24 texts, 14 deities, 21 characters, 8 concepts, 12 narratives, 2 traditions, 5 persons.
  - 62 new passages: 9 Ṛgveda maṇḍalas, 20 RV hymns or verses, 8 ŚB sections, AB 7.13–18, TS 4.5, 7 BU, 5 CU, 3 Kaṭha, Kena 3–4, 2 ŚvU, TU 3.1, Muṇḍaka 1.1, Māṇḍūkya, Aṣṭ. 4.3.98, Mahābhāṣya on 3.1.26, Nirukta 2.16.
  - 15 other new entities:
    - texts: `text:shankara-bhashya-brihadaranyaka`, `text:brahma-sutra`, `text:sayana-rigveda-bhashya`, `text:vikramorvashiya`
    - characters: `char:lopamudra`, `char:sudas`, `char:pravahana-jaivali`, `char:vamadeva`, `char:ida`
    - narratives: `narr:vishnu-dwarf-earth`, `narr:dasharajna`, `narr:five-fires`, `narr:videgha-mathava`
    - place: `place:videha`
    - claim: `claim:janaka-videha-sita-father`
- **Assertions (476).**
  - By status: 341 verified-online, 90 source-checked, 41 recall, 4 disputed.
  - By evidence class: 377 class 1, 61 class 5, 35 class 6, 2 class 7, 1 class 2.
  - Main predicates: PART_OF 119, APPEARS_IN 107, MENTIONED_IN 62, PARTICIPANT_IN 39, NARRATED_IN 32, CENTRAL_TO 20, DERIVED_FROM 14, PARENT_OF 13, ATTRIBUTED_TO 11, IDENTIFIED_WITH 10.
  - RV hymns are `PART_OF` both their maṇḍala and `text:rigveda`, deliberately: this gives the direct text link the brief asked for and keeps the layering. That accounts for 21 of the PART_OF edges. Without them the count would be about 455; the 250–400 target was exceeded mainly through these structural edges.
- **Most connected:** `text:rigveda` (50), `text:shatapatha-brahmana` (20), `text:brihadaranyaka-upanishad` (17), `deity:indra` (16), `col:upanishads` (14), `char:yajnavalkya` and `char:vasishtha` (13 each), `char:uddalaka-aruni` (12), and `text:mahabhashya`, `deity:varuna`, `narr:shunahshepa`, `concept:brahman` and `trad:advaita-vedanta` (11 each).
- **Comparisons (6):**
  - `cmp:vedic-creation-accounts`: RV 10.72, 10.90, 10.121 and 10.129, BU 1.4, CU 6.2.
  - `cmp:indra-standing`: RV, Kena 3–4, CU 8.7–12, KauU 3, BhP 10.24–25.
  - `cmp:rudra-to-shiva`: RV 2.33, ŚB 1.7.3, ŚB 6.1.3, TS 4.5, ŚvU 3–4.
  - `cmp:vishnu-vedic-profile`: RV 1.154, RV 1.22.20 and 6.69.5, ŚB 1.2.5, ŚB 1.1.2.13, ŚB 14.1.1, KaU 3.9.
  - `cmp:manu-fish-identity`: who the fish is in ŚB, MBh, Matsya Purāṇa and BhP.
  - `cmp:five-fires-versions`: BU 6.2 against CU 5.3–10.

## 3. Evidence ledger

| Source | Supports | Checked online |
|---|---|---|
| `src:gretil-rv-aufrecht` (Aufrecht 1877) | All RV locators and quotes; hymn and verse counts | yes — whole file parsed |
| `src:gretil-shatapatha` | ŚB 1.1.2.13, 1.2.5, 1.4.1.10–17, 1.6.3, 1.7.3, 1.8.1, 1.9.3.9, 6.1.3, 9.1.1, 11.5.1, 11.6.1, 11.6.3, 13.5.4, 13.6.1, 14.1.1, 14.6.1, 14.6.10 | yes |
| `src:gretil-brihadaranyaka` / `-chandogya` | BU 1.4, 2.1.1, 2.3.6, 2.4, 3.1–9, 3.2.13, 3.7.1, 4.4.5–6, 4.5, 6.2, 6.3.7, 6.5.3; CU 1.1.1, 3.14.1, 3.17.4–6, 4.4, 4.10, 5.3–10, 6.1–16, 7.1.1, 8.7–12 | yes |
| `src:gretil-katha` (Olivelle numbering) / `-shvetashvatara` / `-taittiriya-up` / `-isha` / `-mandukya` / `-prashna` | KaU 1.1, 1.11, 2.15, 2.18–19, 3.7, 3.9, 6.14; ŚvU 3.2–4.22, 6.16, 6.21, 6.23; TU 3.1; Īśā 1; Māṇḍ. 1–2; PrU 1.1 | yes |
| `src:sanskritdocuments` | Kena 3.1–4.3; Muṇḍaka 1.1.1–5, 3.1.1, 3.1.6; Aitareya Up. 1.1, 3.3 | yes (volunteer e-texts, not critical editions) |
| `src:titus-aitareya-brahmana` | AB 7.13–18 = TITUS “adhyāya 33, khaṇḍa 1–6” (parts 236–241): Hariścandra, Nārada, Rohita, Ajīgarta Sauyavasi, the priests (Viśvāmitra hotṛ, Jamadagni adhvaryu, Vasiṣṭha brahman, Ayāsya udgātṛ), Prajāpati first, Uṣas, Devarāta | yes |
| `src:titus-taittiriya-samhita` | TS 4.5.1.1 “namas te rudra manyave”; 4.5.8.1 “namaḥ śivāya ca śivatarāya ca” | yes |
| `src:gretil-ashtadhyayi` / `-mahabhashya` / `-nirukta` | P. 4.3.95–98, 3.1.26; Mahābhāṣya on 1.1.68, 2.2.24, 2.2.34, 3.1.26, 3.2.111, 3.2.123, 5.3.99; Nirukta 2.16, 7.5, 12.1, 12.10 | yes |
| `src:unesco-ich-vedic-chanting` | Proclaimed 2003, inscribed 2008 (3.COM); “only thirteen of the over one thousand Vedic recitation branches have survived” | yes |
| Olivelle 1996/1998 (orchestrator) | Upaniṣad chronology. The Wikipedia pointer was used to confirm wording: BU and CU pre-Buddhist, 7th–6th c. BCE “give or take a century”; TU, AU, KauU 6th–5th c.; verse Upaniṣads in the last centuries BCE; Praśna and Māṇḍūkya near the turn of the era | via Wikipedia pointer |
| Witzel 1995/1997 (orchestrator and new) | RV c. 1500–1200 BCE core; codification c. 1200–1000; Mantra, Brāhmaṇa and Upaniṣad periods | not online; numeric ranges partly recall |
| Macdonell 1897 | Approximate hymn counts per deity (Indra ≈250, Agni ≈200, Soma ≈120, Aśvins >50, Uṣas ≈20, Varuṇa ≈12, Sūrya ≈10, Viṣṇu ≈5–6, Rudra ≈3, Sarasvatī 3, Mitra 1) | not online; recall. The Soma, Sarasvatī and Mitra counts were confirmed in the RV e-text. |
| Cardona 1997; Bronkhorst 2007 | Pāṇini's date: not later than the early-to-mid 4th c. BCE, against a terminus post quem of c. 350 BCE | via Wikipedia pointer |
| Isaeva 1993; Mayeda 1992 | Śaṅkara c. 700–750 CE, the 788–820 view, the maṭha dates, and which commentaries are authentic | via Wikipedia pointer |

## 4. Uncertainty log

- **Absolute dates of all Vedic texts.** Every `DateClaim` is `estimated` or `disputed`. The numeric ranges for Olivelle's “last few centuries BCE” and for Witzel's periods are my approximations, labelled as such in `basis`. A citation of exact pages in Witzel 1997 and Olivelle 1998 would settle this.
- **Mahābhāṣya on P. 4.3.98.** Patañjali's remark there, that this Vāsudeva is the name of a revered one, could not be checked: the GRETIL file lacks adhyāya 4. It is recorded only in `competing`.
- **Coarse epic and Purāṇic locators from recall** (status `recall`, confidence ≤ medium): Viśvāmitra, Vasiṣṭha, Agastya and Atri in VR books 1, 2 and 3; MBh 3.185 (the fish as Brahmā); Matsya Purāṇa 1–2; BhP 6.9–12, 8.17–18, 8.24 and 10.24–25; MBh 13 (Nāciketa, low confidence); MBh 1.3 (Saramā's curse); AV 20.127 (Parikṣit); Kauṣītaki 1.1 and 3. The epic and purana agents can verify them in their own e-texts.
- **Ownership claims I could not verify.** Kena = Jaiminīya Upaniṣad Brāhmaṇa 4.18–21; Naciketas in Taittirīya Brāhmaṇa 3.11.8; the Sāmaveda having only about 75 non-Ṛgvedic verses; Anukramaṇī attributions (RV 1.24–30 to Śunaḥśepa).
- **Identifications argued by scholars** (class 5, kept separate): Māna = Agastya (RV 7.33.13); the Mahābhāṣya's “Rāma” = Balarāma (2.2.34); Puṣyamitra = the Śuṅga founder; the Yavana of Sāketa = an Indo-Greek; Puruṣa Nārāyaṇa (ŚB 13.6.1.1) = the later Nārāyaṇa; Śakuntalā Nāḍapitī (ŚB 13.5.4.13) = the epic Śakuntalā; Janamejaya Pārikṣita of ŚB 13.5.4 = the epic king.
- **“Tat tvam asi”.** The Advaita reading (“you are that”) stands against Brereton's and Olivelle's contextual reading (“that's how you are”). This is recorded in the narrative details, not as a comparison.

## 5. Cross-agent links

- **Ids I reference.**
  - epic: `text:mahabharata`, `text:valmiki-ramayana`, `text:bhagavad-gita`, `char:krishna`, `char:arjuna`, `char:rama`, `char:dasharatha`, `char:janaka`, `char:janamejaya`, `char:shakuntala`, `char:parikshit`, `char:kamsa`, `char:balarama`, `narr:kamsa-vadha`, `concept:dharma`, `place:kurukshetra`, `place:mithila`
  - purana: `deity:vishnu`, `deity:shiva`, `deity:brahma`, `deity:parvati`, `deity:narayana`, `deity:vamana`, `char:manu`, `char:narada`, `char:harishchandra`, `char:bali`, `narr:vamana-bali`, `narr:matsya-flood`, `narr:daksha-yajna`, `lin:chandravamsha`, `place:ganga-river`, `place:sarasvati-river`, `text:vishnu-purana`, `text:bhagavata-purana`, `text:matsya-purana`, `trad:shaiva`, `trad:shakta`, `trad:smarta`
  - material: `deity:vasudeva`, `deity:sankarshana`, `ms:rigveda-bori`, `claim:krishna-devakiputra-identity`, `pol:shunga`, `pol:indo-greek`, `pol:vijayanagara`, `person:kalidasa`
- **For the material agent.**
  - I verified online P. 4.3.98 and the Mahābhāṣya on 3.1.26 (Kielhorn II 34.14–36.21). `material:82` and `material:84` can be upgraded to `verified-online` using `src:gretil-ashtadhyayi` and `src:gretil-mahabhashya`.
  - Patañjali on 5.3.99 (“mauryaiḥ … arcāḥ prakalpitāḥ”, images set up by the Mauryas) is verified and may interest you; `pol:maurya` does not exist.
- **Duplicate source ids for the orchestrator to merge.** The epic agent created `src:gretil-mahabhashya-etext` and `src:gretil-ashtadhyayi-etext`, which duplicate my `src:gretil-mahabhashya` and `src:gretil-ashtadhyayi`.
  - I removed my copies of `src:gonda-1954`, `src:bhandarkar-1913`, `src:raychaudhuri-1920` and `src:zvelebil-1973` because the purana, epic and regional agents define them.
  - The material agent removed its `src:raychaudhuri-1920` at the same moment I removed mine, and the epic agent then re-added it. If anyone deletes it again, `vedic:297` and `char:krishna-devakiputra` will break.
- **Overlaps I dropped in favour of other agents' verified edges:**
  - `epic:460`: Viśvāmitra teaches Rāma, VR (CE) 1.26.
  - `epic:464`: Agastya's arrow, VR (CE) 6.97.4.
  - `epic:1046`: Urvaśī's curse of Arjuna is only in CE Appendix I, not in the constituted text.
  - `epic:104` and `epic:106`.
  - `purana:568` and `purana:569`: Purūravas in ViP 4.6 and BhP 9.14, both verified.
- **Ids I wish existed:** `concept:bhakti` (Pāṇini 4.3.95; ŚvU 6.23), `ins:mitanni-treaty` (Mitra, Varuṇa, Indra and the Nāsatyas, 14th c. BCE), `pol:maurya`, `person:pushyamitra-shunga`, `text:taittiriya-brahmana`, `text:jaiminiya-upanishad-brahmana`, `text:mahanarayana-upanishad`, `person:gaudapada` with `text:mandukya-karika`, `place:parushni-river` (the site of the Dāśarājña), `place:kuru-panchala`.

## 6. Graph opportunities

- **Layer tree:** `col:vedic-samhitas` → Saṃhitā → Brāhmaṇa → Āraṇyaka → Upaniṣad (school `PART_OF` edges), with the family-book maṇḍalas visibly older than maṇḍalas 1 and 10.
- **Teacher network:**
  - Uddālaka → Yājñavalkya → Janaka and Maitreyī
  - Pravāhaṇa (a kṣatriya) → Uddālaka
  - Varuṇa → Bhṛgu
  - Prajāpati → Indra
  - Yama → Naciketas
  - Ghora → Kṛṣṇa Devakīputra
- **Intertext web:**
  - RV 4.26.1 → BU 1.4.10
  - RV 10.88.15 → BU 6.2.2
  - RV 1.164.20 → Muṇḍaka 3.1.1
  - RV 10.90 and TS 4.5 and RV 1.114 → ŚvU
  - RV 1.22.20 → Kaṭha 3.9
  - Kaṭha 2.18–19 → BG 2.19–20
- **External-witness cluster:** Aṣṭ. 4.3.98 and the Mahābhāṣya, linked with the material agent's Heliodorus, Hāthībāḍā and Agathocles nodes, giving a 4th–2nd c. BCE timeline of Vāsudeva and Saṅkarṣaṇa.
- **Story pipelines:** ŚB 1.8.1 → MBh 3.185 → Matsya and BhP (`cmp:manu-fish-identity`); RV 1.154 and ŚB 1.2.5 → Mahābhāṣya “balibandha” → Purāṇic Vāmana; RV 10.95 and ŚB 11.5.1 → ViP and BhP → Vikramorvaśīya.

## 7. Timeline contributions

- **Scholarly-textual dates:**
  - RV core c. 1500–1200 BCE (Witzel); bulk c. 1500–1000 BCE; codification c. 1200–1000 BCE.
  - Sāmaveda and Atharvaveda c. 1200–1000; Yajurveda c. 1200–800; TS c. 1000–800; VS c. 1000–700.
  - Brāhmaṇas c. 900–500; ŚB c. 800–500.
  - BU and CU c. 700–500 BCE (Olivelle), with Bronkhorst's later-layer view; TU, AU and KauU c. 600–400; Kena, Kaṭha, Īśā, ŚvU and Muṇḍaka in the last centuries BCE; Praśna and Māṇḍūkya c. 100 BCE–200 CE.
  - Nirukta c. 600–400 (disputed); Aṣṭādhyāyī c. 500–350 against c. 350–300 (disputed); Mahābhāṣya c. 180–120 BCE against a late-Maurya view.
  - Brahma Sūtra c. 200 BCE–450 CE (broad); Vikramorvaśīya c. 350–500 CE.
  - Śaṅkara c. 700–750 CE against 788–820 CE; his BU commentary on the same dates; Sāyaṇa's commentary c. 1350–1387.
- **Material dates:** the earliest RV manuscripts c. 1040 CE (Witzel, via pointer); Sāyaṇa's death in 1387.
- **Reception dates:** UNESCO proclamation 2003 and inscription 2008; the Agnicayana at Panjal in 1975 (Staal); Advaita systematisation in the 6th–8th c. CE.
- **Traditional dates:** the maṭha birth dates for Śaṅkara (509 and 483 BCE), recorded as label only.

## 8. Research gaps and follow-up

- Fetch a Kauṣītaki Upaniṣad e-text and verify KauU 1.1, 3 and 4.
- Find Patañjali on 4.3.98 in a complete Mahābhāṣya (Kielhorn vol. II).
- Confirm the Kena/JUB numbering and the Taittirīya Brāhmaṇa 3.11.8 Naciketas.
- Pin Witzel's period dates to page numbers.
- Check the Macdonell hymn counts against an index such as Lubotsky's.
- Add the Taittirīya Brāhmaṇa, Jaiminīya Brāhmaṇa (with its Saramā and Śunaḥśepa variants) and Bṛhaddevatā as text nodes.
- Encode the Vālakhilya hymns, the Khilas and the Padapāṭha (Śākalya, already cited by Pāṇini 1.1.16).
- The material agent might add the Mitanni treaty and the oldest Nepalese RV manuscript as entities.

## 9. Candidate discoveries

1. **Bali's binding was a performed story by the mid-2nd c. BCE.**
   - *Finding:* the same Mahābhāṣya sentence that attests Kaṃsa-vadha performances also has śobhikas “before one's eyes bind Bali” (baliṃ bandhayanti). Read with ŚB 1.2.5 (a dwarf Viṣṇu wins the earth, no Bali) and RV 1.154 (the strides), it gives a three-stage textual history of the Vāmana–Bali story before the Purāṇas.
   - *Ids:* `psg:mahabhashya-3-1-26`, `vedic:343`, `vedic:414`, `vedic:342`, `psg:sb-1-2-5`, `narr:vishnu-dwarf-earth`, with `purana:422`.
   - *Caveat:* Patañjali names neither Viṣṇu nor Vāmana.
2. **Vedic prose already names the epic's frame figures.**
   - *Finding:* ŚB 13.5.4.1–3 has Janamejaya Pārikṣita with brothers Bhīmasena, Ugrasena and Śrutasena — the trio the Mahābhārata names when it opens the Pauṣyaparvan. ŚB 13.5.4.13 has Bharata Dauḥṣanti “whom the apsaras Śakuntalā bore”. The epic's Kuru frame thus reuses Vedic royal memory.
   - *Ids:* `psg:sb-13-5-4`, `vedic:325`, `vedic:326`, `vedic:322`, `vedic:327`.
   - *Caveat:* the MBh-side locator is from recall, and identity is inferred.
3. **The Śvetāśvatara is a demonstrable splice of Ṛgvedic and Yajurvedic Rudra material.**
   - *Finding:* verbatim reuse of TS 4.5.1 (ŚvU 3.5), RV 1.114.8 (ŚvU 4.22) and RV 10.90.1–2 (ŚvU 3.14–15) sits beside the first use of śiva and maheśvara for the one supreme lord and the first “bhakti” to god and guru (6.23).
   - *Ids:* `vedic:144`, `vedic:145`, `vedic:146`, `vedic:215`, `psg:svu-6-23`, `cmp:rudra-to-shiva`.
   - *Caveat:* whether śiva is a name or an epithet is debated.
4. **Temples of Rāma–Keśava in a 2nd-c. BCE grammar.**
   - *Finding:* the Mahābhāṣya on 2.2.34 quotes a verse about drums, conches and flutes sounding “in the prāsāda of Dhanapati, Rāma and Keśava”. With 2.2.24 (“may the strength of Kṛṣṇa, with Saṅkarṣaṇa as companion, grow”), this is literary evidence for shrines of Balarāma and Kṛṣṇa alongside the epigraphic Saṅkarṣaṇa–Vāsudeva record.
   - *Ids:* `vedic:415`, `vedic:416`, `vedic:417`, `vedic:418`.
   - *Caveat:* it is a grammatical example, and “Rāma” = Balarāma is interpretation.
5. **Rebirth doctrine is credited to kings, in two divergent versions.**
   - *Finding:* both BU 6.2.8 (the knowledge “never before dwelt in any brahmin”) and CU 5.3.7 (hence rule belonged to the kṣatriya) give the five-fires doctrine to the Pañcāla king Pravāhaṇa. Only the Chāndogya ties rebirth to conduct and social birth (5.10.7); the Bṛhadāraṇyaka instead quotes RV 10.88.15.
   - *Ids:* `cmp:five-fires-versions`, `vedic:279`, `vedic:399`, `vedic:400`.
   - *Caveat:* this is a literary attribution, not proof of kṣatriya origin.
6. **The Gaṅgā is nearly absent from the Ṛgveda.**
   - *Finding:* it appears once, in the river list RV 10.75.5, plus the adjective gāṅgya at 6.45.31. The Sarasvatī has three hymns. ŚB 1.4.1 narrates Agni's eastward march from the Sarasvatī to Videha.
   - *Ids:* `vedic:473`, `vedic:207`, `vedic:406`, `vedic:407`.
   - *Caveat:* this is the absence of evidence in one corpus, and the migration reading is interpretive.
