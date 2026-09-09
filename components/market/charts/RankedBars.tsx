/* A ranked list with its magnitudes drawn in — cities by execution,
   SKUs by gap count, retailers by compliance.

   Hand-built rather than charted, because the row is the unit: a label
   the reader can scan, a bar for the comparison, the figure itself,
   and often a badge. A bar chart library would give the bars and take
   the row away. */

import type { ReactNode } from "react";
import Bar from "../ui/Bar";
import { MEASURE } from "./theme";

export type RankedRow = {
  id: string;
  label: string;
  value: number;
  color?: string;
  meta?: ReactNode;
  trailing?: ReactNode;
};

export default function RankedBars({
  rows,
  unit = "",
  max,
  par,
  onRowClick,
}: {
  rows: RankedRow[];
  unit?: string;
  /* Defaults to the largest row, so the list fills its width; pass 100
     for rates, where the scale is the point. */
  max?: number;
  par?: number;
  onRowClick?: (row: RankedRow) => void;
}) {
  const ceiling = max ?? Math.max(1, ...rows.map((r) => r.value));

  return (
    <ul className="flex flex-col">
      {rows.map((row) => {
        const body = (
          <>
            <div className="flex min-w-0 items-baseline justify-between gap-2">
              <span className="truncate text-[12.5px] font-medium text-ink-700">
                {row.label}
              </span>
              <span className="mono shrink-0 text-[12.5px] font-semibold text-ink-900">
                {row.value.toLocaleString()}
                {unit}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Bar
                value={row.value}
                max={ceiling}
                par={par}
                color={row.color ?? MEASURE}
                label={`${row.label}: ${row.value}${unit}`}
              />
              {row.trailing}
            </div>
            {row.meta && (
              <p className="mt-1 text-[11px] text-ink-400">{row.meta}</p>
            )}
          </>
        );
        return (
          <li key={row.id} className="border-b border-line py-2.5 last:border-0">
            {onRowClick ? (
              <button
                type="button"
                onClick={() => onRowClick(row)}
                className="-mx-1.5 w-[calc(100%+0.75rem)] rounded-[8px] px-1.5 py-0.5 text-left transition-colors hover:bg-canvas"
              >
                {body}
              </button>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}
