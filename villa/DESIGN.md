# Villa 14 — design language

Oak, stone and brass: the house's own Scandinavian scheme, applied to the app.
A pale stone ground, deep green-black ink, and brass as the one warm note.
Labels are lettered in a monospace, the way titles and dimensions are lettered
on an architect's drawing.

The source of truth is `app/globals.css` (tokens and component classes) and
`components/ui.tsx` (React primitives). This file says how to use them.

## Colour

Use the Tailwind token classes — never a hex literal in a page.

| Role | Token | Use |
| --- | --- | --- |
| Page | `bg-paper` | the stone ground |
| Sunken / hover | `bg-paper-2`, `bg-paper-3` | wells, row hover, bar tracks |
| Raised | `bg-card` | cards, dialogs, tables |
| Text | `text-ink`, `text-ink-2` | headings and body |
| Secondary text | `text-ink-3` | captions, metadata — passes AA |
| Decoration only | `text-ink-4` | placeholders, disabled, chevrons. **Never for text people must read.** |
| Lines | `border-line`, `border-line-2` | dividers, control borders |
| Accent (brass) | `text-accent`, `bg-accent`, `bg-accent-soft`, `text-accent-strong` | what is active, chosen, recommended, or a link |
| Status | `good`, `warn`, `bad`, `info` (+ `-soft`) | state only, never decoration |

Chip tones: `neutral | accent | good | warn | bad | info | ghost`. `toneInk(tone)`
gives the text colour for a figure in that tone.

Drawings (floor plans, room layouts, the 3D model) keep their own illustration
palettes — they are pictures, not UI.

## Type

- One family: Schibsted Grotesk (bundled via `@fontsource-variable`). Headings
  are 600 weight with tight tracking. Body is 14.5px; nothing people must read
  is under 12px.
- `.eyebrow` — IBM Plex Mono, 11px, uppercase: the label above a block.
- `.tnum` marks a number. It keeps lining figures but not tabular spacing,
  because Schibsted's tabular set also widens commas and points ("₹1 . 62 L").
  Right-align numbers in tables with `.table .num`; use `.tabular` only where
  bare digits (no commas or points) must line up.
- Page title: `PageTitle` (28/34px). Section: `Section` (17px `h2`). Card
  heading: 15–16px semibold.

## Layout

- Every page starts with `PageTitle`. Its eyebrow is the menu group, filled in
  automatically; pass `back` for a page deeper in (a room, a vendor).
- Group content into `Section`s with a title and at most one "see all" link.
- Use **one card with dividers** (`card divide-y divide-line`) for a list, not
  a stack of separate cards. Separate cards are for things that are separate
  objects (a layout option, a room tile).
- Gaps, not margins: `grid gap-*` / `flex gap-*`.
- Content max width 1200px; the shell handles gutters.

## Components (classes in `globals.css`)

- Buttons: `.btn` (secondary), `.btn-primary` (the one main action on a
  screen — `.btn-accent` is an alias), `.btn-ghost`, `.btn-danger`,
  `.btn-danger-quiet`, sizes `.btn-sm`, `.btn-icon`. Put an `Icon` before the
  label for create actions (`plus`). Icon-only buttons need `aria-label`.
- Filters and segmented choices: `.pill` with `aria-pressed={on}`.
- Inputs: `.input` on input/select/textarea. Wrap in `Field` for a label,
  hint and error. Show errors after a submit attempt, not before.
- Tables: `.table` inside `card overflow-auto`; `.num` on numeric cells.
  Phones get cards instead of wide tables.
- `Chip` for status. `StageChip` for scope stages.
- `Tabs` — underline tabs with counts and arrow-key navigation. Keep to ~7.
- `Sheet` — the dialog (bottom sheet on phones). Put actions in `footer`.
  `Confirm` for anything destructive. Never `window.confirm/alert/prompt`.
- `useToast()` — confirm that something happened ("Vendor created").
- `Empty` — says why it is empty and offers the way out (`action`).
- `Icon name="…"` from `components/Icon.tsx`: 20px grid, 1.6 stroke.

## Interaction

- The next action is obvious: one primary button per screen, top right in
  `PageTitle`, or inside the empty state.
- Row actions: icon buttons (`edit`, `trash`), quiet until hover on desktop,
  always visible on touch.
- Touch targets are 44px on coarse pointers (the classes handle this).
- Focus is always visible (brass outline). Dialogs trap and restore focus.
- Motion: `.animate-rise` / `.animate-pop` only; all motion respects
  `prefers-reduced-motion`.

## Words

Plain and specific, from the reader's side. Buttons say what happens ("Add
vendor", "Save changes", "Delete room"). Errors say what went wrong and what to
do. No "Oops", no exclamation marks.
