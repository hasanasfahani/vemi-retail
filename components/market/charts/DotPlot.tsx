/* A dot plot — a row per category, the value as a dot on a shared
   scale, the target as a tick behind it.

   WHY THIS RATHER THAN A BAR PER ROW. A bar carries its magnitude in
   its length, which means every row needs enough height for the bar to
   read as a bar, and a list of twenty SKUs becomes a page of scrolling.
   A dot carries its magnitude in its POSITION, so the row can be half
   the height and the comparison between rows gets easier rather than
   harder: the eye follows one vertical line of dots instead of judging
   twenty lengths against each other.

   It also takes a second value for free. Where a row has an observed
   figure and a reference — a shelf price against its list price — the
   two dots are joined and the CONNECTOR is the finding: its length is
   the gap, and a column of long connectors is a pattern nobody has to
   compute.

   The scale is shared and stated. Rows are never individually
   normalised, because a dot plot whose rows use different scales is
   just a list of unrelated numbers wearing a chart's clothes. */

import type { ReactNode } from "react";
import { MEASURE, MEASURE_PRIOR } from "./theme";

export type DotRow = {
  id: string;
  label: string;
  value: number;
  /* The reference this row is measured against, where there is one —
     a list price, last month's figure. Drawn as a hollow dot with the
     distance between the two joined. */
  reference?: number;
  color?: string;
  meta?: ReactNode;
  trailing?: ReactNode;
  watch?: ReactNode;
};

export default function DotPlot({
  rows,
  min,
  max,
  par,
  unit = "",
  format,
  referenceLabel,
  height = 26,
}: {
  rows: DotRow[];
  /* Both ends are given rather than inferred, so two charts of the
     same measure can be read against each other. */
  min?: number;
  max?: number;
  /* The target, drawn once as a line down the whole plot rather than a
     tick per row — one line the eye can follow beats twenty ticks it
     has to find. */
  par?: number;
  unit?: string;
  format?: (value: number) => string;
  referenceLabel?: string;
  height?: number;
}) {
  const values = rows.flatMap((r) => [r.value, ...(r.reference === undefined ? [] : [r.reference])]);
  const lo = min ?? Math.min(...values, par ?? Infinity);
  const hi = max ?? Math.max(...values, par ?? -Infinity);
  const span = hi - lo || 1;
  const at = (v: number) => Math.max(0, Math.min(100, ((v - lo) / span) * 100));
  const show = format ?? ((v: number) => `${v.toLocaleString()}${unit}`);

  return (
    <div className="flex flex-col">
      {/* The target is drawn INSIDE each row's track rather than as one
          absolute line over the whole plot. A single line has to be
          positioned by arithmetic over the label column, the flex gaps
          and the value column, and any change to those silently moves
          the line off the scale it claims to mark. A tick per track is
          aligned by construction, and since the rows are adjacent the
          ticks read as the line anyway. */}
      <div>
        <ul className="flex flex-col">
          {rows.map((row) => {
            const color = row.color ?? MEASURE;
            const a = at(row.value);
            const b = row.reference === undefined ? null : at(row.reference);
            return (
              <li
                key={row.id}
                className="flex items-center gap-2 border-b border-line py-1 last:border-0"
                style={{ minHeight: height }}
              >
                <span className="w-[38%] shrink-0 truncate text-[12px] text-ink-700" title={row.label}>
                  {row.label}
                </span>

                <span className="relative h-2 min-w-0 flex-1" role="img" aria-label={`${row.label}: ${show(row.value)}`}>
                  {/* The track, so a row with a dot near the left edge
                      still reads as a position on a scale rather than
                      as a stray mark. */}
                  <span
                    className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
                    style={{ background: "var(--color-line-strong)" }}
                    aria-hidden
                  />
                  {par !== undefined && (
                    <span
                      className="absolute bottom-[-4px] top-[-4px] w-px bg-ink-400"
                      style={{ left: `${at(par)}%` }}
                      aria-hidden
                    />
                  )}
                  {b !== null && (
                    <span
                      className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full"
                      style={{
                        left: `${Math.min(a, b)}%`,
                        width: `${Math.abs(a - b)}%`,
                        background: color,
                        opacity: 0.35,
                      }}
                      aria-hidden
                    />
                  )}
                  {b !== null && (
                    <span
                      className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white"
                      style={{ left: `${b}%`, borderColor: MEASURE_PRIOR }}
                      aria-hidden
                    />
                  )}
                  <span
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
                    style={{ left: `${a}%`, background: color }}
                    aria-hidden
                  />
                </span>

                <span className="mono w-[4.5rem] shrink-0 text-right text-[12px] font-semibold text-ink-900">
                  {show(row.value)}
                </span>
                {row.trailing}
                {row.watch}
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
        <span>
          Scale {show(lo)} to {show(hi)}
        </span>
        {par !== undefined && <span>Line marks the {show(par)} target</span>}
        {referenceLabel && (
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2 w-2 rounded-full border-2 bg-white"
              style={{ borderColor: MEASURE_PRIOR }}
              aria-hidden
            />
            {referenceLabel}
          </span>
        )}
      </p>
    </div>
  );
}
