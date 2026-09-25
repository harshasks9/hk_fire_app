"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useProject, COLLECTION_KEYS, emptyProject, type CollectionKey, type KeepOptions } from "@/lib/store";
import { SCHEMAS } from "@/lib/model/schema";
import { groupedCategories, categoryUsage } from "@/lib/model/categories";
import { CATEGORY_GROUP_LABEL, type ProjectState } from "@/lib/model/types";
import { projectFinance } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { PageTitle, Tabs, Field, Stat, Money, Chip, Section, Confirm, useToast } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { EntityEditor } from "@/components/EntityEditor";

const TABS = ["Overview", "People", "Categories & rates", "Data", "Danger zone"] as const;
type Tab = (typeof TABS)[number];

/**
 * Settings.
 *
 * The operator's view rather than the homeowner's: who is on the project,
 * what the rate card says, how to get the data in and out, and how to start
 * over. Kept deliberately separate from the project screens — nothing here is
 * part of running a fit-out, and some of it is easy to regret.
 *
 * Lives at /admin; /admin?tab=People opens a tab directly.
 */
export default function AdminPage() {
  return <React.Suspense><AdminInner /></React.Suspense>;
}

function AdminInner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { state } = useProject();
  const wanted = params.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(wanted && TABS.includes(wanted) ? wanted : "Overview");
  useEffect(() => { if (wanted && TABS.includes(wanted)) setTab(wanted); }, [wanted]);

  // Keep the address in step with the tab, so a tab can be linked to and survives a reload.
  const choose = (t: Tab) => {
    setTab(t);
    router.replace(t === "Overview" ? pathname : `${pathname}?tab=${encodeURIComponent(t)}`, { scroll: false });
  };

  return (
    <div>
      <PageTitle title="Settings" sub="Who is on the project, the rate card behind every estimate, and how to back up, restore or start again." />
      <Tabs
        tabs={TABS} active={tab} onChange={choose} label="Settings"
        counts={{ People: state.people.filter((p) => !p.inactive).length, "Categories & rates": state.categories.length }}
      />
      <div className="mt-7">
        {tab === "Overview" && <Overview />}
        {tab === "People" && <PeopleTab />}
        {tab === "Categories & rates" && <CategoriesTab />}
        {tab === "Data" && <DataTab />}
        {tab === "Danger zone" && <DangerZone />}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- backup */

/** Download the whole project as one JSON file. */
function downloadBackup(state: ProjectState): string {
  const blob = new Blob([JSON.stringify({ v: 1, exportedAt: new Date().toISOString(), state }, null, 2)],
    { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const name = `villa-${new Date().toISOString().slice(0, 10)}.json`;
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  return name;
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
  const most = Math.max(...rows.map((x) => x.n), 1);
  const bytes = useMemo(() => {
    try { return new Blob([JSON.stringify(state)]).size; } catch { return 0; }
  }, [state]);

  return (
    <div>
      <div className="card stat-strip mb-10">
        <Stat label="Records" value={total.toLocaleString("en-IN")} sub={`across ${rows.length} collections`} large />
        <Stat label="Size" value={bytes ? `${Math.round(bytes / 1024).toLocaleString("en-IN")} KB` : "—"} sub="the whole project as a backup file" large />
        <Stat label="Forecast" value={<Money value={fin.forecast} compact />} sub={fin.originalBudget ? `against a ${inr(fin.originalBudget, { compact: true })} budget` : "no budget set"} large />
        <Stat label="Complete" value={`${Math.round(fin.completionPct)}%`} sub="of the work, by value" large />
      </div>

      <Section title="Where the data lives">
        <StorageCard storage={storage} />
      </Section>

      <Section title="What is in the project">
        <div className="card divide-y divide-line">
          {rows.filter((r) => r.n > 0).map((r) => (
            <div key={r.key} className="px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-[14px] min-w-0 truncate">{r.label}</span>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-20 sm:w-40 h-[5px] rounded-full bg-paper-3 overflow-hidden" aria-hidden>
                  <div className="h-full rounded-full bg-ink-4" style={{ width: `${(r.n / most) * 100}%` }} />
                </div>
                <span className="tnum text-[14px] w-14 text-right">{r.n.toLocaleString("en-IN")}</span>
              </div>
            </div>
          ))}
          {rows.some((r) => r.n === 0) && (
            <div className="px-4 py-3 text-[13.5px] text-ink-3 leading-relaxed">
              <span className="text-ink-2 font-medium">Nothing yet:</span>{" "}
              {rows.filter((r) => r.n === 0).map((r) => r.label.toLowerCase()).join(", ")}.
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

/** Where the data lives, in plain terms, and what to do about it. */
function StorageCard({ storage }: { storage: ReturnType<typeof useProject>["storage"] }) {
  if (storage.mode === "server") {
    return (
      <div className="card px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Icon name="cloud" size={18} className="text-good" />
          <span className="text-[15px] font-semibold">Shared database</span>
          <Chip tone="good" dot>Connected</Chip>
        </div>
        <p className="text-[14px] text-ink-2 mt-2 leading-relaxed max-w-2xl">
          Every change goes to the shared database as it is made and is recorded in History with the name of
          whoever made it. Now at version <span className="tnum">{storage.version ?? 0}</span>
          {storage.lastSyncAt ? `, last confirmed at ${new Date(storage.lastSyncAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : ""}.
          {storage.pending ? ` ${storage.pending} change${storage.pending === 1 ? " is" : "s are"} still on the way.` : ""}
        </p>
        {storage.error && (
          <p className="text-[13.5px] text-bad mt-2 flex items-start gap-1.5">
            <Icon name="alert" size={16} className="shrink-0 mt-0.5" /> Last problem: {storage.error}.
          </p>
        )}
        <p className="text-[13px] text-ink-3 mt-2 leading-relaxed max-w-2xl">
          Everyone who opens the address sees the same project. To require a password, set <code className="font-mono text-[12.5px]">APP_PASSWORD</code> on the host.
          A copy is also kept in this browser so the app opens instantly and works offline until the next sync.
        </p>
      </div>
    );
  }
  return (
    <div className="card px-5 py-4 border-warn/40">
      <div className="flex flex-wrap items-center gap-2">
        <Icon name="alert" size={18} className="text-warn" />
        <span className="text-[15px] font-semibold">This browser only</span>
        <Chip tone="warn">Not shared</Chip>
      </div>
      <p className="text-[14px] text-ink-2 mt-2 leading-relaxed max-w-2xl">
        No database is connected, so the project lives in this browser&rsquo;s storage: private to this device
        and profile, gone if site data is cleared, and invisible to the designer. Download a backup from the Data
        tab before anything you might regret.
      </p>
      <div className="mt-3 max-w-2xl">
        <div className="text-[14px] font-semibold">To share it and make it permanent</div>
        <ol className="list-decimal ml-5 mt-1.5 space-y-1 text-ink-2 text-[13.5px] leading-relaxed">
          <li>Create a Postgres database — Neon or Vercel Postgres; the free tier is plenty.</li>
          <li>On the host, add the environment variable <code className="font-mono text-[12.5px]">DATABASE_URL</code> with its connection string (and, optionally, <code className="font-mono text-[12.5px]">APP_PASSWORD</code>).</li>
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
  const toast = useToast();
  const active = state.people.filter((p) => !p.inactive);
  const byRole = (r: string) => active.filter((p) => p.role === r).length;
  const inactive = state.people.length - active.length;
  return (
    <div className="space-y-6">
      {active.length > 0 ? (
        <div className="card px-5 py-4 grid sm:grid-cols-[1fr_auto] gap-x-6 gap-y-3 items-center">
          <div>
            <label htmlFor="settings-me" className="text-[15px] font-semibold">Who are you?</label>
            <p className="text-[13.5px] text-ink-3 mt-0.5 leading-relaxed">
              Changes made from this device are recorded under this name. Each person picks themselves on their own device.
            </p>
          </div>
          <select
            id="settings-me"
            className="input w-full sm:w-72"
            value={meId ?? ""}
            onChange={(e) => {
              const id = e.target.value || undefined;
              setMe(id);
              const p = state.people.find((x) => x.id === id);
              toast(p ? `Changes from this device are now recorded as ${p.name}` : "No one chosen — changes are unattributed");
            }}
          >
            <option value="">Nobody — just looking</option>
            {active.map((p) => <option key={p.id} value={p.id}>{p.name}{p.title ? ` — ${p.title}` : ""}</option>)}
          </select>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg bg-accent-soft px-4 py-3 text-[14px] text-ink-2 leading-relaxed">
          <Icon name="info" size={18} className="text-accent-strong shrink-0 mt-0.5" />
          <p>
            <strong className="font-semibold text-ink">No one is on the project yet.</strong> Add yourself first, then the
            designer and the contractors. Each person&rsquo;s role decides which view of the app they get.
          </p>
        </div>
      )}

      {state.people.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13.5px] text-ink-3">
          <span><strong className="text-ink font-semibold tnum">{byRole("homeowner")}</strong> family</span>
          <span><strong className="text-ink font-semibold tnum">{byRole("designer")}</strong> designer{byRole("designer") === 1 ? "" : "s"}</span>
          <span><strong className="text-ink font-semibold tnum">{byRole("vendor")}</strong> contractors &amp; vendors</span>
          {inactive > 0 && <span><span className="tnum">{inactive}</span> inactive</span>}
        </div>
      )}

      <EntityEditor collection="people" rows={state.people as unknown as Record<string, unknown>[]} />
    </div>
  );
}

/* ------------------------------------------------------------- categories */

function CategoriesTab() {
  const { state } = useProject();
  const groups = groupedCategories(state);
  const [asTable, setAsTable] = useState(false);

  return (
    <div className="space-y-6">
      <p className="text-[14.5px] text-ink-2 leading-relaxed max-w-3xl">
        Your trade list and the rate card behind it. Every indicative figure shown before a vendor has quoted
        comes from here — the rate, the wastage, the labour, the tax, and the lead time that decides whether
        an item counts as long-lead. Change a rate and every unquoted item in that trade follows.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13.5px] text-ink-3">
          <strong className="text-ink font-semibold tnum">{state.categories.length}</strong> categories in{" "}
          <span className="tnum">{groups.length}</span> groups
        </span>
        <div className="flex gap-2" role="group" aria-label="View">
          <button className="pill" aria-pressed={!asTable} onClick={() => setAsTable(false)}>By group</button>
          <button className="pill" aria-pressed={asTable} onClick={() => setAsTable(true)}>
            <Icon name="edit" size={14} /> Edit as a table
          </button>
        </div>
      </div>

      {!asTable ? (
        groups.length === 0 ? null : (
          <div className="space-y-7">
            {groups.map(({ group, items }) => (
              <section key={group} aria-labelledby={`cg-${group}`}>
                <h3 id={`cg-${group}`} className="eyebrow mb-2">{CATEGORY_GROUP_LABEL[group]}</h3>
                <div className="card divide-y divide-line">
                  {items.map((c) => {
                    const used = categoryUsage(state, c.id);
                    return (
                      <div key={c.id} className={`px-4 py-3 flex items-center gap-x-4 ${c.archived ? "bg-paper" : ""}`}>
                        <div className="min-w-0 flex-1">
                          <span className={`text-[14px] ${c.archived ? "text-ink-3" : "text-ink font-medium"}`}>{c.label}</span>
                          {c.archived && <span className="ml-2"><Chip tone="ghost">Archived</Chip></span>}
                          <div className="sm:hidden text-[13px] text-ink-3 mt-0.5 tnum">
                            {used} item{used === 1 ? "" : "s"} · {c.rate ? `${inr(c.rate)}/${c.unit}` : "no default rate"}
                          </div>
                        </div>
                        {(c.leadTimeWeeks ?? 0) >= 8 && <Chip tone="warn">{c.leadTimeWeeks}-week lead</Chip>}
                        <span className="hidden sm:block text-[13px] text-ink-3 tnum w-[72px] text-right">{used} item{used === 1 ? "" : "s"}</span>
                        {c.rate ? (
                          <span className="hidden sm:block text-[13px] tnum text-ink-2 w-[120px] text-right">{inr(c.rate)}/{c.unit}</span>
                        ) : (
                          <span className="hidden sm:block text-[13px] text-ink-3 w-[120px] text-right">No default rate</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )
      ) : (
        <EntityEditor collection="categories" rows={state.categories as unknown as Record<string, unknown>[]} />
      )}

      <p className="text-[13px] text-ink-3 leading-relaxed max-w-2xl">
        Prefer archiving to deleting. Archiving hides a trade from the pickers while the items that already use
        it carry on unchanged; deleting moves those items onto another category.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------- data */

function DataTab() {
  const { state, dispatch, storage } = useProject();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ name: string; next: ProjectState } | null>(null);

  const readFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const next = (parsed.state ?? parsed) as ProjectState;
      if (!next || !Array.isArray(next.items) || !Array.isArray(next.spaces)) {
        toast("That file is not a villa backup — it has no spaces or scope items. Nothing was changed.", { tone: "bad" });
        return;
      }
      // A backup taken before categories existed still has to load.
      if (!Array.isArray(next.categories) || !next.categories.length) {
        next.categories = state.categories;
      }
      setPending({ name: file.name, next });
    } catch (e) {
      toast(`Could not read that file: ${(e as Error).message}. Nothing was changed.`, { tone: "bad" });
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card px-5 py-5 flex flex-col">
        <div className="flex items-center gap-2">
          <Icon name="download" size={18} className="text-ink-3" />
          <h2 className="text-[16px]">Back up</h2>
        </div>
        <p className="text-[14px] text-ink-3 mt-1.5 mb-4 leading-relaxed">
          Downloads the entire project as one JSON file — every space, scope item, decision, quote and note.
          Take one before anything you cannot undo.
        </p>
        <div className="mt-auto">
          <button className="btn btn-primary" onClick={() => toast(`Backup downloaded as ${downloadBackup(state)}`)}>
            <Icon name="download" size={16} /> Download a backup
          </button>
        </div>
      </div>

      <div className="card px-5 py-5 flex flex-col">
        <div className="flex items-center gap-2">
          <Icon name="upload" size={18} className="text-ink-3" />
          <h2 className="text-[16px]">Restore from a backup</h2>
        </div>
        <p className="text-[14px] text-ink-3 mt-1.5 mb-4 leading-relaxed">
          Replaces everything in the project with the contents of a backup file. The file is checked first, and
          you confirm before anything is replaced.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void readFile(f); e.target.value = ""; }}
        />
        <div className="mt-auto">
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} /> Choose a backup file…
          </button>
        </div>
      </div>

      <Confirm
        open={!!pending}
        title="Replace the project with this backup?"
        confirmLabel="Replace the project"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return;
          dispatch({ type: "data/import", state: pending.next });
          toast(`Restored ${pending.next.items.length.toLocaleString("en-IN")} scope items across ${pending.next.spaces.length} spaces`);
          setPending(null);
        }}
      >
        {pending && (
          <>
            <p>
              <span className="font-mono text-[13px] text-ink break-all">{pending.name}</span> holds{" "}
              <strong className="font-semibold text-ink">{pending.next.spaces.length} spaces</strong> and{" "}
              <strong className="font-semibold text-ink">{pending.next.items.length.toLocaleString("en-IN")} scope items</strong>.
            </p>
            <p>
              Everything in the project now — {state.spaces.length} spaces, {state.items.length.toLocaleString("en-IN")} scope
              items and all their decisions, quotes and notes — is replaced{storage.mode === "server" ? " for everyone. The restore is recorded in History." : ". History in this browser starts again from the restored file."}
            </p>
            <button className="link text-[14px]" onClick={() => toast(`Backup downloaded as ${downloadBackup(state)}`)}>
              Download a backup of the current project first
            </button>
          </>
        )}
      </Confirm>
    </div>
  );
}

/* ------------------------------------------------------------ danger zone */

function DangerZone() {
  const { state, dispatch, storage } = useProject();
  const shared = storage.mode === "server";
  const toast = useToast();
  const [ask, setAsk] = useState<null | "empty" | "twin" | "sample">(null);
  const [keep, setKeep] = useState<KeepOptions>({ spaces: true, categories: true, people: true, vendors: false, settings: false, scenarios: true });
  const [typed, setTyped] = useState("");
  const [tried, setTried] = useState(false);

  const preview = useMemo(() => emptyProject(state, keep), [state, keep]);
  const losing = COLLECTION_KEYS
    .map((k) => ({
      label: SCHEMAS[k as CollectionKey].label,
      before: (state[k as CollectionKey] as unknown[]).length,
      after: (preview[k as CollectionKey] as unknown[]).length,
    }))
    .filter((r) => r.before !== r.after);
  const totalLost = losing.reduce((a, r) => a + (r.before - r.after), 0);
  const totalNow = COLLECTION_KEYS.reduce((a, k) => a + (state[k as CollectionKey] as unknown[]).length, 0);

  const KEEPS: { key: keyof KeepOptions; label: string; hint: string }[] = [
    { key: "spaces", label: "The villa itself", hint: `Strongly recommended — the ${state.spaces.length} rooms, floors and dimensions come from the architect's drawings, not from anything you typed.` },
    { key: "categories", label: "Categories & rate card", hint: "Strongly recommended — without a category list you cannot create a single scope item." },
    { key: "people", label: "People", hint: "Names and roles." },
    { key: "vendors", label: "Vendors", hint: "Your supplier directory outlives any one project." },
    { key: "scenarios", label: "Costing scenarios", hint: "Practical, Premium and No-compromise." },
    { key: "settings", label: "Project settings", hint: "Name, address, plot, budget and dates." },
  ];

  const close = () => { setAsk(null); setTyped(""); setTried(false); };
  const wayBack = shared
    ? "You can undo it by restoring from History, or from a backup file."
    : storage.mode === "browser"
      ? "The only way back is a backup file — the history kept in this browser starts again too."
      : "A backup file is the surest way back.";
  const backupLink = (
    <button className="link text-[14px]" onClick={() => toast(`Backup downloaded as ${downloadBackup(state)}`)}>
      Download a backup first
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg bg-bad-soft px-4 py-3 text-[14px] text-ink-2 leading-relaxed">
        <Icon name="alert" size={18} className="text-bad shrink-0 mt-0.5" />
        <p>
          Each of these replaces the project{shared ? " for everyone on it" : ""}.{" "}
          {shared
            ? <>The way back is to restore from <strong className="font-semibold text-ink">History</strong> or a backup file.</>
            : storage.mode === "browser"
              ? <>History in this browser starts again afterwards, so a backup file is the only way back.</>
              : <>A backup file is the surest way back.</>}{" "}
          {backupLink}
        </p>
      </div>

      {/* ---------------------------------------------------------- empty */}
      <div className="card px-5 py-5 border-bad/30">
        <h2 className="text-[16px]">Start from scratch</h2>
        <p className="text-[14px] text-ink-2 mt-1.5 leading-relaxed max-w-2xl">
          Empties the project so you can build your own from nothing — no sample villa, no seeded scope, no
          example vendors. Choose what to carry over; everything else goes.
        </p>

        <fieldset className="mt-4">
          <legend className="eyebrow mb-2.5">Keep</legend>
          <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
            {KEEPS.map((k) => (
              <label key={k.key} className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-[3px] shrink-0"
                  checked={!!keep[k.key]}
                  onChange={(e) => setKeep((v) => ({ ...v, [k.key]: e.target.checked }))}
                />
                <span>
                  <span className="text-[14px] font-medium">{k.label}</span>
                  <span className="block text-[13px] text-ink-3 leading-snug mt-0.5">{k.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="hairline mt-5 pt-4">
          <div className="eyebrow">What this removes</div>
          {losing.length ? (
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              {losing.map((r) => (
                <li key={r.label} className="text-[13px] text-ink-3">
                  {r.label} <span className="tnum text-ink font-medium">{r.before.toLocaleString("en-IN")} → {r.after.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13.5px] text-ink-3 mt-2">Nothing — with these choices the project is already as empty as it gets.</p>
          )}
          {totalLost > 0 && (
            <p className="text-[14px] text-bad font-semibold mt-2.5">
              <span className="tnum">{totalLost.toLocaleString("en-IN")}</span> record{totalLost === 1 ? "" : "s"} will be deleted.
            </p>
          )}
        </div>

        <button className="btn btn-danger mt-5" disabled={totalLost === 0} onClick={() => setAsk("empty")}>
          <Icon name="trash" size={16} /> Empty the project…
        </button>
      </div>

      {/* ----------------------------------------------------------- twin */}
      <div className="card px-5 py-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex-1 min-w-[260px]">
          <h2 className="text-[16px]">Start again from the villa itself</h2>
          <p className="text-[14px] text-ink-3 mt-1 leading-relaxed max-w-2xl">
            The empty twin: every room from the drawings with its real dimensions and its scope checklist at
            &ldquo;not started&rdquo;, the category list and rate card — and nobody, no vendors, no money, no
            history. This is what a new project starts as.
          </p>
        </div>
        <button className="btn btn-danger-quiet" onClick={() => setAsk("twin")}>Reset to the empty twin…</button>
      </div>

      {/* --------------------------------------------------------- sample */}
      <div className="card px-5 py-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex-1 min-w-[260px]">
          <h2 className="text-[16px]">Load the sample villa</h2>
          <p className="text-[14px] text-ink-3 mt-1 leading-relaxed max-w-2xl">
            The fully worked example — every room filled in with scope, people, vendors, decisions, quotes and
            snags — replacing whatever is there now. Useful for seeing how a finished project reads.
          </p>
        </div>
        <button className="btn btn-danger-quiet" onClick={() => setAsk("sample")}>Load the sample villa…</button>
      </div>

      {/* -------------------------------------------------------- confirms */}
      <Confirm
        open={ask === "empty"}
        title={`Delete ${totalLost.toLocaleString("en-IN")} records?`}
        confirmLabel="Empty the project"
        onCancel={close}
        onConfirm={() => {
          setTried(true);
          if (typed.trim().toUpperCase() !== "EMPTY") return;
          dispatch({ type: "data/clear", keep });
          toast(`Project emptied — ${totalLost.toLocaleString("en-IN")} records deleted`);
          close();
        }}
      >
        <p>
          This deletes <strong className="font-semibold text-ink">{totalLost.toLocaleString("en-IN")} records</strong>
          {shared ? " for everyone on the project" : ""}: {losing.slice(0, 4).map((r) => r.label.toLowerCase()).join(", ")}{losing.length > 4 ? " and more" : ""}.
        </p>
        <p>{wayBack} {backupLink}</p>
        <div className="pt-2">
          <Field
            label="Type EMPTY to confirm"
            error={tried && typed.trim().toUpperCase() !== "EMPTY" ? "Type the word EMPTY to go ahead." : undefined}
          >
            <input
              className="input font-mono" value={typed} onChange={(e) => setTyped(e.target.value)}
              placeholder="EMPTY" autoComplete="off" aria-invalid={tried && typed.trim().toUpperCase() !== "EMPTY"}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            />
          </Field>
        </div>
      </Confirm>

      <Confirm
        open={ask === "twin"}
        title="Reset to the empty twin?"
        confirmLabel="Reset the project"
        onCancel={close}
        onConfirm={() => { dispatch({ type: "reset" }); toast("Reset to the empty twin of the villa"); close(); }}
      >
        <p>
          All <strong className="font-semibold text-ink">{totalNow.toLocaleString("en-IN")} records</strong> in the project are
          replaced{shared ? " for everyone" : ""} by the empty twin: every room from the drawings and the rate card, with
          no people, vendors, money, decisions or notes.
        </p>
        <p>{wayBack} {backupLink}</p>
      </Confirm>

      <Confirm
        open={ask === "sample"}
        title="Replace the project with the sample villa?"
        confirmLabel="Load the sample"
        onCancel={close}
        onConfirm={() => { dispatch({ type: "reset", to: "sample" }); toast("Sample villa loaded"); close(); }}
      >
        <p>
          All <strong className="font-semibold text-ink">{totalNow.toLocaleString("en-IN")} records</strong> in the project are
          replaced{shared ? " for everyone on the project" : ""} by the worked example.
        </p>
        <p>{wayBack} {backupLink}</p>
      </Confirm>
    </div>
  );
}
