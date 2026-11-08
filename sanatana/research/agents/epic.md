# Itihāsa & Epic Literature — research report (agent `epic`)

Date: 2026-11-08. Files: `data/entities/epic.json` (308), `data/assertions/epic.json` (1,144),
`data/sources/epic.json` (33), `data/comparisons/epic.json` (9). `npm run validate -- --domain epic`:
**0 errors, 0 warnings**.

Method: I downloaded the GRETIL e-texts of the **Pune Critical Edition of the Mahābhārata** (18 parvan
files, BORI 1999 e-text, Tokunaga/Smith), the **Baroda Critical Edition of the Rāmāyaṇa**
(Tokunaga/Smith), **Vaidya's Harivaṃśa**, the **Bhāgavata Purāṇa**, **Pathak's critical Viṣṇu
Purāṇa**, **Pāṇini** and the **Mahābhāṣya**, parsed them into verse indexes, and checked every
locator marked `verified-online` against the Sanskrit (the SourceRef `url` points to the GRETIL file).
Chapter/verse counts quoted below are my counts from those files.

## 1. Executive findings

1. **Critical-edition structure, counted.** MBh (CE): 18 parvans, **1,995 adhyāyas**, c. **73,900**
   numbered verses (Ādi 225, Sabhā 72, Āraṇyaka 299, Virāṭa 67, Udyoga 197, Bhīṣma 117, Droṇa 173,
   Karṇa 69, Śalya 64, Sauptika 18, Strī 27, Śānti 353, Anuśāsana 154, Āśvamedhika 96, Āśramavāsika 47,
   Mausala 9, Mahāprasthānika 3, Svargārohaṇa 5). VR (CE): 7 kāṇḍas, **606 sargas** (76/111/71/66/66/116/100),
   **18,761** verses. HV (CE): 118 adhyāyas (Harivaṃśa 1–45, Viṣṇu 46–113, Bhaviṣya 114–118), c. 6,070
   verses. BORI's own description says "more than 89,000 verses" — a counting discrepancy I record, not resolve.
2. **All requested episode ranges verified in the CE:** Gītā = 6.23–40 (6.23.1 *dharmakṣetre* … 6.40.78);
   Rāmopākhyāna = 3.257–275 (frame 3.257, consolation 3.276); Nala = 3.50–78 (frame 3.49); Sāvitrī =
   3.277–283; Śakuntalā = 1.62–69; churning = 1.15–17 (1.18.1 closes it). Plus ~40 further sub-parvan
   boundaries (Āstīka 1.13–53, aṃśāvataraṇa 1.61, Pañcendra 1.189, Dyūta 2.43–65, Viduranīti 5.33–40,
   Sanatsujātīya 5.42–45, Bhagavadyāna 5.70–137, Ambopākhyāna 5.170–193, Rājadharma 12.1–128,
   Āpaddharma 12.129–167, Mokṣadharma 12.168–353, Nārāyaṇīya 12.321–339, Viṣṇusahasranāma 13.135,
   Anugītā 14.16–50 …).
3. **Famous details absent from the CE constituted text** (present only as star passages/appendices):
   Draupadī's prayer to Kṛṣṇa during the disrobing (*542–*547 after 2.61.40 — the CE says only that
   "another garment of the same kind appeared, many times", 2.61.41); Urvaśī's curse on Arjuna (Āraṇyaka
   App. @006 after 3.45.8); the Vārkṣī precedent for polyandry (*1910 after 1.188.14); Gaṇeśa as Vyāsa's
   scribe (not in 1.1); the Ādityahṛdaya (not in the VR CE text).
4. **The Rāmopākhyāna vs Vālmīki** (cmp tables): MBh 3.258.9 makes Sītā Janaka's own daughter made by
   Tvaṣṭṛ (no furrow-birth, no bow contest); Lakṣmaṇa, not Rāma, kills Kumbhakarṇa (3.271.16); Sītā is
   vindicated by divine testimony and Nalakūbara's curse without a fire-entry (3.275.10–36); no
   banishment. Yet it already makes Rāma the descended four-armed Viṣṇu (3.260.5).
5. **Divine/legal paternity encoded as the text states it:** Hanumān is Kesarin's *kṣetraja* and Māruta's
   *aurasa* son (VR 4.65.27–28); Vālin "Mahendra's son" (4.17.11), Sugrīva "Bhāskara's son" (4.4.20);
   Pāṇḍavas from Dharma/Vāyu/Indra/Aśvins (MBh 1.114–115) with Pāṇḍu as legal father; Karṇa from the Sun
   (1.104.8), and Kṛṣṇa's argument that a *kānīna* son is "by dharma Pāṇḍu's son" (5.138.8–9).

## 2. Dataset summary

- **Entities (308):** 116 owned core ids (all present) + 192 new: 146 characters, 74 narratives,
  51 passages (7 kāṇḍas, 18 parvans, 3 HV parvans, 23 episodes), 20 places, 8 lineages, 5 texts,
  1 collection, 1 deity (`deity:dharma`), 1 concept, 1 claim (`claim:lanka-sri-lanka-identification`).
- **Assertions (1,144):** PARTICIPANT_IN 347, PARENT_OF 117, NARRATED_IN 98, PRECEDES 69,
  APPEARS_IN 63, PART_OF 58, MEMBER_OF 57, OCCURS_AT 46, SIBLING_OF 44, SPOUSE_OF 42, SLAYS 28,
  AVATARA_OF 23, TEACHER_OF 18, ASSOCIATED_WITH 17, ADVERSARY_OF 15, ALLY_OF 14, BLESSES 12,
  CURSES 11, IDENTIFIED_WITH 9, ADOPTIVE_PARENT_OF 9, RETELLS 8 … (above the 500–800 target because
  every participant/kinship edge carries its own verified locator; the count is not padded with
  unverified edges).
- Status: 1,084 verified-online, 37 source-checked, 17 recall, 6 disputed. Evidence class: 1 (textual)
  1,092; 5: 23; 6: 23; 7: 4; 2: 1; 3: 1.
- **Most connected:** char:krishna (63), char:rama (58), text:mahabharata (48), char:arjuna (46),
  text:valmiki-ramayana (34), char:yudhishthira, char:bhima, char:karna, narr:kurukshetra-war,
  char:ravana, char:lakshmana, text:ramopakhyana, char:sita, char:bhishma, char:draupadi.
- **Comparisons (9):** cmp:krishna-portrayal (MBh/Gītā/HV/ViP/BhP), cmp:rama-story-vr-vs-ramopakhyana,
  cmp:sita-birth, cmp:sita-ordeal-banishment, cmp:kumbhakarna-slayer, cmp:karna-parentage (7 parvan rows),
  cmp:draupadi-polyandry (6 justifications), cmp:vidura-origin, cmp:draupadi-garment (CE vs apparatus).

## 3. Evidence ledger

| Source | Supports | Checked |
|---|---|---|
| src:gretil-mbh-ce (BORI e-text) | every MBh (CE) locator; adhyāya/verse counts; star-passage findings | online, full text parsed |
| src:gretil-vr-ce (Tokunaga/Smith) | every VR (CE) locator; sarga counts | online, full text parsed |
| src:gretil-hv-ce (Vaidya) | HV parvan ranges; Kṛṣṇa episodes (48.11, 55–56, 61–62, 63.24–35, 76, 85–88, 94.19) | online |
| src:gretil-bhp-etext, src:gretil-vip-pathak | BhP 1.3.28, 2.7.26, 10.3.8, 10.25.19, 10.29.1, 10.44.37; ViP 5.1.60–64, 5.3, 5.11, 5.13, 5.20 | online |
| src:gretil-ashtadhyayi-etext, src:gretil-mahabhashya-etext | Pāṇini 4.3.98 *vāsudeva-arjunābhyāṃ vun*; 6.2.38 (*mahān … bhārata*); Mahābhāṣya on 3.1.26 *kaṃsavadham ācaṣṭe* | online |
| Wikipedia (BORI, Sukthankar, Spitzer, Aihole, Harivaṃśa, Rāmāyaṇa, Gītā pages) | CE history 1919–1966, editors, 1,259 mss; Spitzer radiocarbon 130 CE (80–230), Franco 200–230; Aihole 3,735 years / Śaka 556; date views of Goldman, Brockington, Upadhyaya, Masson–Ingalls, Couture, Vaidya, Hazra | online (pointer only) |
| Cambridge/BSOAS review records | VR CE fascicles from 1958 (Bālakāṇḍa) to 1973–75 (Uttarakāṇḍa) | online (search) |
| philarchive (Pollock 1984) | JAOS 104(3): 505–528 | online |
| Brockington 1998, Goldman 1984, Jacobi 1893, Hiltebeitel 2001, Matchett 2001, Bryant 2007, Jaiswal 1981, Bhandarkar 1913, McGrath 2004, Sullivan 1990 | scholarly views (dating, divinity debate, fusion theory, Karṇa, Vyāsa) | source-checked (named works; Hiltebeitel's "mid-2nd c. BCE – year zero" wording confirmed via quoting reviews) |

Coordinates were taken from the Wikipedia API (Ayodhya, Janakpur, Anegundi, Chitrakoot Dham, Kalaram
temple/Panchavati, Jagdalpur for Dandakaranya, Hastinapur, Purana Qila, Kurukshetra, Dwarka, Mathura,
Vrindavan, Kampil, Taxila, Viratnagar, Prabhas Patan, Pampa Sarovar, Shringverpur) and, for Nimsar, from
the location link on the Naimisharanya article. All are `precision: approximate` or `region`.

## 4. Uncertainty log

- **CE verse total:** 73,898 numbered verses in the GRETIL e-text vs BORI's "more than 89,000". Settle by
  checking BORI's counting convention (half-verses? prose? star passages?).
- **Aihole era:** 634–35 CE − 3,735 years = 3102/3101 BCE (Kali epoch). The Wikipedia *Mahabharata*
  article states 3137 BCE; I record 3102 BCE as the implied traditional date, `certainty: disputed`.
- **Brockington's 400 BCE–400 CE:** the range is often credited to Winternitz/Hopkins; I attribute the
  view jointly. Check Brockington 1998 p. 26 directly.
- **VR CE dates:** orchestrator lists 1960–1975; fascicles of the Bālakāṇḍa appeared from 1958.
- **Rāmopākhyāna's relation to Vālmīki** (`epic:` DERIVED_FROM, status disputed).
- **Ganguli (vulgate) section numbers** for the disrobing and the Urvaśī episode could not be checked
  (sacred-texts.com blocks automated fetching); left as "section not checked".
- Recall-only items (17): e.g. Droṇa as teacher of all princes (1.121–123 range), Balarāma teaching the
  mace (9.33–34), Śalya's recruitment details now verified but Śatrughna founding Mathurā not checked;
  Paümacariya/Adhyātma/Kampaṉ rows in the comparisons; Laṅkā's central-India proposals (Kibe?).
- **Laṅkā** is kept separate from Sri Lanka; the identification is a `claim` entity with SUPPORTS edges
  and stated alternatives.

## 5. Cross-agent links

Referenced (not defined): deity:vishnu, deity:narayana, deity:shiva, deity:brahma, deity:lakshmi,
deity:ganga, deity:indra, deity:surya, deity:vayu, deity:yama, deity:ashvins, deity:agni, deity:rudra,
deity:vasudeva, deity:sankarshana, char:vishvamitra, char:agastya, char:parashurama, char:narada,
char:markandeya, char:yayati, char:urvashi, char:krishna-devakiputra, char:radha, lin:suryavamsha,
lin:chandravamsha, narr:samudra-manthana, narr:descent-of-ganga, narr:matsya-flood, text:vishnu-purana,
text:bhagavata-purana, text:ashtadhyayi, text:mahabhashya, text:kamba-ramayanam, text:ramcharitmanas,
text:krittivasi-ramayana, text:adhyatma-ramayana, text:paumacariya, text:dasaratha-jataka,
text:kakawin-ramayana, text:ramakien, text:reamker, text:jnaneshwari, ms:spitzer, ins:aihole-ravikirti,
site:hastinapura-excavation, site:dwarka-offshore, place:adams-bridge, place:rameswaram-island,
place:hampi, trad:vaishnava, trad:gaudiya, trad:srivaishnava.

New ids that others may want: **deity:dharma** (the god; IDENTIFIED_WITH deity:yama), **char:bharadvaja**
(epic figure; vedic may want to link the Ṛgvedic seer), **char:kubera** (as character; a deity record
could join it), **char:maya-danava**, **char:rohini**, **char:radha-adhiratha** (≠ char:radha),
**char:nala-vanara** (≠ char:nala), **claim:lanka-sri-lanka-identification**.

Shared sources: I define `src:raychaudhuri-1920` and `src:sankalia-1973` (the material/vedic copies
were withdrawn mid-session after a duplicate-id collision); `src:bhandarkar-1913` is now defined by
purana. Duplicate triples with material (Spitzer, Aihole) and regional (RETELLS) are harmless warnings
in their files. Wished-for ids: deity:shesha (Balarāma/Lakṣmaṇa as Śeṣa), deity:prithivi/bhudevi (Sītā's
return to the earth), deity:vishvakarman (father of Nala), a Sri Lanka place node.

## 6. Graph opportunities

- Kinship super-graph joining the two epics through Kuntī–Vasudeva (Kṛṣṇa's paternal aunt), Hanumān–Bhīma
  (both sons of Vāyu), Maya (Pāṇḍava hall builder and Mandodarī's father) and Bharadvāja (host of Rāma,
  father of Droṇa).
- The "divine fathers" layer (qualifiers.role = divine father vs legal/kṣetra father).
- Story-world PRECEDES chains (27 Rāmāyaṇa, 32 Mahābhārata, 6 Kṛṣṇa-cycle links).
- The aṃśāvataraṇa (MBh 1.61) as a bipartite god→hero map.
- CE vs apparatus contrasts (cmp:draupadi-garment; Urvaśī; Vārkṣī).

## 7. Timeline contributions

- scholarly-textual: VR core c. 750–500 BCE (Goldman); 5th–4th c. BCE primary stage, later stages to
  c. 3rd c. CE (Brockington; Jacobi's relative chronology); MBh c. 400 BCE–400 CE (Brockington /
  Winternitz–Hopkins) vs mid-2nd c. BCE–0 (Hiltebeitel); Gītā c. 2nd–1st c. BCE (common) vs 5th–4th c.
  BCE (Upadhyaya); HV c. 1st–3rd c. CE (Masson–Ingalls, Couture), c. 300 CE (Vaidya), 4th c. (Hazra).
- material: Spitzer parvan list c. 130 CE (80–230); Aihole inscription 634–35 CE.
- reception: Śaṅkara fixes 700 Gītā verses (8th c.); MBh CE 1919–1966; VR CE 1958–1975.
- traditional: Tretā-yuga (Rāma); 3102 BCE Bhārata war (Kali epoch as implied at Aihole).
- external attestation (dated works): Pāṇini 4.3.98 & 6.2.38; Patañjali on 3.1.26 (Kaṃsavadha performance).

## 8. Research gaps / follow-up

- Earliest dated Rāmāyaṇa manuscripts (Nepalese palm-leaf) — not checked; add `ms:` records with the material agent.
- CE apparatus statistics (how many manuscripts carry *542–*547, App. @006) — would quantify the vulgate/CE gap.
- Vulgate (Gita Press/Bombay) concordance for key passages; Ganguli section numbers.
- More Harivaṃśa → Purāṇa NARRATED_IN rows (Pūtanā, Dhenuka, Ariṣṭa, Keśin) and the Viṣṇuparvan's Jarāsandha wars.
- Regional retellings: let `regional` own row-level statements for Kampaṉ, Tulsīdās, Kṛttibās.

## 9. Candidate discoveries

1. **The CE has no Kṛṣṇa in Draupadī's disrobing.** The constituted text (MBh (CE) 2.61.41) says only that
   garments kept appearing; the famous "govinda dvārakāvāsin …" prayers are star passages *542–*547.
   Ids: narr:draupadi-humiliation, cmp:draupadi-garment, the DEVOTEE_OF draupadi→krishna assertion
   (status disputed). Caveat: the CE reconstructs the shared archetype; it does not prove the prayer
   is "late" in every region, and Dharma is sometimes credited in other manuscripts.
2. **The Mahābhārata's own Rāma kills no Kumbhakarṇa and lights no pyre.** In the Rāmopākhyāna Lakṣmaṇa
   kills Kumbhakarṇa with the Brahmā weapon (3.271.16) and Sītā is cleared by the gods' testimony and
   Nalakūbara's curse (3.275.10–36) — yet Rāma is already Viṣṇu descended (3.260.5). Ids:
   text:ramopakhyana, cmp:kumbhakarna-slayer, cmp:sita-ordeal-banishment, char:rama AVATARA_OF
   (text:ramopakhyana). Caveat: may be abridgement rather than an older version.
3. **One "hair" motif links MBh, Viṣṇu and Bhāgavata Purāṇa against the Bhāgavata's own climax.**
   Nārāyaṇa's white and black hairs become Balarāma and Kṛṣṇa in MBh 1.189.31 and ViP 5.1.60–64, and
   BhP 2.7.26 still says "sita-kṛṣṇa-keśaḥ", while BhP 1.3.28 declares "kṛṣṇas tu bhagavān svayam" —
   the textual hinge of the Gauḍīya inversion (deity:vishnu FORM_OF char:krishna, trad:gaudiya). Ids:
   cmp:krishna-portrayal, char:krishna, char:balarama. Caveat: theological readings of these verses
   differ by school; the dataset does not adjudicate.
4. **Five unreconciled justifications of Draupadī's polyandry sit side by side in the Ādiparvan**
   (1.182.2; 1.188.13–16; 1.189.1–40; 1.189.41ff/1.157; 1.61.95–97), and the CE drops one precedent
   (Vārkṣī) to the apparatus. Id: cmp:draupadi-polyandry. Caveat: literary layering vs design is debated.
5. **Grammarians attest the stories before the epics' final form:** Pāṇini 4.3.98 (*vāsudeva-arjunābhyāṃ
   vun*) and Patañjali's "kaṃsavadham ācaṣṭe" (on 3.1.26). Ids: char:arjuna / deity:vasudeva MENTIONED_IN
   text:ashtadhyayi; narr:kamsa-vadha MENTIONED_IN text:mahabhashya. Caveat: attests cults/stories,
   not the texts.
