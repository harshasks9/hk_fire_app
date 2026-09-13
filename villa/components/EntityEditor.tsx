"use client";

import React, { useMemo, useState } from "react";
import { useProject, newId, type CollectionKey } from "@/lib/store";
import { SCHEMAS, readField, writeField, type Field, type CollectionSchema } from "@/lib/model/schema";
import { inr } from "@/lib/model/costing";
import { categoryOptions } from "@/lib/model/categories";
import { Eyebrow, Field as FieldShell, NumberInput, Sheet, Empty, Chip, fmtDay } from "./ui";
import type { ProjectState } from "@/lib/model/types";

/**
 * One editor for every collection.
 *
 * It renders the table, the create form, the edit form and the delete
 * confirmation straight from the schema, so a field cannot be editable in one
 * place and stranded in another. Rows are edited in a sheet rather than inline
 * because most of these objects have more fields than fit on a row, and a
 * half-visible form is how people save the wrong thing.
 */

function optionsFor(f: Field, state: ProjectState): { value: string; label: string }[] {
  if (f.options) return f.options;
  switch (f.source) {
    case "spaces":
      return state.spaces.map((s) => ({ value: s.id, label: s.name }));
    case "vendors":
      return state.vendors.map((v) => ({ value: v.id, label: v.name }));
    case "items":
      return state.items.slice(0, 1200).map((i) => ({
        value: i.id,
        label: `${state.spaces.find((s) => s.id === i.spaceId)?.name ?? "House-wide"} — ${i.title}`,
      }));
    case "people":
      return state.people.map((p) => ({ value: p.name, label: p.name }));
    case "decisions":
      return state.decisions.map((d) => ({ value: d.id, label: d.title }));
    case "designOptions":
      return state.options.map((o) => ({ value: o.id, label: `${o.label} — ${o.headline}` }));
    case "tasks":
      return state.tasks.map((t) => ({ value: t.id, label: t.title }));
    case "categories":
      return categoryOptions(state);
    default:
      return [];
  }
}

function display(f: Field, row: Record<string, unknown>, state: ProjectState): string {
  if (f.compute) return f.compute(row, state);
  const v = readField(row, f.key);
  if (v === undefined || v === null || v === "") return "—";
  switch (f.type) {
    case "money": return inr(Number(v));
    case "percent": return `${v}%`;
    case "date": return fmtDay(String(v));
    case "bool": return v ? "Yes" : "No";
    case "tags": return Array.isArray(v) ? (v.length ? v.join(", ") : "—") : String(v);
    case "select": {
      const o = optionsFor(f, state).find((x) => x.value === v);
      return o?.label ?? String(v);
    }
    default: return String(v);
  }
}

export function EntityEditor({
  collection, rows, spaceId, dense, onChanged,
}: {
  collection: CollectionKey;
  rows: Record<string, unknown>[];
  /** Pre-fills the room on anything created from here. */
  spaceId?: string;
  dense?: boolean;
  onChanged?: () => void;
}) {
  const { state, dispatch, me } = useProject();
  const schema = SCHEMAS[collection];
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Record<string, unknown> | null>(null);
  const [q, setQ] = useState("");

  const cols = schema.fields.filter((f) => f.inTable).slice(0, dense ? 4 : 7);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.toLowerCase();
    return rows.filter((r) => schema.title(r, state).toLowerCase().includes(needle) ||
      cols.some((c) => display(c, r, state).toLowerCase().includes(needle)));
  }, [rows, q, state, schema, cols]);

  const startCreate = () => {
    const row = schema.blank({ id: newId(collection.slice(0, 4)), spaceId, me, state });
    setEditing(row);
    setCreating(true);
  };

  const save = (row: Record<string, unknown>) => {
    if (creating) dispatch({ type: "create", on: collection, row } as never);
    else dispatch({ type: "update", on: collection, id: String(row.id), patch: row } as never);
    setEditing(null);
    setCreating(false);
    onChanged?.();
  };

  const remove = (row: Record<string, unknown>) => {
    if (collection === "spaces") {
      const n = state.items.filter((i) => i.spaceId === row.id).length;
      const withItems = n === 0 ? true : confirm(
        `Delete ${n} scope item${n === 1 ? "" : "s"} in this space too?\n\nOK = delete them.\nCancel = keep them and move them to house-wide.`,
      );
      dispatch({ type: "space/delete", id: String(row.id), withItems });
    } else {
      dispatch({ type: "remove", on: collection, id: String(row.id) });
    }
    setConfirmDelete(null);
    onChanged?.();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          className="input w-auto flex-1 min-w-[160px]"
          placeholder={`Filter ${schema.label.toLowerCase()}…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="text-[11.5px] text-ink-3 tnum">{filtered.length} of {rows.length}</span>
        <button className="btn btn-accent btn-sm" onClick={startCreate}>Add {schema.singular}</button>
      </div>

      {!filtered.length ? (
        <Empty title={`No ${schema.label.toLowerCase()} here yet.`} hint={`Use “Add ${schema.singular}” to create one.`} />
      ) : (
        <>
          {/* Phones get cards. A seven-column table on a 390px screen is a
              horizontal-scroll puzzle, not a record you can actually read. */}
          <div className="sm:hidden space-y-2">
            {filtered.slice(0, 200).map((r) => (
              <div key={String(r.id)} className="card px-3.5 py-3">
                <button
                  onClick={() => { setEditing(r); setCreating(false); }}
                  className="text-left w-full"
                >
                  <div className="text-[13.5px] leading-snug">{schema.title(r, state)}</div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {cols.slice(1).map((c) => {
                      const v = display(c, r, state);
                      if (v === "—") return null;
                      return (
                        <span key={c.key} className="text-[11px] text-ink-3">
                          <span className="text-ink-4">{c.label}</span>{" "}
                          <span className={c.type === "money" || c.type === "number" ? "tnum text-ink-2" : "text-ink-2"}>{v}</span>
                        </span>
                      );
                    })}
                  </div>
                </button>
                <div className="mt-2.5 flex gap-2">
                  <button className="btn btn-sm flex-1 justify-center" onClick={() => { setEditing(r); setCreating(false); }}>Edit</button>
                  <button className="btn btn-sm" style={{ color: "#8d3a2c" }} onClick={() => setConfirmDelete(r)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block card overflow-x-auto thin-scroll">
            <table className="w-full text-[12.5px]" style={{ minWidth: Math.max(420, cols.length * 150) }}>
              <thead>
                <tr className="text-ink-3 text-[10.5px] uppercase tracking-wider border-b border-line">
                  {cols.map((c) => (
                    <th key={c.key} className="text-left font-medium px-3 py-2">{c.label}</th>
                  ))}
                  <th className="text-right font-medium px-3 py-2 w-[112px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 400).map((r) => (
                  <tr key={String(r.id)} className="border-b border-line/70 last:border-0 hover:bg-paper-2/50">
                    {cols.map((c, i) => (
                      <td key={c.key} className="px-3 py-2 align-top">
                        {i === 0 ? (
                          <button onClick={() => { setEditing(r); setCreating(false); }} className="text-left hover:text-clay">
                            {display(c, r, state)}
                          </button>
                        ) : (
                          <span className={c.type === "money" || c.type === "number" ? "tnum" : ""}>{display(c, r, state)}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button className="btn btn-sm" onClick={() => { setEditing(r); setCreating(false); }}>Edit</button>
                      <button className="btn btn-sm ml-1.5" style={{ color: "#8d3a2c" }} onClick={() => setConfirmDelete(r)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > 200 && (
            <div className="px-1 pt-2 text-[11.5px] text-ink-3">
              Showing the first {filtered.length > 400 ? 400 : 200}. Narrow the filter to reach the rest.
            </div>
          )}
        </>
      )}

      {editing && (
        <RowForm
          schema={schema}
          row={editing}
          creating={creating}
          onCancel={() => { setEditing(null); setCreating(false); }}
          onSave={save}
        />
      )}

      {confirmDelete && (
        <Sheet open onClose={() => setConfirmDelete(null)} title={`Delete this ${schema.singular}?`}>
          <p className="text-[14px] text-ink mb-2">{schema.title(confirmDelete, state)}</p>
          {schema.deleteNote && <p className="text-[12.5px] text-ink-3 leading-relaxed mb-4">{schema.deleteNote}</p>}
          <p className="text-[12px] text-ink-3 leading-relaxed mb-4">
            References to it elsewhere in the project are cleaned up automatically, so nothing is left
            pointing at something that no longer exists. This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button className="btn" onClick={() => setConfirmDelete(null)}>Keep it</button>
            <button className="btn" style={{ background: "#a04a3c", color: "#fff", borderColor: "#a04a3c" }}
              onClick={() => remove(confirmDelete)}>
              Delete {schema.singular}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function RowForm({
  schema, row, creating, onCancel, onSave,
}: {
  schema: CollectionSchema;
  row: Record<string, unknown>;
  creating: boolean;
  onCancel: () => void;
  onSave: (row: Record<string, unknown>) => void;
}) {
  const { state } = useProject();
  const [draft, setDraft] = useState<Record<string, unknown>>(row);
  const set = (key: string, v: unknown) => setDraft((d) => writeField(d, key, v));

  const missing = schema.fields.filter((f) => {
    if (!f.required) return false;
    const v = readField(draft, f.key);
    return v === undefined || v === null || v === "";
  });

  return (
    <Sheet open onClose={onCancel} wide title={creating ? `New ${schema.singular}` : `Edit ${schema.singular}`}>
      {/* Numbers pair up two-per-row at every width — a scope item has fourteen
          of them, and one per line turns the form into a scroll. Everything
          else gets the full width it needs to be read. */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
        {schema.fields.filter((f) => f.type !== "readonly").map((f) => (
          <div
            key={f.key}
            className={["number", "money", "percent"].includes(f.type) ? "col-span-1" : "col-span-2 sm:col-span-1"}
            style={f.type === "textarea" || f.type === "tags" ? { gridColumn: "1 / -1" } : undefined}
          >
            <FieldShell label={f.label + (f.required ? " *" : "")} hint={f.hint}>
              <Input field={f} value={readField(draft, f.key)} onChange={(v) => set(f.key, v)} state={state} />
            </FieldShell>
          </div>
        ))}
      </div>

      <div className="hairline mt-5 pt-4 flex items-center justify-between gap-3">
        <span className="text-[11.5px] text-ink-3 font-mono">{String(draft.id)}</span>
        <div className="flex items-center gap-2">
          {missing.length > 0 && (
            <span className="text-[11.5px]" style={{ color: "#8d3a2c" }}>
              {missing.map((f) => f.label).join(", ")} required
            </span>
          )}
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-accent" disabled={missing.length > 0} onClick={() => onSave(draft)}>
            {creating ? `Create ${schema.singular}` : "Save changes"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function Input({
  field, value, onChange, state,
}: { field: Field; value: unknown; onChange: (v: unknown) => void; state: ProjectState }) {
  switch (field.type) {
    case "textarea":
      return (
        <textarea className="input min-h-[90px] resize-y leading-relaxed"
          value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      );
    case "tags": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <textarea className="input min-h-[72px] resize-y font-mono text-[12px]"
          value={arr.join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} />
      );
    }
    case "number":
      return <NumberInput value={value === undefined ? undefined : Number(value)} onChange={(n) => onChange(n)} />;
    case "money":
      return <NumberInput value={value === undefined ? undefined : Number(value)} onChange={(n) => onChange(n || undefined)} prefix="₹" />;
    case "percent":
      return <NumberInput value={value === undefined ? undefined : Number(value)} onChange={(n) => onChange(n || undefined)} suffix="%" />;
    case "bool":
      return (
        <label className="flex items-center gap-2 text-[13px] cursor-pointer py-1.5">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          {value ? "Yes" : "No"}
        </label>
      );
    case "date":
      return (
        <input type="date" className="input"
          value={value ? String(value).slice(0, 10) : ""}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)} />
      );
    case "select": {
      const options = optionsFor(field, state);
      return (
        <select className="input" value={String(value ?? "")} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">—</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    case "readonly":
      return <div className="input bg-paper-2 text-ink-3">{String(value ?? "—")}</div>;
    default:
      return <input className="input" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}
