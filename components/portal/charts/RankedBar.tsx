"use client";

/* Ranked horizontal bars in the emphasis form: the client brand wears
   the accent, everything else is de-emphasis gray. Identity is carried
   by the row label, so hue never has to do that job.

   Marks: ≤ 24px thick, 4px rounded data-end, square at the baseline,
   grown from one baseline. Value at the tip. */

import { useState } from "react";

export type BarRow = {
  id: string;
  label: string;
  value: number;
  emphasis?: boolean;
  /* Optional second line under the label — channel, pack, owner. */
  meta?: string;
};

type Props = {
  rows: BarRow[];
  /* Axis maximum; defaults to the largest value. */
  max?: number;
  /* A string, not a formatter: props cross the server/client boundary
     and functions cannot. */
  unit?: string;
  labelWidth?: number;
};

export default function RankedBar({
  rows,
  max,
  unit = "%",
  labelWidth = 132,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const ceiling = max ?? Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="w-full">
      {rows.map((row) => {
        const width = Math.max((row.value / ceiling) * 100, 0.8);
        const active = hover === row.id;
        return (
          /* Below sm the label sits above a full-width bar — a fixed
             label column would leave the plot too short to compare. */
          <div
            key={row.id}
            className="group flex flex-col gap-1 py-[5px] sm:flex-row sm:items-center sm:gap-3"
            style={{ "--label-w": `${labelWidth}px` } as React.CSSProperties}
            onMouseEnter={() => setHover(row.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(row.id)}
            onBlur={() => setHover(null)}
            tabIndex={0}
          >
            <div className="flex items-baseline justify-between gap-3 text-[13px] leading-tight sm:block sm:w-[var(--label-w)] sm:shrink-0 sm:text-right">
              <span>
                <span
                  className={
                    row.emphasis ? "font-semibold text-ink-900" : "text-ink-700"
                  }
                >
                  {row.label}
                </span>
                {row.meta && (
                  <span className="block text-[11px] text-ink-400">
                    {row.meta}
                  </span>
                )}
              </span>
              <span className="mono shrink-0 font-semibold text-ink-900 sm:hidden">
                {row.value}
                {unit}
              </span>
            </div>

            <div className="relative min-w-0 flex-1">
              <div
                className="h-[14px] rounded-r-[4px] transition-opacity"
                style={{
                  width: `${width}%`,
                  background: row.emphasis
                    ? "var(--color-violet)"
                    : "var(--color-chart-context)",
                  opacity: hover && !active ? 0.55 : 1,
                }}
              />
            </div>

            <div className="mono hidden w-[54px] shrink-0 text-right text-[13px] font-semibold text-ink-900 sm:block">
              {row.value}
              {unit}
            </div>
          </div>
        );
      })}
    </div>
  );
}
