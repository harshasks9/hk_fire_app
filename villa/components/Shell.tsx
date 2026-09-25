"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProject, type StorageStatus } from "@/lib/store";
import { Avatar, PageSkeleton, Sheet } from "./ui";
import { Icon, Mark } from "./Icon";
import { openDecisions, projectFinance } from "@/lib/model/derive";
import { HOME, MOBILE_TABS, activeHref, navFor } from "@/lib/nav";
import { CommandBar } from "./CommandBar";
import { QuickAdd } from "./QuickAdd";
import type { Role } from "@/lib/model/types";

/**
 * The frame around every page.
 *
 * On a desk: a sidebar with the whole app in five groups, the two things you
 * can do from anywhere (add something, find something) at the top, and who you
 * are at the bottom. On a phone: the four places people go every day as tabs,
 * the menu for the rest, and one button to add something wherever you stand.
 */

export const ROLES: { id: Role; label: string; blurb: string }[] = [
  { id: "homeowner", label: "Homeowner", blurb: "Decisions, progress, design, cost and risk." },
  { id: "designer", label: "Designer", blurb: "Design work, feedback, specs, BOQ and vendors." },
  { id: "vendor", label: "Contractor", blurb: "Only the execution information that concerns you." },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { state, role, meId, storage, unlock, hydrated } = useProject();
  const pathname = usePathname() ?? "/";
  const [cmdOpen, setCmdOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [whoOpen, setWhoOpen] = useState(false);

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
  const groups = navFor(role);
  const active = activeHref(pathname, role);
  const badge = (href: string) => (href === "/decisions" && decisions ? decisions : undefined);
  const person = state.people.find((p) => p.id === meId);
  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? "Homeowner";
  const handover = new Date(state.meta.targetHandover).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  const canAdd = !pathname.startsWith("/manage");

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-[70] focus:top-3 focus:left-3 btn btn-primary">Skip to content</a>

      {/* The first load from the server — a hairline, not a spinner. */}
      {storage.mode === "unknown" && (
        <div className="fixed top-0 inset-x-0 z-[70] h-[2px] overflow-hidden" aria-hidden>
          <div className="h-full w-1/3 bg-accent line-progress" />
        </div>
      )}

      {/* ------------------------------------------------------- desktop rail */}
      <aside className="hidden lg:flex lg:w-[252px] shrink-0 flex-col border-r border-line bg-[#ecebe6] sticky top-0 h-dvh" aria-label="Main">
        <Link href="/" className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <Mark size={30} />
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-tight tracking-[-0.01em]">Villa 14</div>
            <div className="text-[12px] text-ink-3 truncate">{state.meta.address || "Interiors & fit-out"}</div>
          </div>
        </Link>

        <div className="px-3 pb-3 flex gap-2">
          {canAdd && (
            <button onClick={() => setAddOpen(true)} className="btn btn-primary btn-sm flex-1">
              <Icon name="plus" size={16} strokeWidth={2} /> New
            </button>
          )}
          <button onClick={() => setCmdOpen(true)} className="btn btn-sm flex-1 justify-between text-ink-3" aria-label="Search (Control K)">
            <span className="inline-flex items-center gap-1.5"><Icon name="search" size={15} /> Search</span>
            <kbd>⌘K</kbd>
          </button>
        </div>

        <nav className="px-3 flex-1 overflow-y-auto thin-scroll pb-4" aria-label="Sections">
          <NavLink item={HOME} on={active === "/"} />
          {groups.map((g) => (
            <div key={g.id} className="mt-3">
              <div className="eyebrow px-2.5 mb-1 text-[10.5px]">{g.label}</div>
              {g.items.map((n) => <NavLink key={n.href} item={n} on={active === n.href} badge={badge(n.href)} />)}
            </div>
          ))}
        </nav>

        <div className="px-3 pt-2 pb-3 border-t border-line space-y-1.5">
          <WhoButton
            name={person?.name ?? roleLabel} sub={person ? (person.title ?? roleLabel) : "Viewing as"}
            tone={person?.avatarTone} onClick={() => setWhoOpen(true)}
          />
          <SyncLine storage={storage} extra={`${Math.round(fin.completionPct)}% done · handover ${handover}`} />
        </div>
      </aside>

      {/* ---------------------------------------------------------- mobile top */}
      <header className="lg:hidden sticky top-0 z-30 bg-paper/90 backdrop-blur-md border-b border-line pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between gap-3 px-4 h-14">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Mark size={26} />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-tight">Villa 14</div>
              <div className="text-[11.5px] text-ink-3 tnum truncate">{Math.round(fin.completionPct)}% done · handover {handover}</div>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => setCmdOpen(true)} className="btn btn-ghost btn-icon" aria-label="Search">
              <Icon name="search" size={20} />
            </button>
            <button onClick={() => setWhoOpen(true)} className="rounded-full p-1.5" aria-label={`Using as ${person?.name ?? roleLabel}. Switch`}>
              <Avatar name={person?.name ?? roleLabel} tone={person?.avatarTone} size={30} />
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- main */}
      <main id="main" className="flex-1 min-w-0 pb-[calc(100px+env(safe-area-inset-bottom))] lg:pb-16 outline-none" tabIndex={-1}>
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10 pt-6 lg:pt-10">
          {hydrated ? children : <PageSkeleton />}
        </div>
      </main>

      {/* ---------------------------------------------------- mobile tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper/95 backdrop-blur-md border-t border-line pb-[env(safe-area-inset-bottom)]" aria-label="Main">
        <div className="flex">
          {[HOME, ...groups.flatMap((g) => g.items)].filter((n) => MOBILE_TABS.includes(n.href)).map((n) => (
            <TabLink key={n.href} href={n.href} icon={n.icon} label={n.label} on={active === n.href} />
          ))}
          <TabLink
            href="/more" icon="menu" label="Menu"
            on={pathname === "/more" || (!!active && !MOBILE_TABS.includes(active))}
            badge={decisions || undefined}
          />
        </div>
      </nav>

      <WhoSheet open={whoOpen} onClose={() => setWhoOpen(false)} />
      {storage.locked && <LockGate unlock={unlock} />}
      {canAdd && <QuickAdd open={addOpen} onOpenChange={setAddOpen} />}
      <CommandBar open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

function NavLink({ item, on, badge }: { item: { href: string; label: string; icon: string }; on: boolean; badge?: number }) {
  return (
    <Link
      href={item.href}
      aria-current={on ? "page" : undefined}
      className={`relative flex items-center gap-2.5 rounded-lg px-2.5 h-[34px] text-[14px] transition-colors ${on ? "bg-card text-ink font-semibold shadow-[0_1px_2px_rgba(27,33,30,.07)]" : "text-ink-2 hover:bg-[#e2e0da] hover:text-ink"}`}
    >
      {on && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-accent" aria-hidden />}
      <span className={on ? "text-accent" : "text-ink-3"}><Icon name={item.icon} size={18} strokeWidth={on ? 1.8 : 1.6} /></span>
      <span className="flex-1 truncate">{item.label}</span>
      {badge ? (
        <span className="tnum text-[11px] font-semibold rounded-full min-w-5 h-5 px-1.5 inline-flex items-center justify-center bg-accent text-white">
          {badge}<span className="sr-only"> waiting</span>
        </span>
      ) : null}
    </Link>
  );
}

function TabLink({ href, icon, label, on, badge }: { href: string; icon: string; label: string; on: boolean; badge?: number }) {
  return (
    <Link
      href={href} aria-current={on ? "page" : undefined}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-[60px] relative ${on ? "text-ink" : "text-ink-3"}`}
    >
      {on && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-accent" aria-hidden />}
      <Icon name={icon} size={22} strokeWidth={on ? 1.9 : 1.6} />
      <span className={`text-[11px] ${on ? "font-semibold" : "font-medium"}`}>{label}</span>
      {badge ? (
        <span className="absolute top-2 left-[calc(50%+6px)] tnum text-[10px] rounded-full min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center bg-accent text-white font-bold">
          {badge}<span className="sr-only"> decisions waiting</span>
        </span>
      ) : null}
    </Link>
  );
}

function WhoButton({ name, sub, tone, onClick }: { name: string; sub: string; tone?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#e2e0da] transition-colors text-left" aria-haspopup="dialog">
      <Avatar name={name} tone={tone} size={30} />
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold truncate">{name}</span>
        <span className="block text-[12px] text-ink-3 truncate">{sub}</span>
      </span>
      <Icon name="chevron-down" size={16} className="text-ink-3" />
    </button>
  );
}

/** Who is using the app — a person on the project, or just a role's view. */
function WhoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, role, setRole, meId, setMe } = useProject();
  const people = state.people.filter((p) => !p.inactive);
  return (
    <Sheet open={open} onClose={onClose} title="Who is using this?" description="Changes you make carry this name in the project's history.">
      <div className="space-y-5">
        {people.length > 0 && (
          <div>
            <div className="eyebrow mb-2">People on the project</div>
            <div className="space-y-1.5">
              {people.map((p) => {
                const on = meId === p.id;
                return (
                  <button key={p.id} onClick={() => { setMe(p.id); onClose(); }}
                    className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 border transition-colors ${on ? "border-ink bg-paper" : "border-line hover:border-line-2 hover:bg-paper"}`}
                    aria-pressed={on}>
                    <Avatar name={p.name} tone={p.avatarTone} size={32} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14.5px] font-semibold truncate">{p.name}</span>
                      <span className="block text-[12.5px] text-ink-3">{p.title ?? ROLES.find((r) => r.id === p.role)?.label}</span>
                    </span>
                    {on && <Icon name="check" size={18} className="text-accent" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div>
          <div className="eyebrow mb-2">{people.length ? "Or just look as" : "Look at the project as"}</div>
          <div className="space-y-1.5">
            {ROLES.map((r) => {
              const on = !meId && role === r.id;
              return (
                <button key={r.id} onClick={() => { setMe(undefined); setRole(r.id); onClose(); }}
                  className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 border transition-colors ${on ? "border-ink bg-paper" : "border-line hover:border-line-2 hover:bg-paper"}`}
                  aria-pressed={on}>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] font-semibold">{r.label}</span>
                    <span className="block text-[12.5px] text-ink-3 leading-snug">{r.blurb}</span>
                  </span>
                  {on && <Icon name="check" size={18} className="text-accent" strokeWidth={2} />}
                </button>
              );
            })}
          </div>
        </div>
        {state.people.length === 0 && (
          <p className="text-[13.5px] text-ink-3 leading-relaxed">
            Add the people on the project under{" "}
            <Link href="/admin?tab=People" className="link" onClick={onClose}>Settings → People</Link>{" "}
            and pick yourself here, so changes carry your name.
          </p>
        )}
      </div>
    </Sheet>
  );
}

/** One quiet line about where the data is and whether it is up to date. */
function SyncLine({ storage, extra }: { storage: StorageStatus; extra?: string }) {
  let text = "Connecting…";
  let dot = "var(--color-ink-4)";
  if (storage.mode === "browser") text = "Saved in this browser";
  if (storage.mode === "server") {
    if (storage.locked) { text = "Locked — password needed"; dot = "var(--color-bad)"; }
    else if (storage.error === "offline") { text = `Offline · ${storage.pending ?? 0} waiting to save`; dot = "var(--color-bad)"; }
    else if (storage.error) { text = `Couldn't sync · ${storage.error}`; dot = "var(--color-bad)"; }
    else if (storage.pending) { text = `Saving ${storage.pending}…`; dot = "var(--color-warn)"; }
    else { text = `All changes saved · v${storage.version ?? 0}`; dot = "var(--color-good)"; }
  }
  return (
    <div className="px-1 text-[12px] text-ink-3 leading-snug">
      {extra && <div className="tnum">{extra}</div>}
      <div className="flex items-center gap-1.5 mt-0.5" role="status" aria-live="polite">
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
        <span className="truncate">{text}</span>
      </div>
    </div>
  );
}

/** The server has a shared password set and this browser has not given it yet. */
function LockGate({ unlock }: { unlock: (pw: string) => Promise<boolean> }) {
  const [pw, setPw] = useState("");
  const [bad, setBad] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const go = async () => {
    setBusy(true);
    const ok = await unlock(pw);
    setBusy(false);
    setBad(!ok);
  };
  return (
    <div className="fixed inset-0 z-50 bg-paper flex items-center justify-center px-4">
      <form className="card px-6 py-7 w-full max-w-sm animate-rise" style={{ boxShadow: "var(--shadow-pop)" }}
        onSubmit={(e) => { e.preventDefault(); void go(); }}>
        <div className="flex items-center gap-2.5 mb-5"><Mark size={32} /><div className="text-[17px] font-semibold">Villa 14</div></div>
        <h1 className="text-[20px] mb-1">This project is shared</h1>
        <p className="text-[14px] text-ink-3 leading-relaxed mb-4">Enter the project password to open it.</p>
        <label className="block">
          <span className="sr-only">Password</span>
          <input ref={ref} className="input" type="password" placeholder="Password" value={pw} aria-invalid={bad}
            onChange={(e) => { setPw(e.target.value); setBad(false); }} />
        </label>
        {bad && <div className="text-[13px] mt-2 text-bad" role="alert">That password didn&rsquo;t work. Check it with whoever shared the project.</div>}
        <button type="submit" className="btn btn-primary w-full mt-4" disabled={busy || !pw}>
          {busy ? "Opening…" : "Open the project"}
        </button>
      </form>
    </div>
  );
}
