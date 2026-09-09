"use client";

/* SECTION A · monthly audit coverage.

   The one number the contract is judged on, so it opens the portal.
   The ring shows how much of the month's 1,000 outlets have been
   reached; the milestones on the track are the quarter marks, and the
   rate line underneath is what says whether the rest will land.

   "On track" is arithmetic, not a mood: outlets remaining ÷ days
   remaining against the rate achieved so far. */

import { BAND_COLOR } from "./ui/health";

export default function CoverageRing({
  audited,
  contracted,
  pct,
  remaining,
  daysRemaining,
  perDaySoFar,
  perDayRequired,
  onTrack,
  size = 168,
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
  const stroke = 13;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, pct)) / 100) * c;
  const color = onTrack ? BAND_COLOR.strong : BAND_COLOR.attention;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={`${filled} ${c - filled}`}
            />
            {/* Quarter milestones, drawn on the track itself so the
                ring says how far through the month's target it is
                without a second scale to read. */}
            {[25, 50, 75].map((mark) => {
              const angle = (mark / 100) * 2 * Math.PI;
              const inner = r - stroke / 2;
              const outer = r + stroke / 2;
              const cx = size / 2;
              const cy = size / 2;
              return (
                <line
                  key={mark}
                  x1={cx + inner * Math.cos(angle)}
                  y1={cy + inner * Math.sin(angle)}
                  x2={cx + outer * Math.cos(angle)}
                  y2={cy + outer * Math.sin(angle)}
                  stroke="white"
                  strokeWidth={2}
                  opacity={pct >= mark ? 0.75 : 0.9}
                />
              );
            })}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[30px] font-bold leading-none tracking-tight text-ink-900">
            {pct}%
          </span>
          <span className="mono mt-1 text-[11px] text-ink-400">
            {audited.toLocaleString()} / {contracted.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="min-w-[220px] flex-1">
        <p className="font-display text-[17px] font-bold tracking-tight text-ink-900">
          {audited.toLocaleString()} of {contracted.toLocaleString()} outlets audited
        </p>
        <p
          className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[11.5px] font-semibold"
          style={{ background: `${color}1a`, color }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {pct}% market coverage achieved · {onTrack ? "on track" : "behind plan"}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {[
            { k: "Remaining", v: remaining.toLocaleString(), s: "outlets" },
            { k: "Days left", v: daysRemaining, s: "in the cycle" },
            { k: "Rate so far", v: perDaySoFar, s: "outlets / day" },
            { k: "Rate needed", v: perDayRequired, s: "outlets / day" },
          ].map((row) => (
            <div key={row.k}>
              <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                {row.k}
              </dt>
              <dd className="mono mt-0.5 text-[15px] font-semibold text-ink-900">{row.v}</dd>
              <dd className="text-[11px] text-ink-400">{row.s}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
