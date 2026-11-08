# Round-2 merge fixes (orchestrator)

Applied by `scripts/apply-r2-merge.ts` (idempotent) after the seven round-2 agents finished.

- **Coordinates outside Asia.** The validator's longitude bound (−30°) excluded the Americas, so
  the temple agent had parked four diaspora temples' coordinates in `attributes`. The bound now
  accepts any valid coordinate and these records were given locations:
  `temple:akshardham-robbinsville` (40.25417, −74.57778), `temple:sv-temple-pittsburgh`
  (40.441, −79.80518), `temple:ganesh-temple-flushing` (40.75275, −73.81683),
  `temple:temple-in-the-sea` (10.48169, −61.47553). The map lists sites beyond its South and
  Southeast Asian basemap in a “Beyond this map” panel instead of distorting the projection.
- **A traditional attribution stored as a material date.** `temple:vijayalaya-choleeswaram`:
  “c. 850–891 (Vijayālaya Cōḻa)”, whose basis is the temple's name, moved to the traditional
  chronology; the inscription's c. 862 CE remains the material date. The data test that guards
  this now matches bases that *rest on* a legend or tradition rather than any mention of one
  (`temple:vadakkunnathan` and `temple:baphuon` mention tradition only to set it aside).
- **Cross-agent links checked.** Holī ↔ the Nārada Purāṇa's Holikā narrative, Ōṇam ↔ Māyōṉ and
  Mahābali, the vernacular Mahābhāratas (Villi Pāratam, Kāśīdāsī) and the early images the
  iconography agent needed (created by the material agent) are connected by id across files.
