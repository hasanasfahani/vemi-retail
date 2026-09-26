/* The KPI tile. Figure, what it is, where it stands against target,
   and how it moved — in that reading order.

   A target turns a number into a judgement, so when one is given the
   tile bands itself and says the gap. Without a target it stays
   neutral: a count of outlets has no "good". */

import { ConfidenceBadge, type Confidence } from "@/components/vemi/ConfidenceBadge";
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
  confidence,
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
  /* How the figure was obtained (brand ConfidenceBadge). */
  confidence?: Confidence;
}) {
  const numeric = typeof value === "number" ? value : null;
  const resolved =
    band ?? (target !== undefined && numeric !== null ? rateBand(numeric, target) : undefined);

  /* The compact brand KPI (components/vemi KpiCard): mono label, 36px
     tabular figure, band chip, delta with its window, basis line. */
  return (
    <div className="vm-kpi vm-kpi--compact">
      {/* THE LABEL OWNS ITS OWN ROW. Sharing it with the status chip and
          the info / watch controls clipped labels at 1280px twice; the
          controls sit at the row's end and the chip moves below. */}
      <div className="vm-kpi__top">
        <span className="vm-label min-w-0 flex-1">{label}</span>
        <span className="flex shrink-0 items-center gap-1">
          {confidence && <ConfidenceBadge level={confidence} size="sm" />}
          {explain && <InfoTip label={`How ${label} is measured`}>{explain}</InfoTip>}
          {watch}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <span className="vm-kpi__value">
          {typeof value === "number" ? value.toLocaleString() : value}
          {unit && <span className="vm-kpi__unit">{unit}</span>}
        </span>
        {trend && trend.length > 1 && <Sparkline points={trend} />}
      </div>

      {(resolved || delta !== undefined || target !== undefined || action) && (
        <div className="vm-kpi__meta">
          {resolved &&
            (detail ? (
              <StatusChip band={resolved} size="sm" detail={detail} title={label} />
            ) : (
              <Badge band={resolved} size="sm" />
            ))}
          {delta !== undefined && (
            <Delta value={delta} unit={deltaUnit} floor={deltaFloor} goodUp={goodUp} label={deltaLabel} />
          )}
          {target !== undefined && (
            <span className="font-mono text-xs text-ink-500">target {target}{unit}</span>
          )}
          {action}
        </div>
      )}

      {footnote && <p className="vm-kpi__foot font-sans">{footnote}</p>}
    </div>
  );
}
