# HK Fire — forensic memoranda

> This repository also hosts **Notes** (notes.hkfire.app), an AI-native note-taking
> and personal intelligence system, in [`notes/`](notes/README.md). It is a separate
> Next.js app with its own Vercel project, deployed from the `notes-vercel` branch.

Two adversarial investment-committee memoranda on listed alternative asset managers —
**Blue Owl (NYSE: OWL)** and **Patria (NASDAQ: PAX)** — published as plain static pages
behind a single shared key.

That is the whole site. There is no app around it any more.

## Running it

```bash
npm install          # one dependency: @vercel/edge, for the key gate
npm test             # memo integrity checks, the gate, and the rendered pages
npm run build        # renders dist/
npm run serve        # build, then preview at http://localhost:4173 (gate included)
```

Node 22.6 or newer — the TypeScript is run directly by Node's type stripping, so there is
no compiler, bundler or framework to install.

## Layout

```
memos/
  types.ts        ForensicMemo — the analytical template both subjects fill
  owl.ts          Blue Owl memorandum (cut 2026-07-31, revalidated 2026-08-28 and 2026-09-20)
  pax.ts          Patria memorandum  (cut 2026-07-31, revalidated 2026-08-28 and 2026-09-20)
  owl.expansion.ts, pax.expansion.ts
                  The v3 chapters — history, multiple history, peer group, yields (cut 2026-09-20)
  index.ts        Registry + derived maths (weighted value, IRR, SOTP, AUM quality)
  memos.test.ts   The prompt's output contract as executable tests
build.ts          Renders the memos to dist/ — index, one page per memo, methodology
serve.ts          Local preview of dist/ with the gate in front (npm run serve)
middleware.ts     The shared-key gate — Vercel runs it in front of every request
docs/
  FORENSIC-ASSET-MANAGER-PROMPT.md   The versioned methodology (v3) the memos follow, with changelogs
  FORENSIC-MEMOS.md                  How the memos are structured, tiered and tested
```

## The key

Every page is behind one passphrase. It defaults to `888888`; set an `ACCESS_KEY`
environment variable on the Vercel project to change it without touching code. The
cookie lasts 30 days; `/logout` clears it.

This keeps casual eyes off the memos. It is not real security: anyone the key is shared
with can share it on, and the memos are served in full once past the gate.

## Adding a memo

Write one `ForensicMemo` object (see `memos/types.ts`), add it to `FORENSIC_MEMOS` in
`memos/index.ts`, and run `npm test`. The index page, the memo page, the side-by-side
table and the tests all pick it up — and the tests will hold it to the same standard as
the first two.

## Where the old apps went

The Five Delta options-execution app and the Meridian wealth OS that used to live in
this repository were removed when the site was cut back to the memos. Both are intact in
git history — the last commit carrying them is `589243a`.

## The villa app

`villa/` is unrelated to the memos: a separate Next.js application with its own
`package.json`, tests and Vercel project (its `vercel.json` only builds when files under
`villa/` change). It shares the repository and nothing else, and this site's build and
tests leave it alone.
