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
