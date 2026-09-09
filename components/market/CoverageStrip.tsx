"use client";

/* Audit coverage, demoted.

   The figure still matters — it is what the contract is judged on —
   but it is not what a commercial director opens the portal to find
   out. So it keeps every number the ring carried and gives up the
   space: one strip, one bar, the quarter marks still on the track.

   "On track" stays arithmetic: outlets remaining ÷ days remaining,
   against the rate achieved so far. */

import { BAND_COLOR } from "./ui/health";

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
  const color = onTrack ? BAND_COLOR.strong : BAND_COLOR.attention;

  return (
    <section className="rounded-[14px] border border-line bg-white px-4 py-3 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="mono flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12.5px] text-ink-500">
          <span className="text-[13.5px] font-semibold text-ink-900">
            {audited.toLocaleString()} / {contracted.toLocaleString()} audited
          </span>
          <span aria-hidden>·</span>
          <span className="font-semibold text-ink-900">{pct}%</span>
          <span aria-hidden>·</span>
          <span>{remaining.toLocaleString()} remaining</span>
          <span aria-hidden>·</span>
          <span>{daysRemaining} days left</span>
        </p>

        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-[2px] text-[11.5px] font-semibold"
          style={{ background: `${color}1a`, color }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {onTrack ? "On track" : "Behind plan"}
        </span>

        <span className="mono ml-auto shrink-0 text-[11px] text-ink-400">
          {perDaySoFar}/day so far · {perDayRequired}/day needed
        </span>
      </div>

      <div
        className="relative mt-2.5 h-2 overflow-hidden rounded-full bg-canvas"
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
            className="absolute top-0 h-full w-px bg-white/85"
            style={{ left: `${mark}%` }}
            aria-hidden
          />
        ))}
      </div>
    </section>
  );
}
