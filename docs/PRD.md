# Product Requirements Document — Notebook administration and platform capabilities

**Product:** Notes · **Release:** 0.3 "Notebooks" · **Date:** 12 September 2026
Companion to `docs/BRD.md`. Requirement IDs are referenced from code comments and tests where useful.

---

## 0. Concepts

- **Notebook** — the unit of tenancy. Owns contexts, notes and everything derived from them, its own members, AI settings, tokens, templates and share links.
- **User** — a person with an email and password. Belongs to exactly one notebook with a role: `owner` or `member`. The platform administrator additionally has role `admin`.
- **Session** — a signed cookie carrying user id, notebook id and role, valid for 30 days.
- **Open mode** — when `APP_PASSWORD` is not set (local demos), the app behaves as the Primary notebook's owner with no sign-in.

---

## 1. Notebook administration (F0)

**Goal:** the platform admin creates and operates notebooks for other people from inside the app.

### Requirements
- A1. `/admin` is visible in the sidebar only for `admin` users; any other role gets 404.
- A2. **Notebook list** shows for each notebook: name, owner (name, email), members, status, notes count, AI calls in the last 7 days, last activity, created date.
- A3. **Create notebook** form: notebook name, owner name, owner email, onboarding method (*generate a temporary password* or *send an invite link*), *Load sample data* checkbox. On submit the notebook, default contexts (Work, Personal, Finance, Family, Research) and the owner user are created; the response shows the temporary password or invite URL once.
- A4. **Invite member** for a notebook: email + role → invite URL valid for 7 days. Accepting creates the user and signs them in.
- A5. **Reset password** for any user → new temporary password shown once; the user's other sessions stay valid until expiry (documented).
- A6. **Disable / enable notebook**: disabled notebooks reject sign-in and API tokens with a clear message; data is retained.
- A7. **Delete notebook**: requires typing the notebook name; removes all of its data, members, tokens, links, templates; cannot delete the Primary notebook or the admin's own.
- A8. **Enter notebook**: the admin can switch their session to view another notebook (banner shown, action logged) and switch back.
- A9. **Audit log**: every admin action (create, invite, reset, disable, enable, delete, enter, leave) is recorded with actor, target and time; the last 200 are listed.
- A10. **Usage cards**: totals across notebooks (notebooks, users, notes, AI calls today/7d, failed AI calls).

### Acceptance
- Creating a notebook with sample data yields the same demo content as a fresh install, scoped to that notebook only.
- A member of notebook B requesting `/notes/<id of a note in A>` or `GET /api/notes/<id>` receives 404; search and Ask in B never return A's content.

---

## 2. Accounts and invites (F1)

- U1. Sign-in form takes **email + password**. If the email is left blank, the request is treated as the owner sign-in (compatible with the existing password-only flow).
- U2. Passwords are hashed with scrypt (N=16384, r=8, p=1, 32-byte key, random 16-byte salt).
- U3. The owner account may use `APP_PASSWORD` from the environment until a password is set in Settings; after that the stored hash wins.
- U4. Settings → Account: change name, email and password (current password required).
- U5. Invite links: `/invite/<token>`; token is 32 random bytes (base64url), single-use, expires after 7 days; the page shows the notebook name and asks for name + password.
- U6. Rate limiting on sign-in: 8 attempts per 15 minutes per IP (existing).
- U7. Sign-out clears the cookie. Disabled users or notebooks cannot sign in.

---

## 3. Bring-your-own AI keys (F2)

- K1. Notebook AI mode: **Shared** (deployment keys), **Own keys**, **Local only** (no model calls).
- K2. Own keys: Anthropic key and/or Gemini key; preference `auto | anthropic | gemini`. Stored AES-256-GCM encrypted with a key derived from `SESSION_SECRET`; the UI shows only the last 4 characters after saving.
- K3. "Test" runs the existing model probe with the notebook's configuration and reports the resolved models or the error.
- K4. All model calls made on behalf of a notebook (extraction, summaries, Ask, prep, rewrite, embeddings, brief) use that notebook's configuration; background processing of a note uses the note's notebook.
- K5. AI call log rows record the notebook, so usage is attributable.

---

## 4. Capture API tokens (F3)

- T1. Settings → Integrations: create a token with a label; the secret is shown once; list shows label, created, last used; revoke.
- T2. `POST /api/capture` accepts `Authorization: Bearer <token>` in addition to the session cookie. Body is `multipart/form-data` (`text`, `files`, optional `context` slug, optional `capturedAt`) or `application/json` (`{ text, url?, context?, capturedAt? }`).
- T3. Token secrets are stored as SHA-256 hashes; comparison is constant-time; a revoked or disabled-notebook token returns 401.
- T4. The page documents a curl example and an iOS Shortcut recipe.

---

## 5. Note templates (F4)

- P1. Built-in templates: Meeting notes, 1:1, Decision record, Weekly review, Project brief, Customer call, Daily journal.
- P2. Custom templates per notebook: "Save as template" from a note's menu (name + description); manage (rename/delete) in Settings.
- P3. "New from template" on the Notes page and in the command bar opens a picker; creating fills `{{date}}`, `{{time}}`, `{{weekday}}` and `{{notebook}}`.
- P4. In the editor, `/template` inserts a template body at the cursor.

---

## 6. Version history (F5)

- V1. A snapshot (title, content, text, word count) is written when a note is saved with processing and its content differs from the latest snapshot; at most one snapshot per 60 seconds per note; the last 200 per note are kept.
- V2. Note menu → History lists versions with time, word delta and a preview; **Restore** replaces the current content (after snapshotting the current state) and reprocesses.

---

## 7. Share links (F6)

- S1. Note menu → Share creates a link `/s/<token>` (32 random bytes) with expiry: 7 days, 30 days or never. Existing links are listed with views; each can be revoked.
- S2. The public page renders title, date and the note body read-only in the app's typography, with a footer "Shared from Notes"; no navigation, no AI content, no attachments beyond images embedded in the note.
- S3. A notebook setting can disable public sharing; expired or revoked links return 404.

---

## 8. Trash (F7)

- D1. Deleting a note moves it to Trash (existing soft delete). `/trash` lists deleted notes with deleted time and days remaining.
- D2. Restore returns the note (and reprocesses it); Delete forever removes the note and all derived rows and vectors.
- D3. The nightly cron purges notes deleted more than 30 days ago.

---

## 9. Import (F8)

- I1. Settings → Import accepts `.md`, `.markdown`, `.txt` and the app's export `.json` (multiple files, up to 25 MB per request).
- I2. Markdown: title from YAML front matter `title:` or the first `# heading` or the filename; date from front matter `date:`/`created:` or the file's last-modified time. Front matter is stripped from the body.
- I3. JSON export: notes are imported with their titles, markdown and timestamps into the matching context by slug when it exists, else the active context.
- I4. Imported notes are processed by the pipeline in the background in slices; the response reports created/skipped and duplicates (same title + same day + same text hash) are skipped.

---

## 10. Weekly review (F9)

- W1. `/review` shows the current week (Mon–Sun) with previous/next navigation and a week picker.
- W2. Computed sections: notes captured, meetings held, decisions made or changed, numbers that changed, tasks completed and added, still-overdue tasks, new people and companies, open loops older than 7 days.
- W3. "Write the narrative" asks the notebook's model for a 5–8 sentence reflective summary from those facts; stored per context and week; regenerable; shown as AI content.
- W4. Sidebar entry "Weekly review"; keyboard-navigable.

---

## 11. Non-functional

- N1. Migration `0001_notebooks` is additive and backfills the Primary notebook; runs automatically on Postgres and PGlite.
- N2. Every by-id read in the query layer returns not-found for rows outside the session's notebook; every by-id mutation route verifies ownership before writing.
- N3. No secrets in logs; tokens and keys never appear in API responses after creation.
- N4. All new pages work at phone width and inherit the offline shell (pages you open are readable offline; writes queue).
- N5. Type-check, unit tests and a Playwright smoke test (create notebook → invite → sign in → isolation) pass before deploy.

---

## 12. Meeting recordings from a phone (F10)

Goal: a recording made on a phone (or the transcript an app produced from it) becomes a structured meeting note in the right context, connected to what the notebook already knows, with no manual filing.

- R1. Ways in: *Meetings → Import recording* in the app (audio up to 80 MB uploaded in 3 MB pieces; `.txt`, `.vtt`, `.srt`, `.json` or pasted transcripts) and `POST /api/recordings` for Shortcuts and automations (session cookie or capture token; JSON, multipart or a plain-text body). Both answer immediately with the meeting to open.
- R2. Every job reports its stage on the meeting (`uploading → queued → transcribing → structuring → filing → done | failed`) with the error when it fails; the import page and the meeting page follow it live and offer *Try again*.
- R3. Transcription (audio only): Gemini, diarized (`Speaker N`) with turn timestamps; recordings above the inline limit are sent through the Files API. Without a Gemini key the job fails with an actionable message; pasting the transcript always works.
- R4. Transcript parsing without a model: speaker-labelled lines, timestamp prefixes, WebVTT, SRT, JSON and plain paragraphs. Speakers and times are preserved in the `transcripts` row.
- R5. Context: an explicit context wins; otherwise the job scores the notebook's contexts by known people/companies mentioned and lets the model break ties, defaulting to Work.
- R6. Prior knowledge fed to structuring: known entities of the context, the last meetings involving the mentioned people/companies, open loops, open tasks, earlier decisions and latest numbers about them.
- R7. Structuring output (one model call, JSON): title, attendees with `speaker → name` and confidence, purpose, context links, summary, key points, decisions, action items with owner/due, open questions, numbers, risks, next steps, plus the standard extraction fields. Generic speaker labels are only renamed at confidence ≥ 0.6 and never become people.
- R8. The note = structured sections (marked as generated) + `## Transcript` verbatim with resolved speaker names; the meeting gets the title, duration and end time; attendees become `attended` relations; the extraction is filed through the pipeline without a second model call.
- R9. The recording is kept as an attachment (playable on the meeting page) and referenced from the transcript; the audio is never modified.
- R10. Isolation: every recordings route verifies the meeting/attachment belongs to the caller's notebook; tokens only reach their own notebook.

---

## 13. Automatic tags (F11)

- G1. The pipeline stores `notes.tags` (auto) and keeps `notes.manual_tags` (owner-added) separately; both are lowercase kebab-case, at most 32 characters, deduplicated; automatic tags are capped at 12.
- G2. Sources of automatic tags, in order: the model's `tags` array in the extraction, topics and projects as slugs, then signal tags (`meeting`, `voice-note`, `link`, `screenshot`, `recording`, `decision`, `action-items`, `open-loop`, `numbers`, `risk`). The local extractor uses a vocabulary tagger.
- G3. Notes page: `?tag=` filter, top-tag chip row with the active tag highlighted, tags on each row. Note panel: editable tags (add, remove suggested, remove own). Meeting page shows the note's tags.
- G4. Search: `tag:x` and `#x` filters (repeatable) restrict keyword and semantic note hits; a tag-only query lists tagged notes newest first; tag names matching the query appear as a *Tags* group.
- G5. `/tags`: every tag with counts, sized by frequency, linking to the filtered Notes page; a backfill control reprocesses untagged notes in slices until none remain.

## 14. Graph explorer (F12)

- H1. `GET /api/graph` returns nodes (`person`, `company`, `topic`, `project`, `tag`, `note`, `meeting`, `decision`) and edges for the active context (or all contexts), in overview or focus mode, capped (default 160 nodes, `truncated` flag).
- H2. Overview: top entities by mentions and top tags; edges from explicit relations, co-mentions (≥2 shared notes) and tag↔entity co-occurrence (≥2 notes); notes, meetings and decisions are opt-in types.
- H3. Focus: the seed node plus direct neighbours across all types (relations, mentions, tags, meetings, decisions, related notes by shared entities); depth 2 expands entity and tag neighbours with a per-node cap.
- H4. Client: animated force layout with auto-fit, pan/zoom/pinch, node dragging (pins), type filters with counts, in-graph search, hover highlighting, a detail panel listing every connection with its relation, *Focus here*, *Open*, double-click to open; URL reflects focus/types/depth.
- H5. Entry points: sidebar *Graph*, command bar, *See in the graph* on notes, entity pages, meeting pages and the tags page.

---

## 15. Contexts and sample data (F13)

- C1. Settings → Contexts: create (name, kind, description; slug derived, unique per notebook, at most 24), rename/describe, remove. Members cannot change contexts.
- C2. Removing a context requires a choice: move everything to another context (all context-scoped rows re-pointed; entities of the same type and slug in the target are merged, mentions and references re-linked) or delete everything in it (no Trash). The last context cannot be removed; the active-context cookie is cleared so the app falls back.
- C3. Settings → Data → *Remove sample data* (owner/admin only) deletes the sample notes and meetings by their seeded ids together with everything derived (tasks, decisions and revisions, commitments, facts and changes, timeline, mentions, attachments, sources, versions, share links, embeddings, transcripts), sample research projects (owner notes are unfiled, not deleted), then any entity no row refers to; insights and weekly reviews are cleared to rebuild. `settings.sampleData=false` is recorded and the seed marker stays so the bootstrap never re-seeds.

## 16. Sheets and charts (F14)

- S1. `/sheet` inserts an atomic editor block whose JSON (`rows`, `cols`, `cells` A1→raw text, `formats` and `widths` per column, `charts`) lives in the note document; the block is draggable and removable.
- S2. Formulas start with `=`: numbers (incl. `12%`, `1,200`, `$3.5M` literals), strings, booleans, cell and range references, `+ - * / ^ & % =` and comparisons, ~60 functions (math, statistics, text, logic, criteria, lookups, finance). Errors are `#DIV/0!`, `#REF!`, `#NAME?`, `#VALUE!`, `#CYCLE!`, `#N/A`, `#NUM!` and show their detail in the formula bar.
- S3. Editing (spreadsheet behaviour, isolated from the note editor: no key, click or paste inside the grid reaches ProseMirror): arrows/Tab/Enter move, Enter or F2 or typing edits, Enter/Tab confirm and move (growing the sheet past the last row/column), Escape cancels, Shift+arrows / Shift+click / header clicks and drags select ranges, ⌘A selects all, Home/End/⌘-arrows jump, Delete clears the selection, ⌘C/⌘X/⌘V copy, cut and paste with relative-reference translation (external TSV/CSV parsed; a single value tiles over a selection), ⌘Z/⌘⇧Z/⌘Y local undo/redo, ⌘D/⌘R fill down/right, fill handle continues series (numbers, `Q1`, `Week 3`, months, weekdays) or repeats and translates formulas, right-click and toolbar menus insert/delete rows and columns (references rewritten; deleted ranges shrink, deleted cells become `#REF!`), sort by column, clear; column resize by dragging header edges (widths stored per column); formula bar edits the active cell and cell clicks/drags insert references while a formula is being typed; selection stats (sum, average, count) in the status bar; full-screen mode; arrowing past the top or bottom returns focus to the document.
- S4. Charts: bar, line, area, pie over a range; header row and label column detected; categorical palette in fixed order (eight slots, extra series fold into the table view), thin marks with rounded data-ends, hairline grid, hover tooltip, legend for two or more series, table toggle; dark mode uses the dark palette.
- S5. Projections: text (`Sheet: title` + computed rows) for search/AI, Markdown tables for export, read-only rendering on share pages.

## 17. Numbers dashboard (F15)

- Q1. `/numbers` groups extracted facts by entity and canonical label with their history (superseded values included, duplicates collapsed) and shows tiles (latest value, delta vs previous, date, source link) and one line chart per measure with entities as series.
- Q2. Filters by entity, measure and text; `?all=1` spans every context; empty state explains where numbers come from and points at `/sheet`.


---

## 18. Self-service registration and account recovery (F16)

**Goal:** anyone the platform allows can create their own notebook without the administrator, and can recover the account without support.

- R1. `POST /api/signup` (name, email, password, optional sampleData) creates a notebook with the default contexts and an owner user, signs them in and sends a verification email; honours the platform's registration mode (open / invite / closed); rate-limited per IP; duplicate emails return 409.
- R2. Passwords: 8–200 characters, not a repeated character or a top-guess; emails validated and stored lower-cased.
- R3. Verification tokens are random, hashed at rest, single use and valid 24 h; `GET /api/auth/verify?token=` marks the address verified and lands in the app. A banner in the app shell offers *Resend*. When *require verification* is on, sign-in is refused until confirmed (with a resend link).
- R4. `POST /api/auth/forgot` always answers the same; a reset link (1 h, single use) goes by email or, without email configured, is returned for the UI. `POST /api/auth/reset` sets the password, bumps the user's token version (every other session ends) and signs the browser in.
- R5. Sessions carry the token version; *Sign out everywhere else* bumps it and re-issues the caller's cookie.
- R6. Public pages `/welcome`, `/signup`, `/forgot`, `/reset/<token>`, `/terms`, `/privacy`; a signed-out `/` redirects to `/welcome`; deep links still go to `/login?next=`.

## 19. Free product (F17)

- P1. The product has no plans, quotas or billing. Every notebook gets the full feature set; the only limits are the physical ones already in the code (attachment size, recording size).
- P2. Public pages never mention pricing; the terms state that the service is free and that fair-use limits, if ever applied, will be announced in the app.
- P3. A fresh install starts with an empty Primary notebook. Installations seeded with the demo dataset by earlier builds have it removed once, automatically, on the first request after upgrading (`app_meta` key `demo-purged`); notes, meetings, people and everything else the owner created stay. Sample data is loaded only on request and is flagged on the notebook so it can be removed again.

## 20. People in a notebook (F18)

- M1. Settings → *People* lists members (role, confirmation, last sign-in) and open invitations.
- M2. Owners invite by email or link (`POST /api/members`), revoke invitations, change roles (`PATCH /api/members/:id`) and remove members (`DELETE`); the owner and the platform admin cannot be removed; removal deletes the person's tokens, not the notes.
- M3. Invitation emails are sent through the configured provider; otherwise the link is shown for copying. All actions are in the audit log.
- M4. Account deletion (`POST /api/account/delete`, password + DELETE): an owner deletes the notebook and everyone in it; a member leaves; the platform admin's account is protected.

## 21. Platform administration for a SaaS (F19)

- S1. Admin → *Settings* stores platform settings in `app_meta` (`platform:settings`): registration mode, require verification, offer sample data, product name, support email, announcement. Applied on the next request, no deploy.
- S2. Admin → *People*: every account with search; actions confirm email, reset password, sign out everywhere, disable/enable, remove.
- S3. Admin → *Overview* adds sign-ups (7 d) and active notebooks (7 d), plus integration badges (email, verification policy).
- S4. New audit actions: `user.signup`, `user.verify`, `user.unverify`, `user.signout-all`, `user.delete-self`, `invite.revoke`, `platform.settings`.
- S5. The announcement shows to everyone as a dismissible banner; the verification banner shows to unconfirmed non-admin users.
- S6. Home shows a first-week checklist for notebooks with fewer than five notes and no sample data.

## 22. Delete everything (F20)

- W1. Settings → Danger zone offers two deletions for the notebook's content: everything, or everything created in a date range (from/to, inclusive). Both show a live preview of what will go (notes, meetings, people/companies/topics, tasks, loops, decisions, numbers, research, attachments) and require the account password plus the word DELETE.
- W2. A range deletion removes the notes, meetings, tasks, loops, decisions (with revisions), numbers, changes, timeline entries and research projects created in the range, then only those people, companies and topics that no remaining note mentions. Insights, weekly reviews and cached briefs are dropped because they may quote removed content. Contexts, members, settings and API tokens stay.
- W3. Platform administrators can empty any notebook from the admin console; the action is audited (`notebook.wipe`, `notebook.wipe-range`).
- W4. One-time: release 0.6.2 emptied the Primary notebook once on first run, recorded in `app_meta` so it never repeats.

## 23. Create, edit and delete everywhere (F21)

- C1. Every list page has a per-row ⋯ menu with Edit and Delete and a header button to add by hand: tasks, open loops, decisions, meetings, people, companies, topics, research projects, numbers, tags (rename merges into an existing tag; remove strips it from every note). Detail pages carry the same menu; deleting from one returns to the list.
- C2. Editors are one shared dialog driven by a field spec (text, textarea, date, datetime, select). Dates entered by hand are stored at noon local time (due dates at 17:00) so they do not slip a day across time zones.
- C3. Routes: `POST/PATCH/DELETE` for entities, decisions (a manual decision gets a `made`/`proposed` revision), commitments, facts (numeric value parsed from `$7.6M`-style text), research, meetings (delete also removes transcripts, timeline entries, relations and embeddings and unlinks notes), tasks; `PATCH/DELETE /api/tags`. Deleting an entity removes its facts, relations, timeline and embeddings and nulls references on tasks, loops, decisions, meetings and insights; notes are never deleted by these actions.

## 24. All: one view across contexts (F22)

- A1. The context switcher offers *All* above the real contexts. Selecting it sets the context cookie to `all` and remembers the previous context in a second cookie; `getActiveScope()` returns every context id for reads while `getActiveContext()` keeps returning the remembered context for writes, so every create path (notes, quick capture, voice, tasks, meetings, research, entities) keeps working unchanged.
- A2. Every list query accepts one id or many (`inCtx` builds `=` or `in (...)`); Home, the sidebar, Notes, Inbox, Tasks, Loops, Decisions, Meetings, People/Companies/Topics, Tags, Numbers, Research, Search, Ask, Graph and the weekly review honour the scope. The daily brief and the weekly review narrative cache under `all:<notebook>` so the cross-context versions never overwrite a context's own.
- A3. While *All* is selected, rows show a context badge; page subtitles read *All*; the switcher footer names where new items go.

## 25. Task details, files and public links (F23)

- T1. `tasks.details` (editor JSON) with `details_text` (projection). `/tasks/<id>` shows status, owner, due, priority, context, entity and source, then the editor bound to the task (autosave via `PATCH /api/tasks/<id>` with `details`), then *Files and media*.
- T2. Attachments belong to a note **or** a task (`attachments.task_id`, `note_id` nullable). `POST /api/upload` takes `taskId` or `noteId`; `DELETE /api/attachments/<id>` removes one; images pasted or dropped into the details are stored the same way. Audio and video render as players; images as a gallery; other files as a list. Deleting a task removes its files and links; wipes and context deletion do the same.
- T3. Share links belong to a note **or** a task (`share_links.task_id`). `GET/POST /api/tasks/<id>/share` mirror the note routes; `POST /api/tasks` accepts `detailsText` (plain text → document) and `public: true` (creates a never-expiring link and returns `shareUrl`). The public page `/s/<token>` renders a task (title, status, owner, due, priority, details, attachments) or a note; `/s/<token>/a/<attachmentId>` serves only attachments of that shared item, without counting a view, and stops working the moment the link is revoked or expired. The private `/api/attachments/<id>` route still requires a session.
- T4. Task rows link to the task page and show a details icon and a globe when a live public link exists.

## 26. Upload documents (F25)

- U1. *Upload documents* (Notes and Inbox headers, the command bar, Settings → Import) accepts many files at once: PDF, DOCX, XLSX/XLS, CSV/TSV, HTML, TXT/MD/RTF/JSON and images, up to 40 MB each. Files up to 4 MB may be posted in one request (`POST /api/documents`, multipart `files`, session or capture token); larger ones are uploaded in 3 MB pieces (`POST /api/documents/upload` → `PUT /api/documents/upload/<attachmentId>` … → `POST /api/documents/upload/<noteId>`).
- U2. A note (`kind: document`, `source: upload` or `api`) exists from the start of the upload with the filename as its title and a placeholder body; the file is stored as its attachment and recorded as a source (`pdf` / `image` / `file`). `GET /api/documents/<noteId>` reports `uploading | extracting | filing | done | failed` (derived from attachment size, note status and the placeholder); `POST /api/documents/<noteId>` re-runs extraction and filing.
- U3. Extraction (`lib/documents/extract.ts`) is deterministic per format: PDF text layer via pdf.js (per page, with the metadata title, hyphenation and wrap repair), DOCX via Mammoth HTML → Markdown, XLSX (every sheet) and CSV as Markdown tables capped at 400 × 30, HTML with headings/lists/links/tables/code, text and Markdown with front matter, JSON pretty-printed. Output is capped at 400k characters; the rest stays in the attached file.
- U4. When a PDF averages fewer than 40 characters per page, or the file is an image, the model reads it (`readDocumentWithModel`, Gemini, inline under 14 MB or through the Files API) and the note opens with a warning callout naming the fact. Without a key the note says what is missing and the file stays attached; the upload dialog offers *Try again*.
- U5. The extracted Markdown replaces the placeholder only if the note has not been edited meanwhile (the placeholder is still in the body); the document's own title wins over the filename when it has one. Then `processNote` runs as for any capture: entities, tasks, decisions, numbers, tags, embeddings, summary; the note lands in the Inbox as `inbox` and becomes `processed`. Empty extractions skip the pipeline and are marked `processed` with the file attached.
- U6. Quick capture (`POST /api/capture`) runs the same extractor (without the model fallback) on any non-image, non-audio file, so PDFs and spreadsheets dropped into ⌘⇧N carry their text and a source with `extractedText`.
- U7. Notes → *Documents* tab filters `kind = document`. Failures are recorded on the note (`processing_error`) and surfaced in the dialog and on the note page.

## 27. Today (F26)

- D1. `/today` (sidebar under Home, command bar *Today*, the date link on Home) renders one calendar day: the journal, meetings starting that day (*Prep* for upcoming ones today), open tasks due that day plus, on today, every overdue task, tasks completed that day, notes created that day, decisions decided that day, changes detected that day, and on today the open loops older than a week. Previous/next arrows, a *Today* button and a Monday-first week strip with capture dots navigate; `?d=YYYY-MM-DD` addresses a day.
- D2. Day boundaries are computed in the reader's IANA time zone, sent by the browser in the `hkn_tz` cookie (`components/today/TimeZoneCookie.tsx`) and validated server-side (`lib/today.ts`: `dayKey`, `dayStart` with DST-safe offset resolution, `shiftDay`, `weekOf`). Without the cookie the server's zone applies.
- D3. The journal is a regular note: `source = 'daily'`, `sourceUrl = 'daily:YYYY-MM-DD'`, created on demand by `POST /api/today { day?, contextId? }` (idempotent: returns the existing note's id with `created: false`) in the writing context. Today's note keeps *now* as its created time; a past day's note is dated noon of that day. The starting body is a custom template whose name begins with *Daily*, *Journal* or *Today* (placeholders filled for that day), otherwise `## Notes` / `## Tomorrow` with one empty checklist item. The title is the day's long date unless the template sets one.
- D4. The journal is edited in place with `NoteEditor` (autosave, AI processing, version history) and links to its note page; it is listed, searched, exported, shared and trashed like any note and is excluded from the day's *Captured* list.
- D5. While *All* is selected the page reads across contexts (badges on rows) and prefers the writing context's journal.

## 28. Export (F27)

- X1. `GET /api/notes/<id>/export?format=md|html|docx|zip|json` (session, ownership-guarded) downloads one note; `html&print=1` returns the page inline with a script that opens the print dialog (the PDF path). File names come from the title (`safeFilename`, RFC 5987 encoded).
- X2. Markdown (`lib/export/index.ts`): front matter `title` (quoted, `"` and `\` escaped), `created`, `updated`, `context` (slug), `type` (when not `note`), `tags` (manual first, then automatic), `source` (URL) and `id`; body from `docToMarkdown` with attachment URLs rewritten to `attachments/<file>`; non-embedded attachments listed under *Attachments*. `parseFrontMatter` unescapes quoted values symmetrically and `markdownToDoc` turns an image-only line into an image node, so export → import preserves title, dates, context, tags and images.
- X3. HTML (`lib/export/html.ts`): a standalone document with inline CSS, print styles, tags and metadata in the header, images and file links as data URIs, sheets as tables of computed values (row/column headers, numbers right-aligned), callouts labelled, text escaped.
- X4. Word (`lib/export/docx.ts`, `docx` package): title and metadata line, Heading 1–4 styles, bullet/numbered lists with three levels and per-list numbering instances, checklists as ☐/☑ paragraphs, block quotes and callouts with a left border, code with a monospace shaded style, tables and sheets as real tables, PNG/JPEG/GIF/BMP images scaled to the page with dimensions read from the file header, hyperlinks, thematic breaks, and an *Attachments* list.
- X5. Zip of one note: `<title>.md`, `<title>.html`, `attachments/<file>` (duplicate names suffixed `-2`, `-3`…) and `note.json` (note fields, tags, summary, editor JSON, Markdown, HTML).
- X6. `GET /api/export?context=<id|slug>|all` (Settings → Data): one folder per context (`<date> <title>.md`, `attachments/`), `data.json` (contexts, notes with Markdown and attachment lists, entities, tasks, decisions and revisions, commitments, facts, changes, meetings, research) and `README.txt`. Unknown contexts are 404; only the session's notebook is ever read.
- X7. The *Export…* dialog (note ⋯ menu) lists the six formats with one-line explanations; *Download* triggers the file, *PDF* opens the print view in a new tab. The old *Export (JSON)* item is folded into it; Settings keeps *JSON only* (`/api/admin/export`).

## 29. Web clipper (F28)

- W1. `POST /api/clip` (session cookie or capture token, JSON or form): `url` (required; found inside `text` or `title` when a share sheet put it there, `parseShare`), `title`, `comment`, `selection`, `context`/`contextId`, `via`. Returns `{ id, title, url, fetched, words, method, error }` with 201. Private and non-web addresses are refused (`isFetchableUrl`); `CLIP_ALLOW_PRIVATE=1` lifts that for development.
- W2. `fetchArticle` fetches with a 9 s timeout and a 3 MB cap and hands the HTML to `extractArticle` (`lib/clip/article.ts`): metadata from Open Graph, Twitter cards, schema.org and `<title>` (headline with the site suffix stripped, site name, author, published date, description, image, canonical URL); the body from the best-scoring `<article>`, else `<main>`, else the densest `div`/`section` (paragraph and comma count, link density penalty; a smaller inner block carrying most of the text is preferred), else the page; blocks whose class or id marks them as comments, sharing, related, ads, navigation or footers are dropped; relative links and images are made absolute; Markdown through `htmlToMarkdown`. `method` records which path was taken; `none` when nothing readable was found.
- W3. `clipToNote` files a `link` note in the Inbox: title = headline (the sharer's title when the page could not be read), body = `_byline_`, comment, selection as a block quote, description (when the article does not already open with it), `## Article` (capped at 60k characters with a note that it continues on the source page) and `Source: <canonical>`; a `sources` row (`kind: url`) carries the extracted text; the pipeline runs as for any capture. Quick capture and `POST /api/capture` route a URL with at most a short comment through the same function.
- W4. `/clip` (`components/clip/ClipForm.tsx`) pre-fills from `url`, `title`, `text`; a share with a URL and nothing else files itself on load; `popup=1` (the bookmarklet) shows a *Clipped* card with *Open note* and *Close* instead of navigating. The middleware carries the query string through sign-in (`next=/clip?…`), and the login page only follows relative `next` targets.
- W5. `manifest.json` declares `share_target` (`GET /clip`, params `title`, `text`, `url`) and a *Clip a page* shortcut; the service worker cache version is bumped so installed apps pick it up. Settings → *Clip web pages* (`ClipperSection`) offers the bookmarklet (`bookmarkletCode(origin)`: current URL, title and selection into a 520×680 popup, falling back to a same-tab navigation when popups are blocked), the share-sheet instructions and the iPhone Shortcut recipe; `⌘K` → *Clip a web page*.

## 30. Links between notes (F29)

- L1. `noteLink` is an inline atom node `{ id: string | null, label }` (`components/editor/NoteLink.tsx`). It renders as `<a data-type="note-link" data-id href="/notes/<id>">label</a>` (dashed when unresolved); `renderText` is the label, so search, the pipeline and `docToText` see the title (mentions now contribute their label as well).
- L2. Typing `[[` opens a suggestion (`@tiptap/suggestion`, own plugin key, spaces allowed) fed by `GET /api/links?q=&exclude=` (the notebook's live titled notes, exact then prefix matches first, then most recent; empty query = recent notes); Enter/Tab or a click inserts the link; *New note “q”* inserts an unresolved link and creates the note through `POST /api/links { title }` (which returns an existing note with that title instead of duplicating), then resolves the node in place. A stray `]` or `]]` after the query is consumed. An input rule turns a fully typed `[[Title]]` into a node; the slash menu has *Link to note*.
- L3. Clicking a link (ProseMirror `handleClickOn`) opens `/notes/<id>`; an unresolved link resolves or creates the note by title, saves the document and opens it.
- L4. `lib/links.ts`: `extractNoteLinks`, `resolveLinksInDoc`, `linkExcerpts`, `findMentionOffsets` (whole word, Unicode-aware, case-insensitive), `mentionExcerpt`, `linkMentionInDoc` (first plain-text occurrence outside link/code marks and code blocks becomes a link; untouched blocks keep identity). `syncNoteLinks(noteId, contextId, doc)` resolves unresolved labels against the notebook's titles, keeps only targets inside the notebook, and upserts/deletes `note_links` rows (migration `0007_note_links`: `from_note_id`, `to_note_id`, `label`, unique pair, index on target). `createNote` and `updateNote` call it whenever a document carries links (or the note had links before); imports run a second pass so links to notes later in the same batch resolve. Purge, context deletion and notebook wipe remove the rows.
- L5. `getNote` returns `links = { outgoing, backlinks (with the linking sentence), unlinked }` from `noteLinksFor`: backlinks join `note_links` with live notes in the notebook; unlinked mentions are live notes whose title or text contains the title (`ILIKE`, then a whole-word check), excluding the note itself and existing backlinks, twelve most recent, with an excerpt around the first hit. `GET /api/notes/<id>/links` exposes the same; `POST /api/notes/<id>/links { fromNoteId }` links the mention (both notes ownership-guarded).
- L6. The intelligence panel (`LinksPanel`) shows *Links to*, *Linked from (n)* and *Unlinked mentions* with a *Link* button per row. The graph adds *links to* / *linked from* edges (overview and focus). Markdown export/import use `[[label]]`; HTML export, Word and share pages render the label (`.note-link`).

