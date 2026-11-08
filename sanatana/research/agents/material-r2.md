# Archaeology, Inscriptions & Material Evidence — round 2 report (agent `material`)

Files: `data/entities/material-r2.json` (214 entities), `data/assertions/material-r2.json` (503 assertions, `material:r2-1` … `material:r2-503`), `data/sources/material-r2.json` (35 sources). Round-1 files edited: `data/assertions/material.json` (67 assertions touched, 58 raised to `verified-online`) and `data/entities/material.json` (14 entities given edition references).
Validator: `npm run validate -- --domain material` → **0 errors · 0 warnings** (2026-11-08). The whole-dataset run shows no errors or warnings in my files (the remaining errors are in another agent's in-progress file).

---

## 1. Executive findings

1. **The DHARMA/Dharmalekha corpus made real verification possible.** Dharmalekha (dharmalekha.info, the ERC DHARMA project, which incorporates SIDDHAM) publishes digital critical editions with full bibliographies — Fleet's CII III item numbers, Sircar's *Select Inscriptions* book/item, SII volume/number — and, for some records, public-domain translations (Kielhorn's 1900–01 Aihole translation; Cœdès' French for Sdok Kak Thom and Vat Luang Kau). I read the edition text itself for each claim before raising a status. Pre-Gupta records were checked in the archive.org scan of Sircar 1965 (text, Sanskritised text and footnotes).
2. **58 round-1 assertions raised to `verified-online`.** The pattern of the round-1 problem (class-3 claims resting on Wikipedia alone) is mostly fixed for the core early inscriptions: Heliodorus, Ghosuṇḍī, Nāṇeghāṭ, Mora, Vasu, Udayagiri Cave 8, the Mehrauli pillar, both Eran records, Gangdhar, Aihole and Changu Narayan. One round-1 recall (`material:188`, the Eran brothers) is now confirmed from the edition: the pillar was raised by mahārāja Mātṛviṣṇu and his younger brother Dhanyaviṣṇu.
3. **A dated chain for Skanda–Kārttikeya before the Purāṇic synthesis.** In order:
   - Huviṣka's gold coins (c. 150–190) still name Skando, Komaro, Bizago (Viśākha) and Maaseno (Mahāsena) as separate figures.
   - A Kuṣāṇa Mathurā Kārttikeya with spear (AIC 1985.1037) and the Yaudheya coins make him a republic's emblem.
   - The Bilsad pillars (Gupta year 96 = 415/416) record a temple of "Svāmi-Mahāsena … brahmaṇya-deva".
   - Kumāragupta I's Peacock-type gold coins show the god on his peacock (Allan 1914 § 101).
4. **Epic genealogies in royal title deeds.**
   - The Pallavas trace descent through Aśvatthāman, Droṇa and Bharadvāja (Kasakudi, SII II 73), and attach a Nāga princess to the line (Velurpalaiyam, SII II 98).
   - The Cōḻas claim the solar line of Manu and Ikṣvāku (Anbil, EI XV; Tiruvālaṅkāṭu, SII III 205).
   - The Kadamba founding story at Tāḷagunda inverts the pattern: a brahmin humiliated at the Pallava capital turns warrior "in this Kali age".
5. **Mahābhārata reception on the Mekong in the 5th century.** The Vat Luang Kau stele (K. 365) of King Devānīka founds a "new Kurukṣetra". It compares the king to Yudhiṣṭhira, Dhanañjaya and Śibi, and quotes tīrtha-praise verses ("kurukṣetraṃ gamiṣyāmi kurukṣetre vasāmy aham …") of the type found in the epic's pilgrimage chapters.
6. **Contested archaeology stays neutral.** The ASI's 2003 Ayodhyā excavation is modelled as a `site` plus `claim:ayodhya-temple-beneath-mosque`. The ASI report SUPPORTS the claim and the critics' reading of the same excavation CONTRADICTS it; both edges are `disputed`. The claim record states how the 2019 judgment used the report: it found an underlying non-Islamic structure, no finding of demolition, and decided title on other evidence. The same treatment is applied to three other claims: the "Rāmāyaṇa sites" project, the Kauśāmbī śyenaciti, and the Võ Cạnh "earliest Sanskrit" claim.

## 2. Dataset summary

| Type | New | | Type | New |
|---|---|---|---|---|
| artifact | 68 | | institution | 18 |
| person | 50 | | manuscript | 12 |
| inscription | 27 | | polity | 8 |
| site | 23 | | claim | 5 |
| | | | text | 3 |

- **Assertions (470):**
  - By status: verified-online 348 · reference-checked 146 · disputed 9.
  - By evidence class: class 4: 301 · class 3: 125 · class 5: 54 · class 2: 11 · class 7: 7 · class 6: 3 · class 1: 2.
  - Top predicates: DEPICTED_IN 99, REFERS_TO 76, HELD_AT 71, DOCUMENTED_BY 67, COMMISSIONED_BY 44, MEMBER_OF 23, FOUND_AT 19, PART_OF 14.
- **Entities by status:** verified-online 107 · reference-checked 101 · disputed 6.
- **Images:** 43 records carry images, all CC0 from museum open-access programmes (Met, Art Institute of Chicago, Cleveland). Each object was confirmed public-domain in its API record, and every image URL returned `200 image/jpeg` on 2026-11-08. V&A objects carry no image because V&A images are not CC0.
- **Most connected new entities:** `inst:dharma-project` (21), `inst:cleveland-museum` (17), `inst:met-museum` (15), `ins:vat-luang-kau-devanika` (13), `ins:allahabad-pillar-samudragupta` and `ins:sdok-kak-thom` (12 each), `person:samudragupta` and `ins:junagadh-skandagupta` (9 each). The busiest round-1 targets are `deity:shiva` (19) and `deity:vishnu` (18).

## 3. Evidence ledger

**Checked online (status `verified-online`, URL in the SourceRef):**
- **Dharmalekha editions:**
  - Siddham/Gupta: 00001 Allahabad; 00008 Mathurā pilaster; 00014 Udayagiri 8; 00015 Mehrauli; 00017 Mandsaur (Naravarman); 00019 Bilsad; 00032 Junagadh (Skandagupta); 00036 Bhitari; 00040 Mandsaur (silk weavers); 00045 Eran pillar; 00076 Gangdhar; 00099 Eran boar; 01050 Tāḷagunda; 02001–02003 Changu Narayan.
  - Other repositories: BadamiCalukya00005 (Aihole); Pallava00046 (Kūram); SII 2.73 (Kasakudi); SII 2.98 (Velurpalaiyam); TamilNadu01003 (Anbil); TamilNadu01005 (Tiruvālaṅkāṭu); IDENK Tugu, Canggal, Kanjuruhan; CIK00235 (Sdok Kak Thom); CIK00365 (Vat Luang Kau); CIC00072 (Mỹ Sơn).
  - For each I read the bibliography and checked the claimed names, gods and dates in the edition text, for example: "pratimāṃ … śārṅgiṇaḥ" (Bhitari); "svāmi-mahāsenasyāyatane" (Bilsad); "ekaṣaṣṭhe 61" (Mathurā); "mātṝṇāṃ … ḍākinī-saṃprakīrṇaṃ veśma" (Gangdhar).
- **Sircar 1965** (archive.org `dli.calcutta.11040`, cross-read with `in.ernet.dli.2015.56635`):
  - bk. II nos. 2 (Besnagar, Lüders 669), 3 (Ghosuṇḍī, Lüders 6), 26A (Mora well, with Vogel's Mathurā catalogue no. Q.1), 26B (Vasu doorjamb), 67 (Junagadh of Rudradāman, Lüders 965, Kielhorn EI VIII) and 82 (Nāṇeghāṭ, Lüders 1112).
  - The Junagadh line 8 on Puṣyagupta and Aśoka, and line 12 on the Yaudheyas, were read in the OCR.
- **Allan 1914** (archive.org `dli.csl.5234`): §§ 74–76 (Standard type, Garuḍa standard), p. lxxvii (Aśvamedha type), § 80 (Candragupta I type), § 97, § 101 (Peacock type: Kārttikeya on Paravāṇi), § 113 (King and Lakṣmī), § 151.
- **Museum APIs:**
  - Metropolitan Museum Collection API v1.1: 20 objects.
  - Art Institute of Chicago API: 13 objects.
  - Cleveland Open Access API: 20 objects.
  - V&A Collections API: 6 objects, with summary texts read (Razmnāma 1598, Persian Harivaṃśa c. 1590, Manaku's 1730 Gīta Govinda, Hoysaḷa Durgā).
- **Schøyen Collection catalogue:** MS 2174 (Devīmāhātmya, 11th c.).

**Reference-checked only (Wikipedia pages read through WebFetch):**
- SE Asian: Võ Cạnh, Ciaruteun, Tugu, Sdok Kok Thom, Po Nagar.
- Excavations and paintings: Razmnāma, Mattancherry Palace, Ayodhya dispute.
- Coins: Yaudheya, Audumbaras, Huviṣka.

**Named but not opened:** Vogel 1918 (Kutai), Vogel 1925, Allan 1936, Losty 2008, Seyller 1999, Goswamy & Fischer 1992, and the excavation reports (Härtel 1993, Joshi 1993, Lal 1993, Sharma 1960, Malleret 1959). The records that depend on them stay `reference-checked`.

## 4. Uncertainty log

| Item | Problem | What would settle it |
|---|---|---|
| `material:36` Nāṇeghāṭ → Varuṇa | Sircar's OCR shows Yama and Vāsava; Varuṇa not legible | Bühler ASWI V plate or a clean Sircar copy |
| Bādāmi Cave 3 (`material:276–280, 287`) | Fleet's IA III/X editions: the archive.org OCR is unusable (Devanāgarī OCR of English) | IA III p. 305 / IA X page images |
| Kailāsa / Kṛṣṇa I (`material:326–328`), Śivagṛha (`material:349–353`) | Baroda plates (IA XII) and de Casparis 1956 not online | the editions |
| Kuṣāṇa coin edges (`material:121–136`) | no museum specimen with a readable reverse checked; Cleveland 1999.225 is a different type | ANS/BM specimen records |
| Hāthībāḍā in Udaipur museum (`material:29`), Mora torso and Vasu doorjamb holdings (`material:51, 52, 59`), Paśupati seal and Deogarh panels in New Delhi | museum sites unreachable | museumsofindia.gov.in / NM catalogue |
| `ins:vo-canh` | 2nd–3rd vs 4th–5th century | modern palaeographic edition |
| `ins:kutai-yupa` | readings and museum inventory numbers unchecked | Vogel 1918 |
| `ins:po-nagar-satyavarman` | C-number and edition not located in DHARMA | Cham corpus (C. 38?) |
| `ins:mahakuta-pillar`, `ins:belur-vishnuvardhana-1117`, `ins:khajuraho-lakshmana`, `ins:uttaramerur-sabha` | edition page/number not checked | Fleet IA XIX, EC V, EI I scan, ARE 1898 |
| Kuram plates → Bhārata recitation | stated in secondary literature; Tamil portion not checked | DHARMA Pallava00046 text |
| Vat Luang Kau → Mahābhārata | parallel verses identified by type, CE locator not checked | MBh (CE) book 3 tīrtha chapters |
| Oldest Rāmāyaṇa / Bhagavad Gītā manuscripts | still not verifiable; Cambridge Digital Library returned 403; the "1020 CE Nepalese Rāmāyaṇa" found in no catalogue | NGMCP / NAK catalogue |
| Devīmāhātmya oldest MS | Schøyen MS 2174 (11th c.) is only a private-catalogue claim | comparison with NGMCP holdings |

## 5. Cross-agent links

- **Referenced:**
  - epic: `char:yudhishthira`, `char:arjuna`, `char:ashvatthama`, `char:drona`, `char:bharadvaja`, `char:duryodhana`, `char:shalya`, `char:karna`, `char:rama`, `char:sita`, `char:lakshmana`, `char:dasharatha`, `char:kaikeyi`, `char:rishyashringa`, `char:shurpanakha`, `char:ravana`, `char:jatayu`, `char:maricha`, `char:hanuman`, `narr:golden-deer`, `narr:jatayu-fight`, `narr:shurpanakha-mutilation`, `narr:abduction-of-sita`, `place:kurukshetra`, `place:naimisha`, `place:prabhasa`, `place:shringaverapura`, `place:ayodhya`, `lin:suryavamsha`, `lin:pancala`.
  - purana: `deity:*`, `narr:vamana-bali`, `narr:three-strides`, `narr:varaha-earth`, `narr:mahishasura-slaying`, `narr:kaliya`, `narr:damodara-binding`, `narr:andhaka-slaying`, `char:pradyumna`, `char:nanda`, `char:vasudeva-father`, `char:radha`, `text:bhagavata-purana`, `text:harivamsha`, `text:devi-mahatmya`.
  - vedic/regional: `char:agastya`, `char:manu`, `char:ikshvaku`, `char:vishvamitra`, `text:gita-govinda`.
  - temple: `temple:my-son`, `temple:lakshmana-khajuraho`, `temple:chennakeshava-belur`, `temple:ram-mandir-ayodhya`, and the persons `person:rajendra-i`, `person:parantaka-i`, `person:nandivarman-ii`, `person:yashovarman-chandela`, `person:vishnuvardhana-hoysala`, `person:rajaraja-i`.
- **Reused temple-r2 ids, not duplicated:** `pol:mughal`, `pol:guhila-mewar`, `pol:chenla`. Also the sources `src:hultzsch-sii2` and `src:sc-ayodhya-2019`.
- **Duplicate edges withdrawn:** two of my edges duplicated temple:301 (Śiva at Mỹ Sơn) and temple:321 (Rājendra I ∈ Cōḻa). I removed mine; temple:301 could cite DHARMA_INSCIC00072.
- **Shared ids I created:** `person:ashoka`, `person:samudragupta`, `person:skandagupta`, `person:chandragupta-i`, `person:akbar`. Three texts are translation records the epic or regional agents may wish to extend: `text:razmnama`, `text:harivamsha-persian`, `text:ramayana-persian-akbar`.
- **Created for the iconography agent (orchestrator request):**
  - `pol:pala`.
  - `art:cma-kushan-possibly-shiva`, `art:vam-mathura-vishnu`, `art:cma-mathura-vishnu-head-400s`, `art:aic-kushan-yakshi`, `art:met-balarama-or-nagaraja`, `art:bharhut-gaja-lakshmi`, `art:kankali-tila-sarasvati`, `art:parkham-yaksha`.
  - `site:bharhut`, `site:kankali-tila`, `inst:indian-museum-kolkata`, `inst:state-museum-lucknow`.
  - The earlier earliest-example records: `art:aic-kushan-mahishasuramardini`, `art:aic-kushan-karttikeya`, `art:aic-early-ganesha-mathura`, `art:met-gupta-ekamukhalinga`.
  - No Kuṣāṇa-period Mathurā liṅga or ekamukhaliṅga with a verifiable accession was found in the Met, AIC, Cleveland or V&A APIs; the Government Museum Mathurā catalogue was unreachable.
- **Ids I wish existed:**
  - `temple:po-nagar`, `temple:phnom-rung`, `temple:mahakuta`, `place:kanchipuram`, `place:ujjain` (the temple agent is adding some).
  - `char:keshi`, `char:shambara`, `char:shuka`, `deity:bhudevi`, `deity:ardochsho`.
  - Iconographic forms — Somāskanda, Harihara, Ekamukhaliṅga, Gaja-Lakṣmī, Anantaśayana, Mahiṣāsuramardinī — for FORM_OF links to my `art:*` records. This is the iconography agent's domain.

## 6. Graph opportunities

- **Skanda timeline:** `art:huvishka-skanda-coins` → `art:aic-kushan-karttikeya` → `art:yaudheya-karttikeya-coins` → `ins:bilsad-kumaragupta` → `art:kumaragupta-kartikeya-coin` → `art:met-somaskanda`.
- **The Girnar rock as a palimpsest:** `site:girnar-junagadh` carries Aśoka, then Rudradāman (who remembers Candragupta Maurya's governor), then Skandagupta and the Vāmana verse.
- **Epic genealogies in charters:** Pallava (Droṇa line) vs Cōḻa (solar line) vs Kadamba (brahmin-to-warrior).
- **Indic sovereignty overseas, c. 400–1050:** Kutai yūpas → Tārumā footprints → Devānīka's new Kurukṣetra → Bhadreśvara at Mỹ Sơn → Canggal liṅga → Dinoyo Agastya → Sdok Kak Thom.
- **Provenance map of museum objects:** Mathurā → Chicago; Vidiśā → Cleveland; Tamil Nadu → New York; Pahari kingdoms → Cleveland and the Met.

## 7. Timeline contributions (system `material`)

- **Secure:**
  - Junagadh of Rudradāman, Śaka 72 ≈ 150.
  - Mathurā pilaster, GE 61 = 380.
  - Mandsaur (Naravarman), Kṛta 461 = 404/05.
  - Bilsad, GE 96 = 415/16.
  - Junagadh of Skandagupta, GE 136–138 = 455–58.
  - Canggal, Śaka 654 = 732.
  - Dinoyo/Kanjuruhan, Śaka 682 = 760.
  - Khajuraho Lakṣmaṇa, VS 1011 = 953/54.
  - Sdok Kak Thom, Śaka 974 = 1052/53.
  - Razmnāma copy 1598–99.
  - Mewar Rāmāyaṇa 1649–53.
  - Manaku's Gīta Govinda 1730.
  - ASI Ayodhyā excavation 2003.
- **Estimated:**
  - Allahabad c. 350–380; Bhitari c. 455–467; Tāḷagunda mid-5th c.
  - Kūram c. 670–695; Kasakudi 8th c.; Velurpalaiyam mid-9th c.; Anbil c. 961; Tiruvālaṅkāṭu c. 1018.
  - Kutai c. 400; Ciaruteun and Tugu 5th c.; Vat Luang Kau 5th c.; Mỹ Sơn (Bhadravarman) late 4th–5th c.
  - Coins c. 150–467.
  - Museum objects 2nd–14th c. by museum attribution.
- **Disputed:** Võ Cạnh (two views); Candragupta I coin issuer; Kauśāmbī rampart; Sungai Batu early dates.

## 8. Research gaps and recommended follow-up

1. Continue the upgrade with the editions not online here:
   - de Casparis 1956 (Śivagṛha);
   - IA III/X/XII and XIX (Bādāmi, Baroda plates, Mahākūṭa);
   - EI VIII (Kielhorn's Junagadh and Talagunda: page check);
   - EC V (Belur).
2. Museum holdings in India (National Museum, Government Museums at Mathurā, Udaipur and Chennai) still lack accession numbers; the national portal was unreachable.
3. The DHARMA Champa and Cambodia corpora hold hundreds more datable Hindu records. Candidates are Po Nagar (C. 38?), Prasat Phnom Rung (K. 384 not found under that number), the Yaśodharāśrama steles and Pre Rup (K. 806).
4. Kuṣāṇa coin specimens with readable reverses (ANS, BM) to firm up `material:121–136` and `art:huvishka-skanda-coins`.
5. Earliest Rāmāyaṇa/Gītā manuscripts: an NGMCP catalogue search is still needed.

## 9. Candidate discoveries

1. **A "new Kurukṣetra" on the Mekong.** In the 5th century King Devānīka founded a tīrtha near Vat Phu named Kurukṣetra. He compared himself to Yudhiṣṭhira and Arjuna and quoted epic-style tīrtha praise. This is among the earliest datable Mahābhārata receptions outside India.
   - Records: `ins:vat-luang-kau-devanika`, `material:r2-124…r2-134` (FOUND_AT, COMMISSIONED_BY and REFERS_TO edges).
   - Caveat: palaeographic date; the textual parallel needs a CE locator.
2. **Skanda had four names before he had one.** Huviṣka's coins (c. 150–190) separate Skanda, Kumāra, Viśākha and Mahāsena. By 415/16 a Gupta-period temple honours "Svāmi-Mahāsena, brahmaṇya-deva", and Kumāragupta (whose own name means Kumāra) issues Peacock coins.
   - Records: `art:huvishka-skanda-coins`, `ins:bilsad-kumaragupta`, `art:kumaragupta-kartikeya-coin` (`material:241`, now verified).
   - Caveat: coin legends are reference-checked; Bilsad is verified.
3. **Dynasties chose their epic ancestors differently.** The Pallavas descend from Droṇa's son Aśvatthāman, a brahmin-warrior line. The Cōḻas descend from Manu and Ikṣvāku of the solar line. The Kadambas tell of a brahmin who became a warrior after a quarrel at the Pallava court.
   - Records: `ins:kasakudi-plates`, `ins:velurpalaiyam-plates`, `ins:anbil-plates`, `ins:tiruvalangadu-plates`, `ins:talagunda-pillar`.
   - Caveat: the genealogy details for Kasakudi, Anbil and Tiruvālaṅkāṭu are reference-checked; Tāḷagunda and Velurpalaiyam are verified.
4. **One boulder, three empires, one reservoir.** The Girnar rock carries Aśoka's edicts, Rudradāman's Sanskrit praśasti, and Skandagupta's inscription. Rudradāman's text (c. 150) credits the Sudarśana lake to Candragupta Maurya's governor Puṣyagupta. Skandagupta's text (455–58) opens with Viṣṇu reclaiming Śrī from Bali.
   - Records: `site:girnar-junagadh`, `ins:junagadh-rudradaman`, `ins:junagadh-skandagupta`.
   - Caveat: the Mauryan attribution is the inscription's own memory.
5. **The buffalo-slaying Goddess is four centuries older than her text.** A Kuṣāṇa Mathurā terracotta Mahiṣāsuramardinī (AIC 1985.1108, 2nd c.) precedes the 608 CE inscriptional quotation of the Devī Māhātmya. The earliest catalogued manuscript (Schøyen MS 2174) is 11th-century.
   - Caveat: stylistic dating; the image shows an iconographic type, not the Devī Māhātmya.

---

## What I added

**Upgrades to round-1 files.**
- `data/assertions/material.json`: 67 assertions touched.
  - **58 raised to `verified-online`** (56 from `reference-checked`, 2 from `recall`):
    - Heliodorus: material:4, 5, 6, 10, 12, 13.
    - Heliodorus–MBh parallel: 19, 20 (Sircar p. 89 n.: Mbh vulg. 5.43.22).
    - Ghosuṇḍī: 25, 26, 28, 31.
    - Nāṇeghāṭ: 34, 35, 37, 38, 39, 41, 42.
    - Mora and Vasu: 45, 46, 47, 54, 57, 58.
    - Udayagiri 8: 163, 164.
    - Mehrauli: 168.
    - Eran boar: 176–180, 184.
    - Eran pillar: 185–188.
    - Kumāragupta coin: 240–243.
    - Gangdhar: 251, 252.
    - Aihole and Cālukya genealogy: 281–286, 331, 332, 336, 337, 340, 341.
    - Changu Narayan: 342, 343.
  - **Edition added, status deliberately unchanged** (5): 175, 182, 183, 254, 329. The edition does not by itself prove these edges (Hūṇa affiliation, "service", a polity as commissioner, the Meguti identification).
  - **Edition URL added to already-verified edges** (4): 181, 255, 338, 344.
- `data/entities/material.json`: edition references added to 14 records: ins:heliodorus, hathibada-ghosundi, nanaghat, mora-well, vasu-doorjamb, eran-toramana, eran-budhagupta, udayagiri-cave8, delhi-iron-pillar, gangdhar, mandasor-silk-weavers, aihole-ravikirti, changu-narayan-manadeva, and art:kumaragupta-kartikeya-coin. No ids changed and nothing was deleted.

**New inscriptions (27).**
- *India (16):*
  - Junagadh of Rudradāman; Allahabad praśasti; Bhitari; Junagadh of Skandagupta.
  - Mathurā pilaster (GE 61); Bilsad (GE 96); Mandsaur of Naravarman (Kṛta 461).
  - Tāḷagunda; Mahākūṭa pillar.
  - Kūram, Kasakudi and Velurpalaiyam plates; Anbil and Tiruvālaṅkāṭu plates; Uttaramērūr sabhā.
  - Khajuraho Lakṣmaṇa; Belur 1117.
- *Southeast Asia (11):*
  - Kutai yūpas; Ciaruteun; Tugu; Canggal; Dinoyo/Kanjuruhan.
  - Sdok Kak Thom (K. 235); Vat Luang Kau (K. 365).
  - Mỹ Sơn (C. 72); Po Nagar (Satyavarman); Võ Cạnh.

**Coins (10 types and specimens).**
- Gupta: Samudragupta Standard and Aśvamedha; Candragupta I–Kumāradevī; Kumāragupta Aśvamedha; Skandagupta King-and-Lakṣmī.
- Kuṣāṇa: Huviṣka's Skanda group; Vāsudeva I gold (Cleveland 1999.226).
- Tribal: Yaudheya Kārttikeya; Audumbara Dharaghoṣa/Viśvāmitra; Audumbara Mahādeva.

**Sculpture with accession numbers (34 verified on museum APIs, plus 6 reference-checked).**
- *Earliest forms:*
  - Kuṣāṇa: Mahiṣāsuramardinī (AIC 1985.1108); Kārttikeya (AIC 1985.1037); Gaṇeśa (AIC 2021.245).
  - Gupta: ekamukhaliṅga (Met 1987.142.323); terracotta Viṣṇu (Met 1987.142.293); Kṛṣṇa–Keśī (Met 1991.300).
  - Viṣṇu at Cleveland: Vidiśā head (1969.57), Gupta Viṣṇu (1976.75), Mathurā late Gupta (1963.580).
  - Gaṅgā (CMA 1966.119); Kashmir Kārttikeya (CMA 1974.75).
- *Goddess:* Durgā (AIC 2006.187, Met 91.21, V&A IS.77-1965 Hoysaḷa, AIC 1996.32 Angkor); Gaja-Lakṣmī (Met 1993.194); Pārvatī (Met 57.51.3).
- *South Indian bronzes:* Somāskanda (Met 1982.220.10; AIC 1966.334); Hanumān (Met 1982.220.9); Kāliyadamana (AIC 1995.62).
- *Viṣṇu and Śiva:* Varāha (AIC 1997.707); Pāla Viṣṇu (CMA 1964.453); Pāla ekamukhaliṅga (CMA 1973.73); Hoysaḷa Keśava (Met 18.41).
- *Southeast Asia:* Harihara (Met 1977.241); Cambodian Gaṇeśas (Met 1982.220.7, CMA 1987.147).
- *Added at the orchestrator's request (earliest examples):*
  - Verified on museum APIs: Kuṣāṇa "possibly Śiva" terracotta (CMA 1986.71); Mathurā Viṣṇu, 3rd–4th c. (V&A IM.75-1927); Mathurā Viṣṇu head, 5th c. (CMA 1942.498); Kuṣāṇa yakṣī (AIC 1995.260); Balarāma or Nāgarāja (Met 1991.83.2).
  - Parkham yakṣa / Maṇibhadra (Sircar bk. II no. 7, `verified-online`; GMM C.1 per Wikipedia).
  - Reference-checked: Bharhut Gaja-Lakṣmī (Indian Museum, Kolkata; Buddhist monument; Lakṣmī or Māyā); Kaṅkālī Ṭīlā Jain Sarasvatī (State Museum Lucknow J.24 as cited; year 54 with two era equations).
- *Without verified accession numbers:* Phnom Da Viṣṇu; Prasat Andet Harihara; Ahichchhatra Gaṅgā and Yamunā; Bharhut Gaja-Lakṣmī; Kaṅkālī Ṭīlā Sarasvatī.

**Illustrated manuscripts, folios and murals (12 manuscripts, 18 folio/mural records, 3 texts).**
- Mughal:
  - Razmnāma: Jaipur imperial copy and the dispersed 1598–99 copy (V&A IS.121-1955, CIRC.243-1922).
  - Persian Harivaṃśa c. 1590 (V&A IS.2-1970, IS.7-1970).
  - Persian Rāmāyaṇa copies: Akbar (Jaipur), Ḥamīda Bānū (Doha), Freer.
- Rajput and Pahari:
  - Mewar Rāmāyaṇa 1649–53, plus a later Mewar folio (Met 1974.148).
  - Manaku's 1730 Gīta Govinda (V&A IM.88-1930); Tehri Garhwal Gīta Govinda (Met 2017.736); Mewar Gīta Govinda (CMA 1990.41).
  - Shangri Rāmāyaṇa (CMA 1996.361, 2002.6, 2018.107, 2025.7; Met 1999.400); "Burnt" Rāmāyaṇa (CMA 2013.306); Kangra Rāmāyaṇa (Met 1976.15).
  - Large Basohli Bhāgavata (CMA 1960.184); early Rajput Bhāgavata (CMA 1960.53, AIC 1998.182).
- Mattancherry murals.
- Schøyen MS 2174 Devīmāhātmya.
- Translation texts: Razmnāma, Persian Harivaṃśa, Persian Rāmāyaṇa.

**Excavations and sites (23 sites, 5 claims).**
- Findspot and inscription sites: Girnar rock, Bhitari, Bilsad, Tāḷagunda, Uttaramērūr, Muara Kaman, Ciaruteun, Tugu, Gunung Wukir, Dinoyo, Sdok Kak Thom, Vat Luang Kau, Võ Cạnh.
- Excavations: Sonkh, Śṛṅgaverapura, Bhagwanpura, Ahichchhatra, Kauśāmbī, Bujang Valley, Oc Eo, Ayodhyā 2003, Bharhut, Kaṅkālī Ṭīlā.
- Claims: devarāja, Võ Cạnh earliest, Rāmāyaṇa-sites archaeology, Kauśāmbī śyenaciti, Ayodhyā structure.

**People and polities (50 persons, 8 polities).**
- *Rulers and officials:*
  - North India: Rudradāman I, Aśoka, Samudragupta, Hariṣeṇa, Skandagupta, Parṇadatta, Cakrapālita, Candragupta I, Kumāradevī, Naravarman.
  - Deccan and South: Mayūraśarman, Śāntivarman, Parameśvaravarman I, Sundara Cōḻa.
  - Kuṣāṇa: Huviṣka, Vāsudeva I.
  - Southeast Asia: Mūlavarman, Kuṇḍuṅga, Pūrṇavarman, Sañjaya (Mataram), Gajayāna, Udayādityavarman II, Jayavarman II, Devānīka, Bhadravarman I, Satyavarman.
  - Mughal and Rajput patrons: Akbar, Ḥamīda Bānū Begum, Jagat Singh I.
- *Religious figures:* Uditācārya, Śivakaivalya.
- *Poets and painters:* Kubja, Sahib Din, Manaku, Banwari Khurd, Kamal.
- *Epigraphists and archaeologists:* Hultzsch, Krishna Sastri, Gopinatha Rao, Vogel, Cœdès, Finot, Sircar, G. R. Sharma, J. P. Joshi, Härtel, Malleret, Quaritch Wales, K. N. Dikshit, B. R. Mani.
- *Polities:* Western Kṣatrapas, Kadambas, Kutai, Tārumānagara, Funan, Yaudheyas, Audumbaras, Pāla dynasty (`pol:pala`, with BUILT_DURING edges from the three Pāla-period museum objects).

**Institutions (18).** Indian Museum Kolkata; State Museum Lucknow; Met; Art Institute of Chicago; V&A; Government Museum Chennai; National Museum of Cambodia; Bangkok National Museum; National Museum of Vietnamese History; Museum of Islamic Art Doha; City Palace Museum Jaipur; Freer Gallery; Allahabad Museum; University of Allahabad; Museum für Asiatische Kunst Berlin; EFEO; DHARMA project; Schøyen Collection.

**Sources (35).** Epigraphic corpora and editions (Gnoli, Lüders, Vogel ×3, Allan ×2, Kielhorn ×3, SII I and III, Gopinatha Rao, Cœdès ×2, Finot, de Casparis 1941, Rice EC V), museum APIs (Met, AIC, V&A, Schøyen), excavation reports (ASI 2003, Lal 1993, Härtel, Joshi, Sharma, Malleret, Agrawala), and studies of painting (Losty, Seyller, Goswamy & Fischer, BL blog).
