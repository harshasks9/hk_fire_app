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
