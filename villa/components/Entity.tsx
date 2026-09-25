"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import Link from "next/link";
import { useProject, newId, type CollectionKey } from "@/lib/store";
import { SCHEMAS } from "@/lib/model/schema";
import { hrefFor, labelFor } from "@/lib/model/links";
import { RowForm } from "./EntityEditor";
import { Sheet, Empty, useToast } from "./ui";
import { Icon } from "./Icon";

/**
 * Create, edit and delete — from wherever you happen to be standing.
 *
 * Every record in the project can be changed from the screen you are already
 * on, rather than only from the console. The form, its fields and its
 * validation all come from the same schema the console uses, so there is
 * exactly one definition of what a vendor or a snag is and no screen can drift
 * from it. The dialog lives at the root of the app, so a card three levels
 * deep can open it without carrying any state of its own.
 */

interface EntityCtx {
  /** Open the edit form for an existing row. */
  edit: (on: CollectionKey, id: string) => void;
  /** Open the create form, pre-filled with the context you are standing in. */
  create: (on: CollectionKey, prefill?: Record<string, unknown>) => void;
  /** Ask to delete a row. Cascades are explained before anything happens. */
  remove: (on: CollectionKey, id: string) => void;
}

const Ctx = createContext<EntityCtx | null>(null);

export function useEntity(): EntityCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useEntity must be used inside EntityDialogs");
  return c;
}

const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

export function EntityDialogs({ children }: { children: React.ReactNode }) {
  const { state, dispatch, me } = useProject();
  const toast = useToast();
  const [form, setForm] = useState<{ on: CollectionKey; row: Record<string, unknown>; creating: boolean } | null>(null);
  const [doomed, setDoomed] = useState<{ on: CollectionKey; id: string } | null>(null);

  const edit = useCallback((on: CollectionKey, id: string) => {
    const row = (state[on] as unknown as Record<string, unknown>[]).find((r) => r.id === id);
    if (row) setForm({ on, row: { ...row }, creating: false });
  }, [state]);

  const create = useCallback((on: CollectionKey, prefill: Record<string, unknown> = {}) => {
    const schema = SCHEMAS[on];
    // The schema mints the id — some collections shape their own (a category id
    // is used as a key elsewhere), so it is not ours to overwrite.
    const row = {
      ...schema.blank({ id: newId(on.slice(0, 4)), me, state, spaceId: prefill.spaceId as string | undefined }),
      ...prefill,
    };
    setForm({ on, row, creating: true });
  }, [me, state]);

  const remove = useCallback((on: CollectionKey, id: string) => setDoomed({ on, id }), []);

  const save = (row: Record<string, unknown>) => {
    if (!form) return;
    if (form.creating) dispatch({ type: "create", on: form.on, row } as never);
    else dispatch({ type: "update", on: form.on, id: String(row.id), patch: row } as never);
    toast(form.creating ? `${cap(SCHEMAS[form.on].singular)} created` : "Changes saved");
    setForm(null);
  };

  const value = useMemo(() => ({ edit, create, remove }), [edit, create, remove]);
  const schema = doomed ? SCHEMAS[doomed.on] : null;
  const doomedRow = doomed
    ? (state[doomed.on] as unknown as Record<string, unknown>[]).find((r) => r.id === doomed.id)
    : null;

  return (
    <Ctx.Provider value={value}>
      {children}
      {form && (
        <RowForm
          schema={SCHEMAS[form.on]}
          row={form.row}
          creating={form.creating}
          onCancel={() => setForm(null)}
          onSave={save}
        />
      )}
      {doomed && schema && (
        <Sheet
          open onClose={() => setDoomed(null)} title={`Delete this ${schema.singular}?`}
          footer={
            <div className="flex gap-2 justify-end">
              <button className="btn" onClick={() => setDoomed(null)} data-autofocus>Keep it</button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  dispatch({ type: "remove", on: doomed.on, id: doomed.id });
                  toast(`${cap(schema.singular)} deleted`);
                  setDoomed(null);
                }}
              >
                Delete {schema.singular}
              </button>
            </div>
          }
        >
          <p className="text-[15px] font-semibold text-ink mb-2">{doomedRow ? schema.title(doomedRow, state) : ""}</p>
          {schema.deleteNote && <p className="text-[14px] text-ink-2 leading-relaxed mb-2">{schema.deleteNote}</p>}
          <p className="text-[13.5px] text-ink-3 leading-relaxed">
            Anything elsewhere that points at it is cleaned up, so nothing is left pointing at something that no longer exists.
            Deleting can&rsquo;t be undone here, but History can restore the project to before it.
          </p>
        </Sheet>
      )}
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------------ pieces */

/** A record's name, as a link to wherever that record lives. */
export function EntityLink({
  on, id, label, className, children,
}: { on: CollectionKey; id?: string; label?: string; className?: string; children?: React.ReactNode }) {
  const { state } = useProject();
  if (!id) return <>{label ?? children ?? "—"}</>;
  const text = children ?? label ?? labelFor(on, id, state) ?? "—";
  const href = hrefFor(on, id, state);
  if (!href) return <>{text}</>;
  return (
    <Link href={href} className={className ?? "link"}>
      {text}
    </Link>
  );
}

/**
 * Edit and delete for one row, kept quiet until the row is hovered so that a
 * list of forty things does not read as a list of eighty buttons. On touch
 * screens, where there is no hover, they are always shown.
 */
export function RowActions({
  on, id, className = "", always,
}: { on: CollectionKey; id: string; className?: string; always?: boolean }) {
  const { edit, remove } = useEntity();
  const noun = SCHEMAS[on].singular;
  return (
    <span
      className={`inline-flex items-center gap-0.5 shrink-0 ${always ? "" : "[@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-within:opacity-100"} transition-opacity ${className}`}
    >
      <button
        className="btn btn-ghost btn-icon btn-sm bg-card/80"
        title={`Edit this ${noun}`} aria-label={`Edit this ${noun}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); edit(on, id); }}
      >
        <Icon name="edit" size={16} />
      </button>
      <button
        className="btn btn-ghost btn-icon btn-sm btn-danger-quiet bg-card/80"
        title={`Delete this ${noun}`} aria-label={`Delete this ${noun}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(on, id); }}
      >
        <Icon name="trash" size={16} />
      </button>
    </span>
  );
}

/** "Add a vendor", wherever vendors are being looked at. */
export function AddButton({
  on, prefill, label, className, accent,
}: { on: CollectionKey; prefill?: Record<string, unknown>; label?: string; className?: string; accent?: boolean }) {
  const { create } = useEntity();
  return (
    <button
      className={className ?? (accent ? "btn btn-primary btn-sm" : "btn btn-sm")}
      onClick={() => create(on, prefill)}
    >
      <Icon name="plus" size={15} strokeWidth={2} />
      {label ?? `Add ${SCHEMAS[on].singular}`}
    </button>
  );
}

/** An empty list is a dead end unless it offers the way out of being empty. */
export function EmptyWithAdd({
  on, prefill, title, hint, icon,
}: { on: CollectionKey; prefill?: Record<string, unknown>; title: string; hint?: string; icon?: string }) {
  return <Empty title={title} hint={hint} icon={icon} action={<AddButton on={on} prefill={prefill} accent />} />;
}
