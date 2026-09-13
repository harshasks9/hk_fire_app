"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useProject, COLLECTION_KEYS, emptyProject, type CollectionKey, type KeepOptions } from "@/lib/store";
import { SCHEMAS } from "@/lib/model/schema";
import { groupedCategories, categoryUsage } from "@/lib/model/categories";
import { CATEGORY_GROUP_LABEL, type ProjectState } from "@/lib/model/types";
import { projectFinance } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { PageTitle, Eyebrow, Tabs, Sheet, Field, Stat, Money, Chip, Empty, fmtDate } from "@/components/ui";
import { EntityEditor } from "@/components/EntityEditor";

const TABS = ["Overview", "People", "Categories & rates", "Data", "Danger zone"] as const;
type Tab = (typeof TABS)[number];

/**
 * Admin.
 *
 * The operator's view rather than the homeowner's: what is in the database,
 * what the rate card says, how to get the data in and out, and how to start
 * over. Kept deliberately separate from the project screens — nothing here is
 * part of running a fit-out, and all of it is easy to regret.
 */
export default function AdminPage() {
  return <React.Suspense><AdminInner /></React.Suspense>;
}

function AdminInner() {
  const params = useSearchParams();
  const wanted = params.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(wanted && TABS.includes(wanted) ? wanted : "Overview");
  useEffect(() => { if (wanted && TABS.includes(wanted)) setTab(wanted); }, [wanted]);

  return (
    <div>
      <div className="text-[12px] text-ink-3 mb-3"><Link href="/more" className="hover:text-clay">More</Link> / Admin</div>
      <PageTitle title="Admin" sub="The project's data, its rate card, and how to back it up or start again." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === "Overview" && <Overview />}
        {tab === "People" && <PeopleTab />}
        {tab === "Categories & rates" && <CategoriesTab />}
        {tab === "Data" && <DataTab />}
        {tab === "Danger zone" && <DangerZone />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- overview */

function Overview() {
  const { state, storage } = useProject();
  const fin = projectFinance(state);

  const rows = COLLECTION_KEYS.map((k) => ({
    key: k as CollectionKey,
    label: SCHEMAS[k as CollectionKey].label,
    n: (state[k as CollectionKey] as unknown[]).length,
  })).sort((a, b) => b.n - a.n);

  const total = rows.reduce((a, r) => a + r.n, 0);
  const bytes = useMemo(() => {
    try { return new Blob([JSON.stringify(state)]).size; } catch { return 0; }
  }, [state]);

  return (
    <div className="space-y-6">
      <div className="card px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Records" value={total.toLocaleString("en-IN")} sub={`across ${rows.length} collections`} large />
        <Stat label="Stored size" value={bytes ? `${Math.round(bytes / 1024)} KB` : "—"} sub="in this browser" large />
        <Stat label="Forecast" value={<Money value={fin.forecast} compact />} sub={`budget ${inr(fin.originalBudget, { compact: true })}`} large />
        <Stat label="Complete" value={`${Math.round(fin.completionPct)}%`} large />
      </div>

      <div>
        <Eyebrow className="mb-2">What is in the project</Eyebrow>
        <div className="card divide-y divide-line">
          {rows.map((r) => (
            <div key={r.key} className="px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-[13px]">{r.label}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 sm:w-40 h-[5px] rounded-full bg-paper-3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(r.n / Math.max(...rows.map((x) => x.n), 1)) * 100}%`, background: "#a8967c" }} />
                </div>
                <span className="tnum text-[13px] w-12 text-right">{r.n.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <StorageCard storage={storage} />
    </div>
  );
}

/** Where the data lives, in plain terms, and what to do about it. */
function StorageCard({ storage }: { storage: ReturnType<typeof useProject>["storage"] }) {
  if (storage.mode === "server") {
    return (
      <div className="card px-5 py-4">
        <div className="flex items-center gap-2">
          <Eyebrow>Storage</Eyebrow>
          <Chip tone="sage">Database connected</Chip>
        </div>
        <p className="text-[12.5px] text-ink-2 mt-2 leading-relaxed max-w-2xl">
          Every change goes to the shared database as it is made and is recorded in History with the name of
          whoever made it. Currently at version <span className="tnum">{storage.version ?? 0}</span>
          {storage.lastSyncAt ? `, last confirmed ${new Date(storage.lastSyncAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}.
          {storage.pending ? ` ${storage.pending} change${storage.pending === 1 ? "" : "s"} still on the way.` : ""}
          {storage.error ? ` Last problem: ${storage.error}.` : ""}
        </p>
        <p className="text-[11.5px] text-ink-3 mt-2 leading-relaxed max-w-2xl">
          Everyone who opens the address sees the same project. To require a password, set <code>APP_PASSWORD</code> on the host.
          A copy is also kept in this browser so the app opens instantly and works offline until the next sync.
        </p>
      </div>
    );
  }
  return (
    <div className="card px-5 py-4" style={{ borderColor: "#e0c3ba" }}>
      <div className="flex items-center gap-2">
        <Eyebrow>Storage</Eyebrow>
        <Chip tone="clay">This browser only</Chip>
      </div>
      <p className="text-[12.5px] text-ink-2 mt-2 leading-relaxed max-w-2xl">
        No database is connected, so the project lives in this browser&rsquo;s local storage: private to this device
        and profile, gone if site data is cleared, and invisible to the designer. Export a backup from the Data tab
        before anything you might regret.
      </p>
      <div className="text-[12.5px] text-ink-2 mt-3 leading-relaxed max-w-2xl">
        <div className="font-medium">To share it and make it permanent</div>
        <ol className="list-decimal ml-5 mt-1 space-y-0.5 text-ink-3 text-[12px]">
          <li>Create a Postgres database — Neon or Vercel Postgres, the free tier is plenty.</li>
          <li>On the host, add the environment variable <code>DATABASE_URL</code> with its connection string (and, optionally, <code>APP_PASSWORD</code>).</li>
          <li>Redeploy. The tables create themselves on first request, and the first browser to open the app becomes the shared starting point — so open it from the device with the most complete data.</li>
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ people */

/**
 * Who is on the project. Designers, contractors, the family — anyone who
 * will make a change or be named as an owner. Picking yourself here is what
 * puts your name against the changes you make.
 */
function PeopleTab() {
  const { state, meId, setMe } = useProject();
  const active = state.people.filter((p) => !p.inactive);
  const byRole = (r: string) => active.filter((p) => p.role === r).length;
  return (
    <div className="space-y-5">
      <div className="card px-5 py-4 grid sm:grid-cols-[1fr_auto] gap-4 items-center">
        <div>
          <Eyebrow>I am</Eyebrow>
          <p className="text-[12.5px] text-ink-3 mt-1 leading-relaxed">
            Changes made from this device are recorded under this name. Each person picks themselves on their own device.
          </p>
        </div>
        <select className="input w-full sm:w-64" value={meId ?? ""} onChange={(e) => setMe(e.target.value || undefined)}>
          <option value="">Nobody chosen — just a view</option>
          {active.map((p) => <option key={p.id} value={p.id}>{p.name}{p.title ? ` — ${p.title}` : ""}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-3">
        <span><strong className="text-ink font-medium tnum">{byRole("homeowner")}</strong> family</span>
        <span><strong className="text-ink font-medium tnum">{byRole("designer")}</strong> designers</span>
        <span><strong className="text-ink font-medium tnum">{byRole("vendor")}</strong> contractors &amp; vendors</span>
        {state.people.length - active.length > 0 && <span>{state.people.length - active.length} inactive</span>}
      </div>

      {state.people.length === 0 && (
        <Empty title="No one on the project yet." hint="Add yourself first, then the designer and the contractors. The role decides which view of the app they get." />
      )}
      <EntityEditor collection="people" rows={state.people as unknown as Record<string, unknown>[]} />
    </div>
  );
}

/* ------------------------------------------------------------- categories */

function CategoriesTab() {
  const { state } = useProject();
  const groups = groupedCategories(state);
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      <div className="card-quiet px-4 py-3.5">
        <Eyebrow>What this is</Eyebrow>
        <p className="text-[12.5px] text-ink-2 mt-1.5 leading-relaxed max-w-3xl">
          Your trade list and the rate card behind it. Every indicative figure the product shows before
          a vendor has quoted comes from here — the rate, the wastage, the labour, the tax and the lead
          time that decides whether an item counts as long-lead. Change a rate here and every
          unquoted item in that trade follows.
        </p>
      </div>

      {!advanced ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <Eyebrow>{state.categories.length} categories in {groups.length} groups</Eyebrow>
            <button className="btn btn-sm" onClick={() => setAdvanced(true)}>Edit as a table</button>
          </div>
          <div className="space-y-4">
            {groups.map(({ group, items }) => (
              <div key={group}>
                <Eyebrow className="mb-1.5">{CATEGORY_GROUP_LABEL[group]}</Eyebrow>
                <div className="card divide-y divide-line">
                  {items.map((c) => {
                    const used = categoryUsage(state, c.id);
                    return (
                      <div key={c.id} className="px-4 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-[13px] flex-1 min-w-[140px]" style={{ opacity: c.archived ? 0.5 : 1 }}>
                          {c.label}
                          {c.archived && <span className="ml-2 text-[10.5px] text-ink-4">archived</span>}
                        </span>
                        <span className="text-[11.5px] text-ink-3 tnum">{used} item{used === 1 ? "" : "s"}</span>
                        {c.rate ? (
                          <span className="text-[11.5px] tnum text-ink-2">
                            {inr(c.rate)}/{c.unit}
                          </span>
                        ) : <span className="text-[11.5px] text-ink-4">no default rate</span>}
                        {(c.leadTimeWeeks ?? 0) >= 8 && <Chip tone="ochre">{c.leadTimeWeeks}w lead</Chip>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div>
          <button className="btn btn-sm mb-3" onClick={() => setAdvanced(false)}>Back to grouped view</button>
          <EntityEditor collection="categories" rows={state.categories as unknown as Record<string, unknown>[]} />
        </div>
      )}

      <p className="text-[11.5px] text-ink-3 leading-relaxed max-w-2xl">
        Prefer archiving to deleting. Archiving hides a trade from the pickers while the items that
        already use it carry on unchanged; deleting moves those items onto another category.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------- data */

function DataTab() {
  const { state, dispatch } = useProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ v: 1, exportedAt: new Date().toISOString(), state }, null, 2)],
      { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `villa-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Backup downloaded.");
  };

  const importJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const next = (parsed.state ?? parsed) as ProjectState;
      if (!next || !Array.isArray(next.items) || !Array.isArray(next.spaces)) {
        setStatus("That file is not a villa backup — it has no spaces or scope items.");
        return;
      }
      // A backup taken before categories existed still has to load.
      if (!Array.isArray(next.categories) || !next.categories.length) {
        next.categories = state.categories;
      }
      dispatch({ type: "data/import", state: next });
      setStatus(`Restored ${next.items.length} scope items across ${next.spaces.length} spaces.`);
    } catch (e) {
      setStatus(`Could not read that file: ${(e as Error).message}`);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card px-5 py-5">
        <Eyebrow>Back up</Eyebrow>
        <p className="text-[12.5px] text-ink-3 mt-1.5 mb-3 leading-relaxed max-w-2xl">
          Downloads the entire project as one JSON file — every space, scope item, decision, quote and
          photo note. This is the only copy that survives clearing your browser data, so take one
          before anything irreversible.
        </p>
        <button className="btn btn-primary" onClick={exportJson}>Download a backup</button>
      </div>

      <div className="card px-5 py-5">
        <Eyebrow>Restore</Eyebrow>
        <p className="text-[12.5px] text-ink-3 mt-1.5 mb-3 leading-relaxed max-w-2xl">
          Replaces everything currently in the project with the contents of a backup file. The file is
          checked before anything is written — if it does not look like a villa export, nothing changes.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }}
        />
        <button className="btn" onClick={() => fileRef.current?.click()}>Choose a backup file…</button>
      </div>

      {status && (
        <div className="card-quiet px-4 py-3 text-[13px] text-ink-2">{status}</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ danger zone */

function DangerZone() {
  const { state, dispatch } = useProject();
  const [open, setOpen] = useState(false);
  const [keep, setKeep] = useState<KeepOptions>({ categories: true, people: true, vendors: false, settings: false, scenarios: true });
  const [typed, setTyped] = useState("");

  const preview = useMemo(() => emptyProject(state, keep), [state, keep]);
  const losing = COLLECTION_KEYS
    .map((k) => ({
      label: SCHEMAS[k as CollectionKey].label,
      before: (state[k as CollectionKey] as unknown[]).length,
      after: (preview[k as CollectionKey] as unknown[]).length,
    }))
    .filter((r) => r.before !== r.after);
  const totalLost = losing.reduce((a, r) => a + (r.before - r.after), 0);

  const KEEPS: { key: keyof KeepOptions; label: string; hint: string }[] = [
    { key: "categories", label: "Categories & rate card", hint: "Strongly recommended — without a category list you cannot create a single scope item." },
    { key: "people", label: "People", hint: "Names and roles." },
    { key: "vendors", label: "Vendors", hint: "Your supplier directory outlives any one project." },
    { key: "scenarios", label: "Costing scenarios", hint: "Practical / Premium / No-compromise." },
    { key: "settings", label: "Project settings", hint: "Name, address, plot, budget and dates." },
  ];

  return (
    <div className="space-y-5">
      <div className="card px-5 py-5" style={{ borderColor: "#e0c3ba" }}>
        <Eyebrow>Start from scratch</Eyebrow>
        <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed max-w-2xl">
          Empties the project so you can build your own from nothing — no sample villa, no seeded
          scope, no example vendors. Choose what to carry over; everything else goes.
        </p>

        <div className="mt-4 space-y-2.5">
          {KEEPS.map((k) => (
            <label key={k.key} className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={!!keep[k.key]}
                onChange={(e) => setKeep((v) => ({ ...v, [k.key]: e.target.checked }))}
              />
              <span>
                <span className="text-[13px]">Keep {k.label.toLowerCase()}</span>
                <span className="block text-[11.5px] text-ink-3 leading-snug">{k.hint}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="hairline mt-4 pt-3.5">
          <Eyebrow>What this removes</Eyebrow>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {losing.map((r) => (
              <span key={r.label} className="text-[12px] text-ink-3 tnum">
                {r.label} <strong className="text-ink font-medium">{r.before}</strong>
                {r.after > 0 ? ` → ${r.after}` : " → 0"}
              </span>
            ))}
          </div>
          <div className="text-[12.5px] mt-2.5" style={{ color: "#8d3a2c" }}>
            {totalLost.toLocaleString("en-IN")} records will be deleted.
          </div>
        </div>

        <button className="btn mt-4" style={{ background: "#a04a3c", color: "#fff", borderColor: "#a04a3c" }}
          onClick={() => { setTyped(""); setOpen(true); }}>
          Empty the project…
        </button>
      </div>

      <div className="card px-5 py-5">
        <Eyebrow>Start again from the villa itself</Eyebrow>
        <p className="text-[12.5px] text-ink-3 mt-1.5 mb-3 leading-relaxed max-w-2xl">
          The empty twin: every room from the drawings with its real dimensions and its scope checklist at
          &ldquo;not started&rdquo;, the category list and rate card — and nobody, no vendors, no money, no
          history. This is what a new project starts as.
        </p>
        <button className="btn" onClick={() => {
          if (confirm("Replace everything with the empty twin of the villa? Your current project will be lost unless you have exported a backup.")) {
            dispatch({ type: "reset" });
          }
        }}>
          Reset to the empty twin
        </button>
      </div>

      <div className="card px-5 py-5">
        <Eyebrow>Load the sample villa</Eyebrow>
        <p className="text-[12.5px] text-ink-3 mt-1.5 mb-3 leading-relaxed max-w-2xl">
          The fully worked example — 57 spaces, 1,130 scope items, people, vendors, decisions, quotes and
          snags — replacing whatever is there now. Useful for seeing how a finished project reads.
        </p>
        <button className="btn" onClick={() => {
          if (confirm("Replace everything with the sample villa? Your current project will be lost unless you have exported a backup.")) {
            dispatch({ type: "reset", to: "sample" });
          }
        }}>
          Load the sample villa
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title="Empty the project">
        <p className="text-[13.5px] text-ink leading-relaxed">
          This deletes <strong className="font-medium">{totalLost.toLocaleString("en-IN")} records</strong> and
          cannot be undone from inside the app.
        </p>
        <p className="text-[12.5px] text-ink-3 mt-2.5 leading-relaxed">
          If you have not downloaded a backup, close this and do that first — it takes a second and it
          is the only way back.
        </p>
        <div className="mt-4">
          <Field label="Type EMPTY to confirm">
            <input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus placeholder="EMPTY" />
          </Field>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn flex-1 justify-center" onClick={() => setOpen(false)}>Cancel</button>
          <button
            className="btn flex-1 justify-center"
            style={{ background: "#a04a3c", color: "#fff", borderColor: "#a04a3c", opacity: typed === "EMPTY" ? 1 : 0.45 }}
            disabled={typed !== "EMPTY"}
            onClick={() => { dispatch({ type: "data/clear", keep }); setOpen(false); }}
          >
            Empty the project
          </button>
        </div>
      </Sheet>
    </div>
  );
}
