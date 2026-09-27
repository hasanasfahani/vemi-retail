"use client";

/* THE OUTLET, IN FULL.

   Opened from a map marker, a table row or an action. Store facts, the
   execution score, the five KPIs against their targets, the issues
   found at this door, the shelf as the audit recorded it, what to do
   about it, and one button to put the outlet on a future route.

   The shelf is drawn from this outlet's own rows — the same cells the
   KPIs are computed from — so the picture and the numbers cannot
   disagree. Enlarging it turns on the detection overlay, which labels
   observations rather than guessing at a photograph. */

import { useState } from "react";
import Link from "next/link";
import Drawer from "./ui/Drawer";
import Badge from "./ui/Badge";
import StatusChip from "./ui/StatusChip";
import { componentDetail } from "@/lib/market/bandDetail";
import { scoreBand, BAND_COLOR, BAND_EDGE, BAND_LABEL } from "./ui/health";
import { Button } from "@/components/vemi/Button";
import Bar from "./ui/Bar";
import ScoreRing from "./ui/ScoreRing";
import ShelfScene from "./ShelfScene";
import {
  channelName, governorateName, contract, monthLabel, scoreWeights, skuOf,
} from "@/lib/market";
import FollowUpEvidence from "./FollowUpEvidence";
import { kpiTargetsForDrawer, posRows, recommendationsFor, type PosRow } from "@/lib/market/pos";
import { outletCase } from "@/lib/market/outletCase";
import type { MonthPair } from "@/lib/market/followUpView";
import type { IssueKpi } from "@/lib/market/issues";
import type { MarketView } from "@/lib/market/filters";

export default function PosDrawer({
  posId,
  view,
  onClose,
  rows,
  flagged,
  onFlag,
  onUnflag,
  followUp,
}: {
  posId: string | null;
  view: MarketView;
  onClose: () => void;
  /* Pre-computed rows, where the caller already has them — the
     Explorer builds 742 of these for its table and should not build
     them twice. */
  rows?: PosRow[];
  flagged?: boolean;
  onFlag?: (posId: string, reason: string) => void;
  onUnflag?: (posId: string) => void;
  /* Opened from a follow-up: the drawer then leads with what was
     raised, what happened to it, and both visits' shelves. */
  followUp?: {
    kpi: IssueKpi;
    originMonth: string;
    cycle: string;
    origin: MonthPair;
    cyclePair: MonthPair | null;
  };
}) {
  const [zoom, setZoom] = useState(false);
  const [overlays, setOverlays] = useState(true);

  const all = rows ?? (posId ? posRows(view) : []);
  const row = posId ? all.find((r) => r.pos.id === posId) ?? null : null;

  return (
    <>
      <Drawer
        open={Boolean(row)}
        onClose={onClose}
        width={620}
        title={row?.pos.name ?? ""}
        eyebrow={row ? `${row.pos.code} · ${governorateName(row.pos.governorateId)}` : undefined}
        subtitle={
          row
            ? `${row.pos.district} · ${channelName(row.pos.channel)}${
                row.pos.retailer === "Independent" ? "" : ` · ${row.pos.retailer}`
              }`
            : undefined
        }
        badge={row ? <Badge band={scoreBand(row.score)} label={`Score ${Math.round(row.score)} · ${BAND_LABEL[scoreBand(row.score)]}`} size="sm" /> : undefined}
        footer={
          row && onFlag && onUnflag ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-text-muted">
                {flagged
                  ? "This outlet is on the revisit queue."
                  : "Put this outlet on a future audit route."}
              </span>
              <Button
                variant={flagged ? "secondary" : "primary"}
                onClick={() =>
                  flagged
                    ? onUnflag(row.pos.id)
                    : onFlag(
                        row.pos.id,
                        row.issues[0]?.detail ?? `Review requested at ${row.pos.name}.`
                      )
                }
              >
                {flagged ? "Remove from revisit queue" : "Flag for revisit"}
              </Button>
            </div>
          ) : undefined
        }
      >
        {row && (
          <div className="flex flex-col gap-5">
            {/* ---------- who and when ---------- */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-md border border-line bg-bg px-3 py-2.5">
              {[
                { k: "Audited on", v: row.auditedAt || "—" },
                { k: "Collector", v: row.collector },
                { k: "Cycle", v: monthLabel(view.month) },
                { k: "Category", v: contract.category },
              ].map((item) => (
                <div key={item.k}>
                  <dt className=" uppercase font-mono text-xs font-medium tracking-[0.1em] text-text-muted">
                    {item.k}
                  </dt>
                  <dd className="mt-0.5 text-sm text-text">{item.v}</dd>
                </div>
              ))}
            </dl>

            {followUp && (
              <FollowUpEvidence
                outletCase={outletCase(
                  row.pos.id,
                  followUp.kpi,
                  followUp.origin,
                  followUp.cyclePair
                )}
                originMonth={followUp.originMonth}
                cycle={followUp.cycle}
                origin={followUp.origin}
                cyclePair={followUp.cyclePair}
              />
            )}

            {/* ---------- score and KPIs ---------- */}
            <div className="flex flex-wrap items-center gap-5">
              <span className="flex flex-col items-center gap-1.5">
                <ScoreRing score={row.score} size={104} />
                <StatusChip
                  band={scoreBand(row.score)}
                  size="sm"
                  title="What makes this outlet's score"
                  detail={componentDetail(
                    row.score,
                    kpiTargetsForDrawer()
                      .filter((kpi) => row[kpi.key] !== null)
                      .map((kpi) => ({
                        label: kpi.label,
                        score: row[kpi.key] as number,
                        weight: scoreWeights[kpi.key === "shelfShare" ? "shelfShare" : kpi.key],
                      }))
                  )}
                />
              </span>
              <dl className="min-w-[240px] flex-1 flex-col gap-2">
                {kpiTargetsForDrawer().map((kpi) => {
                  const value = row[kpi.key];
                  /* Nothing to measure reads as a dash. This outlet
                     lists none of the range, so "0%" would be a
                     failure it never had the chance to have. */
                  if (value === null) {
                    return (
                      <div key={kpi.key} className="flex items-center gap-2 py-[3px]">
                        <dt className="w-[86px] shrink-0 text-xs text-text-muted">
                          {kpi.label}
                        </dt>
                        <dd className="mono flex-1 text-xs text-text-muted">
                          nothing to measure here
                        </dd>
                      </div>
                    );
                  }
                  return (
                    <div key={kpi.key} className="flex items-center gap-2 py-[3px]">
                      <dt className="w-[86px] shrink-0 text-xs text-text-muted">{kpi.label}</dt>
                      <Bar value={value} max={100} par={kpi.target} />
                      <dd className="mono w-[42px] shrink-0 text-right text-xs font-semibold text-text">
                        {value}%
                      </dd>
                      <dd className="w-[16px] shrink-0">
                        <span
                          className="block h-2 w-2 rounded-full"
                          style={{
                            background: value >= kpi.target ? BAND_COLOR.strong : BAND_COLOR.attention,
                            boxShadow: `inset 0 0 0 1.5px ${value >= kpi.target ? BAND_EDGE.strong : BAND_EDGE.attention}`,
                          }}
                          aria-label={value >= kpi.target ? "at target" : "below target"}
                        />
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>

            {/* ---------- issues ---------- */}
            <section>
              <h3 className=" uppercase font-mono text-xs font-medium tracking-[0.1em] text-text-muted">
                Detected issues
              </h3>
              {row.issues.length === 0 ? (
                <p className="mt-2 text-sm text-text-muted">
                  Nothing flagged — this outlet met every threshold the audit checks.
                </p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {row.issues.map((issue) => (
                    <li key={issue.kind} className="flex items-start gap-2">
                      <Badge
                        band={issue.severity === "critical" ? "critical" : "attention"}
                        label={issue.label}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 text-xs leading-snug text-text-muted">
                        {issue.detail}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ---------- the shelf ---------- */}
            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className=" uppercase font-mono text-xs font-medium tracking-[0.1em] text-text-muted">
                  Shelf as audited
                </h3>
                <button
                  type="button"
                  onClick={() => setZoom(true)}
                  className="text-xs font-semibold text-primary-text hover:underline"
                >
                  Enlarge
                </button>
              </div>
              <ShelfScene cells={row.cells} height={190} />
              <p className="mt-1.5 text-xs leading-snug text-text-muted">
                Drawn from this visit&apos;s rows: {row.cells.length} lines checked,{" "}
                {row.gaps} out of stock, {row.facings.toLocaleString()} client facings counted.
              </p>
            </section>

            {/* ---------- what to do ---------- */}
            <section>
              <h3 className=" uppercase font-mono text-xs font-medium tracking-[0.1em] text-text-muted">
                Recommended actions
              </h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {recommendationsFor(row).map((line) => (
                  <li key={line} className="flex gap-2 text-sm leading-snug text-text">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                href="/portal/actions"
                className="mt-2.5 inline-block text-xs font-semibold text-primary-text hover:underline"
              >
                Track these in the Follow-up Audit Center
              </Link>
            </section>

            {/* ---------- lines ---------- */}
            <section>
              <h3 className=" uppercase font-mono text-xs font-medium tracking-[0.1em] text-text-muted">
                Every line checked
              </h3>
              <ul className="mt-2 flex flex-col">
                {row.cells.map((cell) => (
                  <li
                    key={cell.skuId}
                    className="flex items-center gap-2 border-b border-line py-1.5 text-sm last:border-0"
                  >
                    <span className="min-w-0 flex-1 truncate text-text">
                      {skuOf(cell.skuId)?.name ?? cell.skuId}
                    </span>
                    {cell.state === "in-stock" ? (
                      <>
                        <span className="mono text-xs text-text-muted">
                          {cell.position ?? "shelf"}
                        </span>
                        <span className="mono w-[62px] text-right font-semibold text-text">
                          {cell.facings} {cell.facings === 1 ? "facing" : "facings"}
                        </span>
                      </>
                    ) : (
                      <Badge band="critical" label="Out of stock" size="sm" />
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <p className="text-xs leading-snug text-text-muted">
              Map position is placed within {row.pos.district} rather than surveyed to the street.
            </p>
          </div>
        )}
      </Drawer>

      {/* The lightbox sits outside the drawer so it is not clipped by
          the panel's own scroll container. */}
      {zoom && row && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setZoom(false)}
            className="absolute inset-0 bg-text/65"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Shelf view, ${row.pos.name}`}
            className="relative w-full max-w-[880px] rounded-lg border border-line bg-surface p-6 shadow-[var(--vm-shadow-overlay)]"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-sans text-[15px] font-semibold tracking-tight text-text">
                  {row.pos.name}
                </h2>
                <p className="text-xs text-text-muted">
                  {row.pos.district}, {governorateName(row.pos.governorateId)} · audited {row.auditedAt} by{" "}
                  {row.collector}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOverlays((v) => !v)}
                  aria-pressed={overlays}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    overlays
                      ? "border-primary-tint bg-primary-tint text-primary-text"
                      : "border-line-strong bg-surface text-text hover:border-text-muted"
                  }`}
                >
                  Detections
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(false)}
                  aria-label="Close"
                  className="rounded-sm p-1 text-text-muted transition-colors hover:bg-bg hover:text-text"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                    <path d="m4 4 8 8M12 4l-8 8" />
                  </svg>
                </button>
              </div>
            </div>
            <ShelfScene cells={row.cells} height={380} overlays={overlays} maxFacings={40} />
            <p className="mt-2 text-xs leading-snug text-text-muted">
              Every pack, facing count and empty slot is an observation from this visit — the
              overlay labels what was recorded, not what a photograph might contain.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
