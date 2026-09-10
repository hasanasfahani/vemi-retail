/* A ranked list with its magnitudes drawn in — governorates by execution,
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
  /* The Watch control for this row. Rendered OUTSIDE the row's click
     target: where a row opens something, wrapping it in the row's own
     button would nest a button inside a button, which is neither valid
     nor operable. */
  watch?: ReactNode;
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
          <li
            key={row.id}
            className="flex items-start gap-1.5 border-b border-line py-2.5 last:border-0"
          >
            {/* Leading, so a page of these reads as one column of
                controls. */}
            {row.watch && <span className="shrink-0 pt-px">{row.watch}</span>}
            <div className="min-w-0 flex-1">
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
            </div>
          </li>
        );
      })}
    </ul>
  );
}
