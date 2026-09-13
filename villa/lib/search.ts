import type { ProjectState } from "./model/types";
import { CATEGORY_LABEL, STAGE_LABEL } from "./model/types";
import { forecastOf, openDecisions, upcomingPayments, isLate, rollup } from "./model/derive";
import { inr } from "./model/costing";

/**
 * Universal search.
 *
 * Two layers. First, a set of *answers*: patterns that recognise the questions a
 * homeowner actually types — "how much are we spending on wardrobes", "what is
 * delayed", "which marble did we approve" — and reply with a number and a
 * reason rather than a list of links. Second, a plain index over everything
 * else, so nothing in the project is unreachable.
 */

export interface SearchHit {
  kind: "answer" | "space" | "item" | "decision" | "vendor" | "note" | "snag" | "task" | "doc" | "quote";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  /** Rendered large for answers. */
  answer?: string;
  detail?: string;
  score: number;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

function tokens(q: string): string[] {
  const stop = new Set([
    "the", "a", "an", "is", "are", "we", "our", "did", "do", "does", "what", "which",
    "how", "much", "many", "for", "on", "in", "of", "to", "and", "with", "all", "show",
    "me", "my", "i", "at", "was", "were", "have", "has", "this", "that", "it",
  ]);
  return norm(q).split(" ").filter((t) => t.length > 1 && !stop.has(t));
}

export function search(state: ProjectState, query: string): SearchHit[] {
  const q = norm(query);
  if (!q) return [];
  const ts = tokens(query);
  const hits: SearchHit[] = [];
  const spaceById = new Map(state.spaces.map((s) => [s.id, s]));
  const vendorById = new Map(state.vendors.map((v) => [v.id, v]));

  /* ------------------------------------------------------------- answers */

  // "How much are we spending on X?"
  if (/how much|spend|spending|cost of|budget for|total/.test(q)) {
    const catEntries = Object.entries(CATEGORY_LABEL) as [string, string][];
    const matched = catEntries.filter(([key, label]) =>
      ts.some((t) => norm(label).includes(t) || key.includes(t)),
    );
    if (matched.length) {
      const keys = new Set(matched.map(([k]) => k));
      const items = state.items.filter((i) => keys.has(i.category) && i.stage !== "not-applicable");
      const r = rollup(items, state.decisions);
      hits.push({
        kind: "answer", id: "ans-cat", score: 1000,
        title: matched.map(([, l]) => l).join(", "),
        answer: inr(r.forecast),
        detail: `${items.length} items across the villa. ${inr(r.committed)} committed, ${inr(r.paid)} paid, ${inr(r.approvedBudget)} approved budget — forecast is ${r.variance >= 0 ? "over" : "under"} by ${inr(Math.abs(r.variance))}.`,
        href: `/costs?category=${matched[0][0]}`,
      });
    }
    // "How much for the master bedroom?"
    for (const sp of state.spaces) {
      if (!ts.length) break;
      const n = norm(sp.name);
      const overlap = ts.filter((t) => n.includes(t)).length;
      if (overlap >= Math.min(2, ts.length) && overlap > 0) {
        const items = state.items.filter((i) => i.spaceId === sp.id && i.stage !== "not-applicable");
        if (!items.length) continue;
        const r = rollup(items, state.decisions);
        hits.push({
          kind: "answer", id: `ans-space-${sp.id}`, score: 980,
          title: sp.name, answer: inr(r.forecast),
          detail: `${items.length} scope items, ${Math.round(r.completionPct)}% complete. ${inr(r.paid)} paid to date.`,
          href: `/villa/${sp.id}`,
        });
        break;
      }
    }
  }

  // "Which X did we approve?"
  if (/approve|approved|chose|chosen|selected|decided/.test(q)) {
    const approved = state.decisions.filter((d) => d.status === "approved");
    const relevant = approved.filter((d) => ts.some((t) => norm(d.title).includes(t) || norm(d.question).includes(t)));
    const list = relevant.length ? relevant : [];
    for (const d of list.slice(0, 4)) {
      const opt = state.options.find((o) => o.id === d.recommendedOptionId);
      const item = state.items.find((i) => i.id === d.scopeItemId);
      hits.push({
        kind: "answer", id: `ans-dec-${d.id}`, score: 960,
        title: d.title, answer: opt?.headline ?? "Approved",
        detail: `Approved ${new Date(d.history[d.history.length - 1]?.at ?? Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}${item ? ` · ${inr(forecastOf(item))}` : ""}.`,
        href: `/decisions#${d.id}`,
      });
    }
    // Items already approved matching the words, e.g. "marble for the foyer".
    const matches = state.items.filter(
      (i) =>
        ["approved", "boq", "quoted", "ordered", "in-transit", "delivered", "installed", "inspected", "complete"].includes(i.stage) &&
        ts.every((t) => norm(`${i.title} ${spaceById.get(i.spaceId ?? "")?.name ?? ""} ${i.spec ?? ""}`).includes(t)),
    );
    for (const i of matches.slice(0, 3)) {
      hits.push({
        kind: "answer", id: `ans-item-${i.id}`, score: 950,
        title: `${spaceById.get(i.spaceId ?? "")?.name ?? "House-wide"} — ${i.title}`,
        answer: i.spec ? i.spec.split("—")[0].trim() : STAGE_LABEL[i.stage],
        detail: `${STAGE_LABEL[i.stage]} · ${inr(forecastOf(i))}${i.vendorId ? ` · ${vendorById.get(i.vendorId)?.name}` : ""}`,
        href: i.spaceId ? `/villa/${i.spaceId}?item=${i.id}` : `/costs?item=${i.id}`,
      });
    }
  }

  // "What is delayed / late?"
  if (/delay|late|behind|slipping|overdue/.test(q)) {
    const late = state.tasks.filter((t) => isLate(t));
    const overdueDecisions = state.decisions.filter(
      (d) => d.status === "awaiting-owner" && d.decideBy && new Date(d.decideBy) < new Date(),
    );
    hits.push({
      kind: "answer", id: "ans-late", score: 1000,
      title: "Running late",
      answer: `${late.length + overdueDecisions.length} item${late.length + overdueDecisions.length === 1 ? "" : "s"}`,
      detail: [
        late.length ? `${late.length} task${late.length === 1 ? "" : "s"} past their finish date` : "",
        overdueDecisions.length ? `${overdueDecisions.length} decision${overdueDecisions.length === 1 ? "" : "s"} past the date the programme assumed` : "",
      ].filter(Boolean).join(" · ") || "Nothing is past its date.",
      href: "/timeline",
    });
  }

  // "What payments are due this month?"
  if (/payment|due|pay|invoice|owe/.test(q)) {
    const up = upcomingPayments(state, 31);
    const total = up.reduce((a, p) => a + p.amount, 0);
    hits.push({
      kind: "answer", id: "ans-pay", score: 1000,
      title: "Payments due in the next 31 days",
      answer: inr(total),
      detail: up.length
        ? up.slice(0, 4).map((p) => `${p.label} — ${inr(p.amount)} on ${new Date(p.dueOn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`).join(" · ")
        : "Nothing scheduled.",
      href: "/costs?view=payments",
    });
  }

  // "What is pending with X?" — vendor or person.
  if (/pending|waiting|with |outstanding|chase/.test(q)) {
    for (const v of state.vendors) {
      if (!ts.some((t) => norm(v.name).includes(t) || v.trade.some((tr) => tr.includes(t)))) continue;
      const items = state.items.filter((i) => i.vendorId === v.id && i.stage !== "complete" && i.stage !== "not-applicable");
      const tasksOpen = state.tasks.filter((t) => t.vendorId === v.id && t.status !== "done");
      const snagsOpen = state.snags.filter((sn) => sn.vendorId === v.id && sn.status !== "closed");
      hits.push({
        kind: "answer", id: `ans-vendor-${v.id}`, score: 940,
        title: `Pending with ${v.name}`,
        answer: `${items.length + tasksOpen.length + snagsOpen.length} open`,
        detail: `${items.length} scope items, ${tasksOpen.length} tasks, ${snagsOpen.length} snags.`,
        href: `/vendors#${v.id}`,
      });
      break;
    }
    for (const p of state.people) {
      if (!ts.some((t) => norm(p.name).includes(t) || norm(p.firm ?? "").includes(t))) continue;
      const tasksOpen = state.tasks.filter((t) => norm(t.owner).includes(norm(p.name.split(" ")[0])) && t.status !== "done");
      hits.push({
        kind: "answer", id: `ans-person-${p.id}`, score: 930,
        title: `Pending with ${p.name}`,
        answer: `${tasksOpen.length} open task${tasksOpen.length === 1 ? "" : "s"}`,
        detail: tasksOpen.slice(0, 3).map((t) => t.title).join(" · ") || "Nothing open.",
        href: "/timeline",
      });
      break;
    }
  }

  // "Show all decisions related to X"
  if (/decision/.test(q)) {
    const open = openDecisions(state);
    const scoped = state.decisions.filter((d) => {
      const item = state.items.find((i) => i.id === d.scopeItemId);
      const sp = item?.spaceId ? spaceById.get(item.spaceId) : undefined;
      const hay = norm(`${d.title} ${d.question} ${sp?.name ?? ""}`);
      return ts.length ? ts.every((t) => hay.includes(t)) : false;
    });
    const list = scoped.length ? scoped : open;
    hits.push({
      kind: "answer", id: "ans-decisions", score: 970,
      title: scoped.length ? "Matching decisions" : "Decisions awaiting you",
      answer: String(list.length),
      detail: list.slice(0, 4).map((d) => d.title).join(" · ") || "None.",
      href: "/decisions",
    });
  }

  /* ---------------------------------------------------------------- index */

  const add = (h: Omit<SearchHit, "score">, hay: string, base: number) => {
    const n = norm(hay);
    if (!ts.length) return;
    const matched = ts.filter((t) => n.includes(t)).length;
    if (!matched) return;
    const exact = n.includes(q) ? 40 : 0;
    hits.push({ ...h, score: base + (matched / ts.length) * 60 + exact });
  };

  for (const s of state.spaces) {
    add({ kind: "space", id: s.id, title: s.name, subtitle: `${s.floor} · ${s.kind.replace(/-/g, " ")}`, href: `/villa/${s.id}` },
      `${s.name} ${s.kind} ${s.floor} ${s.note ?? ""}`, 120);
  }
  for (const i of state.items) {
    const sp = i.spaceId ? spaceById.get(i.spaceId) : undefined;
    add({
      kind: "item", id: i.id, title: i.title,
      subtitle: `${sp?.name ?? "House-wide"} · ${CATEGORY_LABEL[i.category]} · ${STAGE_LABEL[i.stage]}`,
      href: i.spaceId ? `/villa/${i.spaceId}?item=${i.id}` : `/costs?item=${i.id}`,
    }, `${i.title} ${i.spec ?? ""} ${sp?.name ?? "house wide"} ${CATEGORY_LABEL[i.category]}`, 100);
  }
  for (const d of state.decisions) {
    add({ kind: "decision", id: d.id, title: d.title, subtitle: d.status.replace(/-/g, " "), href: `/decisions#${d.id}` },
      `${d.title} ${d.question} ${d.designerNote ?? ""}`, 110);
  }
  for (const v of state.vendors) {
    add({ kind: "vendor", id: v.id, title: v.name, subtitle: v.trade.map((t) => CATEGORY_LABEL[t]).join(", "), href: `/vendors#${v.id}` },
      `${v.name} ${v.trade.join(" ")} ${v.notes ?? ""}`, 105);
  }
  for (const n of state.notes) {
    add({ kind: "note", id: n.id, title: n.title, subtitle: `${n.kind.replace(/-/g, " ")} · ${n.author}`, href: `/notes#${n.id}` },
      `${n.title} ${n.body} ${n.kind}`, 100);
  }
  for (const sn of state.snags) {
    add({ kind: "snag", id: sn.id, title: sn.title, subtitle: `${spaceById.get(sn.spaceId)?.name ?? ""} · ${sn.status}`, href: `/site#${sn.id}` },
      `${sn.title} ${sn.description ?? ""} ${spaceById.get(sn.spaceId)?.name ?? ""}`, 100);
  }
  for (const t of state.tasks) {
    add({ kind: "task", id: t.id, title: t.title, subtitle: `${t.owner} · ${t.status}`, href: "/timeline" },
      `${t.title} ${t.owner} ${t.notes ?? ""}`, 95);
  }
  for (const d of state.docs) {
    add({ kind: "doc", id: d.id, title: d.title, subtitle: `${d.kind.replace(/-/g, " ")}${d.revision ? ` · ${d.revision}` : ""}`, href: "/documents" },
      `${d.title} ${d.kind}`, 90);
  }
  for (const qt of state.quotations) {
    add({ kind: "quote", id: qt.id, title: qt.title, subtitle: vendorById.get(qt.vendorId)?.name, href: "/vendors" },
      `${qt.title} ${vendorById.get(qt.vendorId)?.name ?? ""}`, 90);
  }

  const seen = new Set<string>();
  return hits
    .sort((a, b) => b.score - a.score)
    .filter((h) => (seen.has(h.kind + h.id) ? false : (seen.add(h.kind + h.id), true)))
    .slice(0, 30);
}

export const SAMPLE_QUERIES = [
  "Which marble did we approve for the foyer?",
  "How much are we spending on wardrobes?",
  "What is pending with the lighting designer?",
  "Which items are delayed?",
  "Show all decisions related to the master bathroom",
  "What payments are due this month?",
];
