"use client";

/* A market KPI, with its target promoted from a footnote to the point
   of the card.

   The old tile stated a value, a band and a small "target 95%" in grey
   — which made the target the least prominent thing on a card whose
   whole job is to say whether the target is being met. Here the target
   is drawn three times over: as a tick on the track, as the dashed
   line across the trend, and as the distance still to close, stated in
   points. The number a reader takes away is the gap, not the level.

   The whole card is the link, because a KPI you cannot open is a
   headline rather than a starting point. */

import type { ReactNode } from "react";
import Link from "next/link";
import Delta from "./ui/Delta";
import InfoTip from "./ui/InfoTip";
import TargetSpark from "./ui/TargetSpark";
import { BAND_COLOR, BAND_LABEL, rateBand, type Band } from "./ui/health";

export default function KpiCard({
  label,
  value,
  unit = "%",
  target,
  trend,
  delta,
  deltaFloor,
  href,
  band,
  explain,
}: {
  label: string;
  value: number;
  unit?: string;
  target: number;
  trend: number[];
  delta: number;
  deltaFloor: number;
  href: string;
  band?: Band;
  /* How the figure is derived. Every tile carries one: a rate whose
     denominator is unstated is a number a reader has to take on
     trust. */
  explain?: ReactNode;
}) {
  const resolved = band ?? rateBand(value, target);
  const color = BAND_COLOR[resolved];
  const gap = Math.round((target - value) * 10) / 10;
  const met = gap <= 0;

  /* The track runs to the target, not to 100 — the reader is being
     asked about the distance to the goal, and a bar that always has
     empty space to the right of a met target reads as failure. */
  const ceiling = Math.max(target, value) * 1.06;
  const fill = Math.max(0, Math.min(100, (value / ceiling) * 100));
  const mark = Math.max(0, Math.min(100, (target / ceiling) * 100));

  return (
    /* The whole tile is a link, but the explanation is a button, and a
       button inside an anchor is neither valid nor operable. So the
       link is an overlay underneath the content and the info control
       sits above it. */
    <article className="group relative flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-ink-400 focus-within:border-violet">
      <Link
        href={href}
        aria-label={`Open ${label} in Performance`}
        className="absolute inset-0 z-0 rounded-[14px] outline-none"
      />

      {/* The label owns its own line. Sharing a row with the status
          pill, the pill won and "Shelf share" was rendered in 16px of
          the 78px it needs — every one of the six tiles was clipped at
          1280px. The status moved down beside the movement figure,
          where it has room and reads as part of the same judgement. */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="block truncate text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {label}
        </span>
        {/* The label keeps its own casing — lowercasing turned "POSM"
            into "posm" for a screen reader. */}
        {explain && <InfoTip label={`How ${label} is measured`}>{explain}</InfoTip>}
      </div>

      <div className="pointer-events-none mt-2 flex items-end justify-between gap-2">
        <span className="font-display text-[27px] font-bold leading-none tracking-tight text-ink-900">
          {value}
          {unit && <span className="ml-0.5 text-[15px] font-semibold text-ink-500">{unit}</span>}
        </span>
        <TargetSpark points={trend} target={target} />
      </div>

      {/* value against target, drawn */}
      <div
        className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-canvas"
        role="img"
        aria-label={`${value}${unit} against a target of ${target}${unit}`}
      >
        <div className="h-full rounded-full" style={{ width: `${fill}%`, background: color }} />
        <span
          className="absolute top-[-3px] h-[12px] w-[2px] rounded-full bg-ink-900"
          style={{ left: `${mark}%` }}
          aria-hidden
        />
      </div>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="mono text-[11.5px] font-semibold" style={{ color: met ? "var(--color-good)" : "var(--color-ink-700)" }}>
          {met ? `${Math.abs(gap)}${unit} above target` : `${gap}${unit} to target`}
        </span>
        <span className="mono text-[11px] text-ink-400">
          target {target}
          {unit}
        </span>
      </div>

      <div className="pointer-events-none mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-[1px] text-[10.5px] font-semibold"
          style={{ background: `${color}1a`, color }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {BAND_LABEL[resolved]}
        </span>
        <Delta value={delta} floor={deltaFloor} label="vs last month" />
      </div>
    </article>
  );
}
