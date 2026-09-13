"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/lib/store";
import { search, SAMPLE_QUERIES, type SearchHit } from "@/lib/search";
import { Eyebrow } from "./ui";

/**
 * One search box for the whole project.
 *
 * It answers questions before it lists results: "how much are we spending on
 * wardrobes" returns a number and a reason, not twenty links. Anything it
 * cannot answer, it indexes.
 */
export function CommandBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useProject();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(() => (q.trim() ? search(state, q) : []), [state, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);
  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, hits.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && hits[sel]) { e.preventDefault(); go(hits[sel]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const go = (h: SearchHit) => { onClose(); router.push(h.href); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[8vh] px-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[3px] animate-fade" onClick={onClose} />
      <div className="relative w-full max-w-2xl card shadow-2xl overflow-hidden animate-rise">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
          <svg viewBox="0 0 20 20" width="17" height="17" className="text-ink-4 shrink-0" aria-hidden>
            <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13.2 13.2 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask anything — rooms, money, decisions, vendors, what is late…"
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-ink-4"
          />
          <kbd className="text-[10px] text-ink-4 hidden sm:block">esc</kbd>
        </div>

        <div className="max-h-[58vh] overflow-y-auto thin-scroll">
          {!q.trim() && (
            <div className="p-4">
              <Eyebrow>Try asking</Eyebrow>
              <div className="mt-2.5 space-y-1">
                {SAMPLE_QUERIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQ(s)}
                    className="w-full text-left rounded-lg px-3 py-2 text-[13.5px] text-ink-2 hover:bg-paper-2 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {q.trim() && !hits.length && (
            <div className="px-4 py-10 text-center text-[13.5px] text-ink-3">
              Nothing matched “{q}”.
            </div>
          )}

          {hits.map((h, i) => (
            <button
              key={h.kind + h.id}
              onMouseEnter={() => setSel(i)}
              onClick={() => go(h)}
              className="w-full text-left px-4 py-3 border-b border-line/70 last:border-0 transition-colors"
              style={{ background: i === sel ? "var(--color-paper-2)" : undefined }}
            >
              {h.kind === "answer" ? (
                <div>
                  <Eyebrow>{h.title}</Eyebrow>
                  <div
                    className="mt-1 text-[22px] leading-tight tnum"
                    style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}
                  >
                    {h.answer}
                  </div>
                  {h.detail && <div className="text-[12.5px] text-ink-3 mt-1.5 leading-relaxed">{h.detail}</div>}
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span className="chip mt-[1px] shrink-0" style={{ background: "#f1ede7", color: "#857b70", fontSize: 10 }}>
                    {h.kind}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13.5px] text-ink truncate">{h.title}</div>
                    {h.subtitle && <div className="text-[11.5px] text-ink-3 truncate">{h.subtitle}</div>}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
