# Research agent contract

Every research agent works to this contract. It is short on purpose: the schema in
`schema/types.ts` is the authority, and `npm run validate -- --domain <you>` is the judge.

## 1. What you write

All files are JSON arrays. `<you>` is your agent id (`vedic`, `epic`, `purana`,
`regional`, `material`, `temple`).

| File | Contents |
|---|---|
| `data/entities/<you>.json` | Full `Entity` records: (a) every core-registry id you **own** (see `data/core-registry.json`, field `owner`), (b) new entities in your domain |
| `data/assertions/<you>.json` | `Assertion` records (edges). Ids `"<you>:1"`, `"<you>:2"` … |
| `data/sources/<you>.json` | `Source` records you cite that are not already in `data/sources/orchestrator.json` |
| `data/comparisons/<you>.json` | `Comparison` tables — what each text says on one point, unreconciled |
| `research/agents/<you>.md` | Your report (section 6) |

Never edit another agent's files or the core registry. If a core identity is wrong, say so in
your report.

## 2. Identity rules

- Ids are `<prefix>:<kebab-slug>`, lowercase ASCII. Prefixes: `col text psg char deity concept
  narr lin place temple site art ins ms person pol inst trad claim`.
- **Before creating any entity, search `data/core-registry.json`** (and, if they exist, other
  agents' entity files) for it. Reference existing ids; do not duplicate.
- You may reference any core id in assertions even if another agent owns it.
- New entities that are *obviously* shared (a major deity, text or place) should be rare; if you
  must create one, give it a precise slug and mention it in your report under “cross-agent links”.
- Keep identities apart where the sources keep them apart. A text's Laṅkā is not Sri Lanka; the
  Upaniṣadic Janaka is not assumed to be Sītā's father; Tamil Murukaṉ and Sanskrit Skanda are two
  ids joined by an `IDENTIFIED_WITH` assertion qualified by tradition. Avatāra identity is an
  `AVATARA_OF` assertion, never a merge.

## 3. Evidence rules (non-negotiable)

1. **No fabrication.** Never invent a verse number, an inscription reading, a museum accession
   number, a publication, a date, or a quotation. If you are not sure of an exact locator, give
   the coarser one you are sure of (`MBh (CE) book 6` rather than a guessed chapter), and set
   `status: "recall"` or `"unresolved"`.
2. Every entity and every assertion carries ≥1 `SourceRef` whose `source` id exists in
   `data/sources/*.json`. Add the source to your `data/sources/<you>.json` if it is new — only
   real works, with real authors/publishers/years. Wikipedia (`src:wikipedia`) may be cited as a
   pointer but never as the *only* support for a contested or high-confidence claim.
3. `status` honestly records checking:
   - `verified-online` — you fetched an authoritative page (GRETIL e-text, museum catalogue,
     UNESCO/ASI page, journal page, a public-domain translation) and it confirmed the fact; put
     the URL in the SourceRef `url`.
   - `source-checked` — you are confident from a named scholarly source.
   - `recall` — plausible from expertise, not checked. Use freely, but do not mark these `high`
     confidence when the claim is a precise locator.
   - `unresolved` / `disputed` — say so; record `competing`.
4. **Verify the important things online.** Spend real effort fetching sources for: every passage
   locator that anchors a major claim, every date of an artifact/inscription/temple, every
   coordinate, every accession number, every image licence. GRETIL
   (`https://gretil.sub.uni-goettingen.de/`), Wikipedia (to find primary pointers), museum
   collection pages, UNESCO WHC pages and Wikisource/sacred-texts are reachable in most cases;
   some sites may block automated fetching — note it and move on.
5. Evidence class is about the *nature* of the evidence:
   1 textual passage · 2 manuscript · 3 inscription · 4 archaeological/material object ·
   5 scholarly interpretation · 6 religious/local tradition · 7 disputed/speculative.
   Traditional associations (`ASSOCIATED_WITH`, sthala-purāṇa claims, a temple's founding legend)
   are class 6. An artifact *depicting* a story is class 4 for the depiction and class 5 for the
   identification if the identification is argued.
6. **Physical evidence of worship or depiction does not prove the narrated events happened.**
   Write `limits` on every material entity: what it establishes and what it does not.
7. **A temple's founding story is not the date of its surviving structure.** Give separate
   `DateClaim`s: `system: "traditional"` for the legend, `system: "material"` with
   `event: "surviving-structure"` (or `construction`, `renovation`) for the fabric.
8. Dates: BCE negative. Ranges, not false precision. `certainty: "secure"` only for dated
   inscriptions, colophons, regnal synchronisms and the like. Record competing scholarly views as
   separate `DateClaim`s with `view`.
9. Preserve disagreement. Where texts differ (genealogies, who did what, theology), write
   separate assertions qualified by `qualifiers.text` and/or a `Comparison` table. Do not
   harmonise.
10. Quotations: only short excerpts from public-domain translations (Griffith, Ganguli, Wilson,
    Eggeling, Müller, Hume) or the original-language text. Never paraphrase and present it as a
    quotation.
11. Neutral, respectful language. Describe what traditions hold without endorsing or dismissing.
    "According to the Bhāgavata Purāṇa …", "the temple tradition holds …", "scholars estimate …".

## 4. Edge vocabulary

Use only predicates in `schema/types.ts → PREDICATES`. The most used:

- literature: `PART_OF`, `RETELLS`, `DERIVED_FROM`, `COMMENTARY_ON`, `WITNESS_OF`, `ATTRIBUTED_TO`,
  `COMPOSED_BY`, `REFERS_TO_TEXT`
- appearance: `APPEARS_IN` (character/deity → text, `qualifiers.role`), `MENTIONED_IN`,
  `NARRATED_IN` (narrative → text), `TEACHES_IN`
- kinship: `PARENT_OF`, `SPOUSE_OF`, `SIBLING_OF`, `ADOPTIVE_PARENT_OF`, `MEMBER_OF`
- narrative: `PARTICIPANT_IN`, `OCCURS_AT`, `PRECEDES`, `SLAYS`, `CURSES`, `BLESSES`, `TEACHER_OF`,
  `ALLY_OF`, `ADVERSARY_OF`, `DEVOTEE_OF`, `SERVES`
- theology: `AVATARA_OF`, `FORM_OF`, `IDENTIFIED_WITH`, `CENTRAL_TO`, `VAHANA_OF`
  (always with `qualifiers.tradition` or `qualifiers.text`)
- material: `LOCATED_AT`, `ASSOCIATED_WITH`, `WORSHIPPED_AT`, `DEPICTED_IN`, `FOUND_AT`, `HELD_AT`,
  `INSCRIBED_AT`, `COMMISSIONED_BY`, `BUILT_DURING`, `REFERS_TO`, `DOCUMENTED_BY`
- argument: `INTERPRETED_AS`, `SUPPORTS`, `CONTRADICTS`, `CONCERNS`

Locators: `RV 1.154.1`, `ŚB 1.8.1.1–10`, `BU 3.6`, `CU 6.8.7`, `MBh (CE) 6.23–40`,
`VR (CE) 6.97`, `ViP 1.3`, `BhP 10.25`, `DM 2–4`. Say which edition when numbering differs
(the Critical Editions vs the vulgate / Gita Press / Ganguli numbering).

## 5. Quality bar

- Depth over breadth: a fully sourced character with genealogy, text appearances, comparisons
  and places beats five thin ones.
- Every entity gets a `summary` (1–3 neutral sentences) and, for important ones, `details`.
- Every important text gets scholarly `dates` (with `view`) and, where known, the earliest
  surviving manuscript or earliest external reference (`REFERS_TO_TEXT` from an inscription or
  dated work).
- Run `npm run validate -- --domain <you>` until it reports **0 errors**; reduce warnings.

## 6. Report (`research/agents/<you>.md`)

1. Executive findings — the most important things you established and why they matter.
2. Dataset summary — counts by type; the most connected entities.
3. Evidence ledger — the key sources and what each supports; which were checked online.
4. Uncertainty log — unresolved or disputed claims, with what would settle them.
5. Cross-agent links — ids you referenced from other domains; ids you wish existed.
6. Graph opportunities — relationships worth visualising.
7. Timeline contributions — the dated items you supplied, by chronology system.
8. Research gaps and recommended follow-up.
9. Candidate discoveries — 3–6 surprising, source-supported findings from your domain, each
   with the entity/assertion ids that substantiate it and its caveat.
