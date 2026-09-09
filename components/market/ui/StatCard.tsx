/* The KPI tile. Figure, what it is, where it stands against target,
   and how it moved — in that reading order.

   A target turns a number into a judgement, so when one is given the
   tile bands itself and says the gap. Without a target it stays
   neutral: a count of outlets has no "good". */

import type { ReactNode } from "react";
import Delta from "./Delta";
import Sparkline from "./Sparkline";
import Badge from "./Badge";
import { rateBand, type Band } from "./health";

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
}) {
  const numeric = typeof value === "number" ? value : null;
  const resolved =
    band ?? (target !== undefined && numeric !== null ? rateBand(numeric, target) : undefined);

  return (
    <div className="flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {label}
        </span>
        {resolved && <Badge band={resolved} size="sm" />}
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
