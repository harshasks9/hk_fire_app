"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dims } from "@/components/Measure";
import Link from "next/link";
import { useProject, newId } from "@/lib/store";
import { activeCategories, buildUpFromCategory } from "@/lib/model/categories";
import { STAGES, STAGE_LABEL, UNIT_LABEL, type ScopeItem, type Stage, type Unit } from "@/lib/model/types";
import { forecastOf } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { FLOOR_META } from "@/lib/seed/spaces";
import { PageTitle, Empty, Confirm, useToast } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * The sheet.
 *
 * Data entry the way people already know how to do it: pick a room, get a
 * grid, type into cells, Tab across, Enter down, and Enter on the last row
 * makes a new one. Paste a block from Excel and it becomes rows. Every cell
 * writes straight to the same scope items every other screen reads, so this is
 * not an import step — it is just the fastest lens on the same data.
 */

type ColKey =
  | "title" | "category" | "stage" | "owner" | "vendorId"
  | "cost.qty" | "cost.unit" | "cost.rate" | "forecast"
  | "ladder.designerEstimate" | "ladder.approved" | "ladder.committed" | "ladder.paid"
  | "procurement.leadTimeWeeks" | "notes";

interface Col { key: ColKey; label: string; w: number; kind: "text" | "select" | "number" | "money" | "readonly" }

const COLS: Col[] = [
  { key: "title", label: "Item", w: 230, kind: "text" },
  { key: "category", label: "Category", w: 160, kind: "select" },
  { key: "stage", label: "Stage", w: 140, kind: "select" },
  { key: "owner", label: "Owner", w: 130, kind: "text" },
  { key: "vendorId", label: "Vendor", w: 170, kind: "select" },
  { key: "cost.qty", label: "Qty", w: 76, kind: "number" },
  { key: "cost.unit", label: "Unit", w: 100, kind: "select" },
  { key: "cost.rate", label: "Rate ₹", w: 110, kind: "money" },
  { key: "forecast", label: "Forecast", w: 120, kind: "readonly" },
  { key: "ladder.designerEstimate", label: "Estimate ₹", w: 120, kind: "money" },
  { key: "ladder.approved", label: "Approved ₹", w: 120, kind: "money" },
  { key: "ladder.committed", label: "Committed ₹", w: 124, kind: "money" },
  { key: "ladder.paid", label: "Paid ₹", w: 110, kind: "money" },
  { key: "procurement.leadTimeWeeks", label: "Lead (wk)", w: 96, kind: "number" },
  { key: "notes", label: "Notes", w: 240, kind: "text" },
];

/** The gutter column that holds each row's delete button. */
const GUTTER = 44;
const FLOORS = ["outdoor", "ground", "first", "second"] as const;

const get = (i: ScopeItem, k: ColKey): unknown => {
  if (k === "forecast") return forecastOf(i);
  const [a, b] = k.split(".") as [keyof ScopeItem, string | undefined];
  const v = i[a];
  return b ? (v as Record<string, unknown> | undefined)?.[b] : v;
};

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement ||
  (el instanceof HTMLElement && el.isContentEditable);

export default function SheetPage() {
  const { state, dispatch } = useProject();
  const toast = useToast();
  const [scope, setScope] = useState<string>(state.spaces[0]?.id ?? "house");
  const [focus, setFocus] = useState<{ r: number; c: number } | null>(null);
  const [doomed, setDoomed] = useState<ScopeItem | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const space = state.spaces.find((s) => s.id === scope);
  const rows = useMemo(
    () => state.items.filter((i) => (scope === "house" ? !i.spaceId : i.spaceId === scope)),
    [state.items, scope],
  );
  const total = rows.reduce((a, i) => a + forecastOf(i), 0);

  // Every room in picker order, so the arrows step through the house floor by floor.
  const order = useMemo(
    () => ["house", ...FLOORS.flatMap((f) => state.spaces.filter((s) => s.floor === f).map((s) => s.id))],
    [state.spaces],
  );
  const at = order.indexOf(scope);
  const step = (d: number) => {
    const next = order[at + d];
    if (next) { setScope(next); setFocus(null); }
  };
  const nameOf = (id?: string) => (id === "house" ? "House-wide" : state.spaces.find((s) => s.id === id)?.name ?? "");
  const where = space?.name ?? "house-wide scope";

  /* ------------------------------------------------------------ writes */
  const write = useCallback((item: ScopeItem, k: ColKey, raw: string) => {
    if (k === "forecast") return;
    const [a, b] = k.split(".") as [string, string | undefined];
    const num = raw === "" ? undefined : Number(raw);
    if (a === "cost") {
      dispatch({ type: "item/cost", id: item.id, cost: { [b!]: b === "unit" ? (raw as Unit) : Number.isNaN(num) ? 0 : (num ?? 0) } });
    } else if (a === "ladder") {
      dispatch({ type: "item/ladder", id: item.id, ladder: { [b!]: Number.isNaN(num) ? undefined : num } });
    } else if (a === "procurement") {
      dispatch({ type: "item/patch", id: item.id, patch: { procurement: { ...(item.procurement ?? { scopeItemId: item.id, status: "to-select" }), leadTimeWeeks: Number.isNaN(num) ? undefined : num } } });
    } else if (a === "stage") {
      dispatch({ type: "item/stage", id: item.id, stage: raw as Stage });
    } else if (a === "category") {
      dispatch({ type: "item/patch", id: item.id, patch: { category: raw } });
    } else {
      dispatch({ type: "item/patch", id: item.id, patch: { [a]: raw || undefined } });
    }
  }, [dispatch]);

  const addRow = useCallback((title = "") => {
    const cat = activeCategories(state)[0]?.id ?? "flooring";
    const id = newId("item");
    dispatch({
      type: "item/add",
      item: {
        id, title: title || "New item", spaceId: scope === "house" ? undefined : scope, category: cat,
        stage: "not-started", cost: buildUpFromCategory(state, cat, space), ladder: {}, tags: [],
      },
    });
    return id;
  }, [dispatch, scope, space, state]);

  /* ----------------------------------------------------------- keyboard */
  const focusCell = (r: number, c: number) => {
    const el = tableRef.current?.querySelector<HTMLElement>(`[data-cell="${r}-${c}"]`);
    el?.focus();
    if (el instanceof HTMLInputElement) el.select();
    setFocus({ r, c });
  };

  const addAndFocus = () => {
    addRow();
    const r = rows.length;
    setTimeout(() => focusCell(r, 0), 40);
  };

  const onKey = (e: React.KeyboardEvent, r: number, c: number) => {
    const last = rows.length - 1;
    const editable = (ci: number) => COLS[ci].kind !== "readonly";
    const next = (dc: number) => { let ci = c + dc; while (ci >= 0 && ci < COLS.length && !editable(ci)) ci += dc; return ci; };
    if (e.key === "Tab") {
      e.preventDefault();
      const ci = next(e.shiftKey ? -1 : 1);
      if (ci >= 0 && ci < COLS.length) focusCell(r, ci);
      else if (!e.shiftKey && r < last) focusCell(r + 1, 0);
      else if (e.shiftKey && r > 0) focusCell(r - 1, COLS.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (r < last) focusCell(r + 1, c);
      else { addRow(); setTimeout(() => focusCell(r + 1, 0), 40); }
    } else if (e.key === "ArrowDown" && !(e.target instanceof HTMLSelectElement)) {
      e.preventDefault(); if (r < last) focusCell(r + 1, c);
    } else if (e.key === "ArrowUp" && !(e.target instanceof HTMLSelectElement)) {
      e.preventDefault(); if (r > 0) focusCell(r - 1, c);
    } else if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
      setFocus(null);
    }
  };

  /* -------------------------------------------------------------- paste */
  const pasteRows = useCallback((text: string): boolean => {
    if (!text.includes("\t") && !text.includes("\n")) return false; // a single cell — let the input take it
    const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
    const cats = activeCategories(state);
    const findCat = (s: string) => {
      const n = s.trim().toLowerCase();
      return cats.find((c) => c.label.toLowerCase() === n || c.id === n)?.id ?? cats.find((c) => c.label.toLowerCase().includes(n))?.id;
    };
    const findVendor = (s: string) => state.vendors.find((v) => v.name.toLowerCase() === s.trim().toLowerCase())?.id;
    let made = 0;
    for (const line of lines) {
      const [title, category, qty, unit, rate, owner, vendor, notes] = line.split("\t");
      if (!title?.trim()) continue;
      const cat = (category && findCat(category)) || cats[0]?.id || "flooring";
      const cost = buildUpFromCategory(state, cat, space, qty ? Number(qty) || undefined : undefined);
      if (unit && (unit.trim() in UNIT_LABEL)) cost.unit = unit.trim() as Unit;
      if (rate && !Number.isNaN(Number(rate))) cost.rate = Number(rate);
      dispatch({
        type: "item/add",
        item: {
          id: newId("item"), title: title.trim(), spaceId: scope === "house" ? undefined : scope, category: cat,
          stage: "not-started", cost, ladder: {}, tags: [],
          owner: owner?.trim() || undefined, vendorId: vendor ? findVendor(vendor) : undefined, notes: notes?.trim() || undefined,
        },
      });
      made++;
    }
    toast(made
      ? `Added ${made} row${made === 1 ? "" : "s"} to ${space?.name ?? "house-wide scope"} from the clipboard`
      : "Nothing to add — every pasted line was missing an item name", { tone: made ? "good" : "bad" });
    return true;
  }, [state, space, scope, dispatch, toast]);

  // Paste works anywhere on the page that is not a text field outside the grid,
  // so an empty room can be filled straight from Excel too.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const inGrid = !!gridRef.current && e.target instanceof Node && gridRef.current.contains(e.target);
      if (!inGrid && isEditable(e.target)) return;
      const text = e.clipboardData?.getData("text/plain") ?? "";
      if (pasteRows(text)) e.preventDefault();
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [pasteRows]);

  const minWidth = COLS.reduce((a, c) => a + c.w, GUTTER);

  return (
    <div>
      <PageTitle
        title="Sheet"
        sub="One room's scope as a spreadsheet. Tab moves across, Enter moves down, and Enter on the last row adds a new one. Paste from Excel to add many rows at once."
        right={
          <button className="btn btn-primary" onClick={addAndFocus}>
            <Icon name="plus" size={16} strokeWidth={2} /> Add row
          </button>
        }
      />

      {/* --------------------------------------------------------- room picker */}
      <div className="card px-4 sm:px-5 py-4 mb-4 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-[300px]">
          <label htmlFor="sheet-room" className="eyebrow block mb-1.5">Room</label>
          <div className="flex items-center gap-1.5">
            <button className="btn btn-icon shrink-0" onClick={() => step(-1)} disabled={at <= 0}
              aria-label={at > 0 ? `Previous room: ${nameOf(order[at - 1])}` : "Previous room"}>
              <Icon name="chevron-left" size={18} />
            </button>
            <select
              id="sheet-room"
              className="input flex-1 min-w-0 text-[16px] font-semibold"
              value={scope}
              onChange={(e) => { setScope(e.target.value); setFocus(null); }}
            >
              <option value="house">House-wide (no room)</option>
              {FLOORS.map((f) => (
                <optgroup key={f} label={FLOOR_META[f].label}>
                  {state.spaces.filter((s) => s.floor === f).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </optgroup>
              ))}
            </select>
            <button className="btn btn-icon shrink-0" onClick={() => step(1)} disabled={at < 0 || at >= order.length - 1}
              aria-label={at >= 0 && at < order.length - 1 ? `Next room: ${nameOf(order[at + 1])}` : "Next room"}>
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
        </div>
        <dl className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <dt className="eyebrow">Rows</dt>
            <dd className="text-[18px] font-semibold mt-0.5 tnum">{rows.length}</dd>
          </div>
          <div>
            <dt className="eyebrow">Forecast</dt>
            <dd className="text-[18px] font-semibold mt-0.5 tnum">{inr(total, { compact: true })}</dd>
          </div>
          {space && (
            <div className="min-w-0">
              <dt className="eyebrow">Size</dt>
              <dd className="text-[13.5px] text-ink-2 mt-1"><Dims sp={space} mm={false} /></dd>
            </div>
          )}
        </dl>
        {space && (
          <Link href={`/villa/${space.id}`} className="link text-[13.5px] inline-flex items-center gap-1 sm:ml-auto self-center">
            Open {space.name} <Icon name="arrow-right" size={14} />
          </Link>
        )}
      </div>

      {/* ---------------------------------------------------------------- grid */}
      {!rows.length ? (
        <Empty
          icon="sheet"
          title={`Nothing in ${where} yet.`}
          hint={<>Add the first row and start typing, or copy rows from a spreadsheet and press <kbd>Ctrl</kbd> <kbd>V</kbd> anywhere on this page.</>}
          action={
            <button className="btn btn-primary btn-sm" onClick={addAndFocus}>
              <Icon name="plus" size={15} strokeWidth={2} /> Add the first row
            </button>
          }
        />
      ) : (
        <div ref={gridRef} className="card overflow-auto thin-scroll max-h-[70vh]" role="region" aria-label={`Scope of ${where}`}>
          <table ref={tableRef} className="border-separate border-spacing-0 text-[13.5px]" style={{ minWidth }}>
            <thead>
              <tr>
                <th scope="col" className="sticky top-0 left-0 z-30 bg-paper-2 border-b border-r border-line" style={{ width: GUTTER, minWidth: GUTTER }}>
                  <span className="sr-only">Delete</span>
                </th>
                {COLS.map((c, ci) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={`sticky top-0 bg-paper-2 border-b border-line px-2.5 py-2.5 eyebrow whitespace-nowrap ${c.kind === "number" || c.kind === "money" || c.kind === "readonly" ? "text-right" : "text-left"} ${ci === 0 ? "sm:left-[44px] z-30 border-r" : "z-20"} ${focus?.c === ci ? "text-ink" : ""}`}
                    style={{ minWidth: c.w, width: c.w }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((item, r) => {
                const rowOn = focus?.r === r;
                return (
                  <tr key={item.id} className="group">
                    <td className={`sticky left-0 z-10 border-b border-r border-line text-center align-middle ${rowOn ? "bg-accent-soft" : "bg-card"}`}>
                      <button
                        className="btn btn-ghost btn-icon btn-sm text-ink-3 hover:text-bad lg:opacity-60 lg:group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`Delete row ${r + 1}: ${item.title}`}
                        title="Delete row"
                        onClick={() => setDoomed(item)}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </td>
                    {COLS.map((col, c) => {
                      const on = rowOn && focus?.c === c;
                      return (
                        <td
                          key={col.key}
                          className={`border-b border-line p-0 align-middle ${c === 0 ? "sm:sticky sm:left-[44px] z-[5] border-r" : ""} ${on ? "bg-card" : rowOn ? "bg-accent-soft" : c === 0 ? "bg-card" : ""}`}
                        >
                          <Cell item={item} col={col} r={r} c={c} onKey={onKey} write={write} onFocus={() => setFocus({ r, c })} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button
            className="sticky left-0 w-full text-left px-4 py-2.5 text-[13.5px] text-ink-3 hover:text-ink hover:bg-paper-2 inline-flex items-center gap-2 border-t border-line"
            onClick={addAndFocus}
          >
            <Icon name="plus" size={15} /> Add a row to {where}
          </button>
        </div>
      )}

      <div className="mt-4 grid gap-1.5 text-[13px] text-ink-3 leading-relaxed max-w-3xl">
        <p>
          <strong className="font-semibold text-ink-2">Forecast is worked out, never typed:</strong> the firmest number
          wins — paid, then committed, approved, estimate, and finally qty × rate.
        </p>
        <p>
          <strong className="font-semibold text-ink-2">Pasting from Excel:</strong> columns in the order{" "}
          <span className="font-mono text-[12.5px] text-ink-2">Item, Category, Qty, Unit, Rate, Owner, Vendor, Notes</span>.
          Blanks are fine; category and vendor are matched by name.
        </p>
      </div>

      <Confirm
        open={!!doomed}
        title="Delete this row?"
        confirmLabel="Delete row"
        onCancel={() => setDoomed(null)}
        onConfirm={() => {
          if (!doomed) return;
          dispatch({ type: "remove", on: "items", id: doomed.id });
          toast(`Deleted “${doomed.title}”`);
          setDoomed(null);
          setFocus(null);
        }}
      >
        {doomed && (
          <p>
            <strong className="font-semibold text-ink">{doomed.title}</strong> is removed from {where}, along with
            anything that pointed at it. You can bring it back from History.
          </p>
        )}
      </Confirm>
    </div>
  );
}

function Cell({
  item, col, r, c, onKey, write, onFocus,
}: {
  item: ScopeItem; col: Col; r: number; c: number;
  onKey: (e: React.KeyboardEvent, r: number, c: number) => void;
  write: (item: ScopeItem, k: ColKey, raw: string) => void;
  onFocus: () => void;
}) {
  const { state } = useProject();
  const v = get(item, col.key);
  const label = `${col.label.replace(" ₹", "")}, row ${r + 1}`;
  const base =
    "w-full h-[38px] px-2.5 bg-transparent text-ink outline-none rounded-none " +
    "focus:bg-card focus:shadow-[inset_0_0_0_2px_var(--color-accent)]";

  if (col.kind === "readonly") {
    return (
      <div className="h-[38px] px-2.5 flex items-center justify-end tnum text-ink-2 bg-paper-2/60" title="Worked out from the figures in this row">
        {inr(Number(v) || 0)}
      </div>
    );
  }
  if (col.kind === "select") {
    const opts =
      col.key === "category" ? activeCategories(state).map((x) => ({ value: x.id, label: x.label }))
      : col.key === "stage" ? STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))
      : col.key === "cost.unit" ? Object.entries(UNIT_LABEL).map(([value, label]) => ({ value, label }))
      : [{ value: "", label: "—" }, ...state.vendors.map((x) => ({ value: x.id, label: x.name }))];
    return (
      <select
        data-cell={`${r}-${c}`}
        aria-label={label}
        className={`${base} appearance-none cursor-pointer`}
        value={String(v ?? "")}
        onChange={(e) => write(item, col.key, e.target.value)}
        onKeyDown={(e) => onKey(e, r, c)}
        onFocus={onFocus}
      >
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  // text / number / money: edit locally, commit on blur or Enter so a half-typed rate does not thrash every screen.
  return (
    <CommitInput
      dataCell={`${r}-${c}`}
      label={label}
      className={`${base} ${col.kind !== "text" ? "tnum text-right" : ""}`}
      value={v === undefined || v === null ? "" : String(v)}
      numeric={col.kind !== "text"}
      onCommit={(raw) => write(item, col.key, raw)}
      onKeyDown={(e) => onKey(e, r, c)}
      onFocus={onFocus}
    />
  );
}

function CommitInput({
  dataCell, label, className, value, numeric, onCommit, onKeyDown, onFocus,
}: {
  dataCell: string; label: string; className: string; value: string; numeric: boolean;
  onCommit: (raw: string) => void; onKeyDown: (e: React.KeyboardEvent) => void; onFocus: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const last = useRef(value);
  React.useEffect(() => { if (last.current !== value) { last.current = value; setDraft(value); } }, [value]);
  const commit = () => { if (draft !== last.current) { last.current = draft; onCommit(draft); } };
  return (
    <input
      data-cell={dataCell}
      aria-label={label}
      className={className}
      inputMode={numeric ? "decimal" : undefined}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") commit(); onKeyDown(e); }}
      onFocus={onFocus}
    />
  );
}
