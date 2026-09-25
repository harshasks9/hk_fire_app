"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProject, newId } from "@/lib/store";
import {
  spaceMetrics, rollup, itemsForSpace, byCategory, forecastOf, findGaps, bucketOf,
  COMPLETENESS_BUCKETS,
} from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { MeasureTable, DimsShort } from "@/components/Measure";
import { roomChecklist } from "@/lib/model/checklist";
import { ChecklistBody } from "@/components/Checklist";
import { RoomDrawings } from "@/components/RoomDrawings";
import { LayoutsPanel } from "@/components/LayoutsPanel";
import { SpecChecklist } from "@/components/SpecChecklist";
import { specFor, specProgress } from "@/lib/specs";
import { designFor } from "@/lib/design";
import { roomLens } from "@/lib/model/lens";
import { drawingsForSpace } from "@/lib/plans/room-drawings";
import {
  CATEGORY_LABEL, STAGE_LABEL, type ScopeItem, type Category, type Idea, type DesignOption,
  type Decision, type Doc, type Task, type SiteUpdate, type Note, type Snag,
} from "@/lib/model/types";
import {
  PageTitle, Eyebrow, Stat, Bar, Chip, StageChip, Money, PhotoBlock, Tabs, Empty,
  fmtDay, BudgetBar, Assumed, Section, LegendDot, BAR, useToast,
} from "@/components/ui";
import { Icon } from "@/components/Icon";
import { ItemSheet } from "@/components/ItemSheet";
import { DecisionCard, OptionTile } from "@/components/DecisionCard";
import { Comments } from "@/components/Comments";
import { FloorPlan } from "@/components/FloorPlan";
import { AddButton, RowActions, EntityLink, EmptyWithAdd, useEntity } from "@/components/Entity";
import { FLOOR_META } from "@/lib/seed/spaces";
import { catLabel, categoryOptions, buildUpFromCategory } from "@/lib/model/categories";

const TABS = ["Layouts", "Specification", "Checklist", "Design", "Decisions", "Scope", "Cost", "On site"] as const;
type Tab = (typeof TABS)[number];

/** Old tab names still work in links: each now lives inside one of the seven. */
const ALIAS: Record<string, { tab: Tab; sub?: string }> = {
  Ideas: { tab: "Design" }, Products: { tab: "Scope", sub: "buy" }, Vendors: { tab: "Cost" },
  Tasks: { tab: "On site", sub: "tasks" }, Files: { tab: "On site", sub: "files" },
  "Site photos": { tab: "On site", sub: "photos" }, Issues: { tab: "On site", sub: "issues" },
};

/**
 * The room workspace.
 *
 * One room, everything about it, in one place. The header answers the four
 * questions a homeowner asks on walking in — how far along, what does it cost,
 * what is waiting on me, what is next — and the tabs below are the same scope
 * items seen through eleven different lenses.
 */
export default function RoomPage() {
  const params = useParams<{ spaceId: string }>();
  const searchParams = useSearchParams();
  const { state, role, meId } = useProject();
  const { edit } = useEntity();
  const hasLayouts = !!designFor(decodeURIComponent(params.spaceId));
  const [tab, setTab] = useState<Tab>(hasLayouts ? "Layouts" : "Checklist");
  const [sub, setSub] = useState<string | undefined>(undefined);
  const spec = specFor(decodeURIComponent(params.spaceId));
  const tabs = TABS.filter((t) => (t !== "Layouts" || hasLayouts) && (t !== "Specification" || !!spec));
  const [openItem, setOpenItem] = useState<ScopeItem | null>(null);

  const spaceId = decodeURIComponent(params.spaceId);
  const space = state.spaces.find((s) => s.id === spaceId);

  const items = useMemo(() => itemsForSpace(state, spaceId), [state, spaceId]);
  const m = useMemo(() => spaceMetrics(state, spaceId), [state, spaceId]);
  const r = useMemo(() => rollup(items, state.decisions), [items, state.decisions]);
  const itemIds = useMemo(() => new Set(items.map((i) => i.id)), [items]);

  const ideas = state.ideas.filter((i) => itemIds.has(i.scopeItemId));
  const options = state.options.filter((o) => itemIds.has(o.scopeItemId));
  const decisions = state.decisions.filter((d) => itemIds.has(d.scopeItemId));
  const openDec = decisions.filter((d) => d.status === "awaiting-owner" || d.status === "changes-requested");
  const tasks = state.tasks.filter((t) => t.spaceId === spaceId || (t.scopeItemId && itemIds.has(t.scopeItemId)));
  const snags = state.snags.filter((s) => s.spaceId === spaceId);
  const updates = state.siteUpdates.filter((u) => u.spaceId === spaceId);
  const docs = state.docs.filter((d) => d.spaceIds.includes(spaceId) || d.scopeItemIds.some((x) => itemIds.has(x)));
  const notes = state.notes.filter((n) => n.spaceIds.includes(spaceId));
  const gaps = useMemo(() => findGaps(state).filter((g) => g.spaceId === spaceId), [state, spaceId]);
  const checklist = useMemo(() => roomChecklist(state, spaceId), [state, spaceId]);
  const products = items.filter((i) => i.procurement);
  const vendorIds = Array.from(new Set(items.map((i) => i.vendorId).filter(Boolean))) as string[];

  const children = state.spaces.filter((s) => s.parentId === spaceId);
  const parent = space?.parentId ? state.spaces.find((s) => s.id === space.parentId) : undefined;

  // Deep link: /villa/ff-master?item=xyz opens that item directly; ?tab=Layouts opens a tab.
  React.useEffect(() => {
    const t = searchParams.get("tab");
    if (t && (tabs as readonly string[]).includes(t)) setTab(t as Tab);
    else if (t && ALIAS[t]) { setTab(ALIAS[t].tab); setSub(ALIAS[t].sub); }
    const want = searchParams.get("item");
    if (want) {
      const it = state.items.find((i) => i.id === want);
      if (it) { setOpenItem(it); setTab("Scope"); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, state.items, hasLayouts]);

  if (space && !roomLens(state, role, meId)(space.id)) {
    return <Empty icon="lock" title="Not one of your rooms." hint="Your view is limited to the rooms assigned to you under Settings → People."
      action={<Link href="/villa" className="btn btn-sm">Back to rooms</Link>} />;
  }
  if (!space) {
    return <Empty icon="villa" title="That room isn’t in the villa." hint="It may have been renamed or removed."
      action={<Link href="/villa" className="btn btn-sm">See all rooms</Link>} />;
  }

  const nextMilestone = tasks
    .filter((t) => t.status !== "done" && t.finish)
    .sort((a, b) => +new Date(a.finish!) - +new Date(b.finish!))[0];

  const openTasks = tasks.filter((t) => t.status !== "done").length;
  const openSnags = snags.filter((s) => s.status !== "closed").length;
  const counts: Partial<Record<Tab, number>> = {
    Layouts: designFor(spaceId)?.layouts.length,
    Specification: spec ? specProgress(spec, space?.specChecks).total - specProgress(spec, space?.specChecks).done : undefined,
    Checklist: checklist ? checklist.total - checklist.done : undefined,
    Design: ideas.length + options.length || undefined,
    Decisions: decisions.length, Scope: r.live,
    "On site": openSnags + openTasks + updates.length + docs.length || undefined,
  };
  const pick = (t: Tab) => { setTab(t); setSub(undefined); };

  return (
    <div>
      <PageTitle
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <Link href="/villa" className="hover:text-ink">Rooms</Link>
            <span aria-hidden>/</span>
            <span>{FLOOR_META[space.floor].label}</span>
            {parent && <><span aria-hidden>/</span><Link href={`/villa/${parent.id}`} className="hover:text-ink">{parent.name}</Link></>}
          </span>
        }
        title={space.name}
        sub={space.note}
        right={
          <button className="btn" onClick={() => edit("spaces", space.id)}>
            <Icon name="edit" size={16} /> Edit room
          </button>
        }
      />

      {/* ------------------------------------------------------------ header */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5 mb-8">
        <div className="min-w-0 space-y-4">
          <div className="card stat-strip">
            <Stat label="Complete" value={`${Math.round(m.completionPct)}%`} sub={`${r.live} scope lines`} />
            <Stat label="Forecast" value={<Money value={r.forecast} compact />} sub={r.approvedBudget ? `budget ${inr(r.approvedBudget, { compact: true })}` : "no approved budget yet"} />
            <Stat
              label="Awaiting you"
              value={openDec.length || "None"}
              tone={openDec.length ? "accent" : undefined}
              sub={openDec.length ? openDec[0].title : "nothing outstanding"}
            />
            <Stat
              label="Next date"
              value={nextMilestone ? fmtDay(nextMilestone.finish) : "None"}
              sub={nextMilestone?.title ?? "nothing scheduled"}
            />
          </div>

          <div>
            <BudgetBar paid={r.paid} committed={r.committed} forecast={r.forecast} budget={r.approvedBudget} />
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-3">
              <LegendDot color={BAR.paid} label={`${inr(r.paid, { compact: true })} paid`} />
              <LegendDot color={BAR.committed} label={`${inr(r.remainingCommitment, { compact: true })} committed, unpaid`} />
              <LegendDot color={BAR.forecast} label={`${inr(r.uncommittedEstimate, { compact: true })} still an estimate`} />
            </div>
          </div>

          {gaps.length > 0 && (
            <div className="card px-4 py-3.5">
              <div className="eyebrow">Not yet thought about</div>
              <ul className="mt-2 space-y-1.5">
                {gaps.slice(0, 3).map((g) => (
                  <li key={g.id} className="text-[13px] leading-snug flex gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: g.severity === "blocker" ? "var(--color-bad)" : g.severity === "risk" ? "var(--color-warn)" : "var(--color-ink-4)" }} />
                    <span className="text-ink-2">{g.title.replace(`${space.name} — `, "")}</span>
                  </li>
                ))}
              </ul>
              {gaps.length > 3 && (
                <Link href="/more/completeness" className="link text-[13px] mt-2 inline-flex items-center gap-1">
                  {gaps.length - 3} more <Icon name="arrow-right" size={13} />
                </Link>
              )}
            </div>
          )}
          {children.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-ink-3">Part of this room:</span>
              {children.map((c) => (
                <Link key={c.id} href={`/villa/${c.id}`} className="pill">{c.name}</Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-3 min-w-0">
          {updates[0] && (
            <PhotoBlock tone={updates[0].photoSwatch ?? "#c9bfae"} ratio="16 / 9" label={`Site — ${fmtDay(updates[0].at)}`} className="hidden lg:block" />
          )}
          <div className="hidden lg:block"><MeasureTable sp={space} /></div>
          {/* On a phone the measurements fold into one line, so the tabs stay near the top. */}
          <details className="lg:hidden card group">
            <summary className="list-none cursor-pointer px-4 py-3 flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="eyebrow block">Measurements</span>
                <span className="block text-[14px] text-ink-2 truncate mt-0.5"><DimsShort sp={space} /></span>
              </span>
              <Icon name="chevron-down" size={18} className="text-ink-3 transition-transform group-open:rotate-180 shrink-0" />
            </summary>
            <div className="px-1 pb-1"><MeasureTable sp={space} /></div>
          </details>
        </aside>
      </div>

      <Tabs tabs={tabs} active={tab} onChange={pick} counts={counts} label={`${space.name} sections`} />

      <div className="mt-6" role="tabpanel" aria-label={tab}>
        {tab === "Layouts" && <LayoutsPanel spaceId={spaceId} />}
        {tab === "Specification" && spec && <SpecChecklist spec={spec} />}
        {tab === "Checklist" && <ChecklistTab spaceId={spaceId} />}
        {tab === "Design" && (
          <div className="space-y-10">
            <DesignTab spaceId={spaceId} options={options} ideas={ideas} decisions={decisions} docs={docs} />
            <Section title={`Ideas${ideas.length ? ` · ${ideas.length}` : ""}`}>
              <IdeasTab spaceId={spaceId} ideas={ideas} items={items} />
            </Section>
          </div>
        )}
        {tab === "Decisions" && (
          decisions.length ? (
            <div className="space-y-3">{decisions.map((d) => <DecisionCard key={d.id} decision={d} />)}</div>
          ) : (
            <Empty icon="decisions" title="No decisions raised for this room yet." hint="A decision is created the moment the designer wants a choice made — from an idea, an option, or straight from a scope item." />
          )
        )}
        {tab === "Scope" && (
          <SubNav
            value={sub ?? "all"} onChange={setSub}
            items={[{ key: "all", label: "All scope", n: r.live }, { key: "buy", label: "Things to buy", n: products.length }]}
          >
            {(sub ?? "all") === "all" ? <ScopeTab items={items} onOpen={setOpenItem} spaceId={spaceId} /> : <ProductsTab items={products} onOpen={setOpenItem} />}
          </SubNav>
        )}
        {tab === "Cost" && (
          <div className="space-y-10">
            <CostTab items={items} rollupData={r} />
            <Section title={`Vendors on this room${vendorIds.length ? ` · ${vendorIds.length}` : ""}`}>
              <VendorsTab vendorIds={vendorIds} items={items} />
            </Section>
          </div>
        )}
        {tab === "On site" && (() => {
          const firstWithSomething = openSnags ? "issues" : openTasks ? "tasks" : updates.length || notes.length ? "photos" : docs.length ? "files" : "issues";
          const cur = sub ?? firstWithSomething;
          return (
            <SubNav
              value={cur} onChange={setSub}
              items={[
                { key: "issues", label: "Snags", n: openSnags },
                { key: "tasks", label: "Tasks", n: openTasks },
                { key: "photos", label: "Photos & notes", n: updates.length + notes.length },
                { key: "files", label: "Files", n: docs.length },
              ]}
            >
              {cur === "issues" && <IssuesTab snags={snags} spaceId={spaceId} />}
              {cur === "tasks" && <TasksTab tasks={tasks} spaceId={spaceId} />}
              {cur === "photos" && <SiteTab updates={updates} notes={notes} spaceId={spaceId} />}
              {cur === "files" && <FilesTab docs={docs} spaceId={spaceId} />}
            </SubNav>
          );
        })()}
      </div>

      <ItemSheet item={openItem} open={!!openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}

/** A second level of navigation inside a tab — pills, not more tabs. */
function SubNav({
  value, onChange, items, children,
}: { value: string; onChange: (v: string) => void; items: { key: string; label: string; n?: number }[]; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 -mx-1 px-1" role="group" aria-label="Show" style={{ scrollbarWidth: "none" }}>
        {items.map((it) => (
          <button key={it.key} className="pill shrink-0" aria-pressed={value === it.key} onClick={() => onChange(it.key)}>
            {it.label}{it.n !== undefined && <span className="count">{it.n}</span>}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- tabs */

function DesignTab({
  spaceId, options, decisions, docs,
}: { spaceId: string; options: DesignOption[]; ideas: Idea[]; decisions: Decision[]; docs: Doc[] }) {
  const { state } = useProject();
  const router = useRouter();
  const space = state.spaces.find((s) => s.id === spaceId)!;
  const renders = docs.filter((d) => d.kind === "render");

  return (
    <div className="space-y-7">
      <RoomDrawings spaceId={spaceId} />
      <div>
        <Eyebrow className="mb-2.5">Where this room sits</Eyebrow>
        <div className="card px-4 py-4">
          <FloorPlan
            floor={space.floor} overlay="completion" selectedId={spaceId} compact
            onSelect={(id) => { if (id && id !== spaceId) router.push(`/villa/${id}`); }}
          />
        </div>
      </div>

      {options.length > 0 && (
        <div>
          <Eyebrow className="mb-2.5">Design options on the table</Eyebrow>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {options.map((o) => <OptionTile key={o.id} option={o} recommended={o.designerRecommended} />)}
          </div>
        </div>
      )}

      {decisions.length > 0 && (
        <div>
          <Eyebrow className="mb-2.5">Open decisions</Eyebrow>
          <div className="space-y-3">
            {decisions.slice(0, 2).map((d) => <DecisionCard key={d.id} decision={d} />)}
          </div>
        </div>
      )}

      {renders.length > 0 && (
        <div>
          <Eyebrow className="mb-2.5">Renders & drawings</Eyebrow>
          <div className="grid sm:grid-cols-3 gap-3">
            {renders.map((d) => (
              <div key={d.id}>
                <PhotoBlock tone="#b9ada0" ratio="4 / 3" label={d.revision} />
                <div className="text-[13px] mt-1.5">{d.title}</div>
                <div className="text-[12px] text-ink-3">{d.addedBy} · {fmtDay(d.addedAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {options.length === 0 && decisions.length === 0 && renders.length === 0 && (
        <Empty
          title="No design work on this room yet."
          hint="Start with an idea — a photo, a link, a screenshot. Ideas become options, options become a decision, and the decision carries straight into the BOQ."
        />
      )}
    </div>
  );
}

function IdeasTab({ ideas, items }: { spaceId: string; ideas: Idea[]; items: ScopeItem[] }) {
  const { state, dispatch, me } = useProject();
  const [text, setText] = useState("");
  const [target, setTarget] = useState(items[0]?.id ?? "");

  const add = () => {
    if (!text.trim() || !target) return;
    dispatch({
      type: "idea/add",
      idea: {
        id: newId("idea"), scopeItemId: target, title: text.trim(), createdBy: me,
        createdAt: new Date().toISOString(),
        attachments: [{ id: newId("a"), kind: "image", label: text.trim(), swatch: "#c3b6a4", addedBy: me, addedAt: new Date().toISOString() }],
      },
    });
    setText("");
  };

  return (
    <div>
      <div className="card px-4 py-4 mb-5">
        <Eyebrow className="mb-2">Add an idea</Eyebrow>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input" aria-label="The idea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a link, describe a reference, name a material…" />
          <select className="input sm:w-64" aria-label="Against which scope line" value={target} onChange={(e) => setTarget(e.target.value)}>
            {items.map((i: ScopeItem) => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>
          <button className="btn btn-primary shrink-0" onClick={add} disabled={!text.trim()}><Icon name="plus" size={15} strokeWidth={2} /> Add idea</button>
        </div>
        <p className="text-[12.5px] text-ink-3 mt-2">Every idea attaches to a piece of scope, so it can become an option and then a decision without being retyped.</p>
      </div>

      {ideas.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea) => {
            const item = state.items.find((i) => i.id === idea.scopeItemId);
            return (
              <div key={idea.id} className="card overflow-hidden">
                <div className="grid grid-cols-2 gap-px bg-line">
                  {(idea.attachments.length ? idea.attachments : [{ id: "x", swatch: "#c3b6a4", label: "" }]).slice(0, 2).map((a) => (
                    <PhotoBlock key={a.id} tone={a.swatch ?? "#c3b6a4"} ratio="1 / 1" label={a.label} className="rounded-none border-0" />
                  ))}
                </div>
                <div className="px-3.5 py-3">
                  <div className="text-[14.5px] leading-snug">{idea.title}</div>
                  {idea.body && <p className="text-[13px] text-ink-3 mt-1.5 leading-relaxed">{idea.body}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[12.5px] text-ink-4 truncate">{item?.title}</span>
                    <button
                      onClick={() => dispatch({ type: "idea/shortlist", id: idea.id })}
                      className={`chip shrink-0 border ${idea.shortlisted ? "bg-accent-soft text-accent-strong border-transparent" : "bg-card text-ink-3 border-line-2 hover:text-ink"}`}
                      aria-pressed={!!idea.shortlisted}
                    >
                      {idea.shortlisted ? "★ Shortlisted" : "☆ Shortlist"}
                    </button>
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-line">
                    <Comments targetType="idea" targetId={idea.id} compact placeholder="Comment…" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty title="No ideas yet for this room." hint="This is where inspiration lands before it becomes a decision." />
      )}
    </div>
  );
}

function ScopeTab({ items, onOpen, spaceId }: { items: ScopeItem[]; onOpen: (i: ScopeItem) => void; spaceId: string }) {
  const { state, dispatch } = useProject();
  const [showNA, setShowNA] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState<Category>("flooring");

  const space = state.spaces.find((s) => s.id === spaceId);
  const addItem = () => {
    if (!newTitle.trim()) return;
    dispatch({
      type: "create", on: "items",
      row: {
        id: newId("item"), title: newTitle.trim(), spaceId, category: newCat, stage: "not-started",
        cost: buildUpFromCategory(state, newCat, space), ladder: {}, tags: [],
      },
    });
    setNewTitle("");
    setAdding(false);
  };
  const grouped = byCategory(items.filter((i) => showNA || i.stage !== "not-applicable"));
  const na = items.filter((i) => i.stage === "not-applicable");

  const buckets = COMPLETENESS_BUCKETS.map((b) => ({
    ...b, n: items.filter((i) => bucketOf(i.stage) === b.key).length,
  })).filter((b) => b.n > 0);

  return (
    <div>
      <div className="card px-4 py-3.5 mb-4">
        <Eyebrow className="mb-2.5">Everything this room needs</Eyebrow>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {buckets.map((b) => (
            <div key={b.key}>
              <div className="text-[20px] font-semibold leading-none">{b.n}</div>
              <div className="text-[12px] text-ink-3">{b.label}</div>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] text-ink-3 mt-3 leading-relaxed">
          This checklist was pre-populated the moment the room existed. Items are never deleted —
          anything not needed is marked <em>Not applicable</em> with a reason, which is how you prove later that it was considered.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {adding ? (
          <>
            <input className="input w-auto flex-1 min-w-[180px]" autoFocus aria-label="New scope line" value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="What else does this room need?" />
            <select className="input w-auto" aria-label="Category" value={newCat} onChange={(e) => setNewCat(e.target.value as Category)}>
              {categoryOptions(state).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={addItem} disabled={!newTitle.trim()}>Add line</button>
            <button className="btn btn-sm" onClick={() => setAdding(false)}>Cancel</button>
          </>
        ) : (
          <>
            <button className="btn btn-sm btn-primary" onClick={() => setAdding(true)}><Icon name="plus" size={15} strokeWidth={2} /> Add a scope line</button>
            <Link href="/manage" className="btn btn-sm">Bulk edit this floor</Link>
          </>
        )}
      </div>

      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([cat, list]) => (
          <div key={cat}>
            <div className="flex items-baseline justify-between mb-1.5">
              <Eyebrow>{catLabel(state, cat as Category)}</Eyebrow>
              <span className="text-[12.5px] text-ink-4 tnum">
                {inr(list.reduce((a, i) => a + forecastOf(i), 0), { compact: true })}
              </span>
            </div>
            <div className="card divide-y divide-line">
              {list.map((i) => (
                <div key={i.id} className="group flex items-center gap-3 px-3.5 py-2.5 hover:bg-paper transition-colors">
                <button
                  onClick={() => onOpen(i)}
                  className="flex-1 text-left flex items-center gap-3 min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] flex items-center gap-2">
                      <span className={i.stage === "not-applicable" ? "line-through text-ink-4" : ""}>{i.title}</span>
                      {i.tags?.includes("critical") && <Chip tone="accent" small>critical</Chip>}
                    </div>
                    {i.spec && <div className="text-[12.5px] text-ink-3 truncate mt-0.5">{i.spec}</div>}
                    {i.stage === "not-applicable" && i.naReason && (
                      <div className="text-[12.5px] text-ink-4 mt-0.5 italic">{i.naReason}</div>
                    )}
                  </div>
                  <span className="tnum text-[13px] text-ink-3 shrink-0 hidden sm:block">
                    {i.stage === "not-applicable" ? "—" : inr(forecastOf(i), { compact: true })}
                  </span>
                  <StageChip stage={i.stage} small />
                </button>
                <RowActions on="items" id={i.id} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {na.length > 0 && !showNA && (
        <button className="btn btn-sm mt-4" onClick={() => setShowNA(true)}>
          Show {na.length} item{na.length > 1 ? "s" : ""} marked not applicable
        </button>
      )}
    </div>
  );
}

function CostTab({ items, rollupData }: { items: ScopeItem[]; rollupData: ReturnType<typeof rollup> }) {
  const { state } = useProject();
  const grouped = byCategory(items.filter((i) => i.stage !== "not-applicable"));
  const rows = Array.from(grouped.entries())
    .map(([cat, list]) => ({
      cat,
      forecast: list.reduce((a, i) => a + forecastOf(i), 0),
      approved: list.reduce((a, i) => a + (i.ladder.approved ?? 0), 0),
      committed: list.reduce((a, i) => a + (i.ladder.committed ?? 0), 0),
      paid: list.reduce((a, i) => a + (i.ladder.paid ?? 0), 0),
      n: list.length,
    }))
    .sort((a, b) => b.forecast - a.forecast);
  const max = Math.max(...rows.map((r) => r.forecast), 1);

  return (
    <div>
      <div className="card stat-strip mb-4">
        <Stat label="Initial estimate" value={<Money value={rollupData.initialEstimate} compact />} />
        <Stat label="Approved" value={<Money value={rollupData.approvedBudget} compact />} />
        <Stat label="Committed" value={<Money value={rollupData.committed} compact />} />
        <Stat
          label="Forecast"
          value={<Money value={rollupData.forecast} compact />}
          tone={rollupData.variance > 0 ? "bad" : "good"}
          sub={`${rollupData.variance > 0 ? "+" : ""}${inr(rollupData.variance, { compact: true })} vs approved`}
        />
      </div>

      <div className="card px-4 py-4">
        <Eyebrow className="mb-3">By category</Eyebrow>
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.cat}>
              <div className="flex items-baseline justify-between text-[13.5px] mb-1">
                <span className="text-ink-2">{catLabel(state, r.cat)} <span className="text-ink-4 tnum">({r.n})</span></span>
                <span className="tnum">{inr(r.forecast)}</span>
              </div>
              <div className="flex h-[5px] rounded-full overflow-hidden bg-paper-3" style={{ width: `${(r.forecast / max) * 100}%`, minWidth: 20 }}>
                <div style={{ width: `${r.forecast ? (r.paid / r.forecast) * 100 : 0}%`, background: BAR.paid }} />
                <div style={{ width: `${r.forecast ? (Math.max(0, r.committed - r.paid) / r.forecast) * 100 : 0}%`, background: BAR.committed }} />
                <div className="flex-1" style={{ background: BAR.forecast }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[12.5px] text-ink-3 mt-4 leading-relaxed">
          Dark green is paid, light green is committed but unpaid, grey is still an{" "}
          <Assumed>estimate</Assumed>.
        </p>
      </div>
    </div>
  );
}

function ProductsTab({ items, onOpen }: { items: ScopeItem[]; onOpen: (i: ScopeItem) => void }) {
  const { state } = useProject();
  if (!items.length) return <Empty title="Nothing to buy in this room." hint="This room's scope is all works rather than products." />;
  const sorted = [...items].sort((a, b) => (b.procurement?.leadTimeWeeks ?? 0) - (a.procurement?.leadTimeWeeks ?? 0));
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {sorted.slice(0, 60).map((i) => {
        const p = i.procurement!;
        const vendor = state.vendors.find((v) => v.id === (p.vendorId ?? i.vendorId));
        return (
          <button key={i.id} onClick={() => onOpen(i)} className="card overflow-hidden text-left hover:border-ink-4 transition-colors">
            <PhotoBlock tone={p.swatch ?? "#c6bbab"} ratio="16 / 10" label={p.brand} />
            <div className="px-3.5 py-3">
              <div className="text-[14px] leading-snug">{p.product ?? i.title}</div>
              <div className="text-[12.5px] text-ink-3 mt-0.5 truncate">{vendor?.name ?? "No vendor yet"}</div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Chip tone={p.status === "verified" || p.status === "installed" ? "good" : p.status === "to-select" ? "neutral" : "warn"}>
                  {p.status.replace(/-/g, " ")}
                </Chip>
                <span className="tnum text-[13px]">{inr(p.orderAmount ?? forecastOf(i), { compact: true })}</span>
              </div>
              {(p.leadTimeWeeks ?? 0) >= 8 && (
                <div className="text-[12px] text-accent mt-1.5">{p.leadTimeWeeks} week lead — order early</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TasksTab({ tasks, spaceId }: { tasks: Task[]; spaceId: string }) {
  const { dispatch } = useProject();
  if (!tasks.length) {
    return <EmptyWithAdd on="tasks" prefill={{ spaceId }} title="No tasks against this room yet."
      hint="Anything that has to happen here, in the order it has to happen. Tasks added here are already attached to this room." />;
  }
  return (
    <div>
    <div className="flex justify-end mb-2"><AddButton on="tasks" prefill={{ spaceId }} label="Add a task" /></div>
    <div className="card divide-y divide-line">
      {tasks.map((t) => (
        <div key={t.id} className="px-4 py-3 flex items-center gap-3 group">
          <button
            onClick={() => dispatch({ type: "task/patch", id: t.id, patch: { status: t.status === "done" ? "todo" : "done" } })}
            className="shrink-0 rounded-md border transition-colors"
            style={{
              width: 20, height: 20,
              background: t.status === "done" ? "var(--color-good)" : "transparent",
              borderColor: t.status === "done" ? "var(--color-good)" : "var(--color-ink-4)",
            }}
            aria-label={t.status === "done" ? "Mark not done" : "Mark done"}
          >
            {t.status === "done" && <svg viewBox="0 0 16 16" width="15" height="15"><path d="m4 8 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </button>
          <div className="min-w-0 flex-1">
            <div className={`text-[14px] ${t.status === "done" ? "line-through text-ink-4" : ""}`}>{t.title}</div>
            <div className="text-[12.5px] text-ink-3">{t.owner}{t.notes ? ` · ${t.notes}` : ""}</div>
          </div>
          {t.status === "blocked" && <Chip tone="bad">Blocked</Chip>}
          <span className="text-[12.5px] text-ink-3 tnum shrink-0">{fmtDay(t.finish)}</span>
          <RowActions on="tasks" id={t.id} />
        </div>
      ))}
    </div>
    </div>
  );
}

function VendorsTab({ vendorIds, items }: { vendorIds: string[]; items: ScopeItem[] }) {
  const { state } = useProject();
  if (!vendorIds.length) {
    return <EmptyWithAdd on="vendors" title="No vendor awarded for this room yet."
      hint="Vendors appear here once scope in this room is assigned to them — set the vendor on a scope item, or add the vendor first." />;
  }
  return (
    <div className="space-y-3">
      {vendorIds.map((id) => {
        const v = state.vendors.find((x) => x.id === id);
        if (!v) return null;
        const mine = items.filter((i) => i.vendorId === id);
        return (
          <div key={id} className="card px-4 py-4 group">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[15px]" >
                  <EntityLink on="vendors" id={v.id} className="hover:text-accent">{v.name}</EntityLink>
                </div>
                <div className="text-[12.5px] text-ink-3 mt-0.5">{v.trade.map((t) => catLabel(state, t)).join(" · ")}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="tnum text-[14px]">{inr(mine.reduce((a, i) => a + forecastOf(i), 0), { compact: true })}</span>
                <RowActions on="vendors" id={v.id} />
              </div>
            </div>
            {v.notes && <p className="text-[13px] text-ink-3 mt-2 leading-relaxed">{v.notes}</p>}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {mine.slice(0, 6).map((i) => <Chip key={i.id} tone="ghost">{i.title}</Chip>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilesTab({ docs, spaceId }: { docs: Doc[]; spaceId: string }) {
  const sheets = drawingsForSpace(spaceId);
  if (!docs.length && !sheets.length) {
    return <EmptyWithAdd on="docs" prefill={{ spaceIds: [spaceId] }} title="No documents filed against this room."
      hint="Drawings, quotes and warranties appear here automatically when they are tagged to this space." />;
  }
  return (
    <div className="space-y-5">
    {sheets.length > 0 && <RoomDrawings spaceId={spaceId} />}
    <div>
    <div className="flex justify-end mb-2"><AddButton on="docs" prefill={{ spaceIds: [spaceId] }} label="Add a document" /></div>
    <div className="card divide-y divide-line">
      {docs.map((d) => (
        <div key={d.id} className="px-4 py-3 flex items-center gap-3 group">
          <Chip tone="ghost">{d.kind.replace(/-/g, " ")}</Chip>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] truncate">{d.title}</div>
            <div className="text-[12.5px] text-ink-3">{d.addedBy} · {fmtDay(d.addedAt)}</div>
          </div>
          {d.revision && <span className="text-[12.5px] text-ink-4 tnum">{d.revision}</span>}
          {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="link text-[13px] shrink-0 inline-flex items-center gap-1">Open <Icon name="open" size={13} /></a>}
          <RowActions on="docs" id={d.id} />
        </div>
      ))}
    </div>
    </div>
    </div>
  );
}

function SiteTab({ updates, notes, spaceId }: { updates: SiteUpdate[]; notes: Note[]; spaceId: string }) {
  if (!updates.length && !notes.length) {
    return <EmptyWithAdd on="siteUpdates" prefill={{ spaceId }} title="No site record for this room yet."
      hint="Use Site mode on your phone to capture a photo and it files itself here — or log one now." />;
  }
  return (
    <div className="space-y-5">
      <div className="flex justify-end gap-2">
        <AddButton on="notes" prefill={{ spaceIds: [spaceId] }} label="Add a note" />
        <AddButton on="siteUpdates" prefill={{ spaceId }} label="Log an update" />
      </div>
      {updates.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {updates.map((u) => (
            <div key={u.id} className="group">
              <PhotoBlock tone={u.photoSwatch} ratio="4 / 3" label={fmtDay(u.at)} />
              <p className="text-[13.5px] text-ink-2 mt-2 leading-relaxed">{u.body}</p>
              <div className="text-[12.5px] text-ink-3 mt-1 flex items-center justify-between gap-2">
                <span>{u.by}{u.progressPct !== undefined ? ` · ${u.progressPct}% complete` : ""}</span>
                <RowActions on="siteUpdates" id={u.id} />
              </div>
            </div>
          ))}
        </div>
      )}
      {notes.length > 0 && (
        <div>
          <Eyebrow className="mb-2">Notes mentioning this room</Eyebrow>
          <div className="card divide-y divide-line">
            {notes.map((n) => (
              <Link key={n.id} href={`/notes#${n.id}`} className="block px-4 py-3 hover:bg-paper">
                <div className="text-[14px]">{n.title}</div>
                <div className="text-[12.5px] text-ink-3">{n.author} · {fmtDay(n.at)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IssuesTab({ snags, spaceId }: { snags: Snag[]; spaceId: string }) {
  const { state, dispatch, me } = useProject();
  if (!snags.length) {
    return <EmptyWithAdd on="snags" prefill={{ spaceId }} title="No snags raised in this room."
      hint="A snag is anything built or delivered that is not right yet. Raised here, it is already attached to this room." />;
  }
  const NEXT: Record<string, string> = { open: "assigned", assigned: "fixed", fixed: "verify", verify: "closed" };
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><AddButton on="snags" prefill={{ spaceId }} label="Raise a snag" /></div>
      {snags.map((s) => (
        <div key={s.id} className="card px-4 py-4 group">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-40 shrink-0 grid grid-cols-2 sm:grid-cols-1 gap-2">
              <PhotoBlock tone={s.photoSwatch} ratio="4 / 3" label="Raised">
                {s.pins?.map((p, i) => (
                  <span
                    key={i}
                    title={p.label}
                    className="absolute rounded-full ring-2 ring-white"
                    style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: 13, height: 13, background: "var(--color-accent)", transform: "translate(-50%,-50%)" }}
                  />
                ))}
              </PhotoBlock>
              {s.rectificationSwatch && <PhotoBlock tone={s.rectificationSwatch} ratio="4 / 3" label="Rectified" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Chip tone={s.severity === "critical" || s.severity === "high" ? "bad" : "warn"}>{s.severity}</Chip>
                <Chip tone={s.status === "closed" ? "good" : s.status === "open" ? "bad" : "info"}>{s.status}</Chip>
                <span className="text-[12.5px] text-ink-3">{catLabel(state, s.category as Category)}</span>
                {s.vendorId && <span className="text-[12.5px]"><EntityLink on="vendors" id={s.vendorId} /></span>}
                <span className="ml-auto"><RowActions on="snags" id={s.id} /></span>
              </div>
              <div className="text-[14px]">{s.title}</div>
              {s.description && <p className="text-[13.5px] text-ink-3 mt-1 leading-relaxed">{s.description}</p>}
              <div className="text-[12.5px] text-ink-3 mt-2">
                Raised by {s.raisedBy} on {fmtDay(s.raisedAt)}
                {s.vendorId && ` · ${state.vendors.find((v) => v.id === s.vendorId)?.name}`}
                {s.dueBy && ` · due ${fmtDay(s.dueBy)}`}
                {s.closedAt && ` · closed ${fmtDay(s.closedAt)} by ${s.verifiedBy}`}
              </div>
              {s.status !== "closed" && (
                <button
                  className="btn btn-sm mt-2.5"
                  onClick={() => dispatch({ type: "snag/patch", id: s.id, patch: { status: NEXT[s.status] as Snag["status"], ...(NEXT[s.status] === "closed" ? { closedAt: new Date().toISOString(), verifiedBy: me } : {}) } })}
                >
                  Move to {NEXT[s.status]}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


/* --------------------------------------------------------------- checklist */

/**
 * The room's own planning checklist, in the order a fit-out runs. The same
 * list the Checklist page shows, here beside the room it belongs to.
 */
function ChecklistTab({ spaceId }: { spaceId: string }) {
  const { state } = useProject();
  const cl = useMemo(() => roomChecklist(state, spaceId), [state, spaceId]);
  if (!cl) return null;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="text-[14px] text-ink-3 tnum">
          <strong className="text-ink font-semibold">{cl.done} of {cl.total}</strong> checked
          {cl.criticalOpen > 0 && <span className="text-accent-strong"> · {cl.criticalOpen} critical outstanding</span>}
        </div>
        <Link href="/checklist" className="btn btn-sm">All rooms <Icon name="arrow-right" size={14} /></Link>
      </div>
      <ChecklistBody list={cl} />
    </div>
  );
}
