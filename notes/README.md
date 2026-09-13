# Notes — an AI-native personal intelligence system

> Capture anything. Organize nothing. Find everything. Act on what matters.

Lives at **notes.hkfire.app**. A single-owner note-taking system where raw
information turns itself into structured knowledge: people, companies, topics,
decisions (with history), tasks, open loops, numbers, timelines and a daily
brief — with every AI statement traceable to the note it came from.

## What it does

| You do | The system does |
|---|---|
| Write a note, dictate a voice note, paste a link, drop a screenshot, end a live meeting | Extracts people, companies, projects, topics, decisions, actions, commitments, numbers and dates; files them; builds timelines; embeds the note for semantic search |
| Mention "Samsung ask = 40%" after having written "30%" | Records a **change** (30% → 40%) on the Samsung page, the note, Home and the next meeting prep |
| Write "Decision: cap remains at 25%" and later "proposal to raise to 50–75%" | Links both to one **decision** with a dated history: decided → proposed → contradicted |
| Say "I'll send the enablement plan" | Tracks an **open loop** and nudges when it goes stale |
| Open an upcoming meeting | Generates prep: who, last time, what they asked, what you promised, unresolved items, what changed, what to ask |
| Ask "What did we decide about marketplace caps?" | Retrieves the relevant passages (pgvector + keywords), answers **only** from them, and cites each source; clicking a citation opens the exact passage |

Everything works with **no API keys** through a deterministic local
understanding layer. Add `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` and the same
pipeline uses a model for extraction, summaries, briefs, generated outputs and
synthesized answers. Gemini also enables server-side transcription and
screenshot understanding.

## Stack

Next.js 15 (App Router, `after()` for background processing) · React 19 ·
TypeScript strict · Tailwind 4 · TipTap 2 editor · Drizzle ORM ·
Postgres + pgvector in production, embedded PGlite (with pgvector) locally ·
Anthropic SDK / Gemini REST · Vercel.

## Screens

Home (briefing) · Inbox (activity feed of what AI filed) · Notes · Note editor
(slash commands, @mentions, tables, tasks, callouts, floating AI toolbar,
autosave) · Meetings · Meeting detail (prep, summary, decisions, actions,
transcript, follow-up email, executive readout) · Live meeting mode · Tasks
(Today / week / overdue / waiting / delegated / completed) · People · Person
detail · Companies · Company detail · Topics · Topic detail · Decisions ·
Decision detail (history) · Open loops · Research projects (with synthesis) ·
Search (keyword + semantic + entities, grouped) · Ask my notes (streaming,
cited) · Settings · Graph (optional advanced view) · Voice capture.

Keyboard: `⌘K` command bar · `⌘N` new note · `⌘⇧N` / `⌥Space` quick capture ·
`⌘P` search · `⌘↵` AI on selection · `⌘\` sidebar · `⌘.` intelligence panel.

## Local development

```bash
cd notes
npm install
npm run db:seed          # embedded PGlite in .data/ — no external services
npm run dev              # http://localhost:3000
```

The database migrates itself and loads the demo dataset on first run, so the
seed step is optional. `FORCE_RESEED=1 npm run db:seed` wipes and reloads.
`npm run db:inspect` prints what the pipeline derived (entities, tasks,
decisions, loops, facts, changes, insights).

```bash
npm run typecheck
npm run build
```

## Environment variables

All optional. Copy `.env.example` to `.env.local`.

| Variable | Effect |
|---|---|
| `APP_PASSWORD` | Require a password. Unset = open (demo) access. |
| `SESSION_SECRET` | Signs the 30-day session cookie (`openssl rand -hex 32`). |
| `DATABASE_URL` | Postgres with the `vector` extension available (Neon, Supabase, Vercel Postgres). Unset = embedded PGlite; on Vercel that means ephemeral `/tmp` storage reseeded per instance. |
| `ANTHROPIC_API_KEY` | Claude (`claude-opus-5` by default, `ANTHROPIC_MODEL` to change) for extraction, summaries, Q&A, generated outputs. |
| `GEMINI_API_KEY` | Gemini as LLM plus Gemini embeddings, audio transcription and image understanding. Models are discovered at runtime (newest stable Flash that the key can actually call, `gemini-embedding-001` for vectors); set `GEMINI_MODEL` / `GEMINI_EMBEDDING_MODEL` to pin them. `/api/health?probe=ai` shows what was resolved. |
| `AI_PROVIDER` | Force `anthropic`, `gemini` or `local`. Default: first configured key, else local. |
| `USER_NAME` | Name used in greetings and as the default task owner (default `Harsha`). |
| `HOME_COMPANY` | Your employer, excluded from "customer" counts in insights (default `Google Cloud`). |
| `CRON_SECRET` | Protects `/api/cron/daily-brief` (runs nightly via `vercel.json`). |

## Architecture

```
lib/db/schema.ts      first-class objects: users, contexts, notes, meetings, transcripts,
                      entities, note_entities, entity_relations, tasks, decisions,
                      decision_revisions, commitments (open loops), facts, changes,
                      research_projects, sources, attachments, timeline_events,
                      embeddings (vector 768), insights, ai_calls
lib/pipeline.ts       processNote(): extraction → entity resolution → tasks/decisions/
                      loops/facts/changes/timeline/relations → summary → embeddings → insights
lib/ai/               provider abstraction (local heuristics | Gemini | Anthropic),
                      embeddings (local hashed | Gemini), prompts
lib/search.ts         hybrid search grouped by type
lib/retrieval.ts      RAG passage retrieval;  lib/ask.ts streams cited answers
lib/prep.ts           meeting prep;  lib/briefing.ts daily brief;  lib/generate.ts outputs
lib/insights.ts       proactive observations, computed from the graph (never hallucinated)
app/api/*             the API boundary every screen uses
```

Contexts (Work / Personal / Finance / Family / Research) are hard data
boundaries: queries, retrieval and AI scope are per-context; cross-context
search only when explicitly requested.

## Integration boundaries (mocked today, designed to plug in)

Calendar sync lands in `meetings` (`status: upcoming`) and gets prep
automatically. Email forwarding lands in `notes` with `kind: email` through the
same `/api/capture` path as links and files. Object storage replaces the inline
attachment bytes behind `attachments.storageUrl`. Server transcription and OCR
sit behind `lib/media.ts`.

## Deploying to Vercel

Vercel project root directory: `notes`. No environment variables are required
for the demo. For persistence add a Postgres `DATABASE_URL` (the `vector`
extension is created by the first migration). Add the domain
`notes.hkfire.app` to the project and a CNAME `notes → cname.vercel-dns.com`.


## Mobile and offline

Notes is an installable web app (PWA). On a phone, open notes.hkfire.app and use **Add to Home Screen**; it then launches full-screen with its own icon.

- **Touch-first shell**: bottom navigation with a central capture button, a formatting bar in the editor (no keyboard shortcuts needed), the intelligence panel as a bottom sheet (✦ in the top bar), larger tap targets on touch screens, and 16px form fields so iOS never zooms the page.
- **Works offline**: a service worker (`public/sw.js`) keeps every page you have opened readable without a connection and always keeps the offline notepad (`/offline`) available.
- **Offline capture and editing**: quick captures, edits to existing notes and new notes written in the offline notepad are stored on the device (IndexedDB, `lib/offline/`) and replayed in order the moment the app is back online. Replays keep the original timestamp and context, and go through the same AI filing as anything else. The top bar shows how many changes are waiting; `/offline` lists them with retry and discard.


## Meeting recordings from your phone

Record a meeting on your iPhone (Voice Memos, the Phone app's call recording, Notes, Otter…) and the recording or its transcript becomes a **structured meeting note** filed into the right context and connected to everything already known about the people in it.

- **Ways in**: *Meetings → Import recording* (drop an audio file up to 80 MB — uploaded in pieces — or a `.txt` / `.vtt` / `.srt` / `.json` transcript, or paste text); `POST /api/recordings` with a capture token from an iOS Shortcut, a script or an automation (JSON `{"transcript": "…"}` or multipart `audio=` / `transcript=`, optional `title`, `context`, `recordedAt`, `participants`, `notes`). Settings → *Capture from anywhere* has the Shortcut recipe.
- **What happens** (`lib/recordings/`): the job is visible stage by stage — *transcribing* (Gemini, diarized and time-stamped; long files go through the Files API) → *structuring* → *filing*. Structuring picks the context from the known people and companies mentioned (a model tie-breaks), pulls in what the notebook already knows about them (previous meetings, open loops, open tasks, earlier decisions, latest numbers) and asks the model for one document: attendees with speaker identification, purpose, how it connects to prior meetings, summary, key points, decisions, action items with owners, open questions, numbers, risks and next steps. Filing sends the same extraction through the normal pipeline, so tasks, decisions, commitments, facts and timeline events land in the graph with excerpts from the transcript.
- **What you get**: a meeting page with the recording (playable), the transcript with `Speaker 1 → Harsha` mapping, the AI summary, decisions, action items and open loops; the note itself keeps the structured sections on top and the verbatim transcript at the bottom. Nothing in the transcript is ever edited by AI. A failed job shows why and can be retried from the meeting page.
- **Transcript formats** understood without a model: `Speaker 1:` / `Name:` lines, `[mm:ss]` prefixes, WebVTT (incl. `<v Name>`), SRT, JSON segment arrays and plain Voice Memos paragraphs.

## Tags and the graph

- **Automatic tags** — every time AI reads a note it stores 4–12 lowercase tags (`notes.tags`): the model's own topical tags, the topics and projects it found, and signal tags such as `meeting`, `recording`, `decision`, `action-items`, `open-loop`, `numbers`, `risk`. Without a model, a vocabulary-based tagger runs instead. You can add your own tags on any note (kept across reprocessing) and remove suggested ones. Tags show on note rows, the note panel and meeting pages; the Notes page filters by tag; search understands `tag:pricing` / `#pricing` alone or combined with words; `/tags` is the tag cloud with a one-click backfill for notes written before tagging existed.
- **Graph** — `/graph` is an interactive explorer over people, companies, topics, projects, tags, notes, meetings and decisions (`lib/graph.ts`, `GET /api/graph`). The overview shows the most-mentioned entities and tags linked by explicit relations, co-mentions and tag co-occurrence; *Focus here* (or *See in the graph* from any note, entity, meeting or tag) rebuilds the graph around one node, one or two hops deep. Pan, zoom, pinch, drag nodes to pin them, filter by type, search within the graph, click to inspect connections, double-click to open. Works at phone width.

## One view across everything, and tasks with details

- **All** — the context switcher (top of the sidebar) has an *All* entry above Work, Finance, Research and the rest. Home, Notes, Inbox, Tasks, Meetings, People, Companies, Topics, Tags, Decisions, Numbers, Open loops, Research, Search, Ask, the weekly review and the graph then span every context, and each row carries a small badge naming its context. New notes and tasks written while *All* is selected go to the context you were in before switching (the switcher says which). Contexts still keep data separate; *All* only reads across them.
- **Task details** — every task has its own page (`/tasks/<id>`, click a task's title anywhere): the same editor as a note for the details (text, checklists, tables, sheets, inline images), plus a *Files and media* section for anything else: drop or add images, screenshots, voice notes, video and documents; images show as a gallery, audio and video play inline. *New task* takes details straight away; the rest is added on the task page.
- **Public task links** — *Anyone with the link can see it* on the new-task form, or *Share* on the task page, creates a read-only public link (title, status, owner, due date, priority, details and attachments, no sign-in needed). Attachments on a public page are served through the link's token, so nothing else in the notebook is exposed; revoke the link and the page and its files stop working. Notes' share pages now also show their images to public viewers the same way.

## Editing what the AI extracted, and deleting data

- **Create, edit and delete everywhere** — every list has a ⋯ menu on each row and a button to add by hand: tasks, open loops, decisions (with their history), meetings, people, companies, topics, research projects, numbers, and tags (rename or remove a tag from every note at once). Detail pages carry the same menu, and deleting from one returns you to the list. The AI still extracts most of it; nothing it produces is read-only.
- **Delete everything, or everything from a date** — Settings → *Danger zone* previews and deletes the notebook's content: everything, or only what was created in a date range (notes, meetings, tasks, loops, decisions, numbers, research, plus the people, companies and topics that no remaining note mentions). It asks for your password and the word DELETE. Platform administrators can empty any notebook from the admin console. Contexts, members and settings stay.

## Sheets, charts and the numbers dashboard

- **Sheets in notes** — type `/sheet` in any note for a spreadsheet block (`lib/sheet/`, `components/sheet/`). The grid behaves like a spreadsheet, not like a form: click or arrow to a cell and type, Enter edits or confirms, Tab and Enter move (and grow the sheet at the edge), Shift+arrows, Shift+click and the row/column headers select ranges, Delete clears, ⌘C/⌘X/⌘V copy, cut and paste blocks (formulas keep their relative references, Excel/Numbers/Google Sheets paste straight in, one value pastes over a whole selection), ⌘Z/⌘⇧Z undo and redo, ⌘D/⌘R fill down and right, and the small square at the corner of a selection is a fill handle that continues number series, `Q1`/`Week 3`, month and day names, or drags formulas along. Right-click (or the Rows/Columns menus) inserts and deletes rows and columns with every formula reference rewritten, sorts by a column, and clears; column edges drag to resize; the formula bar edits the active cell and clicking cells while typing a formula inserts their references; the status bar sums the selection; ⤢ opens the sheet full screen. Formulas are Excel-style (`=SUM(B2:B4)`, `IF`, `SUMIF`/`COUNTIF`/`AVERAGEIF(S)`, `VLOOKUP`/`INDEX`/`MATCH`, `ROUND`, text functions, and finance: `PMT`, `FV`, `PV`, `NPV`, `IRR`, `NPER`, `CAGR`, `PCT`), with per-column formats (number, integer, currency, percent). Charts are added from the toolbar (bar, line, area, pie) over the selection or the whole sheet: the first row becomes series names and the first column the labels, with hover tooltips, a legend and a table view. Sheets render read-only on share pages, and their computed values are part of the note's text, so search, AI and the numbers pipeline see them.
- **Numbers dashboard** — `/numbers` turns every figure the pipeline extracted from notes and meetings into KPI tiles (current value, change since the previous observation, source link) and trend charts per measure with one series per person or company. Filter by who and by measure; `?all=1` spans contexts.

## Contexts and sample data

- **Contexts** (categories) are managed in Settings → Contexts: add (name, kind, description), rename, and remove. Removing one either moves everything it holds into another context (people and companies with the same name are merged) or deletes it all.
- **Sample data** — the demo dataset the app ships with can be removed in Settings → Data → *Remove sample data*: sample notes, meetings, transcripts, research, decisions and everything derived from them go away, entities nothing refers to any more are dropped, and the samples never come back. Notes you wrote, and the contexts, stay.

## Running it as a SaaS

The same deployment can be a multi-tenant product with self-service accounts. Everything below is on by default when `APP_PASSWORD` is set; nothing else is required.

- **Public pages** — `/welcome` (landing), `/signup`, `/login`, `/forgot`, `/reset/<token>`, `/terms`, `/privacy`. A signed-out visitor on `/` lands on `/welcome`. The product is free: there are no plans, quotas or billing.
- **Registration** — name, email, password (8+, not guessable) and an optional sample dataset. Sign-up creates a private notebook with the default contexts, signs the person in and sends a confirmation email. Rate-limited per IP.
- **Email verification** — a banner asks until the address is confirmed; the admin can require confirmation before sign-in (Admin → Settings). Password reset works from `/forgot` with single-use links valid for one hour; a reset signs every other device out.
- **Sessions** — cookies carry a token version; *Sign out everywhere else* (Settings → Account) and password resets invalidate older cookies at once.
- **People** — Settings → *People*: the owner invites by email (sent through Resend when configured, otherwise a link to copy), revokes invitations, changes roles and removes members.
- **Account deletion** — Settings → Account → *Delete my account*: an owner takes the whole notebook with them; a member just leaves. Password and typing DELETE are required.
- **Email** — `RESEND_API_KEY` + `EMAIL_FROM` send verification, reset and invitation emails. Without them every link is shown on screen and logged, so local development needs no mail provider.
- **Platform admin** — `/admin` has four tabs: *Overview* (sign-ups, active notebooks, integrations, audit log), *Notebooks* (enter, disable, delete, invite), *People* (search every account; confirm email, reset password, sign out everywhere, disable, remove) and *Settings* (registration open / invite only / closed, require verification, offer sample data, product name, support email, announcement banner).
- **Onboarding** — a first-week checklist on Home for fresh notebooks, the announcement banner and the verification banner in the app shell.
- **No demo data** — a fresh install starts with an empty Primary notebook. Installations that were seeded with the demo dataset have it removed once, automatically, on the first request after upgrading; everything the owner wrote stays. Sample data is only ever loaded on request (the sign-up checkbox or Settings → *Reset to sample data*) and can be removed again from Settings → Data.

## Notebooks for other people (admin)

One deployment can host many private notebooks. The first account (the owner) is the platform **admin** and sees **Admin** in the sidebar:

- **Create a notebook** for someone: name, owner name and email, then either a one-time temporary password or an invite link (valid 7 days). Tick *Load sample data* to start them with the demo content instead of an empty notebook.
- **Invite members** into an existing notebook, **reset passwords**, **disable/enable** or **delete** notebooks, and **enter** a notebook to see what its owner sees (shown with a banner and recorded).
- The **audit log** records every administrative action; the usage cards show notes and AI calls per notebook.

Every query, page, API and background job is scoped to one notebook: contexts belong to a notebook, so a user of notebook B gets *not found* for anything in notebook A, including search and Ask. Sign-in is email + password (leave the email blank to sign in as the owner with `APP_PASSWORD`, or set your own password in Settings → Account).

## Platform features

- **Bring your own AI keys** — Settings → *AI for this notebook*: use the deployment's shared keys, your own Anthropic/Gemini keys (encrypted at rest with `SESSION_SECRET`/`ENCRYPTION_KEY`), or run local-only. *Test this configuration* runs a real call.
- **Capture from anywhere** — Settings → *Capture from anywhere* creates a token for `POST /api/capture` with `Authorization: Bearer hkn_…` (JSON or multipart), for iOS Shortcuts, Zapier or scripts. Captures land in the Inbox and are filed by AI.
- **Templates** — seven built-ins (meeting notes, 1:1, decision record, weekly review, project brief, customer call, daily journal) plus your own (*Save as template* in a note's menu). *New note from template* on the Notes page or in the command bar; `/template` in the editor; `{{date}} {{time}} {{weekday}} {{title}} {{notebook}} {{name}}` placeholders.
- **Version history** — every analyzed save keeps a version (the pre-edit state is kept as *original*); *Version history…* in a note's menu shows them with word deltas and one-click restore.
- **Share links** — *Share read-only link…* creates a public `/s/<token>` page (7 days, 30 days or no expiry) with view counts and revocation; the notebook owner can turn public links off entirely in Settings → Sharing.
- **Trash** — deleted notes wait 30 days in `/trash` with restore and delete-forever; the nightly cron purges older ones together with everything derived from them.
- **Import** — Settings → Import takes Markdown/text files (front matter or first heading become the title, dates are preserved) and the app's own JSON export; duplicates are skipped and every note is analyzed.
- **Weekly review** — `/review`: notes, meetings, decisions, changed numbers, actions closed/added/overdue, new people and companies and aging open loops for any week, plus an AI-written narrative from those facts only.
