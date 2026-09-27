"use client";

/* THE KPI HERO — what the number is, how far it is from the target,
   how much of the market that covers, and what you can do about it.

   It replaced a band that named the main issue, where it was
   concentrated and what to do next. That analysis was not wrong, it
   was in the wrong place: the charts below say the same things with
   evidence attached, and a hero repeating them made a reader scroll
   past the summary to find the detail that had already been
   summarised. The hero's job is the gap and the two ways to act on it.

   AFFECTED POS AND ISSUES ARE DIFFERENT NUMBERS and both are named.
   One outlet with three empty lines is one affected POS and three
   issues; showing only the larger reads as reach the audit does not
   have, and showing only the smaller hides the work. */

import { Gauge } from "@/components/vemi/Gauge";
import type { ReactNode } from "react";
import InfoTip from "./ui/InfoTip";
import StatusChip from "./ui/StatusChip";
import { distributionDetail, rateBandDetail } from "@/lib/market/bandDetail";
import { rateBand } from "./ui/health";

export default function KpiGapBar({
  label,
  value,
  unit = "%",
  target,
  affectedPos,
  issues,
  issueNoun,
  explain,
  actions,
  spread,
}: {
  label: string;
  value: number;
  unit?: string;
  target: number;
  affectedPos: number;
  issues: number;
  /* What one issue IS for this KPI — "SKU availability gaps", "missing
     material". A bare number leaves the reader guessing what was
     counted. */
  issueNoun: string;
  explain?: ReactNode;
  actions?: ReactNode;
  /* Per-outlet figures behind the headline, so the chip can show how
     the market is spread rather than only its average. */
  spread?: number[];
}) {
  const band = rateBand(value, target);
  const gap = Math.round((target - value) * 10) / 10;
  const met = gap <= 0;

  const ceiling = Math.max(target, value) * 1.06;

  return (
    /* The tab's hero figure (brand KPI hero: mono label, 56px value),
       drawn against its target, then the two counts that scope the
       problem, then the tab's actions. */
    <section className="rounded-lg border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
        {/* the figure */}
        <div className="min-w-[240px] flex-1">
          <p className="flex items-center gap-2">
            <span className="vm-label">{label}</span>
            {explain && <InfoTip label={`How ${label} is measured`} align="left">{explain}</InfoTip>}
          </p>
          <p className="mt-2 flex flex-wrap items-end gap-3">
            <span className="vm-kpi__value">
              {value}
              <span className="vm-kpi__unit">{unit}</span>
            </span>
            <span className="mb-2">
              <StatusChip
                band={band}
                detail={
                  spread && spread.length
                    ? distributionDetail(spread, target, unit)
                    : rateBandDetail(value, target, unit)
                }
                title={spread && spread.length ? `${label}: where the market sits` : undefined}
              />
            </span>
          </p>
          <Gauge
            className="mt-3 max-w-[420px]"
            value={value}
            max={ceiling}
            target={target}
            label={`${value}${unit} against a ${target}${unit} target`}
          />
        </div>

        {/* target and gap, which is the sentence the page is about */}
        <dl className="flex min-w-[200px] gap-10">
          <div>
            <dt className="vm-label">Target</dt>
            <dd className="tnum mt-2 text-[28px] leading-8">
              {target}
              <span className="text-lg text-text-muted">{unit}</span>
            </dd>
          </div>
          <div>
            <dt className="vm-label">Gap</dt>
            <dd className={`tnum mt-2 text-[28px] leading-8 ${met ? "!text-primary-text" : ""}`}>
              {met ? `+${Math.abs(gap)}` : `−${Math.abs(gap)}`}
              <span className="text-lg">{unit}</span>
            </dd>
            <dd className="mt-1 text-sm text-text-muted">{met ? "above target" : "below target"}</dd>
          </div>
        </dl>

        {/* scope: the two counts, never merged */}
        <div className="min-w-[200px]">
          <p className="vm-label">Issue scope</p>
          <p className="mt-2 text-base">
            <span className="tnum text-[28px] leading-8">{affectedPos.toLocaleString()}</span>
            <span className="ml-2 text-sm text-text-muted">affected POS</span>
          </p>
          <p className="mt-1 font-mono text-sm text-text">
            {issues.toLocaleString()}
            <span className="ml-1.5 font-sans text-text-muted">{issueNoun}</span>
          </p>
        </div>
      </div>

      {actions && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">{actions}</div>
      )}
    </section>
  );
}
