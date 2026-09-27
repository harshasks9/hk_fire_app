"use client";

import React from "react";
import { CATALOG, byId, recommended, formatINR } from "@/lib/ht/catalog";
import { ATTR_LABEL, BUY_LABEL, GROUP_LABEL, type Attr, type Group, type Option } from "@/lib/ht/types";
import { Est, GROUP_COLOR, TierTag } from "./bits";

/** Fill the two rows every option can answer from where it's bought. */
function val(o: Option, a: Attr): string | undefined {
  if (o.attrs?.[a]) return o.attrs[a];
  if (a === "import") {
    if (o.buy === "india") return "None — bought in India";
    if (o.buy === "threshold") return `Import only if >${o.threshold}% under the Indian price`;
    if (o.buy === "do-not-import") return "Don't import";
    return `Bought abroad (${BUY_LABEL[o.buy].replace("Buy in ", "")}); duty ~31–35% above the ₹75,000 allowance`;
  }
  if (a === "warranty") {
    if (o.buy === "india") return "Local warranty through the Indian dealer";
    return "Overseas warranty — shipping back is impractical";
  }
  return undefined;
}

export function CompareView({ state, setState, onPick }: {
  state: { component: string; ids: string[] };
  setState: (s: { component: string; ids: string[] }) => void;
  onPick: (c: string) => void;
}) {
  const c = byId(state.component);
  const rec = recommended(c);
  const chosen = state.ids.map((id) => c.options.find((o) => o.id === id)).filter(Boolean) as typeof c.options;

  const toggle = (id: string) => {
    const has = state.ids.includes(id);
    const ids = has ? state.ids.filter((x) => x !== id) : [...state.ids, id].slice(-3);
    setState({ component: c.id, ids });
  };
  const pickComponent = (id: string) => {
    const comp = byId(id);
    const first = comp.options.filter((o) => o.tier !== "avoid").slice(0, 3).map((o) => o.id);
    setState({ component: id, ids: first });
  };

  const attrs = (Object.keys(ATTR_LABEL) as Attr[]).filter((a) => chosen.some((o) => o.attrs?.[a]) || a === "warranty" || a === "import");
  const groups = Array.from(new Set(CATALOG.map((x) => x.group))) as Group[];
  const cols = `minmax(104px, 0.7fr) repeat(${Math.max(chosen.length, 1)}, minmax(210px, 1fr))`;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="eyebrow mb-3">1 · Pick a component</div>
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={g} className="flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] t3 w-[92px] shrink-0" style={{ color: GROUP_COLOR[g] }}>{GROUP_LABEL[g]}</span>
              {CATALOG.filter((x) => x.group === g).map((x) => (
                <button key={x.id} className="toggle" aria-pressed={x.id === c.id} onClick={() => pickComponent(x.id)}>{x.name}</button>
              ))}
            </div>
          ))}
        </div>
        <div className="eyebrow mt-6 mb-3">2 · Choose two or three options</div>
        <div className="flex flex-wrap gap-2">
          {c.options.map((o) => (
            <button key={o.id} className="toggle !h-auto !py-2 text-left" aria-pressed={state.ids.includes(o.id)} onClick={() => toggle(o.id)}>
              <span className="dot" />
              <span className="flex flex-col">
                <span className="text-[13px]" style={{ color: state.ids.includes(o.id) ? "var(--text)" : undefined }}>{o.name}</span>
                <span className="text-[11px] mono t3">{o.tier} · {formatINR(o.price)}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {chosen.length === 0 ? (
        <p className="t3">Choose at least one option above.</p>
      ) : (
        <div className="card overflow-hidden">
          <div className="scroll-x">
            <div className="min-w-fit">
              <div className="grid" style={{ gridTemplateColumns: cols }}>
                <div className="p-4 border-b hair" />
                {chosen.map((o) => (
                  <div key={o.id} className="p-4 border-b border-l hair">
                    <TierTag tier={o.tier} />
                    <div className="text-[16px] font-semibold mt-2 leading-snug">{o.name}</div>
                  </div>
                ))}

                <Row label="Price" cols={chosen.map((o) => {
                  const d = o.price - rec.price;
                  return (
                    <div key={o.id}>
                      <div className="text-[18px] font-semibold num">{formatINR(o.price)}<Est on={o.est} /></div>
                      <div className="text-[12.5px] mono mt-0.5" style={{ color: d > 0 ? "var(--qualified)" : d < 0 ? "var(--agree)" : "var(--text-3)" }}>
                        {o.tier === "recommended" ? "recommended" : d === 0 ? "same as recommended" : `${formatINR(d, { sign: true })} vs recommended`}
                      </div>
                      <div className="t3 text-[12px] mt-1.5">{o.priceNote}</div>
                    </div>
                  );
                })} />
                <Row label="Where to buy" cols={chosen.map((o) => <span key={o.id}>{o.buy === "threshold" ? `Import only if >${o.threshold}% cheaper` : BUY_LABEL[o.buy]}</span>)} />
                {attrs.map((a) => (
                  <Row key={a} label={ATTR_LABEL[a]} cols={chosen.map((o) => { const v = val(o, a); return <span key={o.id} className={v ? "" : "t3"}>{v ?? "Not a differentiator here"}</span>; })} />
                ))}
                <Row label="Key specs" cols={chosen.map((o) => (
                  <dl key={o.id} className="space-y-1">
                    {o.specs.map(([k, v]) => <div key={k}><dt className="t3 text-[11.5px]">{k}</dt><dd className="text-[13px]">{v}</dd></div>)}
                  </dl>
                ))} />
                <Row label="What you'd hear or see" strong cols={chosen.map((o) => <p key={o.id} className="leading-relaxed">{o.perf}</p>)} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card-flat p-5 flex flex-wrap items-center justify-between gap-3">
        <p className="t2 text-[14px] max-w-2xl">
          No scores: each row says what the difference actually is. Read the last row first. It says what changes from your seat.
        </p>
        <button className="btn" onClick={() => onPick(c.id)}>Open {c.name} details</button>
      </div>
    </div>
  );
}

function Row({ label, cols, strong }: { label: string; cols: React.ReactNode[]; strong?: boolean }) {
  return (
    <>
      <div className={`p-4 border-b hair text-[12.5px] ${strong ? "brass font-semibold" : "t3"}`}>{label}</div>
      {cols.map((c, i) => <div key={i} className={`p-4 border-b border-l hair text-[13.5px] ${strong ? "bg-[rgba(214,176,106,0.05)]" : ""}`}>{c}</div>)}
    </>
  );
}
