"use client";

import Link from "next/link";
import { useProject } from "@/lib/store";
import { findGaps, openDecisions } from "@/lib/model/derive";
import { navFor } from "@/lib/nav";
import { PageTitle } from "@/components/ui";
import { Icon } from "@/components/Icon";

/**
 * The whole app on one page.
 *
 * On a phone this is the Menu tab: every screen the sidebar has on a desk,
 * in the same groups and order, each with a line saying what it is for — so
 * nothing is reachable on one device and missing on another.
 */
export default function MenuPage() {
  const { state, role } = useProject();
  const gaps = findGaps(state).length;
  const decisions = openDecisions(state).length;
  const counts: Record<string, number | undefined> = { "/decisions": decisions || undefined, "/more/completeness": gaps || undefined };

  return (
    <div>
      <PageTitle title="Everything" sub="Every part of the project, grouped the way the work is." />

      <div className="grid lg:grid-cols-2 gap-x-10 gap-y-8">
        {navFor(role).map((g) => (
          <section key={g.id} aria-labelledby={`g-${g.id}`}>
            <h2 id={`g-${g.id}`} className="eyebrow mb-2">{g.label}</h2>
            <div className="card divide-y divide-line overflow-hidden">
              {g.items.map((n) => (
                <Link key={n.href} href={n.href} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-paper transition-colors">
                  <span className="w-9 h-9 rounded-lg bg-paper-2 text-ink-2 flex items-center justify-center shrink-0">
                    <Icon name={n.icon} size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold">{n.label}</span>
                    <span className="block text-[13px] text-ink-3 leading-snug">{n.blurb}</span>
                  </span>
                  {counts[n.href] ? (
                    <span className={`tnum text-[12px] font-semibold rounded-full min-w-6 h-6 px-2 inline-flex items-center justify-center ${n.href === "/decisions" ? "bg-accent text-white" : "bg-paper-2 text-ink-3"}`}>{counts[n.href]}</span>
                  ) : null}
                  <Icon name="chevron-right" size={16} className="text-ink-4 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-[13px] text-ink-3 mt-10 leading-relaxed max-w-2xl">
        Dimensions are transcribed from the architect&rsquo;s plans; spaces the plans do not dimension carry no
        dimension rather than a guess. Rates that have not been replaced by a vendor quotation are indicative
        assumptions for a premium Hyderabad fit-out, and are editable wherever they appear.
      </p>
    </div>
  );
}
