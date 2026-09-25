"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useProject, newId, COLLECTION_KEYS, type CollectionKey } from "@/lib/store";
import { useEntity } from "./Entity";
import { SCHEMAS } from "@/lib/model/schema";
import { Sheet, Field, NumberInput, useToast } from "./ui";
import { Icon } from "./Icon";
import type { Severity, Category } from "@/lib/model/types";
import { categoryOptions } from "@/lib/model/categories";

type Kind = "Idea" | "Photo" | "Note" | "Task" | "Decision" | "Expense" | "Issue" | "Product" | "Vendor" | "Document";

const KINDS: { kind: Kind; hint: string; icon: string }[] = [
  { kind: "Note", hint: "Meeting, call or observation", icon: "notes" },
  { kind: "Task", hint: "Something someone must do", icon: "task" },
  { kind: "Issue", hint: "A snag or problem on site", icon: "flag" },
  { kind: "Photo", hint: "Site photo or a reference", icon: "camera" },
  { kind: "Idea", hint: "Inspiration against scope", icon: "sparkle" },
  { kind: "Decision", hint: "Ask the homeowner to choose", icon: "decisions" },
  { kind: "Product", hint: "Something to buy", icon: "buy" },
  { kind: "Expense", hint: "Logged as a note, with the amount", icon: "rupee" },
  { kind: "Vendor", hint: "A supplier or contractor", icon: "vendors" },
  { kind: "Document", hint: "Drawing, quote or invoice", icon: "documents" },
];

/** The collections the shortcuts above do not already cover. */
const OTHER: CollectionKey[] = COLLECTION_KEYS.filter(
  (k) => !["ideas", "notes", "tasks", "decisions", "snags", "items", "vendors", "docs", "siteUpdates"].includes(k),
) as CollectionKey[];

/**
 * Add anything, from anywhere.
 *
 * Its one trick is that it reads where you are: standing in the master
 * bedroom and adding an idea should not ask you which room you mean. On a
 * phone it is the round button above the tab bar; on a desk it opens from
 * "New" at the top of the sidebar.
 */
export function QuickAdd({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { state } = useProject();
  const { create: createAny } = useEntity();
  const pathname = usePathname() ?? "/";
  const [kind, setKind] = useState<Kind | null>(null);
  // On a phone the round button slides away while you scroll down a list, so it
  // never sits on top of the row you are reading, and comes back as you scroll up.
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setTucked(y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Context inference: /villa/ff-master -> the master bedroom is already chosen.
  const contextSpaceId = useMemo(() => {
    const m = pathname.match(/^\/villa\/([^/?#]+)/);
    if (!m) return undefined;
    return state.spaces.find((s) => s.id === decodeURIComponent(m[1]))?.id;
  }, [pathname, state.spaces]);
  const contextSpace = state.spaces.find((s) => s.id === contextSpaceId);

  const close = () => { onOpenChange(false); setKind(null); };

  const pick = (k: Kind) => {
    // Vendors and documents have full forms of their own — use them, rather
    // than filing a note that only looks like a vendor.
    if (k === "Vendor") { close(); createAny("vendors"); return; }
    if (k === "Document") { close(); createAny("docs", contextSpaceId ? { spaceIds: [contextSpaceId] } : undefined); return; }
    setKind(k);
  };

  return (
    <>
      <button
        onClick={() => onOpenChange(true)}
        aria-label="Add to the project"
        className={`lg:hidden fixed z-40 right-4 bottom-[calc(72px+env(safe-area-inset-bottom))] rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 bg-ink text-[#f2f1ed] ${tucked ? "translate-y-[140%]" : ""}`}
        style={{ width: 54, height: 54, boxShadow: "var(--shadow-pop)" }}
      >
        <Icon name="plus" size={24} strokeWidth={2} />
      </button>

      <Sheet
        open={open}
        onClose={close}
        title={kind ? `New ${kind.toLowerCase()}` : "Add to the project"}
        description={!kind && contextSpace ? <>Filed under <strong className="font-semibold text-ink">{contextSpace.name}</strong>, where you are now.</> : undefined}
      >
        {!kind ? (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.kind}
                  onClick={() => pick(k.kind)}
                  className="card card-link text-left px-3.5 py-3 flex items-start gap-3"
                >
                  <span className="mt-0.5 text-accent shrink-0"><Icon name={k.icon} size={19} /></span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold">{k.kind}</span>
                    <span className="block text-[12.5px] text-ink-3 leading-snug mt-0.5">{k.hint}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* Everything the shortcuts above do not cover, straight from the
                schema — so no kind of record is unreachable from here. */}
            <div className="hairline mt-5 pt-4">
              <div className="eyebrow mb-2">Anything else</div>
              <div className="flex flex-wrap gap-1.5">
                {OTHER.map((on) => (
                  <button key={on} className="pill"
                    onClick={() => { close(); createAny(on, contextSpaceId ? { spaceId: contextSpaceId } : undefined); }}>
                    {SCHEMAS[on].singular.replace(/^./, (c) => c.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <QuickForm kind={kind} spaceId={contextSpaceId} onDone={close} onBack={() => setKind(null)} />
        )}
      </Sheet>
    </>
  );
}

function QuickForm({
  kind, spaceId, onDone, onBack,
}: { kind: Kind; spaceId?: string; onDone: () => void; onBack: () => void }) {
  const { state, dispatch, me } = useProject();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [space, setSpace] = useState(spaceId ?? "");
  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState(0);
  const [severity, setSeverity] = useState<Severity>("medium");
  const [category, setCategory] = useState<Category>("flooring");
  const [owner, setOwner] = useState(me);
  const [date, setDate] = useState("");
  const [tried, setTried] = useState(false);

  const itemsInSpace = state.items.filter((i) => i.spaceId === space);
  const now = new Date().toISOString();
  const needsItem = kind === "Idea" || kind === "Decision" || kind === "Photo";
  const needsAmount = kind === "Expense" || kind === "Product";
  const needsDate = kind === "Task" || kind === "Decision" || kind === "Issue";
  const needsCategory = kind === "Issue" || kind === "Product";
  const noScope = needsItem && !itemId && !itemsInSpace[0];

  const submit = () => {
    setTried(true);
    if (!title.trim() || noScope) return;
    switch (kind) {
      case "Idea":
      case "Photo": {
        const target = itemId || itemsInSpace[0]?.id;
        dispatch({
          type: "idea/add",
          idea: {
            id: newId("idea"), scopeItemId: target, title, body, createdBy: me, createdAt: now,
            attachments: kind === "Photo" ? [{ id: newId("att"), kind: "image", label: title, swatch: "#c3b6a4", addedBy: me, addedAt: now }] : [],
          },
        });
        break;
      }
      case "Note":
        dispatch({
          type: "note/add",
          note: {
            id: newId("note"), title, body, kind: "observation", at: now, author: me,
            spaceIds: space ? [space] : [], scopeItemIds: itemId ? [itemId] : [],
            vendorIds: [], decisionIds: [], taskIds: [],
          },
        });
        break;
      case "Task":
        dispatch({
          type: "task/add",
          task: {
            id: newId("task"), title, owner, spaceId: space || undefined,
            scopeItemId: itemId || undefined, finish: date || undefined,
            dependsOn: [], status: "todo", notes: body || undefined,
          },
        });
        break;
      case "Decision": {
        const target = itemId || itemsInSpace[0]?.id;
        dispatch({
          type: "decision/add",
          decision: {
            id: newId("dec"), scopeItemId: target, title, question: body || title,
            alternativeOptionIds: [], status: "awaiting-owner",
            decideBy: date || undefined, history: [{ at: now, by: me, action: "raised" }],
          },
        });
        break;
      }
      case "Expense":
        // Recorded against the project memory with the amount, so it is searchable
        // and taggable, rather than silently minted as a payment nobody approved.
        dispatch({
          type: "note/add",
          note: {
            id: newId("note"), title: `Expense — ${title}`, body: `${body}\n\nAmount: ₹${amount.toLocaleString("en-IN")}`,
            kind: "observation", at: now, author: me,
            spaceIds: space ? [space] : [], scopeItemIds: itemId ? [itemId] : [],
            vendorIds: [], decisionIds: [], taskIds: [],
          },
        });
        break;
      case "Issue":
        dispatch({
          type: "snag/add",
          snag: {
            id: newId("snag"), spaceId: space || state.spaces[0].id, scopeItemId: itemId || undefined,
            title, description: body, category, severity, raisedBy: me, raisedAt: now,
            dueBy: date || undefined, status: "open", photoSwatch: "#bdb2a2",
          },
        });
        break;
      case "Product": {
        const buildUp = { qty: 1, unit: "nos" as const, rate: amount, taxPct: 18 };
        dispatch({
          type: "item/add",
          item: {
            id: newId("item"), title, spaceId: space || undefined, category, stage: "idea",
            spec: body, cost: buildUp, ladder: { initialEstimate: amount },
            procurement: { scopeItemId: "", status: "to-select" },
          },
        });
        break;
      }
      default:
        break;
    }
    const where = state.spaces.find((s) => s.id === space)?.name;
    toast(`${kind} added${where ? ` to ${where}` : ""}`);
    onDone();
  };

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <Field label="Title" required error={tried && !title.trim() ? "Give it a short name so it can be found later." : undefined}>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="A short, specific name" aria-invalid={tried && !title.trim()} />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Room" hint={spaceId ? "Pre-filled from where you were." : undefined}>
          <select className="input" value={space} onChange={(e) => { setSpace(e.target.value); setItemId(""); }}>
            <option value="">House-wide</option>
            {state.spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        {needsItem && (
          <Field label="Against which piece of scope" error={tried && noScope ? "Pick a room with scope in it — ideas and decisions attach to a scope line." : undefined}>
            <select className="input" value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={!itemsInSpace.length}>
              {!itemsInSpace.length && <option value="">Choose a room first</option>}
              {itemsInSpace.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
          </Field>
        )}

        {needsCategory && (
          <Field label="Category">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {categoryOptions(state).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        )}

        {kind === "Issue" && (
          <Field label="Severity">
            <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              {(["low", "medium", "high", "critical"] as const).map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </Field>
        )}

        {kind === "Task" && (
          <Field label="Owner">
            <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} />
          </Field>
        )}

        {needsAmount && (
          <Field label="Amount" hint="An assumption until a quote replaces it.">
            <NumberInput value={amount} onChange={setAmount} prefix="₹" />
          </Field>
        )}

        {needsDate && (
          <Field label={kind === "Decision" ? "Decide by" : "Due"}>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        )}
      </div>

      <Field label="Notes">
        <textarea className="input resize-y" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Anything worth remembering later." />
      </Field>

      <div className="flex items-center justify-between gap-2 pt-1">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          <Icon name="arrow-left" size={16} /> All kinds
        </button>
        <button type="submit" className="btn btn-primary">Add {kind.toLowerCase()}</button>
      </div>
    </form>
  );
}
