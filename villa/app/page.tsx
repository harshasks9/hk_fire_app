"use client";

import Link from "next/link";
import { useProject } from "@/lib/store";
import {
  projectFinance, openDecisions, decisionUrgency, findGaps, longLeadItems,
  upcomingPayments, openSnags, isLate, daysBetween, forecastOf,
} from "@/lib/model/derive";
import { inr } from "@/lib/model/costing";
import {
  PageTitle, Eyebrow, Stat, Money, Chip, BudgetBar, Bar, Avatar, fmtDay, relative, Empty,
} from "@/components/ui";

/**
 * Home.
 *
 * One question first — what needs me today — and everything else below the
 * fold. The test this screen has to pass: ignore the project for a week, come
 * back, and understand what changed in under a minute.
 */
export default function Home() {
  const { state, role } = useProject();
  const fin = projectFinance(state);
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
    ...state.notes.map((n) => ({ at: n.at, who: n.author, what: n.title, href: "/notes" })),
  ]
    .filter((x) => new Date(x.at) >= sinceVisit)
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 6);

  const attention = [
    ...decisions.slice(0, 3).map((d) => ({
      kind: "Decision" as const,
      title: d.title,
      why: d.consequence ?? d.question,
      when: d.decideBy,
      href: `/decisions#${d.id}`,
      tone: "clay" as const,
      urgency: decisionUrgency(d, state.items.find((i) => i.id === d.scopeItemId)),
    })),
    ...blockers.slice(0, 2).map((g) => ({
      kind: "Blocker" as const, title: g.title, why: g.detail, when: undefined,
      href: g.spaceId ? `/villa/${g.spaceId}` : "/more/completeness", tone: "rust" as const, urgency: 85,
    })),
    ...critical.slice(0, 2).map((s) => ({
      kind: "Snag" as const, title: `${spaceName(s.spaceId)} — ${s.title}`, why: s.description ?? "",
      when: s.dueBy, href: "/site", tone: "rust" as const, urgency: 80,
    })),
    ...payments.slice(0, 2).map((p) => ({
      kind: "Payment" as const, title: p.label, why: `${inr(p.amount)} due to ${state.vendors.find((v) => v.id === p.vendorId)?.name ?? "vendor"}.`,
      when: p.dueOn, href: "/costs?view=payments", tone: "ochre" as const, urgency: 70,
    })),
  ].sort((a, b) => b.urgency - a.urgency).slice(0, 5);

  return (
    <div>
      <PageTitle
        title={greeting(role)}
        sub={
          attention.length
            ? `${attention.length} thing${attention.length === 1 ? "" : "s"} need you. Everything else is running.`
            : "Nothing needs you right now. The project is running."
        }
        right={
          <Link href="/villa" className="btn btn-primary">Open the villa</Link>
        }
      />

      {/* ------------------------------------------------ what needs me today */}
      <section className="mb-9">
        <Eyebrow className="mb-2.5">What needs me today</Eyebrow>
        {attention.length === 0 ? (
          <Empty title="Nothing is waiting on you." hint="The designer has no open approval requests and nothing is overdue." />
        ) : (
          <div className="space-y-2">
            {attention.map((a, i) => (
              <Link key={i} href={a.href} className="card block px-4 py-3.5 hover:border-ink-4 transition-colors animate-rise" style={{ animationDelay: `${i * 35}ms` }}>
                <div className="flex items-start gap-3">
                  <Chip tone={a.tone}>{a.kind}</Chip>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] leading-snug">{a.title}</div>
                    <div className="text-[12.5px] text-ink-3 mt-1 leading-relaxed line-clamp-2">{a.why}</div>
                  </div>
                  {a.when && (
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-ink-3">{fmtDay(a.when)}</div>
                      <div className="text-[10.5px]" style={{ color: new Date(a.when) < new Date() ? "#8d3a2c" : "#857b70" }}>
                        {relative(a.when)}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* --------------------------------------------------------- the money */}
      <section className="mb-9">
        <div className="flex items-end justify-between gap-3 mb-2.5">
          <Eyebrow>Where the money is</Eyebrow>
          <Link href="/costs" className="text-[12px] text-clay hover:underline">Full breakdown →</Link>
        </div>
        <div className="card px-5 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-5">
            <Stat label="Original budget" value={<Money value={fin.originalBudget} compact />} large />
            <Stat
              label="Forecast final"
              value={<Money value={fin.forecast} compact />}
              tone={fin.budgetVariance > 0 ? "rust" : "sage"}
              sub={`${fin.budgetVariance > 0 ? "+" : ""}${inr(fin.budgetVariance, { compact: true })} vs budget`}
              large
            />
            <Stat label="Committed" value={<Money value={fin.committed} compact />} sub={`${inr(fin.remainingCommitment, { compact: true })} still to pay`} large />
            <Stat label="Paid" value={<Money value={fin.paid} compact />} sub={`${fin.paidPct}% of budget`} large />
          </div>
          <BudgetBar paid={fin.paid} committed={fin.committed} forecast={fin.forecast} budget={fin.originalBudget} />
          <div className="mt-3 flex flex-wrap gap-4 text-[11.5px] text-ink-3">
            <LegendDot color="#41603f" label={`Paid ${inr(fin.paid, { compact: true })}`} />
            <LegendDot color="#7d9a7a" label={`Committed ${inr(fin.remainingCommitment, { compact: true })}`} />
            <LegendDot color={fin.forecast > fin.originalBudget ? "#d3a08f" : "#c8c0b2"} label={`Uncommitted ${inr(fin.uncommittedEstimate, { compact: true })}`} />
            <LegendDot color="#241f1a" label={`Budget line ${inr(fin.originalBudget, { compact: true })}`} />
            <span className="ml-auto">Contingency left {inr(fin.contingencyRemaining, { compact: true })} of {inr(fin.contingency, { compact: true })}</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ the programme */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-9">
        <div className="card px-5 py-5">
          <Eyebrow>Progress</Eyebrow>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="tnum text-[30px] leading-none" style={{ fontFamily: "var(--font-display)" }}>
              {Math.round(fin.completionPct)}%
            </span>
            <span className="text-[12px] text-ink-3">complete</span>
          </div>
          <div className="mt-3"><Bar pct={fin.completionPct} /></div>
          <div className="mt-3 text-[12px] text-ink-3">
            {daysToHandover > 0
              ? <>{daysToHandover} days to target handover, {fmtDay(state.meta.targetHandover)}.</>
              : <>Target handover has passed.</>}
          </div>
        </div>

        <Link href="/timeline" className="card px-5 py-5 hover:border-ink-4 transition-colors">
          <Eyebrow>Schedule</Eyebrow>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="tnum text-[30px] leading-none" style={{ fontFamily: "var(--font-display)", color: lateTasks.length ? "#8d3a2c" : undefined }}>
              {lateTasks.length}
            </span>
            <span className="text-[12px] text-ink-3">late task{lateTasks.length === 1 ? "" : "s"}</span>
          </div>
          <div className="mt-3 space-y-1">
            {lateTasks.slice(0, 3).map((t) => (
              <div key={t.id} className="text-[12px] text-ink-2 truncate">· {t.title}</div>
            ))}
            {!lateTasks.length && <div className="text-[12px] text-ink-3">Everything is on or ahead of its date.</div>}
          </div>
        </Link>

        <Link href="/procurement" className="card px-5 py-5 hover:border-ink-4 transition-colors">
          <Eyebrow>Critical procurement</Eyebrow>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="tnum text-[30px] leading-none" style={{ fontFamily: "var(--font-display)", color: longLead.length ? "#a8763f" : undefined }}>
              {longLead.length}
            </span>
            <span className="text-[12px] text-ink-3">long-lead, undecided</span>
          </div>
          <div className="mt-3 space-y-1">
            {longLead.slice(0, 3).map((i) => (
              <div key={i.id} className="text-[12px] text-ink-2 truncate">
                · {i.title} <span className="text-ink-4">{i.procurement?.leadTimeWeeks}w</span>
              </div>
            ))}
            {!longLead.length && <div className="text-[12px] text-ink-3">No long-lead item is waiting on a decision.</div>}
          </div>
        </Link>
      </section>

      {/* ------------------------------------------------------------- rows */}
      <div className="grid gap-4 lg:grid-cols-2 mb-9">
        <div className="card px-5 py-5">
          <div className="flex items-center justify-between mb-3">
            <Eyebrow>Deliveries & payments this month</Eyebrow>
            <Link href="/procurement" className="text-[11.5px] text-clay hover:underline">All →</Link>
          </div>
          <div className="space-y-2.5">
            {state.items
              .filter((i) => i.procurement?.expectedDelivery && daysBetween(new Date(), i.procurement.expectedDelivery) <= 30 && daysBetween(new Date(), i.procurement.expectedDelivery) >= -7)
              .slice(0, 3)
              .map((i) => (
                <Row key={i.id} left={i.title} sub={`${spaceName(i.spaceId)} · ${i.procurement?.brand ?? ""}`} right={fmtDay(i.procurement!.expectedDelivery)} tone="sage" />
              ))}
            {payments.slice(0, 4).map((p) => (
              <Row key={p.id} left={p.label} sub={state.vendors.find((v) => v.id === p.vendorId)?.name} right={inr(p.amount, { compact: true })} rightSub={fmtDay(p.dueOn)} tone={new Date(p.dueOn) < new Date() ? "rust" : undefined} />
            ))}
            {!payments.length && <div className="text-[12.5px] text-ink-3">Nothing due in the next 30 days.</div>}
          </div>
        </div>

        <div className="card px-5 py-5">
          <div className="flex items-center justify-between mb-3">
            <Eyebrow>Open snags</Eyebrow>
            <Link href="/site" className="text-[11.5px] text-clay hover:underline">Snag list →</Link>
          </div>
          {snags.length ? (
            <div className="space-y-2.5">
              {snags.slice(0, 5).map((s) => (
                <Row
                  key={s.id}
                  left={s.title}
                  sub={`${spaceName(s.spaceId)} · ${s.status}`}
                  right={s.severity}
                  tone={s.severity === "critical" || s.severity === "high" ? "rust" : "ochre"}
                />
              ))}
            </div>
          ) : (
            <div className="text-[12.5px] text-ink-3">No open snags.</div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------ since your last visit */}
      <section>
        <div className="flex items-end justify-between gap-3 mb-2.5">
          <Eyebrow>Since you were last here — {fmtDay(state.meta.lastOwnerVisit)}</Eyebrow>
          <Link href="/design" className="text-[12px] text-clay hover:underline">Designer activity →</Link>
        </div>
        <div className="card divide-y divide-line">
          {recent.length ? recent.map((r, i) => {
            const person = state.people.find((p) => p.name === r.who);
            return (
              <Link key={i} href={r.href} className="flex items-start gap-3 px-4 py-3 hover:bg-paper-2/60 transition-colors">
                <Avatar name={r.who} tone={person?.avatarTone} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] text-ink-2 leading-relaxed line-clamp-2">
                    <span className="font-medium text-ink">{r.who}</span> · {r.what}
                  </div>
                </div>
                <div className="text-[11px] text-ink-4 shrink-0">{fmtDay(r.at)}</div>
              </Link>
            );
          }) : (
            <div className="px-4 py-6 text-[12.5px] text-ink-3">Nothing new since your last visit.</div>
          )}
        </div>
      </section>

      <p className="mt-8 text-[11px] text-ink-4 leading-relaxed max-w-2xl">
        Figures shown are the project&rsquo;s working numbers. Rates that have not yet been
        replaced by a vendor quotation are indicative assumptions and are editable
        everywhere they appear — they are never market quotations.
      </p>
    </div>
  );
}

function greeting(role: string): string {
  const h = new Date().getHours();
  const t = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  return role === "designer" ? `${t}, Ananya` : role === "vendor" ? "Today on site" : `${t}, Harsha`;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="rounded-full" style={{ width: 7, height: 7, background: color }} />
      {label}
    </span>
  );
}

function Row({
  left, sub, right, rightSub, tone,
}: { left: string; sub?: string; right?: string; rightSub?: string; tone?: "sage" | "rust" | "ochre" }) {
  const color = tone === "rust" ? "#8d3a2c" : tone === "ochre" ? "#8a6a20" : tone === "sage" ? "#41603f" : undefined;
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-[13px] text-ink truncate">{left}</div>
        {sub && <div className="text-[11px] text-ink-3 truncate">{sub}</div>}
      </div>
      <div className="text-right shrink-0">
        {right && <div className="text-[12.5px] tnum font-medium" style={{ color }}>{right}</div>}
        {rightSub && <div className="text-[10.5px] text-ink-3">{rightSub}</div>}
      </div>
    </div>
  );
}
