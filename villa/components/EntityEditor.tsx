"use client";

import React, { useMemo, useState } from "react";
import { useProject, newId, type CollectionKey } from "@/lib/store";
import { SCHEMAS, readField, writeField, type Field, type CollectionSchema } from "@/lib/model/schema";
import { inr } from "@/lib/model/costing";
import { categoryOptions } from "@/lib/model/categories";
import Link from "next/link";
import { hrefFor } from "@/lib/model/links";
import { DESIGNS } from "@/lib/design";
import { Field as FieldShell, NumberInput, Sheet, Empty, fmtDay, useToast } from "./ui";
import { Icon } from "./Icon";
import { MultiPicker } from "./MultiPicker";
import type { ProjectState } from "@/lib/model/types";

/**
 * One editor for every collection.
 *
 * It renders the table, the create form, the edit form and the delete
 * confirmation straight from the schema, so a field cannot be editable in one
 * place and stranded in another. Rows are edited in a dialog rather than
 * inline because most of these objects have more fields than fit on a row,
 * and a half-visible form is how people save the wrong thing.
 */

export function optionsFor(f: Field, state: ProjectState): { value: string; label: string }[] {
  if (f.options) return f.options;
  switch (f.source) {
    case "spaces":
      return state.spaces.map((s) => ({ value: s.id, label: s.name }));
    case "vendors":
      return state.vendors.map((v) => ({ value: v.id, label: v.name }));
    case "items":
      return state.items.slice(0, 1500).map((i) => ({
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
    case "layouts":
      return DESIGNS.flatMap((d) => d.layouts.map((l) => ({
        value: l.id,
        label: `${state.spaces.find((s) => s.id === d.spaceId)?.name ?? d.spaceId} — ${l.key}: ${l.name}`,
      })));
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
    case "tags": {
      if (!Array.isArray(v)) return String(v);
      if (!v.length) return "—";
      if (!f.source) return v.join(", ");
      const labels = new Map(optionsFor(f, state).map((o) => [o.value, o.label]));
      return v.map((x) => labels.get(String(x)) ?? String(x)).join(", ");
    }
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
  const toast = useToast();
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
    toast(creating ? `${cap(schema.singular)} created` : "Changes saved");
    setEditing(null);
    setCreating(false);
    onChanged?.();
  };

  const remove = (row: Record<string, unknown>, withItems = true) => {
    if (collection === "spaces") dispatch({ type: "space/delete", id: String(row.id), withItems });
    else dispatch({ type: "remove", on: collection, id: String(row.id) });
    toast(`${cap(schema.singular)} deleted`);
    setConfirmDelete(null);
    onChanged?.();
  };

  const edit = (r: Record<string, unknown>) => { setEditing(r); setCreating(false); };
  const itemsInDoomedSpace = collection === "spaces" && confirmDelete
    ? state.items.filter((i) => i.spaceId === confirmDelete.id).length : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[180px]">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4 pointer-events-none" />
          <input
            className="input" style={{ paddingLeft: 34 }}
            placeholder={`Filter ${schema.label.toLowerCase()}…`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={`Filter ${schema.label.toLowerCase()}`}
          />
        </div>
        <span className="text-[13px] text-ink-3 tnum">{filtered.length === rows.length ? `${rows.length}` : `${filtered.length} of ${rows.length}`}</span>
        <button className="btn btn-primary btn-sm" onClick={startCreate}>
          <Icon name="plus" size={15} strokeWidth={2} /> Add {schema.singular}
        </button>
      </div>

      {!filtered.length ? (
        q ? (
          <Empty icon="search" title={`No ${schema.label.toLowerCase()} match “${q}”.`} hint="Try fewer letters, or clear the filter."
            action={<button className="btn btn-sm" onClick={() => setQ("")}>Clear filter</button>} />
        ) : (
          <Empty title={`No ${schema.label.toLowerCase()} here yet.`}
            action={<button className="btn btn-primary btn-sm" onClick={startCreate}><Icon name="plus" size={15} strokeWidth={2} /> Add {schema.singular}</button>} />
        )
      ) : (
        <>
          {/* Phones get cards. A seven-column table on a 390px screen is a
              horizontal-scroll puzzle, not a record you can actually read. */}
          <div className="sm:hidden space-y-2">
            {filtered.slice(0, 200).map((r) => (
              <div key={String(r.id)} className="card flex items-stretch">
                <button onClick={() => edit(r)} className="text-left flex-1 min-w-0 px-4 py-3">
                  <div className="text-[15px] font-medium leading-snug">{schema.title(r, state)}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {cols.slice(1).map((c) => {
                      const v = display(c, r, state);
                      if (v === "—") return null;
                      return (
                        <span key={c.key} className="text-[12.5px] text-ink-3">
                          {c.label}{" "}
                          <span className={c.type === "money" || c.type === "number" ? "tnum text-ink-2" : "text-ink-2"}>{v}</span>
                        </span>
                      );
                    })}
                  </div>
                </button>
                <div className="flex flex-col justify-center border-l border-line">
                  <OpenLink collection={collection} id={String(r.id)} />
                  <button className="btn btn-ghost btn-icon btn-sm text-bad" aria-label={`Delete ${schema.title(r, state)}`} onClick={() => setConfirmDelete(r)}>
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden sm:block card overflow-auto thin-scroll max-h-[70vh]">
            <table className="table" style={{ minWidth: Math.max(480, cols.length * 150) }}>
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th key={c.key} className={c.type === "money" || c.type === "number" ? "num" : ""}>{c.label}</th>
                  ))}
                  <th className="w-[120px]"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 400).map((r) => (
                  <tr key={String(r.id)} className="group">
                    {cols.map((c, i) => (
                      <td key={c.key} className={c.type === "money" || c.type === "number" ? "num" : ""}>
                        {i === 0 ? (
                          <button onClick={() => edit(r)} className="text-left font-medium hover:text-accent">
                            {display(c, r, state)}
                          </button>
                        ) : (
                          <span className={c.type === "money" || c.type === "number" ? "tnum" : "text-ink-2"}>{display(c, r, state)}</span>
                        )}
                      </td>
                    ))}
                    <td className="text-right whitespace-nowrap" style={{ paddingTop: 6, paddingBottom: 6 }}>
                      <span className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <OpenLink collection={collection} id={String(r.id)} />
                        <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Edit ${schema.title(r, state)}`} title="Edit" onClick={() => edit(r)}>
                          <Icon name="edit" size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm btn-danger-quiet" aria-label={`Delete ${schema.title(r, state)}`} title="Delete" onClick={() => setConfirmDelete(r)}>
                          <Icon name="trash" size={16} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > 200 && (
            <div className="px-1 pt-2 text-[13px] text-ink-3">
              Showing the first {filtered.length > 400 ? 400 : 200} of {filtered.length}. Narrow the filter to reach the rest.
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
        <Sheet
          open onClose={() => setConfirmDelete(null)} title={`Delete this ${schema.singular}?`}
          footer={
            <div className="flex flex-wrap gap-2 justify-end">
              <button className="btn" onClick={() => setConfirmDelete(null)} data-autofocus>Keep it</button>
              {itemsInDoomedSpace > 0 && (
                <button className="btn" onClick={() => remove(confirmDelete, false)}>Delete room, keep its scope</button>
              )}
              <button className="btn btn-danger" onClick={() => remove(confirmDelete, true)}>
                {itemsInDoomedSpace > 0 ? `Delete room and ${itemsInDoomedSpace} scope line${itemsInDoomedSpace === 1 ? "" : "s"}` : `Delete ${schema.singular}`}
              </button>
            </div>
          }
        >
          <p className="text-[15px] font-semibold text-ink mb-2">{schema.title(confirmDelete, state)}</p>
          {schema.deleteNote && <p className="text-[14px] text-ink-2 leading-relaxed mb-2">{schema.deleteNote}</p>}
          {itemsInDoomedSpace > 0 && (
            <p className="text-[14px] text-ink-2 leading-relaxed mb-2">
              It has {itemsInDoomedSpace} scope line{itemsInDoomedSpace === 1 ? "" : "s"}. You can delete them with it, or keep them as house-wide scope.
            </p>
          )}
          <p className="text-[13.5px] text-ink-3 leading-relaxed">
            Anything elsewhere that points at it is cleaned up, so nothing is left pointing at something that no longer exists.
            Deleting can&rsquo;t be undone here, but History can restore the project to before it.
          </p>
        </Sheet>
      )}
    </div>
  );
}

const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** From the console to wherever the record actually lives. */
function OpenLink({ collection, id }: { collection: CollectionKey; id: string }) {
  const { state } = useProject();
  const href = hrefFor(collection, id, state);
  if (!href) return null;
  return (
    <Link href={href} className="btn btn-ghost btn-icon btn-sm" title="Open where it lives" aria-label="Open where it lives">
      <Icon name="open" size={16} />
    </Link>
  );
}

export function RowForm({
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
  const [tried, setTried] = useState(false);
  const set = (key: string, v: unknown) => setDraft((d) => writeField(d, key, v));

  const missing = schema.fields.filter((f) => {
    if (!f.required) return false;
    const v = readField(draft, f.key);
    return v === undefined || v === null || v === "";
  });
  const isMissing = (f: Field) => tried && missing.includes(f);
  const submit = () => { setTried(true); if (!missing.length) onSave(draft); };
  const formId = `form-${String(draft.id)}`;

  return (
    <Sheet
      open onClose={onCancel} wide
      title={creating ? `New ${schema.singular}` : `Edit ${schema.singular}`}
      description={!creating ? schema.title(row, state) : undefined}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px] min-w-0 truncate">
            {tried && missing.length > 0
              ? <span className="text-bad">Fill in {missing.map((f) => f.label.toLowerCase()).join(", ")} to save.</span>
              : <span className="text-ink-4 font-mono">{String(draft.id)}</span>}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
            <button type="submit" form={formId} className="btn btn-primary">
              {creating ? `Create ${schema.singular}` : "Save changes"}
            </button>
          </div>
        </div>
      }
    >
      {/* Numbers pair up two-per-row at every width — a scope item has fourteen
          of them, and one per line turns the form into a scroll. Everything
          else gets the full width it needs to be read. */}
      <form id={formId} className="grid grid-cols-2 gap-x-4 gap-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        {schema.fields.filter((f) => f.type !== "readonly").map((f) => (
          <div
            key={f.key}
            className={["number", "money", "percent"].includes(f.type) ? "col-span-1" : "col-span-2 sm:col-span-1"}
            style={f.type === "textarea" || f.type === "tags" ? { gridColumn: "1 / -1" } : undefined}
          >
            <FieldShell label={f.label} required={f.required} hint={f.hint} error={isMissing(f) ? `${f.label} is needed.` : undefined}>
              <Input field={f} value={readField(draft, f.key)} onChange={(v) => set(f.key, v)} state={state} invalid={isMissing(f)} />
            </FieldShell>
          </div>
        ))}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Sheet>
  );
}

function Input({
  field, value, onChange, state, invalid,
}: { field: Field; value: unknown; onChange: (v: unknown) => void; state: ProjectState; invalid?: boolean }) {
  switch (field.type) {
    case "textarea":
      return (
        <textarea className="input resize-y leading-relaxed" aria-invalid={invalid}
          value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
      );
    case "tags": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      if (field.source) {
        return <MultiPicker value={arr} options={optionsFor(field, state)} onChange={onChange} placeholder={`Search ${field.label.toLowerCase()}…`} />;
      }
      return (
        <textarea className="input min-h-[80px] resize-y" placeholder="One per line"
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
        <label className="flex items-center gap-2.5 text-[14px] cursor-pointer min-h-[40px]">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          {value ? "Yes" : "No"}
        </label>
      );
    case "date":
      return (
        <input type="date" className="input" aria-invalid={invalid}
          value={value ? String(value).slice(0, 10) : ""}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)} />
      );
    case "select": {
      const options = optionsFor(field, state);
      return (
        <select className="input" value={String(value ?? "")} aria-invalid={invalid} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">{field.required ? "Choose…" : "—"}</option>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    case "readonly":
      return <div className="input bg-paper-2 text-ink-3">{String(value ?? "—")}</div>;
    default:
      return <input className="input" aria-invalid={invalid} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />;
  }
}
