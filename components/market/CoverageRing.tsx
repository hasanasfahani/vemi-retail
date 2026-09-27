"use client";

/* SECTION A · monthly audit coverage.

   The one number the contract is judged on, so it opens the portal.
   The ring shows how much of the month's 1,000 outlets have been
   reached; the milestones on the track are the quarter marks, and the
   rate line underneath is what says whether the rest will land.

   "On track" is arithmetic, not a mood: outlets remaining ÷ days
   remaining against the rate achieved so far. */

import { BandChip } from "@/components/vemi/BandChip";
import { Gauge } from "@/components/vemi/Gauge";

export default function CoverageRing({
  audited,
  contracted,
  pct,
  remaining,
  daysRemaining,
  perDaySoFar,
  perDayRequired,
  onTrack,
}: {
  audited: number;
  contracted: number;
  pct: number;
  remaining: number;
  daysRemaining: number;
  perDaySoFar: number;
  perDayRequired: number;
  onTrack: boolean;
  size?: number;
}) {

  return (
    <div className="flex flex-wrap items-center gap-6">
      {/* Was a ring; the brand avoids donut forms, so coverage is the
          figure over a linear gauge with the quarter marks on it. */}
      <div className="flex w-full max-w-[220px] shrink-0 flex-col">
        <span className="tnum text-[56px] leading-[60px]">
          {pct}
          <span className="text-[28px] text-text-muted">%</span>
        </span>
        <div className="relative mt-3">
          <Gauge value={pct} max={100} label={`${pct}% of contracted outlets audited`} />
          {[25, 50, 75].map((mark) => (
            <span key={mark} aria-hidden className="absolute top-0 h-1.5 w-[2px] bg-surface" style={{ left: `${mark}%` }} />
          ))}
        </div>
        <span className="mono mt-2 text-xs text-text-muted">
          {audited.toLocaleString()} / {contracted.toLocaleString()}
        </span>
      </div>

      <div className="min-w-[220px] flex-1">
        <p className="font-sans text-lg font-semibold tracking-tight text-text">
          {audited.toLocaleString()} of {contracted.toLocaleString()} outlets audited
        </p>
        <p className="mt-2">
          <BandChip band={onTrack ? "strong" : "attention"} label={`${pct}% coverage · ${onTrack ? "on track" : "behind plan"}`} />
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {[
            { k: "Remaining", v: remaining.toLocaleString(), s: "outlets" },
            { k: "Days left", v: daysRemaining, s: "in the cycle" },
            { k: "Rate so far", v: perDaySoFar, s: "outlets / day" },
            { k: "Rate needed", v: perDayRequired, s: "outlets / day" },
          ].map((row) => (
            <div key={row.k}>
              <dt className=" uppercase font-mono text-xs font-medium tracking-[0.1em] text-text-muted">
                {row.k}
              </dt>
              <dd className="mono mt-0.5 text-[15px] font-semibold text-text">{row.v}</dd>
              <dd className="text-xs text-text-muted">{row.s}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
