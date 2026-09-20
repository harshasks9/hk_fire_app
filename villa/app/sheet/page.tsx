"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Dims } from "@/components/Measure";
import Link from "next/link";
import { useProject, newId } from "@/lib/store";
import { activeCategories, catLabel, buildUpFromCategory } from "@/lib/model/categories";
import { STAGES, STAGE_LABEL, UNIT_LABEL, type ScopeItem, type Stage, type Unit } from "@/lib/model/types";
import { forecastOf } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { FLOOR_META } from "@/lib/seed/spaces";
import { PageTitle, Eyebrow, Chip, Empty } from "@/components/ui";

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
  { key: "title", label: "Item", w: 220, kind: "text" },
  { key: "category", label: "Category", w: 150, kind: "select" },
  { key: "stage", label: "Stage", w: 130, kind: "select" },
  { key: "owner", label: "Owner", w: 120, kind: "text" },
  { key: "vendorId", label: "Vendor", w: 160, kind: "select" },
  { key: "cost.qty", label: "Qty", w: 70, kind: "number" },
  { key: "cost.unit", label: "Unit", w: 80, kind: "select" },
  { key: "cost.rate", label: "Rate", w: 100, kind: "money" },
  { key: "forecast", label: "Forecast", w: 110, kind: "readonly" },
  { key: "ladder.designerEstimate", label: "Estimate", w: 110, kind: "money" },
  { key: "ladder.approved", label: "Approved", w: 110, kind: "money" },
  { key: "ladder.committed", label: "Committed", w: 110, kind: "money" },
  { key: "ladder.paid", label: "Paid", w: 100, kind: "money" },
  { key: "procurement.leadTimeWeeks", label: "Lead wk", w: 80, kind: "number" },
  { key: "notes", label: "Notes", w: 220, kind: "text" },
];

const get = (i: ScopeItem, k: ColKey): unknown => {
  if (k === "forecast") return forecastOf(i);
  const [a, b] = k.split(".") as [keyof ScopeItem, string | undefined];
  const v = i[a];
  return b ? (v as Record<string, unknown> | undefined)?.[b] : v;
};

export default function SheetPage() {
  const { state, dispatch } = useProject();
  const [scope, setScope] = useState<string>(state.spaces[0]?.id ?? "house");
  const [focus, setFocus] = useState<{ r: number; c: number } | null>(null);
  const [pasteMsg, setPasteMsg] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const space = state.spaces.find((s) => s.id === scope);
  const rows = useMemo(
    () => state.items.filter((i) => (scope === "house" ? !i.spaceId : i.spaceId === scope)),
    [state.items, scope],
  );
  const total = rows.reduce((a, i) => a + forecastOf(i), 0);

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
      else { addRow(); setTimeout(() => focusCell(r + 1, 0), 30); }
    } else if (e.key === "ArrowDown" && !(e.target instanceof HTMLSelectElement)) {
      e.preventDefault(); if (r < last) focusCell(r + 1, c);
    } else if (e.key === "ArrowUp" && !(e.target instanceof HTMLSelectElement)) {
      e.preventDefault(); if (r > 0) focusCell(r - 1, c);
    } else if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
    }
  };

  /* -------------------------------------------------------------- paste */
  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (!text.includes("\t") && !text.includes("\n")) return; // a single cell — let the input take it
    e.preventDefault();
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
    setPasteMsg(`Added ${made} row${made === 1 ? "" : "s"} from the clipboard.`);
    setTimeout(() => setPasteMsg(null), 4000);
  };

  return (
    <div>
      <PageTitle
        title="Sheet"
        sub="Pick a room and type. Tab moves across, Enter moves down, Enter on the last row adds one. Paste from a spreadsheet to add many at once."
        right={
          <select className="input w-auto" value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="house">House-wide</option>
            {(["outdoor", "ground", "first", "second"] as const).map((f) => (
              <optgroup key={f} label={FLOOR_META[f].label}>
                {state.spaces.filter((s) => s.floor === f).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>
            ))}
          </select>
        }
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[12.5px] text-ink-3">
        <span className="tnum"><strong className="text-ink font-medium">{rows.length}</strong> rows</span>
        <span className="tnum"><strong className="text-ink font-medium">{inr(total, { compact: true })}</strong> forecast</span>
        {space && <Dims sp={space} className="text-[12px]" />}
        {space && <Link href={`/villa/${space.id}`} className="text-clay hover:underline">Open workspace →</Link>}
        <button className="btn btn-sm ml-auto" onClick={() => { addRow(); setTimeout(() => focusCell(rows.length, 0), 30); }}>Add row</button>
      </div>

      {pasteMsg && <div className="card-quiet px-3.5 py-2 mb-3 text-[12.5px] text-ink-2">{pasteMsg}</div>}

      {!rows.length ? (
        <Empty
          title={`Nothing in ${space?.name ?? "house-wide scope"} yet.`}
          hint="Click “Add row”, or paste rows from a spreadsheet: Item, Category, Qty, Unit, Rate, Owner, Vendor, Notes — tab-separated."
        />
      ) : (
        <div className="card overflow-auto thin-scroll" style={{ maxHeight: "70vh" }} onPaste={onPaste}>
          <table ref={tableRef} className="text-[12.5px] border-separate border-spacing-0" style={{ minWidth: COLS.reduce((a, c) => a + c.w, 40) }}>
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="sticky left-0 z-20 bg-paper-2 border-b border-r border-line w-[34px]" />
                {COLS.map((c) => (
                  <th key={c.key} className="text-left font-medium text-[10.5px] uppercase tracking-wider text-ink-3 bg-paper-2 border-b border-line px-2 py-2" style={{ minWidth: c.w }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((item, r) => (
                <tr key={item.id} className="group">
                  <td className="sticky left-0 z-[5] bg-card border-b border-r border-line text-center align-middle">
                    <button
                      title="Delete row"
                      className="text-[11px] text-ink-4 hover:text-rust px-1"
                      onClick={() => { if (confirm(`Delete “${item.title}”?`)) dispatch({ type: "remove", on: "items", id: item.id }); }}
                    >✕</button>
                  </td>
                  {COLS.map((col, c) => (
                    <td key={col.key} className="border-b border-line p-0 align-middle" style={{ background: focus?.r === r && focus?.c === c ? "#fdf6f1" : undefined }}>
                      <Cell item={item} col={col} r={r} c={c} onKey={onKey} write={write} onFocus={() => setFocus({ r, c })} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11.5px] text-ink-3 mt-3 leading-relaxed max-w-3xl">
        Forecast is computed, never typed: the hardest number available wins (paid → committed → approved → estimate → qty × rate).
        Paste columns in this order — <span className="font-mono">Item, Category, Qty, Unit, Rate, Owner, Vendor, Notes</span> — and
        blanks are fine; category and vendor are matched by name.
      </p>
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
  const base = "w-full h-[34px] px-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-clay/60 rounded-none";

  if (col.kind === "readonly") {
    return <div className="h-[34px] px-2 flex items-center tnum text-ink-2 bg-paper-2/40">{inr(Number(v) || 0)}</div>;
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
        className={`${base} appearance-none text-[12.5px]`}
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
  dataCell, className, value, numeric, onCommit, onKeyDown, onFocus,
}: {
  dataCell: string; className: string; value: string; numeric: boolean;
  onCommit: (raw: string) => void; onKeyDown: (e: React.KeyboardEvent) => void; onFocus: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const last = useRef(value);
  React.useEffect(() => { if (last.current !== value) { last.current = value; setDraft(value); } }, [value]);
  const commit = () => { if (draft !== last.current) { last.current = draft; onCommit(draft); } };
  return (
    <input
      data-cell={dataCell}
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
