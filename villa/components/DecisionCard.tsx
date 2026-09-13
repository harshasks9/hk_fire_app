"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import type { Decision, DesignOption } from "@/lib/model/types";
import { inr } from "@/lib/model/costing";
import { forecastOf, decisionUrgency } from "@/lib/model/derive";
import { Eyebrow, Chip, Swatch, PhotoBlock, fmtDate, relative, Avatar, Money } from "./ui";
import { Comments } from "./Comments";

/**
 * A decision card.
 *
 * Everything needed to answer it is on the card: what the designer recommends,
 * what it costs against what was budgeted, what it does to the programme, why
 * it matters, and the alternatives. Approving it here moves the underlying
 * scope item into the BOQ with the chosen option's price attached.
 */
export function DecisionCard({
  decision, expanded: initial = false,
}: { decision: Decision; expanded?: boolean }) {
  const { state, dispatch, me, role } = useProject();
  const [open, setOpen] = useState(initial);
  const [note, setNote] = useState("");
  const [chosen, setChosen] = useState<string | undefined>(decision.recommendedOptionId);

  const item = state.items.find((i) => i.id === decision.scopeItemId);
  const space = state.spaces.find((s) => s.id === item?.spaceId);
  const options = state.options.filter((o) => o.scopeItemId === decision.scopeItemId);
  const recommended = options.find((o) => o.id === decision.recommendedOptionId);
  const overdue = decision.decideBy && new Date(decision.decideBy) < new Date() && decision.status === "awaiting-owner";
  const settled = ["approved", "rejected"].includes(decision.status);

  const act = (action: "approved" | "rejected" | "changes-requested" | "held") => {
    dispatch({ type: "decision/act", id: decision.id, action, by: me, note: note || undefined, optionId: chosen });
    setNote("");
  };

  return (
    <div id={decision.id} className="card overflow-hidden scroll-mt-24">
      <button onClick={() => setOpen((v) => !v)} className="w-full text-left px-4 sm:px-5 py-4 hover:bg-paper-2/50 transition-colors">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <StatusChip status={decision.status} />
              {space && <Link href={`/villa/${space.id}`} className="text-[11.5px] text-ink-3 hover:text-clay">{space.name}</Link>}
              {overdue && <Chip tone="rust">Overdue</Chip>}
            </div>
            <h3 className="text-[16px] leading-snug">{decision.title}</h3>
            <p className="text-[13px] text-ink-3 mt-1 leading-relaxed">{decision.question}</p>

            {recommended && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                <span className="text-[12.5px] text-ink-2">
                  Designer recommends <strong className="font-medium">{recommended.label} — {recommended.headline}</strong>
                </span>
                <Swatch colors={recommended.palette} size={15} />
              </div>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
              {decision.costDeltaVsBudget !== undefined && decision.costDeltaVsBudget !== 0 && (
                <span style={{ color: decision.costDeltaVsBudget > 0 ? "#8d3a2c" : "#41603f" }} className="tnum font-medium">
                  {decision.costDeltaVsBudget > 0 ? "+" : ""}{inr(decision.costDeltaVsBudget)} vs current assumption
                </span>
              )}
              {decision.scheduleImpactDays ? (
                <span className="text-ink-3 tnum">{decision.scheduleImpactDays} days schedule impact</span>
              ) : null}
              {item && <span className="text-ink-3 tnum">item forecast {inr(forecastOf(item), { compact: true })}</span>}
            </div>
          </div>

          <div className="text-right shrink-0">
            {decision.decideBy && !settled && (
              <>
                <div className="text-[11px] text-ink-3">decide by</div>
                <div className="text-[13px] font-medium tnum" style={{ color: overdue ? "#8d3a2c" : undefined }}>
                  {fmtDate(decision.decideBy, { year: undefined })}
                </div>
                <div className="text-[10.5px]" style={{ color: overdue ? "#8d3a2c" : "#857b70" }}>{relative(decision.decideBy)}</div>
              </>
            )}
            <div className="text-[10.5px] text-ink-4 mt-1.5">{open ? "collapse" : "open"}</div>
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 sm:px-5 pb-5 border-t border-line pt-4 animate-fade">
          {decision.consequence && (
            <div className="card-quiet px-3.5 py-3 mb-4">
              <Eyebrow>Why it matters now</Eyebrow>
              <p className="text-[13px] text-ink-2 mt-1.5 leading-relaxed">{decision.consequence}</p>
            </div>
          )}

          {options.length > 0 && (
            <>
              <Eyebrow className="mb-2.5">Options</Eyebrow>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {options.map((o) => (
                  <OptionTile
                    key={o.id}
                    option={o}
                    selected={chosen === o.id}
                    recommended={o.id === decision.recommendedOptionId}
                    onSelect={() => setChosen(o.id)}
                    disabled={settled}
                  />
                ))}
              </div>
            </>
          )}

          {decision.designerNote && (
            <div className="mb-4">
              <Eyebrow className="mb-1.5">Designer&rsquo;s recommendation</Eyebrow>
              <div className="flex items-start gap-2.5">
                <Avatar name="Ananya Rao" tone="#4A6A5C" />
                <p className="text-[13px] text-ink-2 leading-relaxed flex-1">{decision.designerNote}</p>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------- actions */}
          {role === "homeowner" && !settled && (
            <div className="card-quiet px-4 py-4 mb-4">
              <Eyebrow className="mb-2">Your decision</Eyebrow>
              <textarea
                className="input min-h-[60px] resize-y mb-2.5"
                placeholder="Add a note for the designer (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-accent" onClick={() => act("approved")}>
                  Approve {chosen && options.find((o) => o.id === chosen) ? options.find((o) => o.id === chosen)!.label : ""}
                </button>
                <button className="btn" onClick={() => act("changes-requested")}>Request changes</button>
                <button className="btn" onClick={() => act("held")}>Hold</button>
                <button className="btn" onClick={() => act("rejected")}>Reject</button>
              </div>
              <p className="text-[11px] text-ink-4 mt-2.5 leading-relaxed">
                Approving moves this item straight into the BOQ carrying the option&rsquo;s price.
                Every approval is timestamped and kept.
              </p>
            </div>
          )}

          {role !== "homeowner" && !settled && (
            <div className="card-quiet px-4 py-3 mb-4 text-[12.5px] text-ink-3">
              Waiting on the homeowner. {role === "designer" ? "You can revise the options or add a note below." : ""}
            </div>
          )}

          {/* --------------------------------------------------------- history */}
          <Eyebrow className="mb-2">History</Eyebrow>
          <div className="space-y-2 mb-4">
            {decision.history.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[12.5px]">
                <span className="tnum text-ink-4 shrink-0 w-[68px]">{fmtDate(h.at, { year: undefined })}</span>
                <span className="text-ink-2">
                  <strong className="font-medium">{h.by}</strong> {verb(h.action)}
                  {h.note && <span className="text-ink-3"> — {h.note}</span>}
                </span>
              </div>
            ))}
          </div>

          <Eyebrow className="mb-2">Discussion</Eyebrow>
          <Comments targetType="decision" targetId={decision.id} />
        </div>
      )}
    </div>
  );
}

function verb(a: string): string {
  return {
    raised: "raised this", approved: "approved", rejected: "rejected",
    "changes-requested": "asked for changes", held: "put this on hold", revised: "revised the options",
  }[a] ?? a;
}

function StatusChip({ status }: { status: Decision["status"] }) {
  const map: Record<Decision["status"], [string, Parameters<typeof Chip>[0]["tone"]]> = {
    draft: ["Draft", "neutral"],
    "awaiting-owner": ["Awaiting you", "clay"],
    approved: ["Approved", "sage"],
    rejected: ["Rejected", "rust"],
    "changes-requested": ["Changes requested", "ochre"],
    "on-hold": ["On hold", "slate"],
  };
  const [label, tone] = map[status];
  return <Chip tone={tone}>{label}</Chip>;
}

export function OptionTile({
  option, selected, recommended, onSelect, disabled,
}: { option: DesignOption; selected?: boolean; recommended?: boolean; onSelect?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className="text-left card overflow-hidden transition-all disabled:cursor-default"
      style={{
        borderColor: selected ? "var(--color-clay)" : "var(--color-line)",
        boxShadow: selected ? "0 0 0 1px var(--color-clay)" : undefined,
      }}
    >
      <PhotoBlock tone={option.palette[0] ?? "#c3b6a4"} ratio="16 / 9" label={option.label} />
      <div className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[13.5px] font-medium leading-snug">{option.headline}</div>
          {recommended && <Chip tone="sage">Recommended</Chip>}
        </div>
        <p className="text-[12px] text-ink-3 mt-1.5 leading-relaxed line-clamp-3">{option.description}</p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <Swatch colors={option.palette} size={16} />
          <div className="text-right">
            <div className="tnum text-[14px] font-medium">{inr(option.estimate)}</div>
            {option.leadTimeWeeks ? <div className="text-[10.5px] text-ink-3">{option.leadTimeWeeks} week lead</div> : null}
          </div>
        </div>

        {(option.pros.length > 0 || option.cons.length > 0) && (
          <div className="mt-2.5 space-y-1">
            {option.pros.slice(0, 3).map((p, i) => (
              <div key={i} className="text-[11.5px] text-ink-2 flex gap-1.5"><span className="text-sage">+</span>{p}</div>
            ))}
            {option.cons.slice(0, 3).map((c, i) => (
              <div key={i} className="text-[11.5px] text-ink-3 flex gap-1.5"><span className="text-rust">−</span>{c}</div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
