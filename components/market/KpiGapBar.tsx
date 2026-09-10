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

  return (
    <section className="rounded-[14px] border border-line bg-white p-4 shadow-[var(--shadow-card)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        {/* the figure */}
        <div className="min-w-[210px]">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {label}
            {explain && <InfoTip label={`How ${label} is measured`} align="left">{explain}</InfoTip>}
          </p>
          <p className="mt-1.5 flex items-end gap-2.5">
            <span className="font-display text-[38px] font-bold leading-none tracking-tight text-ink-900">
              {value}
              <span className="ml-0.5 text-[20px] font-semibold text-ink-500">{unit}</span>
            </span>
            <span className="mb-1">
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
        </div>

        {/* target and gap, which is the sentence the page is about */}
        <dl className="flex min-w-[200px] gap-8">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Target
            </dt>
            <dd className="mono mt-1 text-[19px] font-semibold text-ink-700">
              {target}
              {unit}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Gap
            </dt>
            <dd
              className="mono mt-1 text-[19px] font-semibold"
              style={{ color: met ? "var(--color-good)" : "var(--color-serious)" }}
            >
              {met ? `+${Math.abs(gap)}` : `−${Math.abs(gap)}`}
              {unit}
              <span className="ml-1.5 text-[11.5px] font-normal text-ink-400">
                {met ? "above target" : "below target"}
              </span>
            </dd>
          </div>
        </dl>

        {/* scope: the two counts, never merged */}
        <div className="min-w-[190px]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Issue scope
          </p>
          <p className="mono mt-1 text-[15px] font-semibold text-ink-900">
            {affectedPos.toLocaleString()}
            <span className="ml-1 text-[12px] font-normal text-ink-500">affected POS</span>
          </p>
          <p className="mono text-[13px] text-ink-700">
            {issues.toLocaleString()}
            <span className="ml-1 text-[12px] font-normal text-ink-500">{issueNoun}</span>
          </p>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}
