"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProject, newId } from "@/lib/store";
import {
  spaceMetrics, rollup, itemsForSpace, byCategory, forecastOf, findGaps, bucketOf,
  COMPLETENESS_BUCKETS,
} from "@/lib/model/derive";
import { inr, dimsLabel, areaSqft, perimeterFt, computeCost } from "@/lib/model/costing";
import { CATEGORY_LABEL, STAGE_LABEL, type ScopeItem, type Category } from "@/lib/model/types";
import {
  PageTitle, Eyebrow, Stat, Bar, Chip, StageChip, Money, PhotoBlock, Tabs, Empty,
  Avatar, fmtDay, Swatch, BudgetBar, Field, Assumed,
} from "@/components/ui";
import { ItemSheet } from "@/components/ItemSheet";
import { DecisionCard, OptionTile } from "@/components/DecisionCard";
import { Comments } from "@/components/Comments";
import { FloorPlan } from "@/components/FloorPlan";
import { FLOOR_META } from "@/lib/seed/spaces";

const TABS = [
  "Design", "Ideas", "Decisions", "Scope", "Cost", "Products",
  "Tasks", "Vendors", "Files", "Site photos", "Issues",
] as const;
type Tab = (typeof TABS)[number];

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
  const router = useRouter();
  const { state, role } = useProject();
  const [tab, setTab] = useState<Tab>("Design");
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
  const products = items.filter((i) => i.procurement);
  const vendorIds = Array.from(new Set(items.map((i) => i.vendorId).filter(Boolean))) as string[];

  const children = state.spaces.filter((s) => s.parentId === spaceId);
  const parent = space?.parentId ? state.spaces.find((s) => s.id === space.parentId) : undefined;

  // Deep link: /villa/ff-master?item=xyz opens that item directly.
  React.useEffect(() => {
    const want = searchParams.get("item");
    if (want) {
      const it = state.items.find((i) => i.id === want);
      if (it) { setOpenItem(it); setTab("Scope"); }
    }
  }, [searchParams, state.items]);

  if (!space) {
    return <Empty title="That space is not in the villa." hint="It may have been renamed or removed." />;
  }

  const nextMilestone = tasks
    .filter((t) => t.status !== "done" && t.finish)
    .sort((a, b) => +new Date(a.finish!) - +new Date(b.finish!))[0];

  const counts: Partial<Record<Tab, number>> = {
    Ideas: ideas.length, Decisions: decisions.length, Scope: r.live,
    Products: products.length, Tasks: tasks.filter((t) => t.status !== "done").length,
    Files: docs.length, "Site photos": updates.length, Issues: snags.filter((s) => s.status !== "closed").length,
    Vendors: vendorIds.length,
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-[12px] text-ink-3 mb-3">
        <Link href="/villa" className="hover:text-clay">Villa</Link>
        <span>/</span>
        <span>{FLOOR_META[space.floor].label}</span>
        {parent && <><span>/</span><Link href={`/villa/${parent.id}`} className="hover:text-clay">{parent.name}</Link></>}
      </div>

      {/* ------------------------------------------------------------ header */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-5 mb-7">
        <div>
          <PageTitle
            title={space.name}
            sub={
              space.dims
                ? `${dimsLabel(space.dims)} · ${areaSqft(space.dims)} sq ft · ${perimeterFt(space.dims)} ft perimeter${space.note ? ` — ${space.note}` : ""}`
                : space.note ?? "This space is not dimensioned on the architect's plan, so no area is assumed."
            }
          />
          {!space.dims && (
            <p className="text-[11.5px] text-ink-3 -mt-3 mb-4 max-w-xl leading-relaxed">
              Quantities here start at 1 and must be measured on site. Nothing has been
              invented from a drawing that does not carry the number.
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <Stat label="Complete" value={`${Math.round(m.completionPct)}%`} />
            <Stat label="Forecast" value={<Money value={r.forecast} compact />} sub={r.approvedBudget ? `budget ${inr(r.approvedBudget, { compact: true })}` : "no approved budget yet"} />
            <Stat
              label="Awaiting you"
              value={openDec.length || "—"}
              tone={openDec.length ? "clay" : undefined}
              sub={openDec.length ? openDec[0].title : "nothing outstanding"}
            />
            <Stat
              label="Next"
              value={nextMilestone ? fmtDay(nextMilestone.finish) : "—"}
              sub={nextMilestone?.title ?? "nothing scheduled"}
            />
          </div>

          <BudgetBar paid={r.paid} committed={r.committed} forecast={r.forecast} budget={r.approvedBudget} />
          <div className="mt-2 text-[11.5px] text-ink-3">
            {inr(r.paid, { compact: true })} paid · {inr(r.remainingCommitment, { compact: true })} committed and unpaid ·{" "}
            {inr(r.uncommittedEstimate, { compact: true })} still an estimate
          </div>

          {children.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11.5px] text-ink-3">Part of this suite:</span>
              {children.map((c) => (
                <Link key={c.id} href={`/villa/${c.id}`} className="chip" style={{ background: "#f1ede7", color: "#514941" }}>
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <PhotoBlock
            tone={updates[0]?.photoSwatch ?? "#c9bfae"}
            ratio="4 / 3"
            label={updates[0] ? `Site — ${fmtDay(updates[0].at)}` : "No site photo yet"}
          />
          {gaps.length > 0 && (
            <div className="card-quiet px-3.5 py-3 mt-3">
              <Eyebrow>Not yet thought about</Eyebrow>
              <div className="mt-2 space-y-1.5">
                {gaps.slice(0, 3).map((g) => (
                  <div key={g.id} className="text-[11.5px] leading-snug">
                    <span style={{ color: g.severity === "blocker" ? "#8d3a2c" : g.severity === "risk" ? "#a8763f" : "#857b70" }}>●</span>{" "}
                    <span className="text-ink-2">{g.title.replace(`${space.name} — `, "")}</span>
                  </div>
                ))}
              </div>
              {gaps.length > 3 && (
                <Link href="/more/completeness" className="text-[11px] text-clay mt-2 inline-block hover:underline">
                  {gaps.length - 3} more →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} counts={counts} />

      <div className="mt-6">
        {tab === "Design" && <DesignTab spaceId={spaceId} options={options} ideas={ideas} decisions={decisions} docs={docs} />}
        {tab === "Ideas" && <IdeasTab spaceId={spaceId} ideas={ideas} items={items} />}
        {tab === "Decisions" && (
          decisions.length ? (
            <div className="space-y-3">{decisions.map((d) => <DecisionCard key={d.id} decision={d} />)}</div>
          ) : (
            <Empty title="No decisions raised for this room yet." hint="A decision is created the moment the designer wants a choice made — from an idea, an option, or straight from a scope item." />
          )
        )}
        {tab === "Scope" && <ScopeTab items={items} onOpen={setOpenItem} />}
        {tab === "Cost" && <CostTab items={items} rollupData={r} />}
        {tab === "Products" && <ProductsTab items={products} onOpen={setOpenItem} />}
        {tab === "Tasks" && <TasksTab tasks={tasks} />}
        {tab === "Vendors" && <VendorsTab vendorIds={vendorIds} items={items} />}
        {tab === "Files" && <FilesTab docs={docs} />}
        {tab === "Site photos" && <SiteTab updates={updates} notes={notes} />}
        {tab === "Issues" && <IssuesTab snags={snags} />}
      </div>

      <ItemSheet item={openItem} open={!!openItem} onClose={() => setOpenItem(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------- tabs */

function DesignTab({
  spaceId, options, ideas, decisions, docs,
}: any) {
  const { state } = useProject();
  const space = state.spaces.find((s) => s.id === spaceId)!;
  const renders = docs.filter((d: any) => d.kind === "render");

  return (
    <div className="space-y-7">
      <div>
        <Eyebrow className="mb-2.5">Where this room sits</Eyebrow>
        <div className="card px-4 py-4">
          <FloorPlan floor={space.floor} overlay="completion" selectedId={spaceId} compact />
        </div>
      </div>

      {options.length > 0 && (
        <div>
          <Eyebrow className="mb-2.5">Design options on the table</Eyebrow>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {options.map((o: any) => <OptionTile key={o.id} option={o} recommended={o.designerRecommended} />)}
          </div>
        </div>
      )}

      {decisions.length > 0 && (
        <div>
          <Eyebrow className="mb-2.5">Open decisions</Eyebrow>
          <div className="space-y-3">
            {decisions.slice(0, 2).map((d: any) => <DecisionCard key={d.id} decision={d} />)}
          </div>
        </div>
      )}

      {renders.length > 0 && (
        <div>
          <Eyebrow className="mb-2.5">Renders & drawings</Eyebrow>
          <div className="grid sm:grid-cols-3 gap-3">
            {renders.map((d: any) => (
              <div key={d.id}>
                <PhotoBlock tone="#b9ada0" ratio="4 / 3" label={d.revision} />
                <div className="text-[12px] mt-1.5">{d.title}</div>
                <div className="text-[10.5px] text-ink-3">{d.addedBy} · {fmtDay(d.addedAt)}</div>
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

function IdeasTab({ spaceId, ideas, items }: any) {
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
      <div className="card px-4 py-3.5 mb-5">
        <Eyebrow className="mb-2">Add an idea</Eyebrow>
        <div className="flex flex-col sm:flex-row gap-2">
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a link, describe a reference, name a material…" />
          <select className="input sm:w-64" value={target} onChange={(e) => setTarget(e.target.value)}>
            {items.map((i: ScopeItem) => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>
          <button className="btn btn-accent shrink-0" onClick={add} disabled={!text.trim()}>Add</button>
        </div>
        <p className="text-[11px] text-ink-3 mt-2">Every idea attaches to a piece of scope, so it can become an option and then a decision without being retyped.</p>
      </div>

      {ideas.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ideas.map((idea: any) => {
            const item = state.items.find((i) => i.id === idea.scopeItemId);
            return (
              <div key={idea.id} className="card overflow-hidden">
                <div className="grid grid-cols-2 gap-px bg-line">
                  {(idea.attachments.length ? idea.attachments : [{ id: "x", swatch: "#c3b6a4", label: "" }]).slice(0, 2).map((a: any) => (
                    <PhotoBlock key={a.id} tone={a.swatch ?? "#c3b6a4"} ratio="1 / 1" label={a.label} className="rounded-none border-0" />
                  ))}
                </div>
                <div className="px-3.5 py-3">
                  <div className="text-[13.5px] leading-snug">{idea.title}</div>
                  {idea.body && <p className="text-[12px] text-ink-3 mt-1.5 leading-relaxed">{idea.body}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-ink-4 truncate">{item?.title}</span>
                    <button
                      onClick={() => dispatch({ type: "idea/shortlist", id: idea.id })}
                      className="chip shrink-0"
                      style={{ background: idea.shortlisted ? "#f2e2d9" : "#f4f1ec", color: idea.shortlisted ? "#9c5333" : "#857b70" }}
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

function ScopeTab({ items, onOpen }: { items: ScopeItem[]; onOpen: (i: ScopeItem) => void }) {
  const [showNA, setShowNA] = useState(false);
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
              <div className="tnum text-[17px]" style={{ fontFamily: "var(--font-display)" }}>{b.n}</div>
              <div className="text-[10.5px] text-ink-3">{b.label}</div>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-ink-3 mt-3 leading-relaxed">
          This checklist was pre-populated the moment the room existed. Items are never deleted —
          anything not needed is marked <em>Not applicable</em> with a reason, which is how you prove later that it was considered.
        </p>
      </div>

      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([cat, list]) => (
          <div key={cat}>
            <div className="flex items-baseline justify-between mb-1.5">
              <Eyebrow>{CATEGORY_LABEL[cat as Category]}</Eyebrow>
              <span className="text-[11px] text-ink-4 tnum">
                {inr(list.reduce((a, i) => a + forecastOf(i), 0), { compact: true })}
              </span>
            </div>
            <div className="card divide-y divide-line">
              {list.map((i) => (
                <button
                  key={i.id}
                  onClick={() => onOpen(i)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-paper-2/60 transition-colors flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] flex items-center gap-2">
                      <span className={i.stage === "not-applicable" ? "line-through text-ink-4" : ""}>{i.title}</span>
                      {i.tags?.includes("critical") && <span className="text-clay text-[10px]" title="Critical for this room">●</span>}
                    </div>
                    {i.spec && <div className="text-[11px] text-ink-3 truncate mt-0.5">{i.spec}</div>}
                    {i.stage === "not-applicable" && i.naReason && (
                      <div className="text-[11px] text-ink-4 mt-0.5 italic">{i.naReason}</div>
                    )}
                  </div>
                  <span className="tnum text-[12px] text-ink-3 shrink-0 hidden sm:block">
                    {i.stage === "not-applicable" ? "—" : inr(forecastOf(i), { compact: true })}
                  </span>
                  <StageChip stage={i.stage} small />
                </button>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 card px-5 py-5 mb-4">
        <Stat label="Initial estimate" value={<Money value={rollupData.initialEstimate} compact />} />
        <Stat label="Approved" value={<Money value={rollupData.approvedBudget} compact />} />
        <Stat label="Committed" value={<Money value={rollupData.committed} compact />} />
        <Stat
          label="Forecast"
          value={<Money value={rollupData.forecast} compact />}
          tone={rollupData.variance > 0 ? "rust" : "sage"}
          sub={`${rollupData.variance > 0 ? "+" : ""}${inr(rollupData.variance, { compact: true })} vs approved`}
        />
      </div>

      <div className="card px-4 py-4">
        <Eyebrow className="mb-3">By category</Eyebrow>
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.cat}>
              <div className="flex items-baseline justify-between text-[12.5px] mb-1">
                <span className="text-ink-2">{CATEGORY_LABEL[r.cat]} <span className="text-ink-4 tnum">({r.n})</span></span>
                <span className="tnum">{inr(r.forecast)}</span>
              </div>
              <div className="flex h-[5px] rounded-full overflow-hidden bg-paper-3" style={{ width: `${(r.forecast / max) * 100}%`, minWidth: 20 }}>
                <div style={{ width: `${r.forecast ? (r.paid / r.forecast) * 100 : 0}%`, background: "#41603f" }} />
                <div style={{ width: `${r.forecast ? (Math.max(0, r.committed - r.paid) / r.forecast) * 100 : 0}%`, background: "#7d9a7a" }} />
                <div className="flex-1" style={{ background: "#c8c0b2" }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-ink-3 mt-4 leading-relaxed">
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
              <div className="text-[13px] leading-snug">{p.product ?? i.title}</div>
              <div className="text-[11px] text-ink-3 mt-0.5 truncate">{vendor?.name ?? "No vendor yet"}</div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <Chip tone={p.status === "verified" || p.status === "installed" ? "sage" : p.status === "to-select" ? "neutral" : "ochre"}>
                  {p.status.replace(/-/g, " ")}
                </Chip>
                <span className="tnum text-[12px]">{inr(p.orderAmount ?? forecastOf(i), { compact: true })}</span>
              </div>
              {(p.leadTimeWeeks ?? 0) >= 8 && (
                <div className="text-[10.5px] text-clay mt-1.5">{p.leadTimeWeeks} week lead — order early</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TasksTab({ tasks }: { tasks: any[] }) {
  const { dispatch } = useProject();
  if (!tasks.length) return <Empty title="No tasks against this room yet." />;
  return (
    <div className="card divide-y divide-line">
      {tasks.map((t) => (
        <div key={t.id} className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: "task/patch", id: t.id, patch: { status: t.status === "done" ? "todo" : "done" } })}
            className="shrink-0 rounded-md border transition-colors"
            style={{
              width: 17, height: 17,
              background: t.status === "done" ? "#5f7a5f" : "transparent",
              borderColor: t.status === "done" ? "#5f7a5f" : "var(--color-line-2)",
            }}
            aria-label={t.status === "done" ? "Mark not done" : "Mark done"}
          >
            {t.status === "done" && <svg viewBox="0 0 16 16" width="15" height="15"><path d="m4 8 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          </button>
          <div className="min-w-0 flex-1">
            <div className={`text-[13px] ${t.status === "done" ? "line-through text-ink-4" : ""}`}>{t.title}</div>
            <div className="text-[11px] text-ink-3">{t.owner}{t.notes ? ` · ${t.notes}` : ""}</div>
          </div>
          {t.status === "blocked" && <Chip tone="rust">Blocked</Chip>}
          <span className="text-[11.5px] text-ink-3 tnum shrink-0">{fmtDay(t.finish)}</span>
        </div>
      ))}
    </div>
  );
}

function VendorsTab({ vendorIds, items }: { vendorIds: string[]; items: ScopeItem[] }) {
  const { state } = useProject();
  if (!vendorIds.length) return <Empty title="No vendor awarded for this room yet." hint="Vendors appear here once scope is assigned to them." />;
  return (
    <div className="space-y-3">
      {vendorIds.map((id) => {
        const v = state.vendors.find((x) => x.id === id);
        if (!v) return null;
        const mine = items.filter((i) => i.vendorId === id);
        return (
          <div key={id} className="card px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[15px]" style={{ fontFamily: "var(--font-display)" }}>{v.name}</div>
                <div className="text-[11.5px] text-ink-3 mt-0.5">{v.trade.map((t) => CATEGORY_LABEL[t]).join(" · ")}</div>
              </div>
              <span className="tnum text-[13px]">{inr(mine.reduce((a, i) => a + forecastOf(i), 0), { compact: true })}</span>
            </div>
            {v.notes && <p className="text-[12px] text-ink-3 mt-2 leading-relaxed">{v.notes}</p>}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {mine.slice(0, 6).map((i) => <Chip key={i.id} tone="ghost">{i.title}</Chip>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilesTab({ docs }: { docs: any[] }) {
  if (!docs.length) return <Empty title="No documents filed against this room." hint="Drawings, quotes and warranties appear here automatically when they are tagged to this space." />;
  return (
    <div className="card divide-y divide-line">
      {docs.map((d) => (
        <div key={d.id} className="px-4 py-3 flex items-center gap-3">
          <Chip tone="ghost">{d.kind.replace(/-/g, " ")}</Chip>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] truncate">{d.title}</div>
            <div className="text-[11px] text-ink-3">{d.addedBy} · {fmtDay(d.addedAt)}</div>
          </div>
          {d.revision && <span className="text-[11px] text-ink-4 tnum">{d.revision}</span>}
        </div>
      ))}
    </div>
  );
}

function SiteTab({ updates, notes }: { updates: any[]; notes: any[] }) {
  if (!updates.length && !notes.length) return <Empty title="No site record for this room yet." hint="Use Site mode on your phone to capture a photo and it files itself here." />;
  return (
    <div className="space-y-5">
      {updates.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {updates.map((u) => (
            <div key={u.id}>
              <PhotoBlock tone={u.photoSwatch} ratio="4 / 3" label={fmtDay(u.at)} />
              <p className="text-[12.5px] text-ink-2 mt-2 leading-relaxed">{u.body}</p>
              <div className="text-[11px] text-ink-3 mt-1">{u.by}{u.progressPct !== undefined ? ` · ${u.progressPct}% complete` : ""}</div>
            </div>
          ))}
        </div>
      )}
      {notes.length > 0 && (
        <div>
          <Eyebrow className="mb-2">Notes mentioning this room</Eyebrow>
          <div className="card divide-y divide-line">
            {notes.map((n) => (
              <Link key={n.id} href={`/notes#${n.id}`} className="block px-4 py-3 hover:bg-paper-2/60">
                <div className="text-[13px]">{n.title}</div>
                <div className="text-[11px] text-ink-3">{n.author} · {fmtDay(n.at)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IssuesTab({ snags }: { snags: any[] }) {
  const { state, dispatch, me } = useProject();
  if (!snags.length) return <Empty title="No snags raised in this room." />;
  const NEXT: Record<string, string> = { open: "assigned", assigned: "fixed", fixed: "verify", verify: "closed" };
  return (
    <div className="space-y-3">
      {snags.map((s) => (
        <div key={s.id} className="card px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-40 shrink-0 grid grid-cols-2 sm:grid-cols-1 gap-2">
              <PhotoBlock tone={s.photoSwatch} ratio="4 / 3" label="Raised">
                {s.pins?.map((p: any, i: number) => (
                  <span
                    key={i}
                    title={p.label}
                    className="absolute rounded-full ring-2 ring-white"
                    style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, width: 13, height: 13, background: "#b0603a", transform: "translate(-50%,-50%)" }}
                  />
                ))}
              </PhotoBlock>
              {s.rectificationSwatch && <PhotoBlock tone={s.rectificationSwatch} ratio="4 / 3" label="Rectified" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Chip tone={s.severity === "critical" || s.severity === "high" ? "rust" : "ochre"}>{s.severity}</Chip>
                <Chip tone={s.status === "closed" ? "sage" : s.status === "open" ? "rust" : "slate"}>{s.status}</Chip>
                <span className="text-[11px] text-ink-3">{CATEGORY_LABEL[s.category as Category]}</span>
              </div>
              <div className="text-[14px]">{s.title}</div>
              {s.description && <p className="text-[12.5px] text-ink-3 mt-1 leading-relaxed">{s.description}</p>}
              <div className="text-[11px] text-ink-3 mt-2">
                Raised by {s.raisedBy} on {fmtDay(s.raisedAt)}
                {s.vendorId && ` · ${state.vendors.find((v) => v.id === s.vendorId)?.name}`}
                {s.dueBy && ` · due ${fmtDay(s.dueBy)}`}
                {s.closedAt && ` · closed ${fmtDay(s.closedAt)} by ${s.verifiedBy}`}
              </div>
              {s.status !== "closed" && (
                <button
                  className="btn btn-sm mt-2.5"
                  onClick={() => dispatch({ type: "snag/patch", id: s.id, patch: { status: NEXT[s.status] as any, ...(NEXT[s.status] === "closed" ? { closedAt: new Date().toISOString(), verifiedBy: me } : {}) } })}
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
