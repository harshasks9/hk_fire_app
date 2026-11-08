# Temple & Sacred Geography — research report (agent `temple`)

Files: `data/entities/temple.json` (168 entities), `data/assertions/temple.json` (439 assertions, `temple:1`–`temple:439`), `data/sources/temple.json` (44 sources).
Validation: `npm run validate` on the whole dataset shows **0 errors and 0 warnings in temple files** (2026-11-08). The 2 errors that remain are in `data/sources/regional.json`.
Generator (scratch, not part of the dataset): `scratchpad/temple-agent/scripts/build.py`. It reads the other agents' files when it runs. It drops any of my entities, sources and (s,p,o) edges that already exist in another agent's file, so that nothing is defined twice.

---

## 1. Executive findings

1. **The founding story and the date of the building usually disagree, and the gap is often more than a thousand years.** Each of the 103 temples carries at least one `material` DateClaim with a `basis`. 45 carry a separate `traditional` founding legend.
   - Many of the most "ancient" pilgrimage temples stand in fabric from the 18th–20th centuries: Somanātha (1951), Kāśī Viśvanātha (1780), Tryambakeśvara (1755–86), Mahākāleśvara (18th c.), Kōṇēsvaram (1952), Kālīghāṭ (1809), Badrīnātha (after 1803).
   - Many of the securely dated early fabrics are modest or ruined: Udayagiri Cave 6 (401/402), Changu Narayan pillar (464), Bādāmi Cave 3 (578), Meguti (634/5).
2. **Of the 15 temples that claim a jyotirliṅga, 9 have their main standing fabric dated after 1700.** Four of the twelve list positions have rival claimant temples: Vaidyanātha, Nāgeśa, Bhīmaśaṅkara and Oṃkāra/Amaleśvara. These are recorded as `disputed` memberships and in `claim:jyotirlinga-site-identifications`.
3. **Pilgrimage networks are recorded as edges.** There are 91 `MEMBER_OF` edges from temples to 8 networks: jyotirliṅga, Śakti Pīṭha, Divya Deśam, Pāṭal Peṟṟa Talam, Char Dham, Chota Char Dham, Pañca Bhūta and Āṟupaṭai Vīṭu. 85 of them were confirmed against the temple's Wikipedia text by keyword. Six are `disputed` or `recall`.
4. **Contested dates are kept as competing DateClaims, not merged:**
   - Muṇḍeśvarī: 108 CE (ASI plaque) vs 570–636 CE (palaeography) vs a possible 16th–17th-c. shrine. See `claim:mundeshwari-108-ce`.
   - Lāḍ Khān: 5th c. vs late 7th–early 8th c.
   - Somanathapura: 1258 vs 1268.
   - Vaikuṇṭha Perumāḷ: c. 690 vs c. 770.
   - Gudimallam liṅga: 2nd c. BCE vs early centuries CE.
   - Pañca Rathas: Narasiṃhavarman I vs Rājasiṃha.

## 2. Dataset summary

| Type | Count | Notes |
|---|---|---|
| temple | 103 | 40 owned core ids (38 temples incl. Gudimallam) + 65 new; India 86, Nepal 4, Indonesia 3, Cambodia 3, Sri Lanka 2, Pakistan 2, Laos, Vietnam, Malaysia 1 each |
| person | 32 | patrons (e.g. `person:rajaraja-i`, `person:ahilyabai-holkar`, `person:lokamahadevi`, `person:chilarai`) |
| polity | 15 | new dynasties not in the registry (`pol:hoysala`, `pol:kakatiya`, `pol:pandya`, `pol:koch`, `pol:chaulukya`, `pol:paramara`, `pol:karkota`, `pol:somavamshi`, `pol:holkar-indore` …) |
| deity | 6 | owned `deity:nataraja`, `deity:jagannatha`, `deity:venkateshvara`; new `deity:minakshi`, `deity:ranganatha`, `deity:yamuna` |
| concept | 6 | pilgrimage networks (`subtype: "pilgrimage network"`) |
| claim | 3 | `claim:jyotirlinga-site-identifications`, `claim:mundeshwari-108-ce`, `claim:jagannatha-tribal-origin` |
| place | 3 | owned `place:hampi`, `place:adams-bridge`, `place:rameswaram-island` |

- **Assertions (439):** WORSHIPPED_AT 111, MEMBER_OF 91, ASSOCIATED_WITH 58, BUILT_DURING 56, COMMISSIONED_BY 46, DEPICTED_IN 36, CONCERNS 10, LOCATED_AT 7, and others.
- **Evidence class:** class 6: 190, class 5: 84, class 3: 80, class 4: 80, class 1: 5.
- **Status:** verified-online 314, recall 80, source-checked 36, disputed 9.
- **Other content:** 30 temples have a UNESCO attribute. 35 temples have a Commons image. There are 254 DateClaims: material 205 (38 secure), traditional 45, reception 4.
- **Most connected entities:** `deity:shiva` (55), `deity:vishnu` (24), `concept:jyotirlinga` (19), `concept:padal-petra-sthalam` (16), `pol:chola` (12), `char:rama` (12), `concept:shakti-pitha` (11), `concept:divya-desam` (11), `temple:prambanan` (10), `concept:arupadai-veedu` (10).

## 3. Evidence ledger

**Checked online**
- **Wikipedia raw wikitext** (`index.php?action=raw`) was fetched for every temple article (106 pages). Coordinates were parsed from `{{coord}}`. Infobox fields were read for creator, completed date, UNESCO number and date, and ASI MANI number. Key sentences on dates and patrons were grep-checked. These are cited as `src:wikipedia` with the article URL.
  - The Wikipedia action API returned HTTP 429 for most of the session, so the REST and raw endpoints were used instead.
- **Wikidata Query Service (P625)** supplied coordinates where Wikipedia had none or used only the group's position: Hazāra Rāma (Q68286065), Vijaya Viṭṭhala (Q68287239), Virūpākṣa and Pāpanātha at Pattadakal (Q97440564, Q97440571), Mīnākṣī (Q1424358), Batu Caves (Q687629), Candi Arjuna (Q11157349) and Ambarnath (Q7499202).
- **Wikimedia Commons API** (`imageinfo|extmetadata`) checked the licence of all 35 images: CC BY, CC BY-SA or PD. The Kailāsa image was skipped because it has no artist credit and a mislabelled filename.
- **ASI World Heritage portal** (`asi.nic.in/pages/World-Heritage/HQ`) confirms the WHS list numbers 239, 240, 241, 243, 244, 246, 249, 250, 1570 and 1670.
- **WebSearch** cross-checked the Lakṣmaṇa inscription (VS 1011 = 953/954) and the Somanathapura 1258/1268 problem.

**Blocked:** whc.unesco.org and sacred-texts.com (Cloudflare 403), srjbtkshetra.org (405) and shreejagannatha.in (connection reset). UNESCO numbers 1224 (Preah Vihear), 481 (Vat Phou) and 949 (Mỹ Sơn) are therefore from recall and are flagged in `limits`.

**Scholarly sources (cited, not opened)**
- Architecture: Michell 1977/2000, Harle 1994, Hardy 1995/2007, Williams 1982 (Gupta).
- Regions: Dehejia 1990 and Sastri 1955 (Cōḻa); Srinivasan 1964 (Pallava); Fritz & Michell 1991 and Dallapiccola et al. 1992 (Hampi); Foekema 1996 (Hoysaḷa); Tartakov 1997 (Aihole); Desai 2000 (Khajuraho); Donaldson 1985 (Odisha).
- Cults and temples: Eschmann/Kulke/Tripathi 1978 (Jagannātha); Urban 2010 (Kāmākhyā); Younger 1995 and Smith 1996 (Chidambaram, Naṭarāja); Fuller 1984 (Madurai); Clothey 1978 (Murukaṉ); Ramesan 1981 (Tirumala); Thapar 2004 (Somanātha); Eck 1982/2012; Sircar 1973 (pīṭhas).
- Nepal and Southeast Asia: Slusser 1982 and Michaels 2008 (Nepal); de Casparis 1956 and Jordaan 1996 (Prambanan); Jacques & Freeman 1997, Cœdès 1968 and Mannikka 1996 (Khmer).
- Inscriptions: Kielhorn 1892 (EI 1), Fleet 1888 (CII III), Hultzsch SII II.
- Facts drawn from these books are marked `recall` or `source-checked`, never `verified-online`.

## 4. Uncertainty log (what would settle it)

- **Muṇḍeśvarī date** (108 vs 570–636 CE vs a later shrine): a re-edition of the Udayasena inscription, and a structural survey of the octagonal shrine.
- **Lāḍ Khān:** Wikipedia's current "now dated to the 5th c." reverses the trend in Michell and Hardy as I recall it. Needs checking against Michell 2017 or a recent Cālukya chronology.
- **Somanathapura 1258 vs 1268:** the Epigraphia Carnatica text. (Narasiṃha III's accession, c. 1263, fits awkwardly with 1258.)
- **Pashupatinath renovation 1692 vs 1697;** Changu Narayan rebuilding "c. 1702" (recall). Needs Slusser 1982 or Nepalese chronicle editions.
- **Grishneshwar:** whether the 18th-c. rebuilding was by Gautamābāī Holkar (1729, per Wikipedia) or Ahilyābāī Holkar.
- **Undated fabric:** the main temples at Baidyanātha (Deoghar), Palani, Swamimalai, Tiruttani and Kedarnath have no verified dated fabric.
- **Śakti Pīṭha memberships** need checking against Sircar's tables: Koneswaram as "Laṅkā Śāṅkarī", Deoghar as the heart-pīṭha, and the Puri Vimalā shrine.
- **Locators from recall:** the jyotirliṅga list (Śiva Purāṇa, Koṭirudrasaṃhitā ch. 1, from recall) and the 108 pīṭhas (DBhP 7.30, from recall; the online text was blocked).
- **Patron and attribution questions:**
  - Elephanta's patron (Kalacuri or another) — the material agent asserts `pol:early-kalachuri`.
  - Kailāsa's attribution to Kṛṣṇa I rests on the later Baroda (812) and Kadaba plates.
  - Lakṣmaṇa: the inscription is dated in Dhaṅga's reign, while construction is credited to Yaśovarman.

## 5. Cross-agent links

**Removed from my files** because they were already defined elsewhere (my build drops these automatically):
- Entities: `person:narasimhavarman-i`, `person:mangalesha`, `person:krishna-i-rashtrakuta` (material); `deity:kamakhya`, `concept:jyotirlinga`, `concept:shakti-pitha` (purana); `deity:vitthala` (regional).
- I use `person:manadeva` (material) for Changu Narayan.
- 8 sources were removed because they exist elsewhere: `src:eck-2012`, `src:eck-1982`, `src:sircar-1973`, `src:de-casparis-1956`, `src:collins-1988`, `src:fleet-1888`, `src:shulman-1980`, `src:clothey-1978`.
- 40 edges were removed whose (s,p,o) another agent already asserts, e.g. material:327 Kailāsa COMMISSIONED_BY Kṛṣṇa I and purana:395 Samudra-manthana DEPICTED_IN Angkor Wat.

**Requests to other agents**
- The orchestrator assigned `concept:jyotirlinga` and `concept:shakti-pitha` to me, but purana defined them first. Please add `subtype: "pilgrimage network"` to purana's records, plus their disputed-member details. My network memberships point at those ids, and the candidate disputes are carried in `claim:jyotirlinga-site-identifications` and in the `competing` fields of the MEMBER_OF edges.
- Regional `src:clothey-1978` is still defined in two places, which is the validation error in `regional.json`.

**Ids I used that other agents own**
- `art:udayagiri-varaha`, `art:gudimallam-linga`, `art:chola-nataraja`
- `ins:aihole-ravikirti`, `ins:changu-narayan-manadeva`, `ins:shivagrha`
- `site:besnagar`, `site:dwarka-offshore`
- `person:dyah-lokapala`, `person:nakkirar`, `person:pulakeshin-ii`, `person:chandragupta-ii`, `person:ravikirti`, `person:shankara`, `person:ramanuja`, `person:andal`, `person:appar`, `person:sambandar`, `person:sundarar`, `person:chaitanya`, `person:jayadeva`
- `text:tirumurukarruppatai`, `text:tevaram`, `text:divya-prabandham`, `text:periya-puranam`, `text:silappatikaram`, `text:shiva-purana`, `text:devi-bhagavata-purana`, `text:padma-purana`, `text:vayu-purana`, `text:kakawin-ramayana`, `text:reamker`
- Narratives, characters, places and traditions from the registry.

**Ids I wish existed**
- Inscriptions: `ins:lakshmana-khajuraho-954`, `ins:brihadisvara-rajaraja`, `ins:ramappa-1213`, `ins:kamakhya-1565`
- `text:pithanirnaya` (51-pīṭha list), `text:rajatarangini`, `text:narayaniyam`
- `deity:amaleshvara`, and `place:pandharpur` (regional has it)

## 6. Graph opportunities

- **Patron networks:**
  - Ahilyābāī Holkar → Kāśī Viśvanātha, Viṣṇupada (Gaya), Aundha, Grishneshwar (disputed), Somanātha (1783 temple).
  - Kṛṣṇadevarāya → Tirumala, Hampi Virūpākṣa, Viṭṭhala.
  - Cōḻa kings → Thanjavur, Gaṅgaikoṇḍacōḻapuram, Darasuram, Srikalahasti, Chidambaram.
- **Conquest and architectural transfer:** Narasiṃhavarman I ADVERSARY_OF Pulakeśin II (material). Later, Vikramāditya II took Kanchi, and his queen's Virūpākṣa temple at Pattadakal DERIVED_FROM Kailāsanātha, Kanchi.
- **Network maps:** the 8 networks as overlays on a map. Rameswaram, Badrinath, Chidambaram, Srisailam and Kedarnath each belong to 2–3 networks.
- **Narrative reception in stone:** `char:rama` and `narr:*` DEPICTED_IN Pattadakal (8th c.), Prambanan (856), Banteay Srei (967), Angkor Wat (12th c.) and Hazāra Rāma (15th c.).

## 7. Timeline contributions

- **Material, secure (38).** Earliest to latest:
  - 401/402 Udayagiri; 464 Changu Narayan; 578 Bādāmi Cave 3; 634/5 Meguti; 856 Prambanan; 953/4 Lakṣmaṇa; 967 Banteay Srei; 1010 Thanjavur
  - 1026 Somanātha raid; 1060 Ambarnath; 1117 Belur; 1213 Rāmappa; 1234–35 Mahākāla destroyed; 1510 Hampi raṅga-maṇḍapa; 1517 Tirumala portrait statues; 1565 Kāmākhyā
  - 1622–24 Kōṇēsvaram destroyed; 1780 Kāśī Viśvanātha; 1787 Gaya; 1809 Kālīghāṭ; 1855 Dakṣiṇeśvar; 1891 Batu Caves; 1910 Janakpur
  - 1951 Somanātha; 1952 Kōṇēsvaram; 1987 Srirangam Rājagopuram; 2021 Kāśī corridor; 2024 Ayodhyā consecration
- **Material, estimated:** about 167 more, from the Gupta period to modern times.
- **Traditional (45):** founding legends such as Indradyumna at Puri, Vajranābha at Dwarka, the Pāṇḍavas at Kedarnath, Bhōgar at Palani and Vibhīṣaṇa at Srirangam. None has a numeric date.
- **Reception (4):** dancing-Śiva images by the 6th c.; the Naṭarāja bronze type by the 10th c.; Āḻvār hymns to Vēṅkaṭam in the 6th–9th c.; the imperial Jagannātha cult in the 12th c.

## 8. Research gaps and follow-up

- Check UNESCO pages by hand for 1224, 481 and 949, and for the Kathmandu Valley component numbers.
- Get ASI Monument of National Importance numbers for more temples (only Konark and Ramappa have them).
- Add dated inscriptions as `ins:` entities, coordinated with the material agent.
- Build a Śakti Pīṭha comparison table (4/18/51/108 by text) once text ids for the Pīṭhanirṇaya and the 18-pīṭha stotra exist.
- Add missing temples: Kāmākṣī (Kanchi), Vimalā (Puri), Kētīsvaram, Vadakkunnathan, Sabarimala, Pandharpur, Mathurā Keśavadeva, Jvālāmukhī, Amarnath and Vaishno Devi. The last two were dropped because a natural cave shrine has no material fabric to date.
- Coordinates are `approximate` for 7 temples (Mamallapuram, Ellora Cave 15, Sirpur, Gangotri, Yamunotri, Hinglaj, Mỹ Sơn) and all 3 owned places.

## 9. Candidate discoveries

1. **One 18th-century queen stands behind the present fabric of several "ancient" shrines.**
   - Ahilyābāī Holkar built the present Kāśī Viśvanātha (1780) and Viṣṇupada at Gaya (1787). She renovated Aundha Nāganātha, built a separate Somanātha temple in 1783, and may have rebuilt Grishneshwar.
   - Ids: `person:ahilyabai-holkar`, `temple:kashi-vishwanath`, `temple:vishnupad-gaya`, `temple:aundha-nagnath`, `temple:somnath`, `temple:grishneshwar`.
   - Caveat: these are rebuildings, not foundations, and the Grishneshwar attribution is disputed.
2. **Conquest carried architecture between capitals.** The Pallava Narasiṃhavarman I took Vātāpi c. 642. A century later Vikramāditya II took Kanchi, and his queen Lokamahādevī's Virūpākṣa at Pattadakal (c. 740–745) follows the Kanchi Kailāsanātha's Drāviḍa design.
   - Ids: `temple:virupaksha-pattadakal` DERIVED_FROM `temple:kailasanatha-kanchi`, `person:lokamahadevi`, `person:vikramaditya-ii`.
   - Caveat: the stylistic dependence is a scholarly argument (class 5).
3. **The jyotirliṅga network is a list without fixed places.** Four of the twelve positions have rival claimant temples. Most claimant temples are 18th–20th-century buildings.
   - Ids: `claim:jyotirlinga-site-identifications`, `temple:baidyanath-deoghar`, `temple:parli-vaijnath`, `temple:nageshwar-dwarka`, `temple:aundha-nagnath`, `temple:jageshwar`.
   - Caveat: a late building does not mean a late cult.
4. **The "oldest functioning temple" (Muṇḍeśvarī, 108 CE) rests on reading an inscription whose era is not stated.** Palaeography puts it at 570–636 CE, and the shrine itself may be early modern.
   - Ids: `claim:mundeshwari-108-ce`, `temple:mundeshwari`.
5. **Prambanan's date comes from an inscription found apart from the temple.** The Śivagṛha text (12 Nov. 856) is tied to the temple by de Casparis's argument (class 5).
   - Ids: `temple:prambanan`, `ins:shivagrha`, `person:dyah-lokapala`.
