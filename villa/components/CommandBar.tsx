"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/lib/store";
import { search, SAMPLE_QUERIES, type SearchHit } from "@/lib/search";
import { HOME, navFor } from "@/lib/nav";
import { Icon } from "./Icon";

/**
 * One search box for the whole project.
 *
 * It answers questions before it lists results: "how much are we spending on
 * wardrobes" returns a number and a reason, not twenty links. It also goes
 * anywhere in the app by name, so the menu is never more than a word away.
 */
type Row = SearchHit | { kind: "page"; id: string; title: string; subtitle: string; href: string; icon: string };

export function CommandBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, role } = useProject();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(() => [HOME, ...navFor(role).flatMap((g) => g.items)], [role]);
  const rows: Row[] = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const pageHits: Row[] = pages
      .filter((p) => p.label.toLowerCase().includes(needle) || p.blurb.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((p) => ({ kind: "page" as const, id: p.href, title: p.label, subtitle: p.blurb, href: p.href, icon: p.icon }));
    return [...pageHits, ...search(state, q)];
  }, [state, q, pages]);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);
  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const go = (h: Row) => { onClose(); router.push(h.href); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, rows.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && rows[sel]) { e.preventDefault(); go(rows[sel]); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[max(8vh,env(safe-area-inset-top))] px-3 sm:px-4" onKeyDown={onKey}>
      <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px] animate-fade" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Search the project"
        className="relative w-full max-w-2xl bg-card rounded-2xl overflow-hidden animate-pop" style={{ boxShadow: "var(--shadow-pop)" }}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
          <Icon name="search" size={19} className="text-ink-3 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rooms, money, decisions, vendors — or ask a question"
            className="flex-1 min-w-0 bg-transparent outline-none text-[16px] placeholder:text-ink-4"
            role="combobox" aria-expanded={rows.length > 0} aria-controls="cmd-list"
            aria-activedescendant={rows[sel] ? `cmd-${sel}` : undefined}
          />
          <button className="btn btn-ghost btn-sm" onClick={onClose}><span className="hidden sm:inline"><kbd>esc</kbd></span><span className="sm:hidden">Close</span></button>
        </div>

        <div ref={listRef} id="cmd-list" role="listbox" className="max-h-[62dvh] overflow-y-auto thin-scroll">
          {!q.trim() && (
            <div className="p-3">
              <div className="eyebrow px-2 pt-1 pb-2">Try asking</div>
              {SAMPLE_QUERIES.map((s) => (
                <button key={s} onClick={() => setQ(s)}
                  className="w-full text-left rounded-lg px-2.5 py-2 text-[14px] text-ink-2 hover:bg-paper-2 transition-colors flex items-center gap-2.5">
                  <Icon name="arrow-right" size={14} className="text-ink-4" /> {s}
                </button>
              ))}
            </div>
          )}

          {q.trim() && !rows.length && (
            <div className="px-4 py-12 text-center">
              <div className="text-[15px] font-semibold">Nothing matched &ldquo;{q}&rdquo;</div>
              <div className="text-[13.5px] text-ink-3 mt-1">Try a room name, a category like &ldquo;flooring&rdquo;, or a vendor.</div>
            </div>
          )}

          {rows.map((h, i) => (
            <button
              key={h.kind + h.id}
              id={`cmd-${i}`} data-i={i}
              role="option" aria-selected={i === sel}
              onMouseMove={() => setSel(i)}
              onClick={() => go(h)}
              className="w-full text-left px-4 py-3 border-b border-line/70 last:border-0 transition-colors flex items-start gap-3"
              style={{ background: i === sel ? "var(--color-paper-2)" : undefined }}
            >
              {h.kind === "answer" ? (
                <div className="min-w-0">
                  <div className="eyebrow">{h.title}</div>
                  <div className="mt-1 text-[24px] leading-tight tnum font-semibold tracking-[-0.02em]">{h.answer}</div>
                  {h.detail && <div className="text-[13.5px] text-ink-3 mt-1.5 leading-relaxed">{h.detail}</div>}
                </div>
              ) : (
                <>
                  <span className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${h.kind === "page" ? "bg-ink text-[#f2f1ed]" : "bg-paper-2 text-ink-3"}`}>
                    <Icon name={h.kind === "page" ? (h as { icon: string }).icon : ICON_FOR[h.kind] ?? "arrow-right"} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] text-ink font-medium truncate">{h.title}</span>
                    {h.subtitle && <span className="block text-[12.5px] text-ink-3 truncate">{h.subtitle}</span>}
                  </span>
                  <span className="eyebrow shrink-0 mt-1.5 text-[10px]">{h.kind === "page" ? "Go to" : KIND_LABEL[h.kind] ?? h.kind}</span>
                </>
              )}
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-4 px-4 h-10 border-t border-line text-[12px] text-ink-3">
          <span className="inline-flex items-center gap-1.5"><kbd>↑</kbd><kbd>↓</kbd> to move</span>
          <span className="inline-flex items-center gap-1.5"><kbd>↵</kbd> to open</span>
        </div>
      </div>
    </div>
  );
}

const KIND_LABEL: Record<string, string> = {
  space: "Room", item: "Scope", decision: "Decision", vendor: "Vendor", note: "Note", snag: "Snag", task: "Task", doc: "Document", quote: "Quote",
};

const ICON_FOR: Record<string, string> = {
  space: "villa", room: "villa", item: "checklist", scope: "checklist", vendor: "vendors", decision: "decisions",
  task: "task", note: "notes", doc: "documents", document: "documents", snag: "flag", issue: "flag", idea: "sparkle",
  payment: "rupee", person: "user", quote: "rupee",
};
