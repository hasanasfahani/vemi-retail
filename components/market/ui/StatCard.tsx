/* The KPI tile. Figure, what it is, where it stands against target,
   and how it moved — in that reading order.

   A target turns a number into a judgement, so when one is given the
   tile bands itself and says the gap. Without a target it stays
   neutral: a count of outlets has no "good". */

import type { ReactNode } from "react";
import Delta from "./Delta";
import Sparkline from "./Sparkline";
import Badge from "./Badge";
import StatusChip from "./StatusChip";
import InfoTip from "./InfoTip";
import { rateBand, type Band } from "./health";
import type { BandDetail } from "@/lib/market/bandDetail";

export default function StatCard({
  label,
  value,
  unit,
  target,
  band,
  delta,
  deltaUnit = "pt",
  deltaFloor = 0,
  deltaLabel,
  goodUp = true,
  trend,
  footnote,
  action,
  detail,
  explain,
  watch,
}: {
  label: string;
  value: number | string;
  unit?: string;
  /* Numeric targets band the tile; pass `band` directly to override. */
  target?: number;
  band?: Band;
  delta?: number;
  deltaUnit?: string;
  deltaFloor?: number;
  deltaLabel?: string;
  goodUp?: boolean;
  trend?: number[];
  footnote?: ReactNode;
  action?: ReactNode;
  /* What sits behind the status chip: the cut-offs it was judged by,
     where this figure falls, and what would move it. Given, the plain
     badge becomes an interrogable chip. */
  detail?: BandDetail | null;
  /* How the figure is derived. A rate whose denominator is unstated is
     a number the reader has to take on trust. */
  explain?: ReactNode;
  /* The Watch control, given where the figure is one the watchlist can
     find again next cycle. */
  watch?: ReactNode;
}) {
  const numeric = typeof value === "number" ? value : null;
  const resolved =
    band ?? (target !== undefined && numeric !== null ? rateBand(numeric, target) : undefined);

  return (
    <div className="flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {label}
          </span>
          {explain && <InfoTip label={`How ${label} is measured`}>{explain}</InfoTip>}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {resolved &&
            (detail ? (
              <StatusChip band={resolved} size="sm" detail={detail} title={label} />
            ) : (
              <Badge band={resolved} size="sm" />
            ))}
          {watch}
        </span>
      </div>

      <div className="mt-1.5 flex items-end justify-between gap-2">
        <span className="font-display text-[26px] font-bold leading-none tracking-tight text-ink-900">
          {typeof value === "number" ? value.toLocaleString() : value}
          {unit && (
            <span className="ml-0.5 text-[15px] font-semibold text-ink-500">{unit}</span>
          )}
        </span>
        {trend && trend.length > 1 && <Sparkline points={trend} />}
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        {delta !== undefined && (
          <Delta
            value={delta}
            unit={deltaUnit}
            floor={deltaFloor}
            goodUp={goodUp}
            label={deltaLabel}
          />
        )}
        {target !== undefined && (
          <span className="mono text-[11.5px] text-ink-400">target {target}{unit}</span>
        )}
        {action}
      </div>

      {footnote && (
        <p className="mt-2 text-[11px] leading-snug text-ink-400">{footnote}</p>
      )}
    </div>
  );
}
