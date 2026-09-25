"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useProject } from "@/lib/store";
import { currentPhase } from "@/lib/model/phases";
import { purchaseList, purchaseTotals } from "@/lib/model/purchase";
import { checklistSummaries, houseChecklist } from "@/lib/model/checklist";
import {
  projectFinance, openDecisions, decisionUrgency, findGaps, longLeadItems,
  upcomingPayments, openSnags, isLate, daysBetween,
} from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import {
  PageTitle, Stat, Money, BudgetBar, Bar, Avatar, fmtDay, relative, Empty, Section, LegendDot, BAR, Confirm, useToast,
} from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * Home.
 *
 * One question first — what needs me today — and everything else below it.
 * The test this screen has to pass: ignore the project for a week, come back,
 * and understand what changed in under a minute.
 */
export default function Home() {
  const { state, role, me, meId } = useProject();
  const fin = projectFinance(state);
  const phase = currentPhase(state);
  const buy = purchaseTotals(purchaseList(state));
  const checkRooms = checklistSummaries(state);
  const houseCl = houseChecklist(state);
  const checklistOpen = checkRooms.reduce((a, x) => a + (x.total - x.done), 0) + (houseCl.total - houseCl.done);
  const checklistCritical = checkRooms.reduce((a, x) => a + x.criticalOpen, 0) + houseCl.criticalOpen;
  const leastComplete = [...checkRooms].sort((a, b) => a.pct - b.pct)[0];
  const decisions = openDecisions(state);
  const gaps = findGaps(state);
  const blockers = gaps.filter((g) => g.severity === "blocker");
  const lateTasks = state.tasks.filter((t) => isLate(t));
  const payments = upcomingPayments(state, 30);
  const snags = openSnags(state);
  const critical = snags.filter((s) => s.severity === "critical");
  const longLead = longLeadItems(state).filter((i) =>
    ["not-started", "idea", "options", "estimated", "discussion"].includes(i.stage),
  );
  const daysToHandover = daysBetween(new Date(), state.meta.targetHandover);
  const spaceName = (id?: string) => state.spaces.find((s) => s.id === id)?.name ?? "House-wide";

  const sinceVisit = new Date(state.meta.lastOwnerVisit);
  const recent = [
    ...state.siteUpdates.map((u) => ({ at: u.at, who: u.by, what: `${spaceName(u.spaceId)} — ${u.body}`, href: "/site" })),
    ...state.comments.map((c) => ({ at: c.createdAt, who: c.author, what: c.body, href: "/design" })),
    ...state.notes.map((n) => ({ at: n.at, who: n.author, what: n.title, href: `/notes#${n.id}` })),
  ]
    .filter((x) => new Date(x.at) >= sinceVisit)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 6);

  const attention = [
    ...decisions.slice(0, 3).map((d) => ({
      kind: "Decision", icon: "decisions", title: d.title, why: d.consequence ?? d.question, when: d.decideBy,
      href: `/decisions#${d.id}`, tone: "accent" as const,
      urgency: decisionUrgency(d, state.items.find((i) => i.id === d.scopeItemId)),
    })),
    ...blockers.slice(0, 2).map((g) => ({
      kind: "Blocker", icon: "alert", title: g.title, why: g.detail, when: undefined as string | undefined,
      href: g.spaceId ? `/villa/${g.spaceId}` : "/more/completeness", tone: "bad" as const, urgency: 85,
    })),
    ...critical.slice(0, 2).map((s) => ({
      kind: "Snag", icon: "flag", title: `${spaceName(s.spaceId)} — ${s.title}`, why: s.description ?? "",
      when: s.dueBy, href: "/site", tone: "bad" as const, urgency: 80,
    })),
    ...payments.slice(0, 2).map((p) => ({
      kind: "Payment", icon: "rupee", title: p.label, why: `${inr(p.amount)} due to ${state.vendors.find((v) => v.id === p.vendorId)?.name ?? "vendor"}.`,
      when: p.dueOn, href: "/costs?view=payments", tone: "warn" as const, urgency: 70,
    })),
  ].sort((a, b) => b.urgency - a.urgency).slice(0, 5);

  const person = state.people.find((p) => p.id === meId);
  const firstName = person ? person.name.split(" ")[0] : undefined;
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const coming = state.items
    .filter((i) => i.procurement?.expectedDelivery && daysBetween(new Date(), i.procurement.expectedDelivery) <= 30 && daysBetween(new Date(), i.procurement.expectedDelivery) >= -7)
    .slice(0, 3);
  const noBudget = !fin.originalBudget;

  return (
    <div>
      <PageTitle
        eyebrow={today}
        title={greeting(role, firstName)}
        sub={
          attention.length
            ? `${attention.length} thing${attention.length === 1 ? " needs" : "s need"} you. Everything else is moving.`
            : "Nothing needs you right now. The project is moving."
        }
      />

      {state.people.length === 0 && state.decisions.length === 0 && state.notes.length <= 1 && <FirstRun />}

      {/* ------------------------------------------------ what needs me today */}
      <Section
        title={<span className="inline-flex items-center gap-2">Needs you {attention.length > 0 && <span className="tnum text-[12px] font-mono rounded bg-ink text-[#f2f1ed] px-1.5 py-px">{attention.length}</span>}</span>}
        action={gaps.length ? { href: "/more/completeness", label: `All ${gaps.length} gaps` } : undefined}
      >
        {attention.length === 0 ? (
          <Empty icon="check" title="Nothing is waiting on you." hint="No approval requests are open and nothing is overdue." />
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {attention.map((a, i) => {
              const overdue = a.when && new Date(a.when) < new Date();
              return (
                <Link key={i} href={a.href} className="flex items-start gap-3.5 px-4 sm:px-5 py-4 hover:bg-paper transition-colors group">
                  <span className="mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `var(--color-${a.tone}-soft)`, color: `var(--color-${a.tone === "accent" ? "accent-strong" : a.tone})` }}>
                    <Icon name={a.icon} size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow block" style={{ color: `var(--color-${a.tone === "accent" ? "accent" : a.tone})` }}>{a.kind}</span>
                    <span className="block text-[15.5px] font-semibold leading-snug mt-0.5">{a.title}</span>
                    {a.why && <span className="block text-[14px] text-ink-3 mt-0.5 leading-relaxed line-clamp-2">{a.why}</span>}
                  </span>
                  {a.when ? (
                    <span className="text-right shrink-0 hidden sm:block">
                      <span className="block text-[13px] text-ink-2 tnum">{fmtDay(a.when)}</span>
                      <span className={`block text-[12px] ${overdue ? "text-bad font-semibold" : "text-ink-3"}`}>{relative(a.when)}</span>
                    </span>
                  ) : null}
                  <Icon name="chevron-right" size={18} className="text-ink-4 mt-2.5 shrink-0 group-hover:text-ink transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </Section>

      {/* --------------------------------------------------------- the money */}
      <Section title="Money" action={{ href: "/costs", label: "Full breakdown" }}>
        <div className="card px-5 py-5">
          {noBudget && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-accent-soft px-4 py-3 mb-5">
              <Icon name="info" size={18} className="text-accent-strong shrink-0" />
              <p className="text-[14px] text-ink-2 flex-1 min-w-[220px] leading-snug">
                <strong className="font-semibold text-ink">No budget set yet.</strong>{" "}
                The forecast below is the sum of today&rsquo;s estimates — set a budget to see how it compares.
              </p>
              <Link href="/manage?settings=1" className="btn btn-sm">Set the budget</Link>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-6 mb-6">
            <Stat label="Budget" value={noBudget ? "Not set" : <Money value={fin.originalBudget} compact />} large />
            <Stat
              label="Forecast final"
              value={<Money value={fin.forecast} compact />}
              tone={!noBudget ? (fin.budgetVariance > 0 ? "bad" : "good") : undefined}
              sub={!noBudget ? `${fin.budgetVariance > 0 ? "+" : ""}${inr(fin.budgetVariance, { compact: true })} against budget` : "the sum of every estimate"}
              large
            />
            <Stat label="Committed" value={<Money value={fin.committed} compact />} sub={`${inr(fin.remainingCommitment, { compact: true })} still to pay`} large />
            <Stat label="Paid" value={<Money value={fin.paid} compact />} sub={noBudget ? "so far" : `${fin.paidPct}% of budget`} large />
          </div>
          <BudgetBar paid={fin.paid} committed={fin.committed} forecast={fin.forecast} budget={fin.originalBudget} />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-ink-3">
            <LegendDot color={BAR.paid} label={`Paid ${inr(fin.paid, { compact: true })}`} />
            <LegendDot color={BAR.committed} label={`Committed ${inr(fin.remainingCommitment, { compact: true })}`} />
            <LegendDot color={!noBudget && fin.forecast > fin.originalBudget ? BAR.over : BAR.forecast} label={`Still an estimate ${inr(fin.uncommittedEstimate, { compact: true })}`} />
            {!noBudget && <span className="sm:ml-auto">Contingency left {inr(fin.contingencyRemaining, { compact: true })} of {inr(fin.contingency, { compact: true })}</span>}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------ the programme */}
      <Section title="The project at a glance">
        <div className="card grid sm:grid-cols-2 lg:grid-cols-3 overflow-hidden [&>*]:border-line [&>*]:border-b sm:[&>*:nth-child(odd)]:border-r lg:[&>*]:border-r lg:[&>*:nth-child(3n)]:border-r-0 lg:[&>*:nth-last-child(-n+3)]:border-b-0">
          <Tile href="/phases" label="Where we are" value={`Phase ${phase.phase.n}`}
            line={phase.phase.name} foot={`Weeks ${phase.phase.weeks[0]}–${phase.phase.weeks[1]} of the programme`} />
          <Tile href="/checklist" label="Checklist" value={checklistOpen.toLocaleString("en-IN")} unit="lines open"
            tone={checklistCritical ? "accent" : undefined}
            line={checklistCritical ? `${checklistCritical} of them critical` : "Every room's checklist is clear."}
            foot={leastComplete ? `Least done: ${leastComplete.name}, ${Math.round(leastComplete.pct)}%` : undefined} />
          <Tile href="/timeline" label="Schedule" value={String(lateTasks.length)} unit={lateTasks.length === 1 ? "late task" : "late tasks"}
            tone={lateTasks.length ? "bad" : undefined}
            line={lateTasks.length ? lateTasks[0].title : "Everything is on or ahead of its date."}
            foot={daysToHandover > 0 ? `${daysToHandover} days to handover, ${fmtDay(state.meta.targetHandover)}` : "Target handover has passed"} />
          <Tile href="/procurement" label="Long-lead, undecided" value={String(longLead.length)} unit="items"
            tone={longLead.length ? "warn" : undefined}
            line={longLead.length ? longLead.slice(0, 2).map((i) => i.title).join(", ") : "No long-lead item is waiting on a decision."}
            foot={longLead.length ? "Decide these first — they set the handover date" : undefined} />
          <Tile href="/purchases" label="Ready to order" value={String(buy.toOrder)} unit="lines"
            tone={buy.overdue ? "bad" : undefined}
            line={`${inr(buy.toOrderValue, { compact: true })} approved and waiting`}
            foot={buy.overdue ? `${buy.overdue} past their order-by date` : buy.undecided ? `${buy.undecided} still to decide` : undefined} />
          <Tile href="/site" label="Open snags" value={String(snags.length)} unit={snags.length === 1 ? "snag" : "snags"}
            tone={critical.length ? "bad" : undefined}
            line={snags.length ? `${critical.length} critical` : "No open snags."}
            foot={<span className="inline-flex items-center gap-2 w-full"><Bar pct={fin.completionPct} height={4} label="Work complete" /> <span className="tnum shrink-0">{Math.round(fin.completionPct)}% done</span></span>} />
        </div>
      </Section>

      {/* ------------------------------------------------------------- rows */}
      <div className="grid gap-x-8 lg:grid-cols-2">
        <Section title="Coming up in 30 days" action={{ href: "/procurement", label: "Procurement" }}>
          <div className="card divide-y divide-line">
            {coming.map((i) => (
              <Row key={i.id} icon="procurement" left={i.title} sub={`${spaceName(i.spaceId)}${i.procurement?.brand ? ` · ${i.procurement.brand}` : ""}`} right={fmtDay(i.procurement!.expectedDelivery)} rightSub="delivery" />
            ))}
            {payments.slice(0, 4).map((p) => (
              <Row key={p.id} icon="rupee" left={p.label} sub={state.vendors.find((v) => v.id === p.vendorId)?.name} right={inr(p.amount, { compact: true })} rightSub={fmtDay(p.dueOn)} bad={new Date(p.dueOn) < new Date()} />
            ))}
            {!payments.length && !coming.length && <div className="px-4 py-6 text-[14px] text-ink-3">No deliveries or payments due in the next 30 days.</div>}
          </div>
        </Section>

        <Section title={`Since ${me && person ? "you were" : "the owner was"} last here`} action={{ href: "/history", label: "History" }}>
          <div className="card divide-y divide-line">
            {recent.length ? recent.map((r, i) => {
              const who = state.people.find((p) => p.name === r.who);
              return (
                <Link key={i} href={r.href} className="flex items-start gap-3 px-4 py-3 hover:bg-paper transition-colors">
                  <Avatar name={r.who} tone={who?.avatarTone} />
                  <div className="min-w-0 flex-1 text-[14px] text-ink-2 leading-snug line-clamp-2">
                    <span className="font-semibold text-ink">{r.who}</span> · {r.what}
                  </div>
                  <div className="text-[12px] text-ink-3 shrink-0 tnum">{fmtDay(r.at)}</div>
                </Link>
              );
            }) : (
              <div className="px-4 py-6 text-[14px] text-ink-3">Nothing new since {fmtDay(state.meta.lastOwnerVisit)}.</div>
            )}
          </div>
        </Section>
      </div>

      <p className="text-[12.5px] text-ink-3 leading-relaxed max-w-2xl">
        Figures are the project&rsquo;s working numbers. A rate that has not yet been replaced by a vendor
        quotation is an indicative assumption, editable wherever it appears — never a market quotation.
      </p>
    </div>
  );
}

function greeting(role: string, name?: string): string {
  if (role === "vendor") return name ? `Today on site, ${name}` : "Today on site";
  const h = new Date().getHours();
  const t = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return name ? `${t}, ${name}` : t;
}

function Tile({
  href, label, value, unit, line, foot, tone,
}: { href: string; label: string; value: string; unit?: string; line: string; foot?: React.ReactNode; tone?: "accent" | "bad" | "warn" }) {
  return (
    <Link href={href} className="block px-5 py-5 hover:bg-paper transition-colors group">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <Icon name="arrow-right" size={15} className="text-ink-4 group-hover:text-ink transition-colors" />
      </div>
      <div className="mt-2.5 flex items-baseline gap-2 min-w-0">
        <span className="text-[28px] leading-none font-semibold tracking-[-0.02em]" style={{ color: tone ? `var(--color-${tone})` : undefined }}>{value}</span>
        {unit && <span className="text-[14px] text-ink-3">{unit}</span>}
      </div>
      <div className="text-[14px] text-ink-2 mt-2 leading-snug line-clamp-2">{line}</div>
      {foot && <div className="text-[12.5px] text-ink-3 mt-1.5 leading-snug">{foot}</div>}
    </Link>
  );
}

function Row({
  icon, left, sub, right, rightSub, bad,
}: { icon: string; left: string; sub?: string; right?: string; rightSub?: string; bad?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 text-ink-3 shrink-0"><Icon name={icon} size={17} /></span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] text-ink truncate">{left}</div>
        {sub && <div className="text-[12.5px] text-ink-3 truncate">{sub}</div>}
      </div>
      <div className="text-right shrink-0">
        {right && <div className={`text-[14px] tnum font-semibold ${bad ? "text-bad" : ""}`}>{right}</div>}
        {rightSub && <div className="text-[12px] text-ink-3">{rightSub}</div>}
      </div>
    </div>
  );
}

/**
 * Shown while the project is still the empty twin. Three things make it
 * yours; each ticks itself off as it is done, and the card goes when all are.
 */
function FirstRun() {
  const { state, dispatch, storage } = useProject();
  const toast = useToast();
  const [ask, setAsk] = useState(false);
  const steps = [
    { done: state.people.length > 0, href: "/admin?tab=People", title: "Add the people", body: "You, the designer, the contractors — then pick yourself, so changes carry your name." },
    { done: state.items.some((i) => i.vendorId || i.ladder?.quoted || i.ladder?.approved), href: "/sheet", title: "Fill in a room", body: "The Sheet is one room's scope as a spreadsheet — rates, owners, vendors. Paste from Excel if you have it." },
    { done: state.meta.originalBudget > 0, href: "/manage?settings=1", title: "Set the budget", body: "Budget, dates and address, in project settings." },
  ];
  const left = steps.filter((s) => !s.done).length;
  if (!left) return null;
  return (
    <section className="card px-5 sm:px-6 py-5 mb-10 animate-rise">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[17px]">Make this project yours</h2>
        <span className="text-[13px] text-ink-3 tnum">{3 - left} of 3 done</span>
      </div>
      <p className="text-[14px] text-ink-3 leading-relaxed mt-1 max-w-2xl">
        Every room from the drawings is already here, each with its checklist at &ldquo;not started&rdquo;.
      </p>
      <ol className="grid sm:grid-cols-3 gap-2.5 mt-4">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Link href={s.href} className={`h-full flex gap-3 rounded-xl border px-4 py-3.5 transition-colors ${s.done ? "border-line bg-paper" : "border-line-2 hover:border-ink-4 hover:bg-paper"}`}>
              <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[12px] font-semibold ${s.done ? "bg-good text-white" : "border border-line-2 text-ink-3"}`}>
                {s.done ? <Icon name="check" size={14} strokeWidth={2.2} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={`block text-[14.5px] font-semibold ${s.done ? "text-ink-3 line-through decoration-ink-4" : ""}`}>{s.title}</span>
                <span className="block text-[13px] text-ink-3 mt-0.5 leading-snug">{s.body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-[13px] text-ink-3">
        <button className="link" onClick={() => setAsk(true)}>Or load the sample villa to see it filled in</button>
        {storage.mode === "browser" && <span>Saved in this browser until a database is connected.</span>}
      </div>
      <Confirm
        open={ask} title="Load the sample villa?" confirmLabel="Load the sample" danger={false}
        onCancel={() => setAsk(false)}
        onConfirm={() => { dispatch({ type: "reset", to: "sample" }); setAsk(false); toast("Sample villa loaded"); }}
      >
        <p>It replaces this project with a fully worked example, so you can see every screen filled in.</p>
        <p>You can start again from an empty villa at any time under Settings → Danger zone.</p>
      </Confirm>
    </section>
  );
}
