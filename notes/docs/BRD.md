# Business Requirements Document — Notes: multi-notebook administration and the next ten capabilities

**Product:** Notes (notes.hkfire.app) — an AI-native note-taking and personal intelligence system.
**Document owner:** Product · **Status:** Approved for build · **Date:** 12 September 2026

## 1. Background

Notes today is a single-owner system: one password, one person, one set of contexts. It has proven the core loop (capture anything, AI files it, ask questions with citations, act on what matters) and now runs in production with a persistent database, model resilience and a mobile/offline shell.

The owner wants to give the same system to other people — colleagues, family, a small circle — each with their own completely separate notebook, without standing up a new deployment per person. Around that, the product needs the set of capabilities people expect once more than one person depends on it: accounts, safe sharing, recovery, history, ways to get data in and out, and a place to look back on the week.

## 2. Business objectives

| # | Objective | Measure of success |
|---|-----------|--------------------|
| O1 | One deployment serves many people, each with private data | An admin can create a notebook for someone else in under a minute; no user can see another notebook's data by any route or API |
| O2 | Zero-touch onboarding for invitees | An invited person reaches a working notebook from a link with no admin involvement after the invite is sent |
| O3 | AI cost and quota are attributable and controllable | Each notebook can run on its own model keys, the shared keys, or no model at all; AI usage is visible per notebook |
| O4 | Nothing captured is ever lost | Deleted notes are recoverable for 30 days; every processed edit is versioned; imports and exports are lossless for text |
| O5 | The product extends outside its own UI | Notes can be captured from shortcuts and automations, and shared read-only with people who do not have an account |
| O6 | The owner can operate the system alone | Usage, health and an audit trail of administrative actions are visible in one admin console |

## 3. Scope

### In scope
1. **Notebook administration** — create, invite, reset, disable, delete notebooks; view usage; audit log.
2. **Accounts and invites** — email + password sign-in, invite links, password change, per-notebook membership.
3. **Bring-your-own AI keys** — per-notebook Anthropic/Gemini keys, or the shared keys, or local-only.
4. **Capture API tokens** — personal endpoint for iOS Shortcuts, Zapier, email forwarders and scripts.
5. **Note templates** — built-in and custom templates, new-from-template, slash command.
6. **Version history** — automatic snapshots with one-click restore.
7. **Share links** — read-only public links with expiry and revocation.
8. **Trash** — restore or purge deleted notes; automatic purge after 30 days.
9. **Import** — Markdown, text and the app's own JSON export, with AI filing.
10. **Weekly review** — what happened this week, with an AI narrative.
11. **Admin usage dashboard and audit log** — per-notebook activity and an immutable record of admin actions.

- **F10 — Meeting recordings from a phone**: the owner records meetings on an iPhone; the recording or its transcript is posted (app or Shortcut) and automatically becomes a structured meeting note in the right context, linked to prior meetings, people, open loops and decisions.

- **F11 — Automatic tags**: content-derived tags on every note for filtering and search, editable by the owner.
- **F12 — Graph explorer**: an interactive view of how people, companies, topics, tags, notes, meetings and decisions connect, with focus mode from any item.

### Out of scope (this release)
- Real-time collaboration inside one note; shared notebooks with multiple concurrent editors.
- Billing or metering for AI usage beyond visibility.
- Inbound email capture (requires a mail provider); covered by capture tokens + forwarders.
- SSO / OAuth sign-in; two-factor authentication.

## 4. Stakeholders and personas

- **Owner / platform admin (Harsha)** — runs the deployment, creates notebooks for others, needs visibility and control without becoming support staff.
- **Notebook owner** — a person given a notebook; expects the full product, private data, and the ability to bring their own AI key.
- **Notebook member** — an additional person invited into an existing notebook (e.g. an assistant); same data, separate login.
- **Link recipient** — someone without an account who receives a shared note; expects a clean read-only page.

## 5. Business rules

- **Isolation is absolute.** Every query, page, API and background job is scoped to one notebook. Contexts (Work, Personal, …) live inside a notebook. Cross-notebook access exists only for the platform admin, explicitly, and is logged.
- **The platform admin is the deployment owner.** Exactly the users with role `admin` may use the admin console; the first (owner) account is admin. Admin actions are recorded in an audit log.
- **Sample data is opt-in for new notebooks.** New notebooks start empty with default contexts unless the admin ticks "Load sample data".
- **AI keys are secrets.** Keys are encrypted at rest, never returned to the browser after saving, and never logged.
- **Deletion is reversible for 30 days.** Soft delete → Trash → purge. Purge also removes derived facts and vectors.
- **Share links are opt-out.** Each notebook can disable public sharing; links can expire and be revoked; views are counted.
- **Backwards compatibility.** The existing single-owner deployment upgrades in place: its data becomes the "Primary" notebook, the existing password keeps working, and open (no password) mode still works for local demos.

## 6. Assumptions and constraints

- Postgres with pgvector in production; embedded PGlite locally. Migrations run automatically on boot.
- Password sign-in is the only authentication method; sessions are signed cookies (30 days).
- The Gemini free tier is per model per day; BYOK is the mechanism for a person to lift their own limits.
- The service worker and offline queue keep working unchanged; offline items are replayed into the notebook of the session that created them.

## 7. Risks

| Risk | Mitigation |
|------|------------|
| A by-id endpoint leaks data across notebooks | Central guard applied in the query layer (returns not-found) and in every mutation route; automated isolation test |
| Migration on the live database corrupts existing data | Migration is additive; backfill creates the Primary notebook and links existing rows; tested against a copy locally |
| Lost admin password | Owner password can still come from the APP_PASSWORD environment variable; a reset from the environment is documented |
| Shared keys exhausted by one notebook | Per-notebook AI usage is visible; notebooks can be switched to own keys or local mode |

## 8. Success criteria for release

- Admin creates a notebook, sends an invite, invitee signs in and sees an empty notebook with default contexts; the admin's notes are not reachable from the invitee's session by UI, API, search or Ask.
- All ten capabilities are functional end to end in production, covered by unit tests where logic is non-trivial and by a browser smoke test for the onboarding and isolation path.
- Existing production data and the offline/mobile experience are unchanged after upgrade.
