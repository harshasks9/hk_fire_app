# Research contract — round 2 (expansion)

Round 2 widens the graph toward encyclopedic coverage. Everything in
`research/AGENT-CONTRACT.md` still applies (evidence rules, identity rules, honesty of
`status`, `limits` on material records, traditional vs material dates, no fabrication). The
schema is `schema/types.ts`. These additions and changes apply on top.

## 1. Files

| You are | Write new records to | Assertion ids |
|---|---|---|
| a round-1 agent (`vedic`, `epic`, `purana`, `regional`, `material`, `temple`) | `data/entities/<you>-r2.json`, `data/assertions/<you>-r2.json`, `data/sources/<you>-r2.json`, `data/comparisons/<you>-r2.json` | `"<you>:r2-1"`, `"<you>:r2-2"` … |
| a new agent (`iconography`) | `data/entities/iconography.json` (etc.) | `"iconography:1"` … |

You may also **correct or upgrade existing records in your own domain's round-1 files**
(`data/*/<you>.json`, and `regional-new.json` for regional): add sources, restore or fix locators,
raise or lower `status`/`confidence` honestly. Never change an existing id and never delete a
record that other records reference. List every such edit in your report. Never edit another
agent's files.

Report: `research/agents/<you>-r2.md` — sections 1–9 as in round 1, plus **“What I added”**: a
categorised list of the new records (by name) and the upgrades you made, with counts.

## 2. Before creating any record, search for it

```bash
npm run find -- "Kalidasa" "Bṛhat Saṃhitā" "कृष्ण"
```

It folds spellings and scripts. If a record exists, **reference its id**; do not create a second.
If two records are genuinely different (two Bharatas), give the new one a disambiguating name
(“Bharata (son of Śakuntalā)”) — the validator warns on two records of the same type and name.

Other round-2 agents are working at the same time. Stay inside your **ownership list** (§4) for
anything you *create*; reference anything else by the id it will most likely have
(`npm run find` first) — if it does not exist yet, record the link you wanted in your report under
“cross-agent links” instead of creating it.

## 3. Statuses

`reference-checked` now exists: use it when a fact was checked only against Wikipedia or another
reference work. `verified-online` means an authoritative online source (an edition e-text, a
museum catalogue, an epigraphic corpus scan, UNESCO/ASI, a journal page) — with the URL.

## 4. Ownership in round 2 (what each agent creates)

- **vedic** — darśanas and śāstra: the six schools and their root texts (Brahma Sūtra exists —
  extend it), commentators and ācāryas of Vedānta and Mīmāṃsā, Yoga and Sāṅkhya; Vedāṅgas and
  Sūtra literature (Śrauta, Gṛhya, Dharma Sūtras); Dharmaśāstra beyond Manu; remaining Upaniṣads;
  philosophical concepts.
- **epic** — Sanskrit kāvya and drama that retell the epics and Purāṇas (Kālidāsa, Bhāsa,
  Bhavabhūti, Bhāravi, Māgha, Bhaṭṭi, Śrīharṣa, Kṣemendra …); the Mahābhārata’s upaparvan
  structure and missing major episodes; **restoring precise locators for the 55 lineage
  memberships withdrawn in round 1** (epic:335–389).
- **purana** — Upapurāṇas and māhātmyas; missing Purāṇic narratives (Kṛṣṇa’s childhood and
  Dvārakā cycles, Gaṇeśa, Śiva and Devī cycles, avatāras); cosmography (dvīpas, Meru, lokas);
  full Solar and Lunar king-lists as texts give them.
- **regional** — bhakti poets and saints not yet present (North, East, West, South, Northeast,
  Nepal); vernacular works; festivals and pilgrimages (with narrative and text links); UNESCO
  Intangible Cultural Heritage elements; Southeast Asian literature not yet present; the
  diaspora; upgrading round-1 comparison rows still at `recall`.
- **material** — inscriptions (South and Southeast Asia), coins, sculptures and paintings with
  museum accession numbers, illustrated manuscripts, excavations; **upgrading round-1 class-3
  assertions now `reference-checked` with their epigraphic editions** (EI, CII, SII …).
- **temple** — temples and sacred sites not yet present (gap regions listed in your brief), sacred
  rivers, mountains, tīrthas and cities (Sapta Purī), and pilgrimage networks.
- **iconography** — iconographic forms of deities (Ardhanārīśvara, Harihara, Dakṣiṇāmūrti,
  Somāskanda, Anantaśayana …), attributes, vāhanas and weapons, the Navagrahas and Dikpālas;
  iconographic and architectural treatises (Bṛhat Saṃhitā, Viṣṇudharmottara’s Citrasūtra,
  Mayamata, Mānasāra, Śilpa Prakāśa …); temple architectural styles as concepts; the earliest dated
  representations of each form (linking to existing material records).

## 5. Depth bar

Aim for **150–250 new entities and 400–700 new assertions** each, every new entity with a
summary, sources, and — wherever the record is datable or locatable — dates (with view and basis)
and coordinates. Prefer coverage of *important* items first, then breadth. Run
`npm run validate -- --domain <you>` until it reports **0 errors**, and make sure
`npm run validate` (whole dataset) shows no errors in your files.
