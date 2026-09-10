/* Distance from the target, drawn from the target.

   The bar charts this replaces all started at zero, which meant every
   row was mostly full and the eye had to compare the small differences
   at the right-hand ends of seven near-identical bars. The question
   was never "how much compliance is there" — it was "how far short is
   this one", and that quantity was the part the chart drew smallest.

   So the axis is the target and the bars grow OUT from it: short is
   close, long is far, left is behind and right is ahead. A market
   that is broadly on target reads as a tight column with one or two
   rows sticking out, which is exactly the shape the reader is looking
   for and cannot see in a chart that starts at zero. */

import type { ReactNode } from "react";
import { BAND_COLOR, rateBand } from "../ui/health";

export type GapRow = {
  id: string;
  label: string;
  value: number;
  meta?: ReactNode;
  trailing?: ReactNode;
  watch?: ReactNode;
};

export default function GapBars({
  rows,
  par,
  unit = "%",
  /* Widest gap the axis has to show. Given rather than inferred where
     two charts should be readable against each other. */
  reach,
  /* What the centre line IS, where it is not a target — the list
     price, the category average. The footnote says it, and the bands
     are dropped, because "needs attention" against a reference point
     nobody set as a goal would be a judgement the audit never made. */
  parLabel,
}: {
  rows: GapRow[];
  par: number;
  unit?: string;
  reach?: number;
  parLabel?: string;
}) {
  const gaps = rows.map((r) => r.value - par);
  const span = Math.max(reach ?? 0, ...gaps.map((g) => Math.abs(g)), 1);
  /* One decimal, because a gap rounded to whole points hides exactly
     the differences this chart exists to show. */
  const r1 = (n: number) => Math.round(n * 10) / 10;

  return (
    <div className="flex flex-col">
      <ul className="flex flex-col">
        {rows.map((row) => {
          const gap = row.value - par;
          const behind = gap < 0;
          const width = (Math.abs(gap) / span) * 50;
          return (
            <li
              key={row.id}
              className="flex items-center gap-2 border-b border-line py-1.5 last:border-0"
            >
              <span className="w-[34%] shrink-0 truncate text-[12px] text-ink-700" title={row.label}>
                {row.label}
              </span>

              <span
                className="relative h-4 min-w-0 flex-1"
                role="img"
                aria-label={`${row.label}: ${r1(row.value)}${unit}, ${
                  behind ? `${r1(Math.abs(gap))}${unit} below` : `${r1(gap)}${unit} above`
                } the ${par}${unit} target`}
              >
                {/* The target itself, down the middle. */}
                <span
                  className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-ink-400"
                  aria-hidden
                />
                <span
                  className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[3px]"
                  style={{
                    left: behind ? `${50 - width}%` : "50%",
                    width: `${width}%`,
                    /* Banded rather than one flat red: a governorate
                       two points short and one twenty points short are
                       not the same news, and the portal already has a
                       vocabulary for saying so. */
                    background: parLabel
                      ? "var(--color-serious)"
                      : behind
                        ? BAND_COLOR[rateBand(row.value, par)]
                        : "var(--color-good)",
                  }}
                  aria-hidden
                />
              </span>

              <span
                className="mono w-[4.75rem] shrink-0 text-right text-[12px] font-semibold"
                style={{
                  color: parLabel
                    ? "var(--color-ink-900)"
                    : behind
                      ? BAND_COLOR[rateBand(row.value, par)]
                      : "var(--color-good)",
                }}
              >
                {gap > 0 ? "+" : ""}
                {r1(gap)}
                {unit}
              </span>
              {/* The level, EXCEPT where the centre line is a
                  reference the value is already measured from. With the
                  list price at zero the gap and the level are the same
                  number, and printing it twice reads as two facts. */}
              {par !== 0 && (
                <span className="mono w-[3.5rem] shrink-0 text-right text-[12px] text-ink-500">
                  {r1(row.value)}
                  {unit}
                </span>
              )}
              {row.trailing}
              {row.watch}
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 text-[11px] text-ink-400">
        {parLabel ? (
          <>Bars run from {parLabel} — left is under it, right is over. The second figure is the level itself.</>
        ) : (
          <>
            Bars run from the {par}
            {unit} target — left is behind it, right is ahead. The second figure is the level itself.
          </>
        )}
      </p>
    </div>
  );
}
