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
import StatusChip from "./ui/StatusChip";
import TargetSpark from "./ui/TargetSpark";
import { rateBand, type Band } from "./ui/health";
import { distributionDetail, rateBandDetail, scoreBandDetail } from "@/lib/market/bandDetail";
import WatchEye from "./WatchEye";
import type { Watch as WatchRecord, WatchScope } from "@/lib/market/watchlist";

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
  spread,
  isScore,
  watch,
  size = "compact",
  deltaLabel,
  basis,
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
  /* Per-outlet values behind the headline, so the chip can show how
     the market is actually spread rather than only its average. */
  spread?: number[];
  /* Composites band on their own scale rather than against a target. */
  isScore?: boolean;
  /* Which measure this tile is and which cycle it is reading, so the
     figure can be pinned with an honest baseline. Omitted where a tile
     shows something the watchlist cannot recompute. */
  watch?: { kpi: WatchRecord["kpi"]; month: string; scope?: WatchScope };
  /* `hero`: the first KPI row of a page (56px figure). `compact`: a
     secondary grid (36px). Both are on the brand scale. */
  size?: "hero" | "compact";
  /* The named comparison window, e.g. "vs Aug 2026" (plan D5). */
  deltaLabel?: string;
  /* The basis line: "As of 21 Sep 2026 · 742 outlets". */
  basis?: string;
}) {
  const resolved = band ?? rateBand(value, target);
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
       link is an overlay underneath the content and the controls sit
       above it. */
    <article
      className={`vm-kpi ${size === "compact" ? "vm-kpi--compact" : ""} group relative transition-colors hover:z-20 hover:border-line-strong focus-within:z-20 focus-within:border-primary`}
    >
      <Link
        href={href}
        aria-label={`Open ${label} in Performance`}
        className="absolute inset-0 z-0 rounded-lg outline-none"
      />

      {/* The label owns its own line; the status moved down beside the
          movement figure, where it has room (it clipped every tile at
          1280px when it shared this row). */}
      <div className="vm-kpi__top relative z-10">
        <span className="vm-label min-w-0 truncate">{label}</span>
        <span className="relative z-10 flex shrink-0 items-center gap-1">
          {explain && <InfoTip label={`How ${label} is measured`}>{explain}</InfoTip>}
          {watch && (
            <WatchEye
              kpi={watch.kpi}
              scope={watch.scope ?? {}}
              value={value}
              target={target}
              month={watch.month}
              size="sm"
            />
          )}
        </span>
      </div>

      <div className="pointer-events-none flex items-end justify-between gap-3">
        <span className="vm-kpi__value">
          {value}
          {unit && <span className="vm-kpi__unit">{unit}</span>}
        </span>
        <TargetSpark points={trend} target={target} width={size === "hero" ? 140 : 112} height={size === "hero" ? 52 : 40} />
      </div>

      {/* value against target, drawn: the track runs past the target so
          a met goal does not read as an empty bar */}
      <div
        className="vm-gauge mt-1"
        role="img"
        aria-label={`${value}${unit} against a target of ${target}${unit}`}
      >
        <div className="vm-gauge__fill" style={{ width: `${fill}%` }} />
        <span className="vm-gauge__target" style={{ insetInlineStart: `${mark}%` }} />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 text-sm">
        <span className={`font-medium ${met ? "text-primary-text" : "text-text"}`}>
          {met ? `${Math.abs(gap)}${unit} above target` : `${gap}${unit} to target`}
        </span>
        <span className="font-mono text-xs text-text-muted">
          target {target}
          {unit}
        </span>
      </div>

      <div className="vm-kpi__meta">
        {/* Above the overlay link, so the chip can be hovered and
            focused without navigating. */}
        <span className="relative z-10">
          <StatusChip
            band={resolved}
            size="sm"
            detail={
              isScore
                ? scoreBandDetail(value)
                : spread && spread.length
                  ? distributionDetail(spread, target, unit)
                  : rateBandDetail(value, target, unit)
            }
            title={spread && spread.length && !isScore ? `${label}: where the market sits` : undefined}
          />
        </span>
        <span className="pointer-events-none">
          <Delta value={delta} floor={deltaFloor} label={deltaLabel ?? "vs the prior cycle"} />
        </span>
      </div>

      {basis && <div className="vm-kpi__foot">{basis}</div>}
    </article>
  );
}
