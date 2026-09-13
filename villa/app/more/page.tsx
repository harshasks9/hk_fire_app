"use client";

import Link from "next/link";
import { useProject } from "@/lib/store";
import { findGaps, openSnags, projectFinance } from "@/lib/model/derive";
import { PageTitle, Eyebrow, Chip } from "@/components/ui";

const LINKS = [
  { href: "/manage", title: "Manage the project",
    blurb: "Create, edit and delete anything in the villa — floor by floor, room by room, across all sixteen kinds of record." },
  { href: "/vendors", title: "Vendors & quotations", blurb: "Suppliers, and side-by-side quote comparison that flags when quotes are not like-for-like." },
  { href: "/notes", title: "Project notes", blurb: "Meetings, site visits, calls and measurements — the project's memory, tagged to everything." },
  { href: "/documents", title: "Documents", blurb: "Drawings, quotes, POs, invoices, warranties and manuals." },
  { href: "/costs", title: "BOQ", blurb: "The bill of quantities, built automatically from approved scope." },
  { href: "/admin", title: "Admin",
    blurb: "Record counts, the category list and its rate card, backup and restore, and starting the project from scratch." },
  { href: "/more/completeness", title: "Completeness report", blurb: "Not what has been entered — what has not yet been thought about." },
  { href: "/costs", title: "Scenario planner", blurb: "Practical, Premium and No-compromise, and the specific trades between them." },
];

export default function MorePage() {
  const { state, dispatch, role, setRole } = useProject();
  const gaps = findGaps(state);
  const fin = projectFinance(state);

  return (
    <div>
      <PageTitle title="More" sub="Everything that does not need to live in the main navigation." />

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {LINKS.map((l) => (
          <Link key={l.title} href={l.href} className="card px-4 py-4 hover:border-ink-4 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[15px]" style={{ fontFamily: "var(--font-display)" }}>{l.title}</span>
              {l.href === "/more/completeness" && gaps.length > 0 && <Chip tone="clay">{gaps.length}</Chip>}
            </div>
            <p className="text-[12.5px] text-ink-3 mt-1.5 leading-relaxed">{l.blurb}</p>
          </Link>
        ))}
      </div>

      <div className="card px-5 py-5 mb-5">
        <Eyebrow className="mb-3">Who is looking</Eyebrow>
        <p className="text-[12.5px] text-ink-3 mb-3 leading-relaxed max-w-2xl">
          The same project, three different jobs. The homeowner sees decisions, progress, cost and risk.
          The designer sees design work, feedback, specification and vendor coordination. A contractor
          sees only the execution information that concerns them.
        </p>
        <div className="flex flex-wrap gap-2">
          {(["homeowner", "designer", "vendor"] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)} className="btn"
              style={{ background: role === r ? "var(--color-ink)" : undefined, color: role === r ? "var(--color-paper)" : undefined, borderColor: role === r ? "var(--color-ink)" : undefined }}>
              {r === "vendor" ? "Contractor" : r[0].toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card px-5 py-5">
        <Eyebrow className="mb-2">This project</Eyebrow>
        <div className="text-[13px] text-ink-2 space-y-1.5 leading-relaxed">
          <div>{state.spaces.length} spaces · {state.items.length} scope items · {state.vendors.length} vendors</div>
          <div>Budget {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(fin.originalBudget)} · forecast {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(fin.forecast)}</div>
          <div>Plot {state.meta.plotWidthFt}&prime;0&quot; × {state.meta.plotDepthFt}&prime;3&quot; · built footprint 45&prime;10&quot; × 45&prime;2&quot;</div>
        </div>
        <p className="text-[11.5px] text-ink-3 mt-4 leading-relaxed max-w-2xl">
          All dimensions are transcribed from the architect&rsquo;s plans. Spaces the plans do not
          dimension carry no dimension at all rather than an estimate. Rates that have not been
          replaced by a vendor quotation are indicative assumptions for a premium Hyderabad
          fit-out and are editable everywhere they appear.
        </p>
        <Link href="/admin" className="btn btn-sm mt-4">Admin, backup & reset</Link>
      </div>
    </div>
  );
}
