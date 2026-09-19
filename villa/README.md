# The Villa — interiors & fit-out

A digital twin and command centre for the complete interiors and fit-out of a
5 BHK villa in Hyderabad.

It is not a generic project-management tool that happens to be pointed at a
house. The villa is built into the product: every room on all three floors
already exists, already carries the checklist appropriate to it, and already
knows its own dimensions from the architect's plans. Nobody starts from a blank
page, and it is hard for anything important to go quietly missing.

## The idea the whole thing rests on

A piece of scope is **one object for its entire life**.

```
Space → Idea → Options → Estimate → Discussion → Decision → Approval
      → BOQ → Procurement → Execution → Inspection → Snag → Handover
```

The master bedroom floor starts as a `ScopeItem` the moment the room exists. An
idea attaches to it. Options attach to the idea. A decision resolves an option
onto it. Approving that decision moves the same object into the BOQ carrying the
chosen option's price, then into procurement, then onto the snag list. It is
never re-keyed, never retyped, and never duplicated into a parallel "BOQ module".

Every screen in the app is a different lens on the same set of scope items.
That is why the BOQ is always current, why approving a decision changes the
forecast immediately, and why a snag can be traced back to the conversation that
chose the material.

## What is in the box

**1,130 scope items across 57 spaces**, generated from room-type templates plus a
house-wide master scope — pre-populated, so the checklist exists before anyone
thinks to ask for it.

| Screen | What it is for |
|---|---|
| **Home** | One question first: what needs me today. Then money, programme, risk, and what changed since your last visit. |
| **Villa** | A three-floor stack. Pick a floor, the plan opens; pick a room, its workspace opens. Eleven overlays repaint the plan as completion, cost, overrun, decisions, procurement risk, snags, or the services layers. |
| **Room workspace** | One room, everything about it: Design, Ideas, Decisions, Scope, Cost, Products, Tasks, Vendors, Files, Site photos, Issues. |
| **Design** | The designer's surface and the homeowner's window onto it — moodboard, options, revisions, client feedback. |
| **Decisions** | The decision inbox, ranked by how soon it bites and how much rides on it. Answerable from the card. |
| **Timeline** | Built around the dependency chains that actually govern interiors, not a Gantt chart you have to learn to read. |
| **Costs** | Seven money columns, drill-down from project to item, the BOQ, the scenario planner, and payments. |
| **Procurement** | Nine-state pipeline, with long-lead items given their own place because they are what moves handover. |
| **Site** | Mobile-first capture. Pick the room once; everything files itself there. |
| **Manage** | The editing console. Everything in the project, floor by floor — create, edit and delete across all sixteen collections, with references cleaned up on delete. |
| **Admin** | Record counts, the category taxonomy and its rate card, backup and restore, and starting the project from scratch. |
| **More** | Vendors & quotation comparison, notes, documents, and the completeness report. |

## Things worth knowing

**The floor plans are the interface.** Each plate is redrawn as SVG traced from
the architect's drawings, so every room is a real clickable, fillable shape
rather than an invisible box over a bitmap. The plot is 59'0" × 65'3"; the
upper-floor footprint is 45'10" × 45'2".

**Dimensions are never invented.** Every dimension is transcribed from the plans
and carries its `source`. Spaces the plans do not dimension — the gardens, the
deck, the utility yard, circulation — carry no dimension at all, and their
quantities start at 1 with a note that they must be measured on site.

**The taxonomy is the project's, not the code's.** Categories are data, seeded
from a built-in rate card and owned by the project from then on. Each one
carries its indicative rate, unit, wastage, labour, tax, quantity basis and
lead time — so the whole rate card is editable in one place under Admin, and a
rate changed there is picked up by every item created afterwards. A trade can
be archived (hidden from pickers, existing items untouched) or deleted (items
fall back to another category rather than orphaning).

**You can start from scratch.** Admin → Danger zone empties the project, with a
per-collection choice of what to carry over — the taxonomy by default, since
without a category list you cannot create a single scope item. Vendors, people,
scenarios and settings are each optional. The dialog names exactly how many
records will go, and asks you to type EMPTY. Back up and restore the whole
project as JSON from Admin → Data.

**Rates are assumptions, never quotations.** Where no vendor quote exists, the
forecast uses an indicative Hyderabad rate for that category. Those rates carry
their assumption in a tooltip, render with a dotted underline, and are editable
on every item. The product never lets an indicative rate pass for a real price.

**Money cannot run ahead of the workflow.** An item at "options" can never carry
a paid figure; one merely "estimated" can never carry a vendor quotation. The
invariant is enforced in the model and covered by tests, so the forecast can
never be quietly driven by a number that does not exist yet.

**Nothing is ever deleted.** Scope that is not needed is marked *Not applicable*
with a reason and stays visible. That is the audit trail proving it was
considered rather than forgotten.

**The completeness engine looks for absence.** Its job is not to report what has
been entered but to surface what has *not been thought about*: the tiling moving
ahead of the concealed diverter body, the ceiling closing over an undecided
curtain pelmet, waterproofing nobody owns, acoustic treatment nobody budgeted,
a 16-week chandelier still undecided.

## Things added beyond the brief

A three-storey Hyderabad villa has failure modes the original scope list did not
mention. These are in the model, marked *Added by the app*:

- Gated-community NOC, working-hours and debris rules before mobilising
- Sanctioned electrical load review — five ACs, a lift, a theatre and an EV point
  will exceed a standard villa sanction
- Water softener — Hyderabad borewell water scales CP fittings and glass within a year
- Rainwater harvesting, statutory on this plot size in Telangana
- AC outdoor unit positions, structural support and condensate routing
- Wi-Fi coverage across three concrete slabs, with cabled backhaul
- Curtain pelmet coordination with the false ceiling — the classic track-vs-grille clash
- Anti-termite pre-treatment, earthing and lightning protection, gas leak detection
- Secured dry storage for marble, veneer and shutters delivered before they are needed
- **Furniture access plan** — the lift car is 5'6" × 5'0". The theatre recliners,
  the sectional sofa and slab countertops have to be checked against the lift,
  the stair turn and the balcony openings *before* ordering, or craned
- As-built drawings photographed before concealed work closes; defect liability
  period and retention release agreed and dated

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 70 tests over the model, workflow, seed and CRUD integrity
npm run typecheck
npm run build
```

Next.js 15 (App Router) · TypeScript strict · Tailwind 4 · Vitest.

State lives in a reducer over the whole project, persisted to `localStorage`, so
the app runs with no database and no configuration. `lib/store.tsx` is the only
place that knows about persistence; swapping it for a real backend touches
nothing else. **More → Reset to seeded project** puts everything back.

## Layout

```
lib/model/types.ts       the villa model — ScopeItem is the spine
lib/model/costing.ts     cost build-ups and the indicative rate table
lib/model/derive.ts      roll-ups, forecast, completeness engine, heatmap fuel
lib/seed/spaces.ts       the villa as drawn, with plan dimensions
lib/seed/scope-templates.ts   per-room-type checklists
lib/seed/master-scope.ts      house-wide scope
lib/seed/build.ts        generates scope items and a coherent money ladder
lib/seed/content.ts      curated ideas, options, decisions, quotes, snags, notes
lib/plans/geometry.ts    floor-plate SVG geometry
lib/search.ts            answers questions first, indexes everything else
lib/model/categories.ts  the taxonomy and rate card, and the lookups over it
lib/model/schema.ts      per-collection editable fields — one source for every form
lib/store.tsx            reducer, uniform CRUD, delete cascades, persistence, roles
```

## The seeded project

The villa arrives mid-flight, deliberately: the ground floor is being executed,
the first floor is in approvals, the second floor and the garden are still being
designed. Every stage of the workflow is therefore visible at once.

The figures are illustrative working numbers for a premium Hyderabad fit-out,
not market quotations. The original budget is derived so that the project sits
slightly over it — which is the normal condition of every fit-out and the whole
reason this product exists.
