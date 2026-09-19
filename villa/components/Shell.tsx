"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject, type StorageStatus } from "@/lib/store";
import { Sheet } from "./ui";
import { openDecisions, projectFinance } from "@/lib/model/derive";
import { CommandBar } from "./CommandBar";
import { QuickAdd } from "./QuickAdd";
import type { Role } from "@/lib/model/types";

/**
 * Navigation.
 *
 * Nine destinations, never fifteen. Vendors, Notes, Documents, BOQ, the
 * completeness report and settings all live under More or inside the screen
 * they belong to — the command bar reaches anything else in two keystrokes.
 */
const PRIMARY = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/villa", label: "Villa", icon: "villa" },
  { href: "/design", label: "Design", icon: "design" },
  { href: "/decisions", label: "Decisions", icon: "decisions" },
  { href: "/timeline", label: "Timeline", icon: "timeline" },
  { href: "/costs", label: "Costs", icon: "costs" },
  { href: "/procurement", label: "Procurement", icon: "procurement" },
  { href: "/site", label: "Site", icon: "site" },
  { href: "/more", label: "More", icon: "more" },
] as const;

/** Mobile keeps five; the rest move under More. */
const MOBILE = ["/", "/villa", "/decisions", "/site", "/more"];

function Icon({ name, active }: { name: string; active?: boolean }) {
  const s = { fill: "none", stroke: "currentColor", strokeWidth: active ? 1.85 : 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const p: Record<string, React.ReactNode> = {
    home: <><path d="M3 9.5 10 4l7 5.5" {...s} /><path d="M5 9v7h10V9" {...s} /></>,
    villa: <><path d="M3 16h14M4 16V8l6-4 6 4v8" {...s} /><path d="M8 16v-4h4v4" {...s} /></>,
    design: <><circle cx="10" cy="10" r="6.5" {...s} /><path d="M10 3.5v13M3.5 10h13" {...s} /></>,
    decisions: <><path d="M4 10.5 8.5 15 16 5.5" {...s} /></>,
    timeline: <><path d="M3 6h10M3 10h14M3 14h7" {...s} /><circle cx="15" cy="6" r="1.6" {...s} /></>,
    costs: <><path d="M4 15V8M8.5 15V5M13 15v-4M17 15V9" {...s} /></>,
    procurement: <><path d="M3.5 6.5 10 3l6.5 3.5v7L10 17l-6.5-3.5z" {...s} /><path d="M3.5 6.5 10 10l6.5-3.5M10 10v7" {...s} /></>,
    site: <><path d="M10 17s5.5-5 5.5-9A5.5 5.5 0 0 0 4.5 8c0 4 5.5 9 5.5 9z" {...s} /><circle cx="10" cy="8" r="1.9" {...s} /></>,
    more: <><circle cx="4.5" cy="10" r="1.3" fill="currentColor" /><circle cx="10" cy="10" r="1.3" fill="currentColor" /><circle cx="15.5" cy="10" r="1.3" fill="currentColor" /></>,
  };
  return <svg viewBox="0 0 20 20" width="19" height="19" aria-hidden>{p[name]}</svg>;
}

const ROLES: { id: Role; label: string; blurb: string }[] = [
  { id: "homeowner", label: "Homeowner", blurb: "Decisions, progress, design, cost and risk." },
  { id: "designer", label: "Designer", blurb: "Design work, feedback, specs, BOQ and vendors." },
  { id: "vendor", label: "Contractor", blurb: "Only the execution information that concerns you." },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { state, role, setRole, me, meId, setMe, storage, unlock } = useProject();
  const pathname = usePathname();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const decisions = openDecisions(state).length;
  const fin = projectFinance(state);

  const nav = role === "vendor"
    ? PRIMARY.filter((n) => ["/", "/villa", "/timeline", "/site", "/more"].includes(n.href))
    : PRIMARY;

  const badge = (href: string) => (href === "/decisions" && decisions ? decisions : undefined);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      {/* ------------------------------------------------------- desktop rail */}
      <aside className="hidden lg:flex lg:w-[228px] xl:w-[248px] shrink-0 flex-col border-r border-line bg-paper-2/60 sticky top-0 h-dvh">
        <Link href="/" className="px-5 pt-6 pb-5 block">
          <div className="text-[17px] leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            The Villa
          </div>
          <div className="text-[11px] text-ink-3 mt-0.5">{state.meta.address}</div>
        </Link>

        <nav className="px-2.5 flex-1 overflow-y-auto thin-scroll">
          {nav.map((n) => {
            const on = isActive(n.href);
            const b = badge(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] mb-0.5 text-[13.5px] transition-colors"
                style={{
                  background: on ? "var(--color-card)" : "transparent",
                  color: on ? "var(--color-ink)" : "var(--color-ink-2)",
                  fontWeight: on ? 550 : 450,
                  boxShadow: on ? "0 1px 2px rgba(36,31,26,.06)" : undefined,
                }}
              >
                <span style={{ color: on ? "var(--color-clay)" : "var(--color-ink-4)" }}>
                  <Icon name={n.icon} active={on} />
                </span>
                <span className="flex-1">{n.label}</span>
                {b ? (
                  <span className="tnum text-[10.5px] rounded-full px-[6px] py-[1px] bg-clay text-white font-semibold">{b}</span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="p-2.5 space-y-2">
          <button onClick={() => setCmdOpen(true)} className="btn w-full justify-between text-ink-3">
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m13.2 13.2 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              Search
            </span>
            <kbd className="text-[10px] text-ink-4 font-sans">⌘K</kbd>
          </button>

          <div className="relative">
            <button onClick={() => setRoleOpen((v) => !v)} className="btn w-full justify-between">
              <span className="text-[12.5px] truncate">{meId ? me : ROLES.find((r) => r.id === role)?.label}</span>
              <span className="text-ink-4 text-[10px] shrink-0">switch</span>
            </button>
            {roleOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setRoleOpen(false)} />
                <div className="absolute bottom-full mb-2 left-0 right-0 z-30 card p-1.5 shadow-xl animate-rise max-h-[60vh] overflow-y-auto">
                  {state.people.filter((p) => !p.inactive).length > 0 && (
                    <>
                      <div className="eyebrow px-2.5 pt-1.5 pb-1">I am</div>
                      {state.people.filter((p) => !p.inactive).map((p) => (
                        <button key={p.id} onClick={() => { setMe(p.id); setRoleOpen(false); }}
                          className="w-full text-left rounded-lg px-2.5 py-1.5 hover:bg-paper-2 transition-colors flex items-center gap-2">
                          <span className="text-[13px] flex-1 truncate">{p.name}</span>
                          <span className="text-[10.5px] text-ink-3">{p.title ?? ROLES.find((r) => r.id === p.role)?.label}</span>
                          {meId === p.id && <span className="text-clay text-[11px]">me</span>}
                        </button>
                      ))}
                      <div className="hairline my-1.5" />
                      <div className="eyebrow px-2.5 pt-1 pb-1">Or just a view</div>
                    </>
                  )}
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setMe(undefined); setRole(r.id); setRoleOpen(false); }}
                      className="w-full text-left rounded-lg px-2.5 py-2 hover:bg-paper-2 transition-colors"
                    >
                      <div className="text-[13px] font-medium flex items-center gap-2">
                        {r.label}
                        {!meId && role === r.id && <span className="text-clay text-[11px]">current</span>}
                      </div>
                      <div className="text-[11px] text-ink-3 leading-snug mt-0.5">{r.blurb}</div>
                    </button>
                  ))}
                  {state.people.length === 0 && (
                    <div className="px-2.5 py-2 text-[11px] text-ink-3 leading-snug">
                      Add the people on the project under <Link href="/admin?tab=People" className="text-clay" onClick={() => setRoleOpen(false)}>Admin → People</Link> and pick yourself here, so changes carry your name.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="px-1 pt-1 pb-1 text-[10.5px] text-ink-4 leading-snug">
            {Math.round(fin.completionPct)}% complete · handover{" "}
            {new Date(state.meta.targetHandover).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            <SyncPill storage={storage} />
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------- mobile top */}
      <header className="lg:hidden sticky top-0 z-30 bg-paper/92 backdrop-blur border-b border-line">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="min-w-0">
            <div className="text-[15px] leading-tight truncate" style={{ fontFamily: "var(--font-display)" }}>The Villa</div>
            <div className="text-[10.5px] text-ink-3">{Math.round(fin.completionPct)}% complete</div>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setCmdOpen(true)} className="btn btn-sm" aria-label="Search">
              <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m13.2 13.2 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
            <button onClick={() => setRoleOpen(true)} className="btn btn-sm max-w-[140px]">
              <span className="truncate">{meId ? me.split(" ")[0] : ROLES.find((r) => r.id === role)?.label}</span>
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- main */}
      <main className="flex-1 min-w-0 pb-24 lg:pb-10">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-9 py-6 lg:py-9">{children}</div>
      </main>

      {/* ---------------------------------------------------- mobile tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {nav.filter((n) => MOBILE.includes(n.href)).map((n) => {
            const on = isActive(n.href);
            const b = badge(n.href);
            return (
              <Link key={n.href} href={n.href} className="flex-1 flex flex-col items-center gap-1 py-2.5 relative"
                style={{ color: on ? "var(--color-clay)" : "var(--color-ink-3)" }}>
                <Icon name={n.icon} active={on} />
                <span className="text-[10px]" style={{ fontWeight: on ? 600 : 450 }}>{n.label}</span>
                {b ? <span className="absolute top-1.5 right-[22%] tnum text-[9px] rounded-full px-[4.5px] bg-clay text-white font-bold">{b}</span> : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <Sheet open={roleOpen && isMobile()} onClose={() => setRoleOpen(false)} title="Who is using this?">
        <div className="space-y-1">
          {state.people.filter((p) => !p.inactive).map((p) => (
            <button key={p.id} onClick={() => { setMe(p.id); setRoleOpen(false); }}
              className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-paper-2 flex items-center gap-2 border border-line">
              <span className="text-[14px] flex-1">{p.name}</span>
              <span className="text-[11px] text-ink-3">{p.title ?? ROLES.find((r) => r.id === p.role)?.label}</span>
              {meId === p.id && <span className="text-clay text-[11px]">me</span>}
            </button>
          ))}
          {state.people.length > 0 && <div className="eyebrow pt-3 pb-1">Or just a view</div>}
          {ROLES.map((r) => (
            <button key={r.id} onClick={() => { setMe(undefined); setRole(r.id); setRoleOpen(false); }}
              className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-paper-2 border border-line">
              <div className="text-[14px]">{r.label}{!meId && role === r.id && <span className="text-clay text-[11px] ml-2">current</span>}</div>
              <div className="text-[11.5px] text-ink-3">{r.blurb}</div>
            </button>
          ))}
          {state.people.length === 0 && (
            <p className="text-[12px] text-ink-3 pt-2 leading-snug">Add the people on the project under Admin → People and pick yourself here, so changes carry your name.</p>
          )}
        </div>
      </Sheet>

      {storage.locked && <LockGate unlock={unlock} />}
      <QuickAdd />
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

const isMobile = () => typeof window !== "undefined" && window.innerWidth < 1024;

/** One quiet line about where the data is and whether it is up to date. */
function SyncPill({ storage }: { storage: StorageStatus }) {
  if (storage.mode === "unknown") return null;
  let text = "saved in this browser";
  let tone = "var(--color-ink-4)";
  if (storage.mode === "server") {
    if (storage.locked) { text = "server locked"; tone = "#a04a3c"; }
    else if (storage.error === "offline") { text = `offline · ${storage.pending ?? 0} unsaved`; tone = "#a04a3c"; }
    else if (storage.error) { text = `sync error · ${storage.error}`; tone = "#a04a3c"; }
    else if (storage.pending) { text = `saving ${storage.pending}…`; tone = "#8a6d3b"; }
    else text = `synced · v${storage.version ?? 0}`;
  }
  return <div style={{ color: tone }} className="mt-0.5">{text}</div>;
}

/** The server has a shared password set and this browser has not given it yet. */
function LockGate({ unlock }: { unlock: (pw: string) => Promise<boolean> }) {
  const [pw, setPw] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    const ok = await unlock(pw);
    setBusy(false);
    setBad(!ok);
  };
  return (
    <div className="fixed inset-0 z-50 bg-paper/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="card px-6 py-6 w-full max-w-sm shadow-xl animate-rise">
        <div className="text-[18px] mb-1" style={{ fontFamily: "var(--font-display)" }}>The Villa</div>
        <p className="text-[12.5px] text-ink-3 leading-relaxed mb-4">This project is shared. Enter the project password to open it.</p>
        <input className="input" type="password" autoFocus placeholder="Password" value={pw}
          onChange={(e) => { setPw(e.target.value); setBad(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") void go(); }} />
        {bad && <div className="text-[12px] mt-2" style={{ color: "#a04a3c" }}>That is not the password.</div>}
        <button className="btn btn-primary w-full justify-center mt-3" disabled={busy || !pw} onClick={() => void go()}>
          {busy ? "Opening…" : "Open the project"}
        </button>
      </div>
    </div>
  );
}
