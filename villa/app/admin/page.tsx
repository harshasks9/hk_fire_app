"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useProject, COLLECTION_KEYS, emptyProject, type CollectionKey, type KeepOptions } from "@/lib/store";
import { SCHEMAS } from "@/lib/model/schema";
import { groupedCategories, categoryUsage } from "@/lib/model/categories";
import { CATEGORY_GROUP_LABEL, type ProjectState } from "@/lib/model/types";
import { projectFinance } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { PageTitle, Eyebrow, Tabs, Sheet, Field, Stat, Money, Chip, Empty, fmtDate } from "@/components/ui";
import { EntityEditor } from "@/components/EntityEditor";

const TABS = ["Overview", "Categories & rates", "Data", "Danger zone"] as const;
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
  const { state } = useProject();
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div>
      <div className="text-[12px] text-ink-3 mb-3"><Link href="/more" className="hover:text-clay">More</Link> / Admin</div>
      <PageTitle title="Admin" sub="The project's data, its rate card, and how to back it up or start again." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      <div className="mt-6">
        {tab === "Overview" && <Overview />}
        {tab === "Categories & rates" && <CategoriesTab />}
        {tab === "Data" && <DataTab />}
        {tab === "Danger zone" && <DangerZone />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- overview */

function Overview() {
  const { state } = useProject();
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

      <p className="text-[11.5px] text-ink-3 leading-relaxed max-w-2xl">
        Everything is held in this browser&rsquo;s local storage, not on a server — so it is private to
        this device and this browser profile, and clearing site data will remove it. Export a backup
        from the Data tab before you do anything you might want to undo.
      </p>
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
        <Eyebrow>Restore the sample villa</Eyebrow>
        <p className="text-[12.5px] text-ink-3 mt-1.5 mb-3 leading-relaxed max-w-2xl">
          Puts back the fully worked example — 57 spaces, 1,130 scope items, decisions, quotes and
          snags — replacing whatever is there now. Useful for seeing how a finished project reads.
        </p>
        <button className="btn" onClick={() => {
          if (confirm("Replace everything with the sample villa? Your current project will be lost unless you have exported a backup.")) {
            dispatch({ type: "reset" });
          }
        }}>
          Reset to the sample villa
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
