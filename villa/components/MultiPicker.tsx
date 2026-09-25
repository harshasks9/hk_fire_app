"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";

/**
 * Choose several things from a long list — rooms, vendors, scope lines — by
 * typing part of a name. What is chosen shows as chips above the box; nobody
 * has to know an id.
 */
export function MultiPicker({
  value, options, onChange, placeholder = "Type to search…",
}: {
  value: string[];
  options: { value: string; label: string }[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);
  const chosen = new Set(value);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return options
      .filter((o) => !chosen.has(o.value) && (!needle || o.label.toLowerCase().includes(needle)))
      .slice(0, 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, q, value]);

  const add = (v: string) => { onChange([...value, v]); setQ(""); setHi(0); inputRef.current?.focus(); };
  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  return (
    <div className="relative">
      <div
        className="input flex flex-wrap items-center gap-1.5 cursor-text"
        style={{ padding: value.length ? "6px 8px" : undefined }}
        onClick={() => { inputRef.current?.focus(); setOpen(true); }}
      >
        {value.map((v) => (
          <span key={v} className="chip bg-paper-2 text-ink-2 pr-1" style={{ fontSize: 12.5 }}>
            {byValue.get(v) ?? v}
            <button
              type="button" className="rounded-full p-0.5 hover:bg-line text-ink-3 hover:text-ink"
              aria-label={`Remove ${byValue.get(v) ?? v}`}
              onClick={(e) => { e.stopPropagation(); remove(v); }}
            >
              <Icon name="close" size={12} strokeWidth={2} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, matches.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
            else if (e.key === "Enter" && open && matches[hi]) { e.preventDefault(); add(matches[hi].value); }
            else if (e.key === "Backspace" && !q && value.length) remove(value[value.length - 1]);
            else if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); }
          }}
          placeholder={value.length ? "Add another…" : placeholder}
          className="flex-1 min-w-[120px] bg-transparent outline-none py-0.5"
          role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
          aria-activedescendant={open && matches[hi] ? `${listId}-${hi}` : undefined}
        />
      </div>
      {open && (
        <div id={listId} role="listbox" className="absolute z-20 left-0 right-0 mt-1 bg-card border border-line rounded-xl max-h-60 overflow-y-auto thin-scroll animate-pop" style={{ boxShadow: "var(--shadow-pop)" }}>
          {matches.length ? matches.map((o, i) => (
            <div
              key={o.value} id={`${listId}-${i}`} role="option" aria-selected={i === hi}
              onMouseDown={(e) => { e.preventDefault(); add(o.value); }}
              onMouseEnter={() => setHi(i)}
              className={`px-3 py-2 text-[14px] cursor-pointer ${i === hi ? "bg-paper-2" : ""}`}
            >
              {o.label}
            </div>
          )) : (
            <div className="px-3 py-3 text-[13.5px] text-ink-3">{q ? `Nothing matches “${q}”.` : "Everything is already chosen."}</div>
          )}
        </div>
      )}
    </div>
  );
}
