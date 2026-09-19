"use client";

import React, { useState } from "react";
import { useProject } from "@/lib/store";
import { openDecisions, decisionUrgency, forecastOf } from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import { PageTitle, Tabs, Stat, fmtDay } from "@/components/ui";
import { DecisionCard } from "@/components/DecisionCard";
import { AddButton, RowActions, EmptyWithAdd } from "@/components/Entity";

const TABS = ["Needs my decision", "On hold", "Settled"] as const;
type Tab = (typeof TABS)[number];

/**
 * The decision inbox.
 *
 * For a homeowner this is probably the most important screen in the product:
 * a single queue, ranked by what will hurt soonest, where each card carries
 * enough context to answer without leaving it.
 */
export default function DecisionsPage() {
  const { state, role } = useProject();
  const [tab, setTab] = useState<Tab>("Needs my decision");

  const ranked = openDecisions(state);
  const waiting = ranked.filter((d) => d.status === "awaiting-owner" || d.status === "changes-requested");
  const held = ranked.filter((d) => d.status === "on-hold");
  const settled = state.decisions.filter((d) => d.status === "approved" || d.status === "rejected");

  const list = tab === "Needs my decision" ? waiting : tab === "On hold" ? held : settled;

  const totalDelta = waiting.reduce((a, d) => a + (d.costDeltaVsBudget ?? 0), 0);
  const soonest = waiting.filter((d) => d.decideBy).sort((a, b) => +new Date(a.decideBy!) - +new Date(b.decideBy!))[0];
  const overdue = waiting.filter((d) => d.decideBy && new Date(d.decideBy) < new Date()).length;

  return (
    <div>
      <PageTitle
        title={role === "designer" ? "Approval requests" : "Needs my decision"}
        sub={
          waiting.length
            ? "Ranked by how soon it bites and how much rides on it. Each card has everything you need to answer it here."
            : "Nothing is waiting on you."
        }
        right={<AddButton on="decisions" label="Raise a decision" accent />}
      />

      {waiting.length > 0 && (
        <div className="card px-5 py-5 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Waiting on you" value={waiting.length} tone={overdue ? "rust" : "clay"} large />
          <Stat label="Overdue" value={overdue || "—"} tone={overdue ? "rust" : undefined} large />
          <Stat
            label="Cost at stake"
            value={`${totalDelta >= 0 ? "+" : ""}${inr(totalDelta, { compact: true })}`}
            sub="against current assumptions"
            tone={totalDelta > 0 ? "rust" : "sage"}
            large
          />
          <Stat
            label="Soonest deadline"
            value={soonest ? fmtDay(soonest.decideBy) : "—"}
            sub={soonest?.title}
            large
          />
        </div>
      )}

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={setTab}
        counts={{ "Needs my decision": waiting.length, "On hold": held.length, Settled: settled.length }}
      />

      <div className="mt-5 space-y-3">
        {list.length ? (
          list.map((d, i) => (
            <div key={d.id} id={d.id} className="animate-rise scroll-mt-24 group relative" style={{ animationDelay: `${i * 40}ms` }}>
              <DecisionCard decision={d} expanded={i === 0 && tab === "Needs my decision"} />
              <RowActions on="decisions" id={d.id} className="absolute top-3 right-3 z-10" />
            </div>
          ))
        ) : (
          <EmptyWithAdd
            on="decisions"
            title={tab === "Needs my decision" ? "Nothing is waiting on you." : tab === "On hold" ? "Nothing is on hold." : "No decisions settled yet."}
            hint={tab === "Needs my decision" ? "The designer has no open approval requests. You can still raise one yourself — anything the project is stuck on belongs here." : undefined}
          />
        )}
      </div>
    </div>
  );
}
