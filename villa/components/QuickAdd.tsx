"use client";

import React, { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useProject, newId, COLLECTION_KEYS, type CollectionKey } from "@/lib/store";
import { useEntity } from "./Entity";
import { SCHEMAS } from "@/lib/model/schema";
import { Sheet, Field, Eyebrow, NumberInput } from "./ui";
import type { Severity, Category } from "@/lib/model/types";
import { CATEGORY_LABEL } from "@/lib/model/types";
import { categoryOptions } from "@/lib/model/categories";

type Kind = "Idea" | "Photo" | "Note" | "Task" | "Decision" | "Expense" | "Issue" | "Product" | "Vendor" | "Document";

const KINDS: { kind: Kind; hint: string }[] = [
  { kind: "Idea", hint: "Inspiration against a piece of scope" },
  { kind: "Photo", hint: "Site photo or a reference" },
  { kind: "Note", hint: "Meeting, call or observation" },
  { kind: "Task", hint: "Something someone must do" },
  { kind: "Decision", hint: "Ask the homeowner to choose" },
  { kind: "Expense", hint: "A payment made or due" },
  { kind: "Issue", hint: "A snag or a problem on site" },
  { kind: "Product", hint: "Something to buy" },
  { kind: "Vendor", hint: "A supplier or contractor" },
  { kind: "Document", hint: "Drawing, quote or invoice" },
];

/**
 * The universal +.
 *
 * Its only real trick is that it reads where you are. Standing in the master
 * bedroom and hitting + Idea should not ask you which room you mean.
 */
/** The collections the ten shortcuts above do not already cover. */
const OTHER: CollectionKey[] = COLLECTION_KEYS.filter(
  (k) => !["ideas", "notes", "tasks", "decisions", "snags", "items", "vendors", "docs", "siteUpdates"].includes(k),
) as CollectionKey[];

export function QuickAdd() {
  const { state } = useProject();
  const { create: createAny } = useEntity();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind | null>(null);

  // Context inference: /villa/ff-master -> the master bedroom is already chosen.
  const contextSpaceId = useMemo(() => {
    const m = pathname.match(/^\/villa\/([^/?#]+)/);
    if (!m) return undefined;
    return state.spaces.find((s) => s.id === decodeURIComponent(m[1]))?.id;
  }, [pathname, state.spaces]);

  const contextSpace = state.spaces.find((s) => s.id === contextSpaceId);

  const close = () => { setOpen(false); setKind(null); };

  // The console already offers an explicit "Add" per collection; a floating
  // second way in would only duplicate it and sit on top of the row actions.
  if (pathname.startsWith("/manage")) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick add"
        className="fixed z-40 right-4 bottom-[76px] lg:bottom-7 lg:right-7 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ width: 52, height: 52, background: "var(--color-clay)", color: "#fff" }}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" className="mx-auto" aria-hidden>
          <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <Sheet
        open={open}
        onClose={close}
        title={kind ? `New ${kind.toLowerCase()}` : "Add to the project"}
      >
        {!kind ? (
          <div>
            {contextSpace && (
              <div className="card-quiet px-3.5 py-2.5 mb-4 text-[12.5px] text-ink-2">
                You are in <strong className="font-medium">{contextSpace.name}</strong> — anything you add will be filed here.
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {KINDS.map((k) => (
                <button
                  key={k.kind}
                  onClick={() => setKind(k.kind)}
                  className="card text-left px-3.5 py-3 hover:border-ink-4 transition-colors"
                >
                  <div className="text-[13.5px] font-medium">{k.kind}</div>
                  <div className="text-[11px] text-ink-3 leading-snug mt-0.5">{k.hint}</div>
                </button>
              ))}
            </div>

            {/* Everything the ten shortcuts above do not cover, straight from
                the schema — so no kind of record is unreachable from here. */}
            <div className="hairline mt-5 pt-4">
              <Eyebrow className="mb-2">Anything else</Eyebrow>
              <div className="flex flex-wrap gap-1.5">
                {OTHER.map((on) => (
                  <button key={on} className="btn btn-sm"
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
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [space, setSpace] = useState(spaceId ?? "");
  const [itemId, setItemId] = useState("");
  const [amount, setAmount] = useState(0);
  const [severity, setSeverity] = useState<Severity>("medium");
  const [category, setCategory] = useState<Category>("flooring");
  const [owner, setOwner] = useState(me);
  const [date, setDate] = useState("");

  const itemsInSpace = state.items.filter((i) => i.spaceId === space);
  const now = new Date().toISOString();

  const submit = () => {
    if (!title.trim()) return;
    switch (kind) {
      case "Idea":
      case "Photo": {
        const target = itemId || itemsInSpace[0]?.id;
        if (!target) break;
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
        if (!target) break;
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
      case "Vendor":
      case "Document":
        dispatch({
          type: "note/add",
          note: {
            id: newId("note"), title: `${kind} — ${title}`, body, kind: "observation", at: now, author: me,
            spaceIds: space ? [space] : [], scopeItemIds: [], vendorIds: [], decisionIds: [], taskIds: [],
          },
        });
        break;
    }
    onDone();
  };

  const needsItem = kind === "Idea" || kind === "Decision" || kind === "Photo";
  const needsAmount = kind === "Expense" || kind === "Product";
  const needsDate = kind === "Task" || kind === "Decision" || kind === "Issue";
  const needsCategory = kind === "Issue" || kind === "Product";

  return (
    <div className="space-y-4">
      <Field label="Title">
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="A short, specific name" />
      </Field>

      {kind !== "Vendor" && (
        <Field label="Room" hint={spaceId ? "Pre-filled from where you were." : undefined}>
          <select className="input" value={space} onChange={(e) => { setSpace(e.target.value); setItemId(""); }}>
            <option value="">House-wide</option>
            {state.spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
      )}

      {needsItem && space && (
        <Field label="Against which piece of scope">
          <select className="input" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">{itemsInSpace[0]?.title ?? "—"}</option>
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
            {["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}
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

      <Field label="Notes">
        <textarea className="input min-h-[88px] resize-y" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Anything worth remembering later." />
      </Field>

      <div className="flex items-center justify-between pt-1">
        <button className="btn" onClick={onBack}>Back</button>
        <button className="btn btn-accent" onClick={submit} disabled={!title.trim()}>Add {kind.toLowerCase()}</button>
      </div>
    </div>
  );
}
