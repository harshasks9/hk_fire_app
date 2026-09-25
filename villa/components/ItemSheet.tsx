"use client";

import React, { useState } from "react";
import { useProject, newId, useRevisions } from "@/lib/store";
import type { ScopeItem, Stage, Unit } from "@/lib/model/types";
import { STAGES, STAGE_LABEL, UNIT_LABEL, CATEGORY_LABEL } from "@/lib/model/types";
import { computeCost, inr, round } from "@/lib/model/costing";
import { measureSpace } from "@/lib/model/measure";
import { Dims } from "./Measure";
import { forecastOf } from "@/lib/model/derive";
import { Sheet, Field, Eyebrow, NumberInput, StageChip, Chip, Money, Assumed, Tabs, Avatar, Empty, fmtDate } from "./ui";
import { Comments } from "./Comments";
import { EntityLink, RowActions } from "./Entity";
import { catLabel, catDef } from "@/lib/model/categories";

const TABS = ["Cost", "Spec", "Procurement", "Discussion", "Changes"] as const;
type Tab = (typeof TABS)[number];

/**
 * One scope item, fully open.
 *
 * The cost tab is the product's costing engine made visible: quantity, rate,
 * wastage, labour, installation, freight and tax are all separate, all editable,
 * and the total is derived, never typed. Nothing here pretends to be a quote —
 * the default rate carries its assumption in a tooltip until a vendor number
 * replaces it.
 */
export function ItemSheet({
  item, open, onClose,
}: { item: ScopeItem | null; open: boolean; onClose: () => void }) {
  const { state, dispatch, me, role } = useProject();
  const [tab, setTab] = useState<Tab>("Cost");
  const [naReason, setNaReason] = useState("");

  if (!item) return null;
  const space = state.spaces.find((s) => s.id === item.spaceId);
  const breakdown = computeCost(item.cost);
  const rateDef = catDef(state, item.category);
  const decision = state.decisions.find((d) => d.scopeItemId === item.id);
  const ideas = state.ideas.filter((i) => i.scopeItemId === item.id);
  const options = state.options.filter((o) => o.scopeItemId === item.id);

  const setCost = (patch: Parameters<typeof dispatch>[0] extends never ? never : Partial<ScopeItem["cost"]>) =>
    dispatch({ type: "item/cost", id: item.id, cost: patch });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      wide
      title={
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="truncate">{item.title}</span>
          <StageChip stage={item.stage} />
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-4 text-[13px] text-ink-3">
        <Chip tone="ghost">{catLabel(state, item.category)}</Chip>
        {space ? <EntityLink on="spaces" id={space.id} label={space.name} /> : <span>House-wide</span>}
        {space?.dims && <Dims sp={space} source={false} className="text-[12.5px]" />}
        {item.vendorId && <>·<EntityLink on="vendors" id={item.vendorId} /></>}
        {decision && <>·<EntityLink on="decisions" id={decision.id} label="the decision" /></>}
        <span className="ml-auto"><RowActions on="items" id={item.id} always /></span>
        {item.tags?.includes("critical") && <Chip tone="accent">Critical</Chip>}
        {item.tags?.includes("beyond-brief") && (
          <Chip tone="info" title="Added to the model because the villa needs it, though it was not in the original brief.">
            Added by the app
          </Chip>
        )}
      </div>

      {item.stage === "not-applicable" ? (
        <div className="card-quiet px-4 py-4 mb-5">
          <Eyebrow>Marked not applicable</Eyebrow>
          <p className="text-[14px] text-ink-2 mt-1.5 leading-relaxed">{item.naReason}</p>
          <button
            className="btn btn-sm mt-3"
            onClick={() => dispatch({ type: "item/stage", id: item.id, stage: "not-started" })}
          >
            Bring it back into scope
          </button>
          <p className="text-[12.5px] text-ink-4 mt-2.5 leading-relaxed">
            Nothing is ever deleted. Keeping it here is the proof that it was considered.
          </p>
        </div>
      ) : (
        <>
          {/* -------------------------------------------------- stage control */}
          <div className="mb-5">
            <Eyebrow className="mb-2">Where this has got to</Eyebrow>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.filter((s) => s !== "not-applicable" && s !== "snagged").map((s) => (
                <button
                  key={s}
                  onClick={() => dispatch({ type: "item/stage", id: item.id, stage: s as Stage })}
                  className="rounded-lg px-2.5 py-1 text-[12.5px] border transition-colors"
                  style={{
                    background: item.stage === s ? "var(--color-ink)" : "transparent",
                    color: item.stage === s ? "var(--color-paper)" : "var(--color-ink-3)",
                    borderColor: item.stage === s ? "var(--color-ink)" : "var(--color-line)",
                  }}
                >
                  {STAGE_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <Tabs tabs={TABS} active={tab} onChange={setTab} counts={{ Discussion: state.comments.filter((c) => c.targetType === "item" && c.targetId === item.id).length }} />

          <div className="mt-5">
            {tab === "Cost" && (
              <div>
                {/* ------------------------------------------- the build-up */}
                <div className="card px-4 py-4">
                  <div className="flex items-baseline justify-between gap-3 mb-3.5">
                    <Eyebrow>Cost build-up</Eyebrow>
                    <div className="text-right">
                      <div className="tnum text-[22px] leading-none">
                        {inr(breakdown.total)}
                      </div>
                      <div className="text-[12px] text-ink-3 mt-1">calculated, not typed</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Field label="Quantity">
                      <NumberInput value={item.cost.qty} onChange={(n) => setCost({ qty: n })} />
                    </Field>
                    <Field label="Unit">
                      <select
                        className="input"
                        value={item.cost.unit}
                        onChange={(e) => setCost({ unit: e.target.value as Unit })}
                      >
                        {Object.entries(UNIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </Field>
                    <Field label="Rate">
                      <NumberInput value={item.cost.rate} onChange={(n) => setCost({ rate: n })} prefix="₹" />
                    </Field>
                    <Field label="Wastage %">
                      <NumberInput value={item.cost.wastagePct ?? 0} onChange={(n) => setCost({ wastagePct: n })} suffix="%" />
                    </Field>
                    <Field label="Labour / unit">
                      <NumberInput value={item.cost.labourRate ?? 0} onChange={(n) => setCost({ labourRate: n })} prefix="₹" />
                    </Field>
                    <Field label="Labour lump sum">
                      <NumberInput value={item.cost.labourLumpSum ?? 0} onChange={(n) => setCost({ labourLumpSum: n })} prefix="₹" />
                    </Field>
                    <Field label="Installation %">
                      <NumberInput value={item.cost.installationPct ?? 0} onChange={(n) => setCost({ installationPct: n })} suffix="%" />
                    </Field>
                    <Field label="Freight">
                      <NumberInput value={item.cost.freight ?? 0} onChange={(n) => setCost({ freight: n })} prefix="₹" />
                    </Field>
                    <Field label="Tax %">
                      <NumberInput value={item.cost.taxPct ?? 0} onChange={(n) => setCost({ taxPct: n })} suffix="%" />
                    </Field>
                    <Field label="Other charges">
                      <NumberInput value={item.cost.otherCharges ?? 0} onChange={(n) => setCost({ otherCharges: n })} prefix="₹" />
                    </Field>
                  </div>

                  {space?.dims && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[12.5px] text-ink-3">Use this room&rsquo;s:</span>
                      {([
                        ["Floor area", measureSpace(space)?.areaSqft, "sqft"],
                        ["Wall area", measureSpace(space)?.wallSqft, "sqft"],
                        ["Perimeter", measureSpace(space)?.perimeterFt, "rft"],
                      ] as const).map(([label, v, unit]) =>
                        v ? (
                          <button
                            key={label}
                            className="btn btn-sm"
                            onClick={() => setCost({ qty: v, unit: unit as Unit })}
                          >
                            {label} {v} {unit === "sqft" ? "sq ft" : "rft"}
                          </button>
                        ) : null,
                      )}
                    </div>
                  )}

                  <div className="hairline mt-4 pt-3.5 space-y-1.5 text-[13.5px]">
                    <Line label={`Base — ${item.cost.qty} ${UNIT_LABEL[item.cost.unit]} × ${inr(item.cost.rate)}`} v={breakdown.base} />
                    {breakdown.wastage > 0 && <Line label={`Wastage ${item.cost.wastagePct}%`} v={breakdown.wastage} />}
                    {breakdown.labour > 0 && <Line label="Labour" v={breakdown.labour} />}
                    {breakdown.installation > 0 && <Line label={`Installation ${item.cost.installationPct}%`} v={breakdown.installation} />}
                    {breakdown.freight > 0 && <Line label="Freight" v={breakdown.freight} />}
                    {breakdown.tax > 0 && <Line label={`Tax ${item.cost.taxPct}%`} v={breakdown.tax} />}
                    {breakdown.other > 0 && <Line label="Other" v={breakdown.other} />}
                    <div className="hairline pt-2 flex items-baseline justify-between font-medium">
                      <span>Total</span>
                      <span className="tnum">{inr(breakdown.total)}</span>
                    </div>
                  </div>

                  {(item.cost.assumption || rateDef) && (
                    <p className="text-[12.5px] text-ink-3 mt-3 leading-relaxed">
                      <Assumed note="This is the app's starting assumption. Overwrite it with a real quotation.">
                        Assumption
                      </Assumed>
                      : {item.cost.assumption ?? rateDef?.assumption}
                    </p>
                  )}
                </div>

                {/* ------------------------------------------- the ladder */}
                <div className="card px-4 py-4 mt-3">
                  <Eyebrow className="mb-1">Budget → estimate → commit → actual</Eyebrow>
                  <p className="text-[12.5px] text-ink-3 mb-3.5 leading-relaxed">
                    Seven separate numbers, because &ldquo;what we thought&rdquo;, &ldquo;what they quoted&rdquo;,
                    &ldquo;what we agreed&rdquo; and &ldquo;what we paid&rdquo; are four different things.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {([
                      ["initialEstimate", "Initial estimate", "The early planning allowance."],
                      ["designerEstimate", "Designer estimate", "Refined once specified."],
                      ["quoted", "Quoted", "Lowest or recommended vendor quote."],
                      ["approved", "Approved", "Negotiated and signed off."],
                      ["committed", "Committed", "PO raised or contract awarded."],
                      ["paid", "Paid", "Cash out the door."],
                    ] as const).map(([k, label, hint]) => (
                      <Field key={k} label={label} hint={hint}>
                        <NumberInput
                          value={item.ladder[k] ?? 0}
                          onChange={(n) => dispatch({ type: "item/ladder", id: item.id, ladder: { [k]: n || undefined } })}
                          prefix="₹"
                        />
                      </Field>
                    ))}
                  </div>
                  <div className="hairline mt-4 pt-3 flex items-baseline justify-between">
                    <div>
                      <div className="eyebrow">Forecast final cost</div>
                      <div className="text-[12px] text-ink-4 mt-0.5">The hardest number available wins.</div>
                    </div>
                    <span className="tnum text-[19px]">
                      {inr(forecastOf(item))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {tab === "Spec" && (
              <div className="space-y-4">
                <Field label="Specification">
                  <textarea
                    className="input min-h-[120px] resize-y leading-relaxed"
                    value={item.spec ?? ""}
                    onChange={(e) => dispatch({ type: "item/patch", id: item.id, patch: { spec: e.target.value } })}
                    placeholder="Brand, model, finish, size, colour, the things a vendor needs to quote against."
                  />
                </Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Owner" hint="Who is answerable for this.">
                    <input
                      className="input"
                      value={item.owner ?? ""}
                      onChange={(e) => dispatch({ type: "item/patch", id: item.id, patch: { owner: e.target.value } })}
                      placeholder="Unassigned"
                    />
                  </Field>
                  <Field label="Vendor">
                    <select
                      className="input"
                      value={item.vendorId ?? ""}
                      onChange={(e) => dispatch({ type: "item/patch", id: item.id, patch: { vendorId: e.target.value || undefined } })}
                    >
                      <option value="">Not awarded</option>
                      {state.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Target date">
                    <input
                      type="date"
                      className="input"
                      value={item.targetDate ? item.targetDate.slice(0, 10) : ""}
                      onChange={(e) => dispatch({ type: "item/patch", id: item.id, patch: { targetDate: e.target.value ? new Date(e.target.value).toISOString() : undefined } })}
                    />
                  </Field>
                </div>
                <Field label="Notes">
                  <textarea
                    className="input min-h-[70px] resize-y"
                    value={item.notes ?? ""}
                    onChange={(e) => dispatch({ type: "item/patch", id: item.id, patch: { notes: e.target.value } })}
                  />
                </Field>

                <div className="card-quiet px-4 py-3.5">
                  <Eyebrow>Not needed here?</Eyebrow>
                  <p className="text-[13px] text-ink-3 mt-1.5 mb-2.5 leading-relaxed">
                    Mark it not applicable rather than deleting it. It stays visible with your reason,
                    which is how you prove later that it was considered and not forgotten.
                  </p>
                  <div className="flex gap-2">
                    <input
                      className="input"
                      placeholder="Why is this not needed?"
                      value={naReason}
                      onChange={(e) => setNaReason(e.target.value)}
                    />
                    <button
                      className="btn shrink-0"
                      onClick={() => {
                        dispatch({ type: "item/stage", id: item.id, stage: "not-applicable", naReason: naReason || "Not required in this space." });
                        setNaReason("");
                      }}
                    >
                      Mark N/A
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === "Procurement" && (
              <ProcurementPanel item={item} />
            )}

            {tab === "Discussion" && (
              <div>
                {(ideas.length > 0 || options.length > 0 || decision) && (
                  <div className="card-quiet px-4 py-3 mb-4 text-[13.5px] text-ink-2">
                    This item already carries{" "}
                    {[
                      ideas.length ? `${ideas.length} idea${ideas.length > 1 ? "s" : ""}` : "",
                      options.length ? `${options.length} option${options.length > 1 ? "s" : ""}` : "",
                      decision ? "a decision" : "",
                    ].filter(Boolean).join(", ")}
                    . They all live on the same object — nothing is re-created.
                  </div>
                )}
                <Comments targetType="item" targetId={item.id} />
              </div>
            )}

            {tab === "Changes" && <ItemChanges itemId={item.id} />}
          </div>
        </>
      )}
    </Sheet>
  );
}

function Line({ label, v }: { label: string; v: number }) {
  return (
    <div className="flex items-baseline justify-between text-ink-2">
      <span>{label}</span>
      <span className="tnum">{inr(v)}</span>
    </div>
  );
}

function ProcurementPanel({ item }: { item: ScopeItem }) {
  const { state, dispatch } = useProject();
  const p = item.procurement;
  const patch = (x: Partial<NonNullable<ScopeItem["procurement"]>>) =>
    dispatch({
      type: "item/patch", id: item.id,
      patch: { procurement: { ...(p ?? { scopeItemId: item.id, status: "to-select" }), ...x } },
    });

  if (!p) {
    return (
      <div className="card-quiet px-4 py-5 text-center">
        <p className="text-[14px] text-ink-2">This is a works item rather than something you buy.</p>
        <button className="btn btn-sm mt-3" onClick={() => patch({})}>Track it as a purchase anyway</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Product"><input className="input" value={p.product ?? ""} onChange={(e) => patch({ product: e.target.value })} /></Field>
        <Field label="Brand"><input className="input" value={p.brand ?? ""} onChange={(e) => patch({ brand: e.target.value })} /></Field>
        <Field label="SKU / model"><input className="input" value={p.sku ?? ""} onChange={(e) => patch({ sku: e.target.value })} /></Field>
        <Field label="Vendor">
          <select className="input" value={p.vendorId ?? ""} onChange={(e) => patch({ vendorId: e.target.value || undefined })}>
            <option value="">—</option>
            {state.vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <Field label="Order amount"><NumberInput value={p.orderAmount ?? 0} onChange={(n) => patch({ orderAmount: n })} prefix="₹" /></Field>
        <Field label="Advance paid"><NumberInput value={p.advance ?? 0} onChange={(n) => patch({ advance: n, balance: (p.orderAmount ?? 0) - n })} prefix="₹" /></Field>
        <Field label="Lead time" hint="8 weeks or more and it shows up as long-lead everywhere.">
          <NumberInput value={p.leadTimeWeeks ?? 0} onChange={(n) => patch({ leadTimeWeeks: n })} suffix="weeks" />
        </Field>
        <Field label="Expected delivery">
          <input type="date" className="input" value={p.expectedDelivery?.slice(0, 10) ?? ""} onChange={(e) => patch({ expectedDelivery: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
        </Field>
        <Field label="Actual delivery">
          <input type="date" className="input" value={p.actualDelivery?.slice(0, 10) ?? ""} onChange={(e) => patch({ actualDelivery: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
        </Field>
        <Field label="Installation date">
          <input type="date" className="input" value={p.installationDate?.slice(0, 10) ?? ""} onChange={(e) => patch({ installationDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
        </Field>
        <Field label="Storage location" hint="Where it sits between delivery and installation."><input className="input" value={p.storageLocation ?? ""} onChange={(e) => patch({ storageLocation: e.target.value })} /></Field>
        <Field label="Warranty"><NumberInput value={p.warrantyMonths ?? 0} onChange={(n) => patch({ warrantyMonths: n })} suffix="months" /></Field>
        <Field label="Invoice reference"><input className="input" value={p.invoiceRef ?? ""} onChange={(e) => patch({ invoiceRef: e.target.value })} /></Field>
        <Field label="Responsible"><input className="input" value={p.owner ?? ""} onChange={(e) => patch({ owner: e.target.value })} /></Field>
      </div>
    </div>
  );
}

/** Everything that has ever happened to this one item, newest first. */
function ItemChanges({ itemId }: { itemId: string }) {
  const { state } = useProject();
  const { revisions, loading } = useRevisions({ itemId });
  const list = revisions.slice().reverse();
  if (!list.length) {
    return <Empty title={loading ? "Loading…" : "No changes recorded on this item yet."} hint="Every edit from here on is listed with who made it and when." />;
  }
  return (
    <div className="card divide-y divide-line">
      {list.map((r) => {
        const person = state.people.find((p) => p.id === r.byId || p.name === r.by);
        return (
          <div key={r.v} className="px-4 py-3 flex items-start gap-3">
            <Avatar name={r.by || "?"} tone={person?.avatarTone} size={24} />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] leading-relaxed">{r.summary}</div>
              <div className="text-[12.5px] text-ink-3 mt-0.5">
                <span className="font-medium text-ink-2">{r.by || "Unattributed"}</span> · {fmtDate(r.at)}{" "}
                {new Date(r.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · <span className="tnum">v{r.v}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
