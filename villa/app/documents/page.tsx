"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { PageTitle, Eyebrow, Chip, Empty, fmtDay } from "@/components/ui";
import type { Doc } from "@/lib/model/types";

const GROUPS: { label: string; kinds: Doc["kind"][] }[] = [
  { label: "Drawings", kinds: ["floor-plan", "electrical", "lighting", "ceiling", "plumbing", "furniture", "joinery", "elevation"] },
  { label: "Visuals", kinds: ["render"] },
  { label: "Commercial", kinds: ["boq", "quote", "po", "contract", "invoice", "receipt"] },
  { label: "Handover", kinds: ["spec", "warranty", "manual"] },
];

/**
 * Documents.
 *
 * A repository exists, but it is the fallback. Documents appear where they are
 * relevant — the joinery drawing inside the room, the quote inside the
 * comparison, the warranty inside the item — and this page is only for when you
 * know you want the file and not the context.
 */
export default function DocumentsPage() {
  const { state } = useProject();
  const [q, setQ] = useState("");

  const spaceName = (id: string) => state.spaces.find((s) => s.id === id)?.name ?? id;
  const filtered = useMemo(
    () => state.docs.filter((d) => !q.trim() || `${d.title} ${d.kind}`.toLowerCase().includes(q.toLowerCase())),
    [state.docs, q],
  );

  return (
    <div>
      <div className="text-[12px] text-ink-3 mb-3"><Link href="/more" className="hover:text-clay">More</Link> / Documents</div>
      <PageTitle
        title="Documents"
        sub="Everything filed. Most of the time you will meet these inside the room or the item they belong to rather than here."
      />

      <input className="input mb-5 max-w-md" placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="space-y-6">
        {GROUPS.map((g) => {
          const list = filtered.filter((d) => g.kinds.includes(d.kind));
          if (!list.length) return null;
          return (
            <div key={g.label}>
              <Eyebrow className="mb-2">{g.label}</Eyebrow>
              <div className="card divide-y divide-line">
                {list.map((d) => (
                  <div key={d.id} className="px-4 py-3 flex items-center gap-3">
                    <Chip tone="ghost">{d.kind.replace(/-/g, " ")}</Chip>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] truncate">{d.title}</div>
                      <div className="text-[11px] text-ink-3 truncate">
                        {d.addedBy} · {fmtDay(d.addedAt)}
                        {d.spaceIds.length > 0 && ` · ${d.spaceIds.map(spaceName).join(", ")}`}
                        {d.vendorId && ` · ${state.vendors.find((v) => v.id === d.vendorId)?.name}`}
                      </div>
                    </div>
                    {d.revision && <span className="chip shrink-0" style={{ background: "#f4f1ec", color: "#514941" }}>{d.revision}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {!filtered.length && <Empty title="No documents match." />}
      </div>

      <p className="text-[11.5px] text-ink-3 mt-6 leading-relaxed max-w-2xl">
        Revisions are never overwritten. A superseded drawing stays on the record with its
        revision mark, so it is always possible to see what was approved at the time a
        decision was taken.
      </p>
    </div>
  );
}
