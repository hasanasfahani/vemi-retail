"use client";

/* Audit coverage, demoted.

   The figure still matters — it is what the contract is judged on —
   but it is not what a commercial director opens the portal to find
   out. So it keeps every number the ring carried and gives up the
   space: one strip, one bar, the quarter marks still on the track.

   "On track" stays arithmetic: outlets remaining ÷ days remaining,
   against the rate achieved so far. */

import { BandChip } from "@/components/vemi/BandChip";

export default function CoverageStrip({
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
}) {
  /* Progress is always Violet; the chip carries the verdict (plan D1). */
  const color = "var(--vm-primary)";

  return (
    <section className="rounded-lg border border-line bg-surface py-5 pl-6 pr-14">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-sm text-text-muted">
          <span className="vm-label mr-1">Audit coverage</span>
          <span className="font-medium text-text">
            {audited.toLocaleString()} / {contracted.toLocaleString()} audited
          </span>
          <span aria-hidden>·</span>
          <span className="font-medium text-text">{pct}%</span>
          <span aria-hidden>·</span>
          <span>{remaining.toLocaleString()} remaining</span>
          <span aria-hidden>·</span>
          <span>{daysRemaining} days left</span>
        </p>

        <BandChip band={onTrack ? "strong" : "attention"} label={onTrack ? "On track" : "Behind plan"} size="sm" />

        <span className="ml-auto shrink-0 font-mono text-xs text-text-muted">
          {perDaySoFar}/day so far · {perDayRequired}/day needed
        </span>
      </div>

      <div
        className="vm-gauge mt-4 overflow-hidden"
        role="img"
        aria-label={`${pct}% of the contracted outlets audited`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }}
        />
        {/* Quarter marks, kept from the ring — they are what turn a bar
            into a plan rather than a decoration. */}
        {[25, 50, 75].map((mark) => (
          <span
            key={mark}
            className="absolute top-0 h-full w-[2px] bg-surface"
            style={{ left: `${mark}%` }}
            aria-hidden
          />
        ))}
      </div>
    </section>
  );
}
