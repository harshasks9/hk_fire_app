# Archaeology, Inscriptions & Material Evidence — research report (agent `material`)

Files: `data/entities/material.json` (165 entities), `data/assertions/material.json` (454 assertions), `data/sources/material.json` (48 new sources).
Validator: `npm run validate -- --domain material` → **0 errors · 0 warnings** (2026-11-08).

---

## 1. Executive findings

1. **The Vāsudeva–Saṅkarṣaṇa cult is materially attested over a very wide area before the Common Era, and the dates hold up.** The earliest items are:
   - the Agathocles drachms from Aï Khanoum, c. 190–180 BCE (`art:agathocles-coins`; the identification of the two deities is class 5);
   - the Heliodorus pillar at Besnagar, late 2nd c. BCE (`ins:heliodorus`), where Vāsudeva is *devadeva* and the Greek envoy calls himself *bhāgavata*;
   - the Hāthībāḍā–Ghosuṇḍī enclosure at Nagari, Rajasthan (`ins:hathibada-ghosundi`), with "Saṃkarṣaṇa-Vāsudeva" and the name *Nārāyaṇa-vāṭikā*;
   - the Nāṇeghāṭ invocation of the Sātavāhana queen Nāganikā, 1st c. BCE (`ins:nanaghat`).

   By the early 1st c. CE, Mathurā has image worship of the five Vṛṣṇi heroes (`ins:mora-well`, `art:mora-vrishni-torso`) and a shrine of Bhagavat Vāsudeva with a stone gateway and railing (`ins:vasu-doorjamb`, GMM 13.367). Every one of these records carries a `limits` statement: none of them establishes the epic Kṛṣṇa or the historicity of the narratives.
2. **The often-quoted "113 BCE" for the Heliodorus pillar is a convention.** The inscription dates itself only to Bhāgabhadra's 14th regnal year. Its absolute date depends on the reign of Antialkidas: c. 115–95 BCE (Bopearachchi) or c. 130–120 BCE (Senior). I recorded three `DateClaim`s, and marked the single year as *disputed*.
3. **Dated anchors for texts.** Five dated objects fix when texts or authors were already known:
   - Dadhimatī Mātā inscription, 608 CE: quotes the Devī Māhātmya (`ins:dadhimati-mata` → `REFERS_TO_TEXT text:devi-mahatmya`, verified against EI XI no. 31).
   - Aihole praśasti, 634/635 CE: names Kālidāsa and Bhāravi and dates itself both in Śaka 556 and as 3735 years after the Bhārata war.
   - Skandapurāṇa manuscript, 810/811 CE: NAK 2-229.
   - Spitzer manuscript, radiocarbon 80–230 CE: its Mahābhārata parvan list lacks the Anuśāsana and Virāṭa parvans.
   - BORI Rigveda collection: oldest dated manuscript 1464 CE (No. 5/1882-83), from the UNESCO nomination file.
4. **Early Śaiva evidence, with the disputes kept visible.** The proto-Śiva reading of the Mohenjo-daro seal is modelled as `claim:proto-shiva` (class 7), with SUPPORTS and CONTRADICTS edges. Gudimallam has three competing date views and `claim:gudimallam-early-date`. The Kuṣāṇa "Śiva" coins are kept apart from Śiva. Their deity is named ΟΗϷΟ (`deity:oesho`), an Iranian wind-god name; IDENTIFIED_WITH edges to both Śiva and Vāyu, plus `claim:oesho-shiva-identity`, record the dispute.
5. **Contested heritage claims are modelled neutrally, with evidence on both sides.** They are Dwarka, Rāma Setu, Hastinapur/PGW, the Hastinapur flood and Nicakṣu, Purana Qila as Indraprastha, and the identity of the Mamallapuram relief. Each claim CONCERNS its subjects and receives SUPPORTS and CONTRADICTS edges from the relevant evidence entity, with the reasoning given in `rationale`.

## 2. Dataset summary

| Type | Count | | Type | Count |
|---|---|---|---|---|
| person | 47 | | site | 15 |
| artifact | 26 | | claim | 12 |
| polity | 20 | | manuscript | 5 |
| institution | 18 | | deity | 4 |
| inscription | 17 | | text | 1 |

- **Totals:** 57 owned core ids (all present) and 108 new entities.
- **Images:** 25 key items have images: 22 from Wikimedia Commons with licences read from the Commons API, and 3 CC0 images from the Cleveland Museum of Art Open Access API.
- **Assertions (454):** the most common predicates are DEPICTED_IN 67, CONCERNS 57, REFERS_TO 56, DOCUMENTED_BY 52, BUILT_DURING 31, MEMBER_OF 25, INTERPRETED_AS 20, COMMISSIONED_BY 20, HELD_AT 18, SUPPORTS 16 and CONTRADICTS 11.
- **Evidence classes:** class 4: 160 · class 5: 120 · class 3: 119 · class 7: 33 · class 2: 14 · class 6: 4 · class 1: 4.
- **Assertion status:** verified-online 369 · source-checked 62 · disputed 18 · recall 5.
- **Most connected entities:** `deity:shiva` (20), `art:deogarh-plinth-panels` (18), `pol:gupta` (13), `ins:heliodorus` (12), `deity:vasudeva` (12), `claim:megasthenes-herakles` (12), `inst:asi`, `ins:nanaghat`, `art:pashupati-seal` and `art:mamallapuram-great-relief` (11 each).
- **Retired assertion ids (deliberately unused, so the others keep their numbers):**
  - `material:82` and `material:84` duplicated the vedic agent's GRETIL-verified Pāṇini 4.3.98 and Mahābhāṣya edges, which confirmed my locators.
  - `material:335` and `material:372` duplicated epic:101 and epic:102.

## 3. Evidence ledger

**Checked online:**
- Wikipedia pages, used as pointers to editions: Heliodorus pillar, Hathibada Ghosundi Inscriptions, Naneghat, Mora Well Inscription, Vasu Doorjamb Inscription, Agathocles of Bactria, Ai-Khanoum, Pashupati seal, Gudimallam Lingam, Oesho, Vima Kadphises, Kanishka, Megasthenes, Megasthenes' Herakles, Krishna, Udayagiri Caves, Eran, Eran boar inscription of Toramana, Dashavatara Temple (Deogarh), Nachna, Kumaragupta I, Gangadhar inscription, Badami caves, Mangalesha, Elephanta, Mahishasuramardini Mandapa, Descent of the Ganges, Kailasa temple, Aihole inscription, Changu Narayan, Manadeva, Shivagrha inscription, Spitzer Manuscript, Skanda Purana, Devi Mahatmya, Dadhimati Mata, Kizil Caves, Mohenjo-daro, Besnagar, Hastinapur, Purana Qila, PGW, Adam's Bridge, Dwarka, S. R. Rao, Iron pillar of Delhi, Mandsaur, Phnom Da, Antialcidas, Toramana.
- **Primary and authoritative pages:**
  - UNESCO Memory of the World nomination PDF for the Rigveda, read in full with pdftotext: 30 MSS; 1 birch bark in Śāradā; oldest dated No. 5/1882-83 = 1464 AD; Max Müller used 5/1875-76. The register page gives 2007.
  - Dharmalekha edition of Udayagiri Cave 6 (year 82, Āṣāḍha śukla 11; Fleet CII III item 3).
  - Siddham record for Gangdhar.
  - Epigraphia Indica XI no. 31 (Pandit Ram Karna) scan for Dadhimatī.
  - Fordham sourcebook (Robson) for Arrian, *Indica* ch. 8.
  - Cleveland Museum of Art Open Access API for 1930.331 (Naṭarāja), 1977.62 (Candragupta II archer coin), 1973.106 (Phnom Da Kṛṣṇa Govardhana) and 1999.225.
  - Rijksmuseum page for AK-MAK-187.
  - Claremont CPDR and Himal for the Sivapuram Naṭarāja.
- **Images:** every image licence was read from the Commons `imageinfo/extmetadata` API through WebFetch; direct curl was rate-limited by Wikimedia. Image URLs were then tested to return image/jpeg, or HTTP 429 from rate-limiting on upload.wikimedia.org originals.

**Named scholarly sources (source-checked or recall):** Sircar 1965; Salomon 1998; Fleet 1888; Lüders/Janert 1961; Quintanilla 2007; Williams 1982; Harle 1994; Srinivasan 1975, 1979, 1997; Marshall 1931; Mackay 1938; Sullivan 1964; Hiltebeitel 1978; Rosenfield 1967; Sims-Williams & Cribb 1996; Jongeward & Cribb 2015; Bopearachchi 1991; Vats 1952; Cunningham 1854, 1880; Franco 2004; Schlingloff 1969; Willis 2009; Gaur et al. 2004; Rao 1999; Lal 1955, 1981; Kaimal 1994; Collins 1988; Dhavalikar 2003; de Casparis 1956; Kielhorn EI VI.

Bibliographic details supplied from recall are flagged in each source's `notes`: Audouin & Bernard 1974, Brockington 2010, Lal 1981, and the Bumper [1991] 1 WLR 1362 citation.

## 4. Uncertainty log

| Item | Problem | What would settle it |
|---|---|---|
| `ins:heliodorus` date | depends on Antialkidas's reign (115–95 vs 130–120 BCE); Cunningham's first notice given as 1874–75 *or* 1877 | Indo-Greek numismatic chronology; Cunningham's ASR vol. X text |
| `art:agathocles-coins` repository | present whereabouts of the six 1970 drachms unknown (Aï Khanoum and the Kabul museum were looted) | DAFA / National Museum of Afghanistan inventory |
| `ins:mora-well` five heroes | names are supplied from the Vāyu Purāṇa list, not the inscription | none possible from the stone; keep as class 5 |
| `claim:proto-shiva` | undeciphered script | a decipherment or bilingual |
| `art:gudimallam-linga` date | 3rd c. BCE – 4th c. CE | publication of the 1973–74 stratigraphy; scientific dating |
| `deity:oesho` | Śiva vs Vāyu | consensus in Bactrian studies |
| `ins:changu-narayan-manadeva` | Saṃvat 386 = 464 or 495/96 CE; a Saṃvat 381 fragment may be older, so "earliest dated in Nepal" is not secure | Licchavi era studies |
| `ins:badami-cave3` | language given as Kannada on Wikipedia, Sanskrit in Kannada script in most editions | Fleet's edition (Indian Antiquary) |
| `ins:eran-budhagupta` donors | Mātṛviṣṇu/Dhanyaviṣṇu taken from Fleet from recall (`material:188` is `recall`) | Fleet CII III text |
| `art:sivapuram-nataraja` | returned 1986 or 1987; Sivapuram or Kapaleeswarar temple, Chennai | Tamil Nadu HR&CE / Idol Wing records |
| `art:pathur-nataraja` | present custodian and art-historical date not verified | judgment text; TN records |
| `art:nachna-ramayana-panels`, `art:deogarh-plinth-panels`, `art:govardhanadhara-bkb`, `art:pashupati-seal` | in situ / museum location and accession numbers not verified (National Museum and Bharat Kala Bhavan pages not reached) | museum catalogues |
| `claim:hastinapura-flood-nichakshu` | Purāṇic locator only coarse (ViP book 4); the 2021 Ulta-Kheda report is known only via Wikipedia | Purana agent's ViP locator; Garnayak 2022 report |
| Oldest Rāmāyaṇa / Mahābhārata / Bhagavad Gītā manuscripts | **not recorded**: the "1020 CE Nepalese Rāmāyaṇa" could not be verified; the Devī Māhātmya oldest manuscript is "11th c., Nepal, Bhujimol" (Wikipedia) without a repository | NGMCP catalogue; Cambridge UL Sanskrit catalogue |
| Kuṣāṇa Mathurā liṅgas | not added (no accession verified) | Government Museum Mathurā catalogue |
| Spitzer and the Rāmāyaṇa | whether the manuscript also mentions the Rāmāyaṇa is not confirmed | Franco 2004 |

## 5. Cross-agent links

- **Ids referenced from other domains:**
  - epic: `char:krishna`, `char:balarama`, `char:arjuna`, `char:rama`, `char:sita`, `char:ravana`, `char:hanuman`, `lin:yadava`, `lin:pandavas`, `narr:*` and `place:*`.
  - vedic: `text:rigveda`, `text:chandogya-upanishad`, `char:krishna-devakiputra`, `char:ghora-angirasa`, `text:ashtadhyayi`, `person:sayana`.
  - purana: `deity:*`, `narr:gajendra-moksha`, `narr:mahishasura-slaying`, `narr:descent-of-ganga`, `text:devi-mahatmya`, `text:vishnu-purana`, `trad:*`, and `text:skandapurana-early` (the target of `ms:skandapurana-810 WITNESS_OF`).
  - temple: `temple:*`, `place:adams-bridge`, `deity:nataraja`.
- **Shared ids I created:** `person:kalidasa`, `person:bharavi` (anchored by the Aihole inscription), `deity:matrikas` (Gangdhar), `text:megasthenes-indica`, `pol:maurya` (missing from the core registry), `person:chandragupta-maurya`. Please merge or keep.
- **Collisions to resolve:**
  - temple.json duplicates `person:narasimhavarman-i`, `person:mangalesha` and `person:krishna-i-rashtrakuta`. These are errors in temple.json. The brief assigns persons and polities to the material agent, so I kept mine; the temple agent should drop its copies and keep its edges.
  - Several temple, purana and epic assertions repeat my triples. These are warnings in their files; my versions carry class-3/4 evidence and verified URLs.
  - I removed my `src:sankalia-1973` and `src:raychaudhuri-1920` because epic.json defines the same works.
- **Ids I wish existed:** `char:bhagiratha` and `char:atri` exist (purana/vedic); `text:kiratarjuniya` (Bhāravi) does not. Also wanted: a Mathurā-region place for Mora and Katra; a Delhi or Indraprastha *modern* place; `deity:ardochsho`, the Kuṣāṇa goddess often treated as the prototype of the Gupta Śrī coin type.

## 6. Graph opportunities

- **"What existed by century X":** a timeline lane of the class-3 and class-4 Vāsudeva nodes (190 BCE → 15 CE), the textual mentions (Pāṇini 4.3.98, Mahābhāṣya), and the IDENTIFIED_WITH bridge to `char:krishna`.
- **Claim boards:** each `claim:*` node with its green SUPPORTS and red CONTRADICTS evidence: proto-Śiva, Dwarka, Rāma Setu, PGW–Mahābhārata, Megasthenes' Herakles, Oesho = Śiva, the Mamallapuram relief.
- **Eran family across regime change:** Budhagupta (Gupta, 484/85) → Toramāṇa (Hūṇa, c. 510) → the same Vaiṣṇava donors.
- **Terminus-ante-quem web:** dated inscriptions and manuscripts → texts and authors (DM 608, Kālidāsa/Bhāravi 634, Skandapurāṇa 810, MBh parvan list 2nd–3rd c.).
- **Provenance map:** findspot → repository (Aï Khanoum → ?, Kizil → Berlin/London, Mohenjo-daro → New Delhi, Phnom Da → Cleveland, Prambanan → Jakarta, Tamil Nadu → Cleveland/Amsterdam/Pasadena → back).

## 7. Timeline contributions (system `material` unless noted)

- **Secure (dated in an era or colophon):**
  - Udayagiri Cave 6, GE 82 = 401/402
  - Gangdhar, 423/424
  - Mandasor, 436/437 and 472/473
  - Eran Budhagupta pillar, 484/485
  - Bādāmi Cave 3, 578
  - Dadhimatī, 608
  - Aihole, 634/635
  - Skandapurāṇa MS, 810/811
  - Śivagṛha, 856
  - Rigveda MS 5/1882-83, 1464
- **Estimated:**
  - Pashupati seal, c. 2350–2000 BCE
  - Mohenjo-daro, c. 2500–1700 BCE
  - Hastinapur PGW, c. 1100–800 BCE (Lal) or 1500–1000 BCE (Garnayak)
  - Aï Khanoum, c. 300–145 BCE
  - Agathocles coins, c. 190–180 BCE
  - Heliodorus, 3 views
  - Hāthībāḍā–Ghosuṇḍī, 2nd–1st c. BCE
  - Nāṇeghāṭ, 3 views
  - Gudimallam, 3 views
  - Mora and Vasu, c. 15 CE
  - Wima Kadphises, 3 views
  - Kuṣāṇa Oesho coins, c. 127–230
  - Spitzer, radiocarbon 80–230 and palaeography 200–230
  - Udayagiri Varāha, 401–415
  - Iron pillar, c. 375–415
  - Deogarh, c. 425–525
  - Nachna, 5th/6th c.
  - Eran Varāha, c. 510–513
  - Phnom Da, c. 600
  - Elephanta, c. 525–575
  - Bādāmi Naṭarāja, later 6th c.
  - Mamallapuram, 7th c.
  - Ellora Rāvaṇānugraha, later 8th c. (or 10th c., Goetz)
  - Cōḻa bronzes, 10th–12th c.
- **Reigns:** 20 polities and about 25 rulers (`event: "reign"` / `"rule"`).
- **Traditional:** Aihole's Bhārata-war epoch ≈ 3102/3101 BCE, as the inscription reckons it.

## 8. Research gaps and recommended follow-up

1. Fetch museum catalogues the tools could not reach (National Museum New Delhi, Bharat Kala Bhavan, Government Museum Mathurā, the Met) to add accession numbers for the Deogarh panels, the Paśupati seal and the Govardhana image, and to add a Met Naṭarāja.
2. Verify the oldest dated Rāmāyaṇa, Mahābhārata and Bhagavad Gītā manuscripts through the NGMCP and Cambridge catalogues before adding them.
3. Add Kuṣāṇa-period Mathurā liṅgas, the Bhita/Mathurā Ekamukha liṅgas, and the Chilas "Rāma-Kṛṣṇa" petroglyph if a primary report (Fussman) can be checked.
4. Check Fleet CII III item numbers for Gangdhar, Mandasor, Eran and Meharauli.
5. Add the Rāmāyaṇa reliefs of Prambanan and the Śivagṛha–Prambanan link at panel level, coordinating with the temple agent.

## 9. Candidate discoveries

1. **Vāsudeva–Saṅkarṣaṇa worship spanned Bactria to the western Deccan within about a century, under four different kinds of ruler.** The evidence: Greco-Bactrian coins (c. 190–180 BCE), an Indo-Greek envoy at Vidiśā (late 2nd c. BCE), a Rajasthani king with an aśvamedha (2nd–1st c. BCE), and a Sātavāhana queen (1st c. BCE).
   - Entities: `art:agathocles-coins`, `ins:heliodorus`, `ins:hathibada-ghosundi`, `ins:nanaghat`, `deity:vasudeva`, `deity:sankarshana`.
   - Assertions: `material:60`, `material:63`, `material:64`, `material:1`, `material:11`, `material:22`, `material:23`, `material:32`, `material:33`.
   - Caveat: the coin identifications are class 5, and none of this dates the Kṛṣṇa narratives.
2. **One inscription dates two poets and shows that the Kali-yuga epoch was already in use.** The Aihole praśasti (634/635 CE) names Kālidāsa and Bhāravi, which is the firm terminus ante quem for both. Its dating formula, 3735 years after the Bhārata war, shows that the c. 3102 BCE epoch was in use in 7th-century Karnataka.
   - Entities: `ins:aihole-ravikirti`, `person:kalidasa`, `person:bharavi`.
   - Assertions: `material:333`, `material:334`; the purana agent's `purana:623` links the inscription to its `claim:kali-epoch-3102`.
   - Caveat: the formula is a traditional reckoning, not evidence for the war's date.
3. **A verse of the Devī Māhātmya was quoted on stone in 608 CE.** The Dadhimatī Mātā inscription (Gupta year 289) gives a secure terminus ante quem for the text. Two centuries earlier, the Gangdhar inscription (423/424 CE) already records a "terrifying abode of the divine Mothers" built beside a Viṣṇu temple.
   - Entities: `ins:dadhimati-mata`, `ins:gangdhar`, `deity:matrikas`.
   - Assertions: `material:267`, `material:250`, `material:251`.
   - Caveat: the quotation shows only that one verse existed by 608 CE, not the whole text.
4. **The Kuṣāṇa "Śiva" has an Iranian name.** The deity on the coins of Kaniṣka I and his successors is labelled ΟΗϷΟ (Oesho, Bactrian for Vāyu), even though it carries Śaiva attributes. The graph keeps `deity:oesho` separate, with IDENTIFIED_WITH edges to both readings.
   - Entities: `deity:oesho`, `art:kushan-oesho-coins`, `art:wima-kadphises-coin`, `claim:oesho-shiva-identity`.
   - Assertions: `material:133`, `material:136`, `material:137`, `material:138`, `material:139`.
   - Caveat: this is a live scholarly dispute.
5. **One Vaiṣṇava family at Eran kept its cult across a change of overlord.** It dedicated a Garuḍa pillar under the Gupta Budhagupta (484/85 CE) and then the colossal Varāha under the Hūṇa Toramāṇa (c. 510).
   - Entities: `ins:eran-budhagupta`, `ins:eran-toramana`, `art:eran-varaha`, `person:dhanyavishnu`.
   - Assertions: `material:179`, `material:180`, `material:183`, `material:187`, `material:188`.
   - Caveat: the family link for the Budhagupta pillar rests on Fleet, cited from recall (`material:188`, status `recall`).
6. **The Mahābhārata's parvan list circulated in a Buddhist anthology in the Tarim Basin by c. 130 CE (radiocarbon), and it lacks two parvans.**
   - Entity: `ms:spitzer`.
   - Assertions: `material:373`–`378` (the REFERS_TO_TEXT edge is the epic agent's `epic:101`).
   - Caveat: the gaps may reflect the list's purpose rather than the epic's contents.
