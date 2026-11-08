# Temple & Sacred Geography — round-2 report (agent `temple`)

Files:
- `data/entities/temple-r2.json`: 215 entities.
- `data/assertions/temple-r2.json`: 655 assertions, `temple:r2-1` to `temple:r2-655`.
- `data/sources/temple-r2.json`: 41 sources.
- Upgrades to round-1 `data/assertions/temple.json` and `data/entities/temple.json` (listed in "What I added", part C).

Validation on 2026-11-08:
- `npm run validate -- --domain temple`: **0 errors, 4 warnings**.
- `npm run validate` on the whole dataset: **0 errors**.
- The 4 warnings are "temple without coordinates" for the three US temples and the Trinidad temple. The validator rejects longitudes west of 30° W, so these four carry their checked coordinates in `attributes.coordinates` instead of `location`.

Generator (scratch, not part of the dataset): `scratchpad/temple-r2/scripts/build.py` with region modules in `scripts/regions/*.py`.
- It drops any of my entities, sources and (s,p,o) edges already defined in another agent's file. In the final build this dropped nothing.
- Sources that regional-r2 had already defined (`src:sekar-1992`, `src:sarkar-1978`, `src:eisenlohr-2006`, `src:waghorne-2004`) are cited by their existing ids.

---

## 1. Executive findings

1. **The gap between a famous cult and the date of its building is even wider in round 2 than in round 1.**
   - Of the 164 new temples, most "ancient" pilgrimage centres stand in fabric of 1500 or later. Examples:
     - Pandharpur: mainly 17th c., although inscriptions record a shrine in 1189.
     - Kolhapur: a 634 CE claim set against Hemāḍpantī fabric of the 11th–13th c.
     - Eklingji: Rāimal's rebuilding of 1473–1509, against an 8th-c. legend.
     - Udupi, Sabarimala (rebuilt 1950), Nallur (1734), Kamakshi (1783), Ketheeswaram (1903 onward), Jogulamba (2005).
   - The securely dated fabrics are often modest regional monuments: Baijnath (1204), Itagi (1112), Brahmeśvara (c. 1058), Prasat Kravan (921), Bakong (881), Nyātāpola (1702) and the Bishnupur plaques (1643, 1655).
2. **The sacred identity often travels with the image, not the building.** Examples, each recorded with a reception or traditional date beside the fabric date:
   - Govindadeva: Vrindavan 1590, then Jaipur from 1719.
   - Śrīnāthjī: Braj, then Nathdwara in 1672.
   - Maṅgeśa: Portuguese Goa, then Priol in 1560.
   - Kāmākṣī: the image was in exile from 1565 to 1783.
   - Ḍhākeśvarī: the image went to Kolkata in 1947–50.
3. **Pilgrimage networks are lists laid over older temples.**
   - Eight of the nine Navagraha temples are Tēvāram Śiva temples, and only Sūryanār Kōvil (Kulottuṅga I) is a graha temple.
   - The Pañca Kedāra's Pāṇḍava legend is Garhwali and is not in the Mahābhārata. None of its five shrines has a dated fabric.
   - The Aṣṭavināyaka temples are 17th–18th-c. Marāṭhā buildings, and Morgaon is "not earlier than the 17th c." (Feldhaus).
   - The three new networks and the Sapta Purī are modelled as `concept` records with MEMBER_OF edges. There are 63 membership edges across 7 networks, and every one was checked against Wikipedia text (the temple article or the network's list article).
4. **Names and stories conflict with inscriptions, and the inscription is kept separately:**
   - Vijayālaya Cōḻīśvaram was built by a Muttaraiyar chief in the 7th year of the Pallava Nṛpatuṅga (c. 862), not by Vijayālaya Cōḻa.
   - Pandharpur's inscriptions (1189, 1237, 1273–77) contradict the Hoysaḷa foundation story.
   - Mitaoli's inscription of 1323 conflicts with an 11th-c. style.
   - Kiradu has three scholarly dates, recorded as three DateClaims: 12th c. (Ojha), 11th c. (Dhaky), c. 1020 (Michell).
5. **Sacred geography now has its rivers and cities.**
   - 10 rivers, 3 sacred mountains and the Sapta Purī are added, with Haridvāra, Kāñcī and Ujjayinī new and Ayodhyā, Mathurā, Kāśī and Dvārakā linked.
   - Rivers carry the temples on them: Oṃkāreśvara on the Narmadā; Srirangam and Jambukeśvara on the Kāverī; Śrīśailam on the Kṛṣṇā; Bhadrachalam on the Godāvarī.
   - The Ṛgveda's river hymn is cited as RV 10.75 and RV 10.75.5, from Jamison & Brereton.

## 2. Dataset summary

| Type | Count | Notes |
|---|---|---|
| temple | 164 | See the country breakdown below |
| place | 23 | 10 rivers; 3 mountains or hills; 3 cities; Amarnāth and Vaiṣṇo Devī as natural cave shrines; Haridwar, Har kī Pauṛī, Rishikesh, Amarkantak, Mahāmaham tank, Kbal Spean |
| polity | 24 | Dynasties needed for BUILT_DURING (see "What I added") |
| concept | 4 | Networks: Sapta Purī, Pañca Kedāra, Aṣṭavināyaka, Navagraha temples |

Temples and places by country:

| Country | Count |
|---|---|
| India | 141 |
| Nepal | 7 |
| Cambodia | 7 |
| Indonesia | 6 |
| Bangladesh | 4 |
| Sri Lanka | 4 |
| Pakistan | 3 |
| Thailand | 3 |
| United States | 3 |
| Malaysia | 2 |
| Myanmar, Vietnam, Singapore, United Kingdom, Mauritius, Trinidad and Tobago, United Arab Emirates | 1 each |

**Assertions (655).**
- By predicate: WORSHIPPED_AT 241, ASSOCIATED_WITH 141, BUILT_DURING 93, MEMBER_OF 63, DEPICTED_IN 51, LOCATED_AT 44, MENTIONED_IN 9, DERIVED_FROM 3, COMMISSIONED_BY 3, DOCUMENTED_BY 3, and one each of CONCERNS, IDENTIFIED_WITH, INSCRIBED_AT and REFERS_TO.
- By evidence class: class 6 = 360, class 4 = 135, class 5 = 128, class 3 = 26, class 7 = 3, class 1 = 3.
- By status: reference-checked 598, source-checked 29, recall 26, disputed 1, verified-online 1.
- By confidence: medium 559, low 96, high 0. Nothing is marked high while the main check was against a reference work.

**Entity status:** reference-checked 196, source-checked 15, recall 3, verified-online 1 (Rani ki Vav, against the ASI World Heritage page).

**Other content:**
- 334 DateClaims: material 245 (18 secure), reception 51, traditional 38. 36 temples carry a separate founding legend.
- 40 Commons images.
- 21 records carry a UNESCO attribute (inscribed or Tentative List).

**Most connected:** `deity:shiva` (79), `char:krishna` (26), `deity:vishnu` (23), `concept:shakti-pitha` (16), `deity:devi` (14), `concept:padal-petra-sthalam` (12), `concept:navagraha-temples` (10), `pol:maratha` (8), `temple:rani-ki-vav` (8), `temple:govind-dev-vrindavan` (8).

## 3. Evidence ledger

**Checked online**
- **Wikipedia raw wikitext** (`index.php?action=raw`) for about 200 articles: every new temple, river and city, the network list articles, and the 24 polity articles.
  - Each article was digested: `{{coord}}`, infobox fields, the lead, and sentences containing dates. Facts used were taken from these digests.
  - Where an article contradicted itself, both values are recorded: Kantajew 1722 vs 1704–52, Ulun Danu 1633 vs 1663, Bhīmakālī 1827 vs 1927, Jejuri "Ahilyābāī … 17th century".
  - Cited as `src:wikipedia` with the article URL. Status is **reference-checked**, per contract R2 §3.
- **Wikidata** P625, P18, P757 (World Heritage id) and P1371 (ASI or state monument number). Read through `Special:ItemByTitle` and `Special:EntityData`, because the query service and API were rate-limited (429).
  - Coordinates were accepted as `exact` only when the Wikipedia `{{coord}}` and Wikidata P625 agree within 1 km. Otherwise they are `approximate` or `region`, and the source used is named in `attributes.coordinateSource`.
  - 19 mismatches were resolved by hand: Baijnath, Bhīmakālī, Lakṣmī-Nārāyaṇa Chamba, Galtaji, Vaitāl Deuḷ, Sakshigopal and Itagi use Wikidata; Alangudi and Vijayālaya use Wikipedia.
  - Wikidata also supplied: Govindadeva, Vrindavan (Q97816101; ASI N-UP-A195), which has no English Wikipedia article; Koh Ker WHS 1667; Sambor Prei Kuk WHS 1532; Rani ki Vav WHS 922.
- **ASI World Heritage page** (`asi.nic.in/pages/World-Heritage/HQ`, re-fetched) confirms "Rani-ki-Vav … at Patan, Gujarat (2014)", "Champaner-Pavagadh Archaeological Park (2004)" and "Ellora Caves (1983)".
- **Wikimedia Commons**: the licence and author were read from the raw file-page wikitext of all 40 images, because the Commons API returned 429. The thumbnail URL was resolved through `Special:FilePath`.
  - Licences: CC BY-SA 3.0/4.0/2.0, CC BY 2.0/4.0, CC0, and PD-self/PD-user.
  - Rejected, with no licence template found or no resolvable file: Eklingji, Rām Rājā, Kantajew, Lakkundi, Tiruvarur, Avantipur, Paraśurāmeśvara, Prasat Kravan. The Kapaleeshwarar image showed a house, not the temple.

**Blocked:** whc.unesco.org (403); the Wikipedia and Commons APIs (429); the Wikidata query service (limited to 1 request per minute).

**Scholarly sources (cited, not opened).** These support statuses of `source-checked` or `recall`, never `verified-online`.
- Regional architecture and art:
  - Michell 1989 (Penguin Guide); Cousens 1926 (Kalyāṇī Cāḷukya); Barrett 1974 and Balasubrahmanyam 1971 (early Cōḻa); Donaldson 1985 and Panigrahi 1961 (Odisha); McCutchion 1972 (Bengal); Dehejia 1986 (yoginī temples); Kak 1933 (Kashmir); Goetz 1955 (Chamba).
  - Schastok 1985 (Śāmaḷājī); Kalia 1982 (Osian); Sivaramamurti 1985 (Lepakshi murals).
- Mughal-period Braj: Asher 1992, Case 1996, Entwistle 1987, Haberman 1994 and 2006.
- Southeast Asia: Kinney 2003 (East Java); Jacques & Lafond 2007 and Jacques & Freeman 1997 (Khmer); Freeman 1996 and Siribhadra & Moore 1992 (Thailand); Strachan 1989 (Bagan); Hardy, Cucarzi & Zolese 2009 (Champa); Gutschow 2011 and Slusser 1982 (Nepal).
- Cults and pilgrimage:
  - Erndl 1993 (Vaiṣṇo Devī, Jvālāmukhī); McDaniel 2004 (Tarapith); van der Veer 1988 (Hanumān Gaṛhī); Humes 1996 (Vindhyavāsinī).
  - Sontheimer 1989 and Feldhaus 1995, 2003 (Khaṇḍobā, rivers, Morgaon); Dhere 2011 (Pandharpur); Sharma 1981 (Udupi).
  - Sekar 1992 (Sabarimala); Obeyesekere 1978 and Pathmanathan 1978 (Kataragama, Jaffna); Eisenlohr 2006 (Ganga Talao); Waghorne 2004 and Williams 2001 (diaspora and BAPS).
  - Axelrod & Fuerch 1996 (Goan deities); Peabody 1991 and Ambalal 1987 (Nathdwara); Bhardwaj 1973 and Eck 2012 (sacred geography).
- Legal and textual: the Supreme Court Sabarimala judgment (28 September 2018); Sachau 1910 (Al-Bīrūnī).

## 4. Uncertainty log

Each item states what would settle it.

**Dates that are stylistic or come from the reference work only**
- Kolhapur 634 CE, Gokarna 4th c. (Kadamba), Kollur c. 800, Mahāgaṇapati Ranjangaon 9th–10th c., Chamundeshwari 12th c. All are unsupported claims in Wikipedia and are recorded as `disputed`. *Settles it:* ASI or state survey reports and the epigraphic records of each temple.
- Recall-only dates, flagged in each `basis`:
  - Vidyāśaṅkara (1338), Thousand Pillar (1163), Ananta Vāsudeva (1278), Kṛṣṇa Mandir Patan (1637) and Draksharama (Bhīma I).
  - Jvālāmukhī fabric, Tarapith (early 19th c.) and Jogulamba (2005).
  - *Settles it:* the EI, SII and ARIE editions, and Slusser 1982 for Patan.
- Undated fabric, recorded with wide disputed ranges rather than invented dates: the Pañca Kedāra shrines, Kanjanur, Tirunaḷḷāṟu, Tirunāgeśvaram, Chottanikkara, Thirunelli, Sakshigopal, Dakṣiṇkālī, Chandranath and Panchmukhi Hanumān (Karachi).

**Contested attributions**
- Baphuon: Udayādityavarman II vs Sūryavarman I.
- Mitaoli: 1323 inscription vs 11th-c. style.
- Rani ki Vav: 1063–83 vs c. 1032 (Commissariat).
- Bhedaghat: Yuvarāja II attribution.
- Vijayālaya: name vs inscription.

**Coordinates.** Several are approximate:
- Group or town centroids: Osian, Ambaji, Kalna, Vindhyachal, Ranjangaon, Bishnupur group, Ellora caves 14, 21 and 29 (group point), Sringeri (complex point), Bujang Valley.
- Varadavināyaka uses the location-map marker in the Aṣṭavināyaka article, because Wikidata's point is about 130 km off.
- Rivers carry a `region` representative point.

**Śakti pīṭha memberships** (16) follow Wikipedia's list and the temple articles. Several are marked low confidence because lists differ: Tarapith, Dhakeshwari, Śāradā Pīṭha, Draksharama, Kāmākṣī, Tiruvarur. *Settles it:* Sircar's tables in *The Śākta Pīṭhas*.

**Textual locators from recall:** VR (CE) 1.5 for Ayodhyā on the Sarayū (status recall); RV 4.30.18 for the Ṛgvedic Sarayu (in details only). RV 10.75 and 10.75.5 are cited as source-checked from Jamison & Brereton.

**Sensitive sites, recorded neutrally:**
- Kṛṣṇa Janmasthān: the destruction of the Keśavadeva temple in 1670 is placed in the reception system, and the ongoing litigation is noted without assessment.
- Sabarimala: the 2018 judgment and the 2019 referral to a larger bench.
- Seetha Amman: the record links to `claim:lanka-sri-lanka-identification`.

## 5. Cross-agent links

**Ids from other round-2 agents, used after a `find` check at build time:**
- iconography: `deity:ayyappa` (regional), `deity:tara-mahavidya`, `deity:tripurasundari`, `deity:shani`, `deity:ketu`, `deity:mangala`, `deity:brihaspati`, `deity:navagraha`, `deity:dakshinamurti`, `deity:somaskanda`, `deity:anantashayana`, `deity:trivikrama`, `deity:harihara`, `deity:chausath-yogini`, `deity:lakulisha`, `deity:chaturmukhalinga`, `deity:panchamukhalinga`, `deity:umamaheshvara`, `deity:bhairava`, `deity:panchamukha-hanuman`, `deity:govardhanadhara`, `deity:lakshmi-narayana`, `deity:mahishasuramardini`.
- vedic: `person:madhva`, `person:vallabha`, `person:vidyaranya`, `trad:dvaita`.
- regional:
  - Persons: `person:rupa-goswami`, `person:jiva-goswami`, `person:kanaka-dasa`, `person:bhadrachala-ramadasu`, `person:tyagaraja`, `person:arunagirinathar`, `person:swaminarayan`.
  - Traditions: `trad:baps`, `trad:kumbh-mela`, `trad:pandharpur-wari`, `trad:sabarimala-pilgrimage`, `trad:mysore-dasara`, `trad:sankirtana-manipur`, `trad:grand-bassin-pilgrimage`, `trad:thaipusam`, `trad:mauritian-hinduism`, `trad:indo-caribbean-hinduism`, `trad:malaysian-hinduism`, `trad:british-hindu-temple-movement`, `trad:american-hindu-temple-movement`.
- material: `ins:po-nagar-satyavarman` (INSCRIBED_AT Po Nagar), `ins:sdok-kak-thom` (REFERS_TO Phnom Bakheng, class 5), `site:bujang-valley` (my candi record is LOCATED_AT it), `pol:kadamba`.

**Ids from round 1:**
- `place:ayodhya`, `place:mathura`, `place:kashi`, `place:dvaraka` (MEMBER_OF Sapta Purī).
- `place:vindhya`, `place:chitrakuta` (not re-created), `place:kamarupa`, `place:prayaga`, `place:kanakhala`, `place:pandharpur`, `place:srivilliputhur`, `place:vrindavan`, `place:panchavati`, `place:hampi`, `place:kishkindha`, `place:pampa`.
- `site:phnom-da` (not re-created as a temple).

**Ids I wish existed:**
- Texts: `text:nilamata-purana`, `text:rajatarangini`, `text:nagarakretagama`, `text:prabandhacintamani`, `text:tiruppugazh`, `text:yalpana-vaipava-mala`, `text:krishnayana-triguna`.
- Inscriptions (material): `ins:baijnath-1204`, `ins:brahmeswara-1058`, `ins:itagi-1112`, `ins:hanamkonda-1163`, `ins:prasat-kravan-921`, `ins:bakong-881`, `ins:govindadeva-1590`, `ins:vijayalaya-choleeswaram-862`, `ins:pandharpur-1189`.
- Artifact: `art:phanom-rung-narai-lintel`, with `inst:art-institute-chicago`, for the 1988 restitution.
- Deities: `deity:kanyakumari`, `deity:mookambika`, `deity:khandoba`, `deity:jvala`, `deity:taleju`, `deity:yan-po-nagar`, `deity:kataragama`.

**Not created, and why:**
- Maihar Śāradā and Kāmadgiri: no usable article, coordinates or date.
- Shantadurga (Kavlem): the Wikipedia article is about the goddess, with no coordinates.
- Kanyākumārī Bhagavatī: the article is about the goddess, with no coordinates.
- Already present from round 1, and therefore not created: Trimbakeshwar, Bhimashankar, Ambarnath (1060), Pushkar Brahmā, Dakshineswar, Jambukeśvara, Varadarāja, Śrīkāḷahasti, Mukteśvara, Hirapur Yoginī and Yamunotri.

## 6. Graph opportunities

- **Image migrations as a map layer:**
  - Govindadeva: Vrindavan to Jaipur (DERIVED_FROM).
  - Śrīnāthjī: Govardhana to Nathdwara.
  - Goan deities: to Ponda.
  - Kāmākṣī: Tiruvarur, then Kanchipuram.
  - Ḍhākeśvarī: Dhaka to Kolkata.
- **Networks as overlays:**
  - Sapta Purī, with 7 cities across the subcontinent.
  - Aṣṭavināyaka: a closed loop around Pune that begins and ends at Morgaon.
  - Navagraha: 9 villages within about 60 km of Kumbakonam.
  - Pañca Kedāra: Garhwal.
- **Rivers as spines:** the temples LOCATED_AT each river, plus Kumbha sites (Haridwar, Ujjain, Nashik–Godāvarī, Prayāga).
- **Dynastic patronage chains:** Marāṭhā (8 edges); Khmer (Bakong 881, Phnom Bakheng, Prasat Kravan 921, Koh Ker, Baphuon, Kbal Spean); Mallabhūm (Bishnupur); Eastern Gaṅga (Simhachalam, Ananta Vāsudeva).
- **Diaspora timeline:** Singapore 1827, Kuala Lumpur 1873, Ganga Talao 1890s, Trinidad 1947–52, Pittsburgh and Flushing 1977, Neasden 1995, Delhi 2005, Robbinsville 2023, Abu Dhabi 2024.

## 7. Timeline contributions

**Material, secure (18).**
- 881 Bakong; 921 Prasat Kravan; c. 1058 Brahmeśvara; 1112 Itagi; 1163 Hanamkonda; 1189 Pandharpur shrine; 1204 Baijnath; 1369 Penataran.
- 1590 Govindadeva; 1643 Śyām Rāy; 1655 Joṛ Bāṅglā; 1702 Nyātāpola.
- 1977 Pittsburgh and Flushing; 1992–95 Neasden; 2005 Delhi Akshardham; 2015–23 Robbinsville; 2024 Abu Dhabi.

**Material, estimated (227).** These run from the Lenyadri vihāra (1st–3rd c.) and Sambor Prei Kuk (7th c.) to modern rebuildings.

**Reception (51).** Includes:
- Earliest attestations: Amarnāth in the Rājataraṅgiṇī (1148–50); Kataragama (Mahāvaṃsa; Aruṇakirinātar); Śāradā Pīṭha (Nīlamata; Al-Bīrūnī c. 1030); Haridwar (Xuanzang).
- Destructions: Keśavadeva 1670; Nallur 1624; Jogulamba 1390.
- Heritage events: Rani ki Vav (UNESCO 2014); Phanom Rung lintel returned 1988; Koh Ker (UNESCO 2023); Sambor Prei Kuk (UNESCO 2017); Baphuon anastylosis 1995–2011.

**Traditional (38).** No numeric dates. Examples: Pāṇḍava foundations of the Pañca Kedāra; Bappā Rāwal at Eklingji; Paraśurāma at Vaṭakkunnātha; Madhva at Udupi; Śaṅkara at Śṛṅgeri; Ballāla Sena at Dhaka; Vikramāditya at Har kī Pauṛī; Arjuna at Aranmula.

## 8. Research gaps and follow-up

- **Epigraphic editions** (EI, SII, ARIE, CII IV, Cœdès's *Inscriptions du Cambodge*) for the 26 class-3 edges, and for the recall dates in §4.
- **UNESCO pages** (blocked) to confirm WHS 922, 1532 and 1667 directly, and the Kathmandu Valley monument zones.
- **Validator range:** the validator should accept longitudes west of 30° W so that Americas temples can be mapped. That file belongs to the orchestrator.
- **Temples still missing:** Maihar, Kāmadgiri, Shantadurga, Kanyākumārī, Kumbakonam's other Divya Deśams, the Nava Tirupati and Nava Kailāsam, Kodungallur, Puri's Vimalā, Naina Devi, Chintpurni, Prambanan's neighbours (Sewu, Plaosan — Buddhist), Preah Ko and Lolei.
- **A Śakti pīṭha comparison table** (4, 18, 51 and 108 by text), now that more claimant temples exist. It needs the Pīṭhanirṇaya and the 18-pīṭha stotra as text ids.

## 9. Candidate discoveries

1. **The god moves; the building stays young.**
   - Govindadeva left Mān Siṃh's dated temple of 1590 in 1670 and has been worshipped in Jaipur since 1719.
   - Śrīnāthjī was installed at Nathdwara in 1672.
   - Maṅgeśa moved out of Portuguese Goa in 1560.
   - Kāmākṣī's image returned to a rebuilt temple in 1783.
   - Ids: `temple:govind-dev-vrindavan`, `temple:govind-dev-ji-jaipur`, `temple:shrinathji-nathdwara`, `temple:mangueshi`, `temple:kamakshi-kanchi`, `temple:dhakeshwari`.
   - Caveat: the movements come from temple and sectarian records summarised in reference works. Only Govindadeva's 1590 date rests on an inscription.
2. **The "planetary" circuit is a Śaiva landscape re-read.** Eight of the nine Navagraha temples are Tēvāram or Cōḻa Śiva temples whose graha shrine is secondary. Only Sūryanār Kōvil (Kulottuṅga I, c. 1070–1120) was built for a graha.
   - Ids: `concept:navagraha-temples`, `temple:suryanar-kovil`, plus the 8 Śiva temples and their `MEMBER_OF concept:padal-petra-sthalam` edges.
   - Caveat: when the nine were first grouped is undocumented in the sources used.
3. **The Pañca Kedāra legend is not in the epic it invokes.** The bull-form Śiva hiding from the Pāṇḍavas is a Garhwali tradition. None of the five shrines has a dated fabric.
   - Ids: `concept:panch-kedar`, `temple:tungnath`, `temple:rudranath`, `temple:madhyamaheshwar`, `temple:kalpeshwar`, `temple:kedarnath`.
   - Caveat: absence from the Mahābhārata critical edition is stated from the literature, not from a full-text search.
4. **The richest 11th-century Vaiṣṇava sculpture programme in Gujarat is in a stepwell.** Rani ki Vav's avatāras and Śeṣaśāyī Viṣṇu turn a water structure into an inverted temple. Its date depends on a chronicle written about 250 years later (1063 vs c. 1032).
   - Ids: `temple:rani-ki-vav` and its DEPICTED_IN and BUILT_DURING edges.
   - Caveat: the queen's patronage is known from Merutuṅga's Prabandhacintāmaṇi (1304), not from a foundation inscription.
5. **A temple's name can misattribute it.** Vijayālaya Cōḻīśvaram bears the Cōḻa founder's name, but its inscription credits a Muttaraiyar chief under the Pallava Nṛpatuṅga (c. 862).
   - Ids: `temple:vijayalaya-choleeswaram` (two DateClaims with views).
   - Caveat: the inscription is cited through Wikipedia and Barrett, not from its edition.
6. **The first immigrant-built Hindu temples in the USA were consecrated a month apart in 1977:** Pittsburgh on 8 June, Flushing on 4 July. Neasden (1995) was Europe's first carved-stone temple.
   - Ids: `temple:sv-temple-pittsburgh`, `temple:ganesh-temple-flushing`, `temple:baps-neasden`.
   - Caveat: "first" depends on definitions. Earlier Vedanta Society buildings, such as San Francisco's 1905 "Old Temple", are not counted.

---

## What I added

### A. New records: 215 entities, 655 assertions, 41 sources

**Temples (164)**

- **Northeast (7):** Umānanda; Hayagrīva Mādhava (Hajo); Ugratārā; Madan Kāmdev; Tripura Sundarī (Udaipur); Unakoti rock reliefs; Śrī Govindajī (Imphal).
- **Himalaya and Kashmir (13):**
  - Tuṅgnāth, Rudranāth, Madhyamaheśvar, Kalpeśvar.
  - Vaidyanātha (Baijnath), Hiḍimbā Devī (Manali), Bhīmakālī (Sarahan), Lakṣmī-Nārāyaṇa group (Chamba), Masrur.
  - Kṣīra Bhavānī, Avantisvāmin, Pandrethan, Śaṅkarācārya (Jyeṣṭheśvara), Jvālāmukhī.
- **Gujarat, Rajasthan and Goa (11):** Rani ki Vav; Ambājī; Kālikā Mātā (Pavagadh); Śāmaḷājī; Ekaliṅgajī; Śrīnāthjī (Nathdwara); Osian group (Harihara temples); Baroli; Kiradu; Galtājī; Maṅgeśa (Priol).
- **Maharashtra (15):**
  - Viṭṭhala-Rukmiṇī (Pandharpur); Khaṇḍobā (Jejuri); Mahālakṣmī (Kolhapur); Tuḷajā Bhavānī.
  - Ellora caves 29 (Dhūmar Leṇā), 21 (Rāmeśvara) and 14 (Rāvaṇ kī Khāī).
  - Aṣṭavināyaka: Morgaon, Siddhatek, Pali, Mahad, Theur, Lenyadri, Ozar, Ranjangaon.
- **Central India and Uttar Pradesh (14):**
  - Rām Rājā (Orchha); Kāla Bhairava (Ujjain); Bateshwar group; Causaṭh Yoginī at Mitaoli and at Bhedaghat.
  - Kṛṣṇa Janmasthān; Govindadeva (Vrindavan); Govind Dev Jī (Jaipur); Bāṅke Bihārī; Hanumān Gaṛhī; Vindhyavāsinī; Saṅkaṭ Mocan.
- **Odisha (7):** Paraśurāmeśvara; Vaitāl Deuḷ; Brahmeśvara; Rājarāṇī; Ananta Vāsudeva; Sākṣīgopāla; Virajā (Jajpur).
- **Bengal and Bangladesh (10):** Temples of Bishnupur; Rāsmañca; Joṛ Bāṅglā; Śyām Rāy; Tārāpīṭh; Nava Kailāśa (Kalna); Ḍhākeśvarī; Kāntajī; Candranāth; Puthia complex.
- **Karnataka (9):** Udupi Kṛṣṇa; Vidyāśaṅkara (Śṛṅgeri); Śāradāmbā and Śṛṅgeri maṭha; Mahābaleśvara (Gokarna); Mūkāmbikā (Kollur); Cāmuṇḍeśvarī; Kāśīviśveśvara (Lakkundi); Mahādeva (Itagi); Lakṣmī Devī (Doddagaddavalli).
- **Andhra Pradesh and Telangana (9):** Vīrabhadra (Lepakshi); Simhachalam; Ahobilam; Thousand Pillar (Hanamkonda); Bhīmeśvara (Draksharama); Bhadrachalam; Mahānandi; Kanaka Durgā; Jogulāmbā.
- **Tamil Nadu and Puducherry (23):**
  - Śārṅgapāṇi; Ādi Kumbheśvara; Tyāgarāja (Tiruvarur); Kāmākṣī; Āṇṭāḷ–Vaṭapatraśāyī; Kaḷḷaḻakar; Nellaiyappar; Sthāṇumālaya (Suchindram).
  - Early Cōḻa and allied: Koraṅganātha; Vijayālaya Cōḻīśvaram; Mūvarkōvil.
  - The 9 Navagraha temples: Sūryanār, Tiṅkaḷūr, Vaitīsvaran, Tiruveṇkāṭu, Āluṅkuṭi, Kañcaṉūr, Tirunaḷḷāṟu, Tirunāgeśvaram, Kīḻapperumpaḷḷam.
  - Kapālīśvara; Pārthasārathi (Triplicane).
- **Kerala (7):** Śabarimala; Vaṭakkunnātha; Ettumanoor; Aranmula Pārthasārathi; Āṭṭukāl; Cōṟṟāṉikkara; Tirunelli.
- **Nepal (7):** Budhānīlakaṇṭha; Guhyeśvarī; Dakṣiṇkālī; Manakāmanā; Nyātāpola; Kṛṣṇa Mandir (Patan); Taleju (Kathmandu).
- **Sri Lanka and Pakistan (6):** Nallūr Kantacuvāmi; Kataragama; Tirukkētīsvaram; Sītā Amman; Śāradā Pīṭha; Pañcamukhī Hanumān (Karachi).
- **Southeast Asia (19):**
  - Cambodia: Phnom Bakheng, Baphuon, Prasat Thom (Koh Ker), Sambor Prei Kuk, Prasat Kravan, Bakong.
  - Thailand: Phanom Rung, Phimai, Devasathan.
  - Myanmar: Nathlaung Kyaung.
  - Vietnam: Po Nagar.
  - Indonesia: Penataran, Gedong Songo, Sukuh, Tanah Lot, Ulun Danu Bratan, Tirta Empul.
  - Malaysia and Singapore: Bujang Valley candi, Sri Mahamariamman (Kuala Lumpur), Sri Mariamman (Singapore).
- **Diaspora (8):** Neasden; Akshardham Delhi; Akshardham Robbinsville; Sri Venkateswara (Pittsburgh); Gaṇeśa temple (Flushing); Ganga Talao; Temple in the Sea; BAPS Abu Dhabi.

**Places and sacred geography (23)**
- Rivers (10): Yamunā, Sarayū (Ghaghara), Narmadā, Godāvarī, Kāverī, Kṛṣṇā, Sindhu, Brahmaputra, Tuṅgabhadrā, Kṣiprā.
- Mountains (3): Aruṇācala, Govardhana, Śrīparvata.
- Sapta Purī cities (3): Haridvāra, Kāñcī, Ujjayinī.
- Tīrthas and cave shrines (7): Har kī Pauṛī, Ṛṣikeśa, Amarakaṇṭaka, Mahāmaham tank, Kbal Spean, Amarnāth cave, Vaiṣṇo Devī cave shrine.

**Networks (4 concepts):** Sapta Purī, Pañca Kedāra, Aṣṭavināyaka, Navagraha temples.

**Polities (24):**
- Ahom; Māṇikya (Tripura); Manipur; Utpala; Gurjara-Pratīhāra; Kacchapaghāta; Kalacuris of Tripurī; Bundelā (Orchha).
- Marāṭhā; Mysore (Woḍeyar); Kalyāṇī Cāḷukyas; Veṅgī Cāḷukyas; Mallabhūm; Mughal; Kachvāhā (Amber); Shah (Nepal); Jaffna kingdom.
- Chenla; Pagan; Majapahit; Irukkuvēḷ; Śailodbhava; Bhauma-Kara; Guhilas of Mewar.

**Memberships (63):** Śakti pīṭha 16, Pāṭal Peṟṟa 12, Navagraha 9, Aṣṭavināyaka 8, Sapta Purī 7, Divya Deśam 6, Pañca Kedāra 5.

**Images:** 40 new temples, with the licence checked on the Commons file page.

**New sources (41):** listed in `data/sources/temple-r2.json`.

### B. Cross-links to other agents' new records

About 55 of the 655 assertions come from `scripts/regions/links.py`. They link to iconography deities, regional traditions and persons, vedic ācāryas and material inscriptions and sites (see §5).

Seven further links were already asserted by the iconography agent (iconography:590–598): Tārā at Tarapith and Ugratārā; Tripurasundarī at Udaipur; Harihara at Osian; the yoginīs at Mitaoli and Bhedaghat; Bhairava at Ujjain. My build drops these duplicates and leaves the iconography agent's assertions in place.

### C. Upgrades to round-1 files

**`data/assertions/temple.json`: 107 assertions moved from reference-checked to source-checked.** Each gained a named scholarly or epigraphic source, and each rationale says the page was not cited.
- The upgraded ids are temple:6, 8–11, 15, 21, 22, 24, 38, 39, 41, 43–45, 53–56, 58, 59, 62, 64–66, 68, 69, 76, 77, 90, 93, 100, 101, 104–108, 112, 115, 120, 121, 123, 126–128, 140–145, 147–149, 162, 164, 166, 168, 169, 171–173, 179–181, 183–188, 190, 193, 195–198, 200–202, 213, 216–218, 233, 234, 249, 250, 252–254, 256, 257, 274–277, 286, 287, 292–294, 297, 298, 301, 302. The exact list is in `scratchpad/temple-r2/wk/upgrades.json`.
- Sources added include: Dehejia 1990, Sastri 1955, Younger 1995, Smith 1996, Harle 1994, Ramesan 1981, Hardy 1995 and 2007, Tartakov 1997, Dhavalikar 2003, Fritz & Michell 1991, Foekema 1996, Williams 1982, Desai 2000, Donaldson 1985, Panigrahi 1961, Eschmann et al. 1978, Urban 2010, Eck 1982, Thapar 2004, Stein 1900, Slusser 1982, Michaels 2008, de Casparis 1956, Jordaan 1996, Jacques & Freeman 1997, Cœdès 1968, Mannikka 1996, Guy 2014, Hardy, Cucarzi & Zolese 2009, Clothey 1978, Fuller 1984, Berkson 1983, Collins 1988 and Michell 1989.
- Epigraphic editions with locators:
  - Kielhorn, EI 6 (Aihole inscription) on temple:100.
  - Fleet, CII III (Udayagiri inscriptions of Candragupta II) on temple:164.
  - Kielhorn, EI 1 (Lakṣmaṇa temple inscription) on temple:183.
  - Indraji & Bühler 1885 (Changu Narayan pillar inscription) on temple:257.

**`data/assertions/temple.json`: 47 round-1 assertions moved from verified-online to reference-checked**, and the reason is stated in each rationale. They had been marked verified-online only because Wikipedia text confirmed a list membership.
- 46 are network memberships (temple:378–386, 391–396, 398, 410–439).
- One is a patron's MEMBER_OF edge (temple:335).
- Under the round-2 definitions, Wikipedia is a reference work.

**`data/entities/temple.json`: 2 entities moved from reference-checked to source-checked.** `temple:dieng-arjuna` (+ Dumarçay 1986) and `temple:jageshwar` (+ Michell 1989).

No ids were changed and no records were deleted. Backups of the pre-edit round-1 files are in `scratchpad/temple-r2/wk/`.
