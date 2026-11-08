# SANATANA — Research blueprint

Phase 1 deliverable: the research organisation, source taxonomy, methodology, graph schema,
chronological model, evidence framework and risk register that every later phase follows.

## 1. The question

*If the recorded universe of Hindu sacred literature and traditions were organised as one
interconnected graph, what would that network reveal?* The answer is only as good as the
discipline with which four kinds of statement are kept apart:

| Kind of statement | Example | How it is recorded |
|---|---|---|
| What a text says | “In the Vālmīki Rāmāyaṇa, Hanumān leaps to Laṅkā.” | Assertion, evidence class 1, `qualifiers.text`, passage locator |
| What a tradition holds | “Rameswaram is where Rāma worshipped Śiva.” | Assertion, evidence class 6 (`ASSOCIATED_WITH`) |
| What scholars infer | “The Bhāgavata Purāṇa was composed c. 9th–10th c. CE.” | `DateClaim` with `view`, evidence class 5 |
| What objects show | “The Heliodorus pillar records devotion to Vāsudeva c. 113 BCE.” | Material entity, class 3/4, `limits` |

Physical evidence of worship or depiction is never treated as proof that narrated events
occurred. A temple’s founding legend is never treated as the date of its surviving fabric.

## 2. Research organisation

| Agent | Domain | Owns (core registry) | Writes |
|---|---|---|---|
| 1 Chief Historian & Orchestrator | method, schema, registry, merge, chronology, discoveries | sources seed | `schema/`, `scripts/`, `data/core-registry.json`, `data/discoveries.json` |
| 2 Vedic Literature | Saṃhitās, Brāhmaṇas, Āraṇyakas, Upaniṣads, Vedāṅgas, Pāṇini/Patañjali | ≈95 ids | `data/*/vedic*.json` |
| 3 Itihāsa & Epic | Rāmāyaṇa, Mahābhārata, Gītā, Harivaṃśa, critical editions | ≈125 ids | `data/*/epic*.json` |
| 4 Purāṇic Literature | Mahā- and Upapurāṇas, avatāras, cosmology, genealogies, sacred chronology | ≈105 ids | `data/*/purana*.json`, `data/sacred-chronology.json` |
| 5 Regional & Living Heritage | Tamil bhakti, vernacular retellings, Jain/Buddhist tellings, SE Asia, Āgamas | ≈45 ids | `data/*/regional*.json` |
| 6 Characters & Genealogies | merged into agents 3 and 4 (kinship is asserted by the text-owning agent, so every tie carries its text) | — | — |
| 7 Archaeology, Inscriptions & Material | inscriptions, coins, sculpture, manuscripts, excavations, contested claims | ≈60 ids | `data/*/material*.json` |
| 8 Temple & Sacred Geography | 80–110 temples with coordinates, phases, patrons, networks | ≈45 ids | `data/*/temple*.json` |
| 9 Chronology | encoded in the schema (`DateClaim.system`) and enforced by the validator; traditional chronology owned by agent 4 | — | — |
| 10 Comparative & Network Analysis | comparison tables by every agent; metrics computed in `scripts/build-graph.ts` | — | `research/audit/` |
| 11 Knowledge Graph Architect | schema, validator, compiler, exports | — | `schema/`, `scripts/` |
| 12 Product & Microsite | design system, graph, atlas, time machine, profiles | — | `src/` |
| 13 Independent Verification | audits a sample of every domain and the user journeys; never produced research | — | `research/verification-report.md` |

Agents 6, 9, 10 and 11 are functions rather than separate researchers: kinship needs the
text that asserts it, chronology needs a schema rather than an opinion, and network metrics
are computed rather than written. The contract every researcher follows is
`research/AGENT-CONTRACT.md`.

### Controlled merging

Parallel research creates duplicates unless identity is decided up front. The **core
registry** (`scripts/seed-core.ts` → `data/core-registry.json`) fixes 443 shared identities,
each owned by exactly one agent who writes its full record; all others reference the id.
The validator flags a core id defined in a non-owner’s file, duplicate ids, duplicate triples,
and dangling references. Deliberate *non*-merges are encoded in the registry itself:
`char:janaka-videha` ≠ `char:janaka`; `place:lanka-narrative` is not Sri Lanka;
`char:vasudeva-father` ≠ `deity:vasudeva`; `deity:murugan` and `deity:skanda` are joined
only by a tradition-qualified `IDENTIFIED_WITH`; Karṇa’s foster mother Rādhā is not `char:radha`.

## 3. Source taxonomy

| Tier | Source type (`Source.type`) | Use |
|---|---|---|
| Primary | `primary-text` — critical editions (BORI Mahābhārata, Baroda Rāmāyaṇa, Vaidya’s Harivaṃśa, Groningen Skandapurāṇa) and e-texts (GRETIL) | passage locators |
| Primary | `epigraphic-corpus`, `excavation-report`, `catalogue` | inscriptions, findspots, accession numbers |
| Primary (translation) | `translation` — public-domain (Griffith, Ganguli, Wilson, Eggeling) for quotation; modern scholarly (Jamison & Brereton, Olivelle, Goldman, van Buitenen) for reading | quotations only from PD |
| Secondary | `scholarly-book`, `journal-article` | dating, interpretation, debates |
| Institutional | `institutional` — UNESCO WHC, ASI, National Mission for Manuscripts, Museums of India | status, protection, catalogues |
| Tradition | `tradition` — temple and sampradāya publications | evidence of what a tradition holds (class 6) |
| Pointer | `reference` — Wikipedia, Wikimedia Commons | finding primary sources; image licences; never sole support for a contested claim |

## 4. Graph schema (summary — authority: `schema/types.ts`)

Nineteen node types: collection, text, passage, character, deity, concept, narrative, lineage,
place, temple, site, artifact, inscription, manuscript, person, polity, institution, tradition,
claim. Fifty-five predicates in seven groups (literature, appearance, kinship, narrative,
theology, material, argument). Every edge is an `Assertion`:

```
{ id, s, p, o, qualifiers: {tradition?, text?, role?, note?},
  evidenceClass: 1–7, sources: [{source, locator, edition, quote, url}],
  confidence: high|medium|low, status: verified-online|source-checked|recall|unresolved|disputed,
  rationale?, competing?, agent, lastVerified? }
```

Theology is always qualified: `AVATARA_OF`, `FORM_OF`, `IDENTIFIED_WITH` without a tradition
or text qualifier raise a validator warning.

## 5. Chronological model

Four systems, stored separately on every dated record (`DateClaim.system`):

- **A · scholarly-textual** — composition/compilation/redaction ranges, one claim per scholarly view.
- **B · material** — dated objects, inscriptions, structures and manuscripts, with the dating basis.
- **C · reception** — first appearance of a tradition, motif or worship form in a region.
- **D · traditional** — yugas, manvantaras, kalpas and narrative order as the traditions state
  them (`data/sacred-chronology.json`); never drawn on the historical axis.

Rules enforced by `scripts/lib/check.ts`: non-traditional dates need numeric start and end;
start ≤ end; nothing after 2026; “secure” material dates spanning more than 50 years are flagged.

## 6. Evidence and confidence framework

Evidence class (nature of the evidence) × confidence (strength) × verification status (how far
checked). Displayed everywhere as a numbered badge, three dots and a status label. Disputed
claims are first-class `claim` nodes with `SUPPORTS` / `CONTRADICTS` edges from evidence.

## 7. Research risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Fabricated verse numbers, accession numbers or readings | high (LLM research) | severe | contract rule 1; `status` must be honest; coarse locators when unsure; verifier audit; UI shows “awaiting check” |
| Vulgate vs Critical Edition numbering confusion | high | moderate | locators name the edition; CE preferred; Ganguli/Griffith flagged as vulgate |
| Merging distinct identities (Janakas, Bharatas, Nalas, Rādhās) | medium | severe | registry non-merges; disambiguated names; search returns both |
| Treating traditional associations as history | medium | severe | class 6; `limits`; separate traditional dates |
| Sensationalist archaeology (Dwarka, Rāma Setu, proto-Śiva) | medium | severe | modelled as `claim` nodes with evidence both ways, status `disputed` |
| False precision in dating | high | moderate | intervals, views, certainty; validator flags |
| Network metrics read as importance | medium | moderate | stated on every metric surface |
| Coverage bias (well-documented Sanskrit and Tamil material dominates) | certain | moderate | stated in the audit; counts labelled as dataset counts |
| Image licensing | medium | moderate | Commons API check; licence + credit + file page required by validator |
| Politically sensitive sites | medium | moderate | facts and dates only, neutral language, no commentary |
| Copyright in quotations | low | moderate | short excerpts from public-domain translations only |
| Sites blocking automated fetching (sacred-texts, UNESCO, some museums) | high | low | record as `source-checked`/`recall` rather than claim online verification |

## 8. Significant unknowns identified before research

1. Exact Critical-Edition chapter ranges for many episodes (the CE renumbers the vulgate).
2. Earliest dated manuscripts for most texts (rarely published in accessible form).
3. Accession numbers for well-known sculptures (museum sites often block automated fetching).
4. Dates of many Purāṇas, which are layered and fluid (Rocher): any single range misleads.
5. Coordinates for narrative places, which are traditional identifications, not facts.
