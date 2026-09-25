"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import type { Decision, DesignOption } from "@/lib/model/types";
import { inr } from "@/lib/model/costing";
import { forecastOf } from "@/lib/model/derive";
import { Eyebrow, Chip, Swatch, PhotoBlock, fmtDate, relative, Avatar, useToast } from "./ui";
import { Icon } from "./Icon";
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
  decision, expanded: initial = false, actions,
}: { decision: Decision; expanded?: boolean; actions?: React.ReactNode }) {
  const { state, dispatch, me, role } = useProject();
  const toast = useToast();
  const [open, setOpen] = useState(initial);
  const [note, setNote] = useState("");
  const [chosen, setChosen] = useState<string | undefined>(decision.recommendedOptionId);

  const item = state.items.find((i) => i.id === decision.scopeItemId);
  const space = state.spaces.find((s) => s.id === item?.spaceId);
  const raisedBy = state.people.find((p) => p.name === decision.history[0]?.by);
  const options = state.options.filter((o) => o.scopeItemId === decision.scopeItemId);
  const recommended = options.find((o) => o.id === decision.recommendedOptionId);
  const overdue = decision.decideBy && new Date(decision.decideBy) < new Date() && decision.status === "awaiting-owner";
  const settled = ["approved", "rejected"].includes(decision.status);
  const bodyId = `dec-body-${decision.id}`;

  const act = (action: "approved" | "rejected" | "changes-requested" | "held") => {
    dispatch({ type: "decision/act", id: decision.id, action, by: me, note: note || undefined, optionId: chosen });
    setNote("");
    toast({
      approved: "Approved — it moves into the BOQ at the chosen option's price",
      rejected: "Rejected — the designer will see why",
      "changes-requested": "Sent back to the designer for changes",
      held: "Put on hold",
    }[action]);
  };

  return (
    <div id={decision.id} className="card overflow-hidden scroll-mt-24">
      <div className="px-4 sm:px-5 py-4 flex items-start gap-3 hover:bg-paper transition-colors cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <StatusChip status={decision.status} />
            {space && (
              <Link href={`/villa/${space.id}`} onClick={(e) => e.stopPropagation()} className="text-[13px] text-ink-3 hover:text-accent-strong hover:underline">
                {space.name}
              </Link>
            )}
            {overdue && <Chip tone="bad">Overdue</Chip>}
          </div>
          <h3 className="text-[16.5px] leading-snug">
            <button className="text-left hover:text-accent-strong" aria-expanded={open} aria-controls={bodyId}
              onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
              {decision.title}
            </button>
          </h3>
          <p className="text-[14px] text-ink-3 mt-1 leading-relaxed">{decision.question}</p>

          {recommended && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <span className="text-[14px] text-ink-2">
                Designer recommends <strong className="font-semibold">{recommended.label} — {recommended.headline}</strong>
              </span>
              <Swatch colors={recommended.palette} size={15} />
            </div>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
            {decision.costDeltaVsBudget !== undefined && decision.costDeltaVsBudget !== 0 && (
              <span className={`tnum font-semibold ${decision.costDeltaVsBudget > 0 ? "text-bad" : "text-good"}`}>
                {decision.costDeltaVsBudget > 0 ? "+" : ""}{inr(decision.costDeltaVsBudget)} against the current assumption
              </span>
            )}
            {decision.scheduleImpactDays ? (
              <span className="text-ink-3 tnum">{decision.scheduleImpactDays} days on the schedule</span>
            ) : null}
            {item && <span className="text-ink-3 tnum">item forecast {inr(forecastOf(item), { compact: true })}</span>}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
          {actions}
          {decision.decideBy && !settled && (
            <div className="text-right">
              <div className="eyebrow">Decide by</div>
              <div className={`text-[14.5px] font-semibold tnum mt-0.5 ${overdue ? "text-bad" : ""}`}>
                {fmtDate(decision.decideBy, { year: undefined })}
              </div>
              <div className={`text-[12.5px] ${overdue ? "text-bad" : "text-ink-3"}`}>{relative(decision.decideBy)}</div>
            </div>
          )}
          <button className="btn btn-ghost btn-icon btn-sm" aria-label={open ? "Collapse" : "Expand"} aria-expanded={open} aria-controls={bodyId}
            onClick={() => setOpen((v) => !v)}>
            <Icon name="chevron-down" size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div id={bodyId} className="px-4 sm:px-5 pb-5 border-t border-line pt-4 animate-fade">
          {decision.consequence && (
            <div className="card-quiet px-3.5 py-3 mb-4">
              <Eyebrow>Why it matters now</Eyebrow>
              <p className="text-[14px] text-ink-2 mt-1.5 leading-relaxed">{decision.consequence}</p>
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
                <Avatar
                  name={raisedBy?.name ?? decision.history[0]?.by ?? "Designer"}
                  tone={raisedBy?.avatarTone}
                />
                <p className="text-[14px] text-ink-2 leading-relaxed flex-1">{decision.designerNote}</p>
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
                <button className="btn btn-primary" onClick={() => act("approved")}>
                  <Icon name="check" size={16} strokeWidth={2} />
                  Approve{chosen && options.find((o) => o.id === chosen) ? ` option ${options.find((o) => o.id === chosen)!.label}` : ""}
                </button>
                <button className="btn" onClick={() => act("changes-requested")}>Ask for changes</button>
                <button className="btn btn-ghost" onClick={() => act("held")}>Put on hold</button>
                <button className="btn btn-ghost btn-danger-quiet sm:ml-auto" onClick={() => act("rejected")}>Reject</button>
              </div>
              <p className="text-[13px] text-ink-3 mt-2.5 leading-relaxed">
                Approving moves this item straight into the BOQ carrying the option&rsquo;s price.
                Every approval is timestamped and kept.
              </p>
            </div>
          )}

          {role !== "homeowner" && !settled && (
            <div className="card-quiet px-4 py-3 mb-4 text-[13.5px] text-ink-3">
              Waiting on the homeowner. {role === "designer" ? "You can revise the options or add a note below." : ""}
            </div>
          )}

          {/* --------------------------------------------------------- history */}
          <Eyebrow className="mb-2">History</Eyebrow>
          <div className="space-y-2 mb-4">
            {decision.history.map((h, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[13.5px]">
                <span className="tnum text-ink-3 shrink-0 w-[68px]">{fmtDate(h.at, { year: undefined })}</span>
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
    "awaiting-owner": ["Awaiting you", "accent"],
    approved: ["Approved", "good"],
    rejected: ["Rejected", "bad"],
    "changes-requested": ["Changes requested", "warn"],
    "on-hold": ["On hold", "info"],
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
      aria-pressed={onSelect ? !!selected : undefined}
      className="text-left card overflow-hidden transition-all disabled:cursor-default relative"
      style={{
        borderColor: selected ? "var(--color-accent)" : "var(--color-line)",
        boxShadow: selected ? "0 0 0 1px var(--color-accent)" : undefined,
      }}
    >
      <PhotoBlock tone={option.palette[0] ?? "#c3b6a4"} ratio="16 / 9" label={option.label} className="rounded-none border-0" />
      {selected && (
        <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center" aria-hidden>
          <Icon name="check" size={16} strokeWidth={2.2} />
        </span>
      )}
      <div className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[14.5px] font-medium leading-snug">{option.headline}</div>
          {recommended && <Chip tone="good">Recommended</Chip>}
        </div>
        <p className="text-[13px] text-ink-3 mt-1.5 leading-relaxed line-clamp-3">{option.description}</p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <Swatch colors={option.palette} size={16} />
          <div className="text-right">
            <div className="tnum text-[14px] font-medium">{inr(option.estimate)}</div>
            {option.leadTimeWeeks ? <div className="text-[12px] text-ink-3">{option.leadTimeWeeks} week lead</div> : null}
          </div>
        </div>

        {(option.pros.length > 0 || option.cons.length > 0) && (
          <div className="mt-2.5 space-y-1">
            {option.pros.slice(0, 3).map((p, i) => (
              <div key={i} className="text-[12.5px] text-ink-2 flex gap-1.5"><span className="text-good">+</span>{p}</div>
            ))}
            {option.cons.slice(0, 3).map((c, i) => (
              <div key={i} className="text-[12.5px] text-ink-3 flex gap-1.5"><span className="text-bad">−</span>{c}</div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
