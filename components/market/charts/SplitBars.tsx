/* How much is there, and how much of it is missing — in one bar.

   THE QUESTION THIS ANSWERS THAT A RATE CANNOT. "Where would a
   deployment run pay?" is not the same question as "which place has the
   worst compliance rate". A governorate at 59% over eighty checks has
   fewer items missing than one at 71% over four hundred, and a chart
   drawn in percentages ranks them the wrong way round for anyone
   loading a van.

   So the bar's LENGTH is the volume checked and its SPLIT is the rate:
   the coloured part is what was found, the hollow part is what was
   missing, and the eye reads both facts off one shape. A long bar with
   a big hollow section is where the work is.

   Deliberately different from GapBars, which answers the compliance
   question — how far from target — and says nothing about how many
   items that gap represents. The two belong on the same page, on
   different cards, answering different halves of the same problem. */

import type { ReactNode } from "react";

export type SplitRow = {
  id: string;
  label: string;
  /* Everything checked in this slice. */
  total: number;
  /* Of those, the ones that were there. */
  present: number;
  meta?: ReactNode;
  watch?: ReactNode;
};

export default function SplitBars({
  rows,
  presentLabel = "Present",
  missingLabel = "Missing",
  unit = "",
}: {
  rows: SplitRow[];
  presentLabel?: string;
  missingLabel?: string;
  unit?: string;
}) {
  const widest = Math.max(1, ...rows.map((r) => r.total));
  const r1 = (n: number) => Math.round(n * 10) / 10;

  return (
    <div className="flex flex-col">
      <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-3 rounded-[2px] bg-[color:var(--color-violet)]" aria-hidden />
          {presentLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2 w-3 rounded-[2px] border border-line-strong bg-canvas"
            aria-hidden
          />
          {missingLabel}
        </span>
        <span>Bar length is how many were checked.</span>
      </p>

      <ul className="flex flex-col">
        {rows.map((row) => {
          const missing = Math.max(0, row.total - row.present);
          const share = row.total === 0 ? 0 : r1((row.present / row.total) * 100);
          const width = (row.total / widest) * 100;
          const fill = row.total === 0 ? 0 : (row.present / row.total) * 100;
          return (
            <li key={row.id} className="border-b border-line py-2 last:border-0">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12.5px] font-medium text-ink-700">{row.label}</span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="mono text-[12.5px] font-semibold text-ink-900">
                    {missing.toLocaleString()}
                    {unit} {missingLabel.toLowerCase()}
                  </span>
                  <span className="mono text-[11px] text-ink-400">{share}% there</span>
                  {row.watch}
                </span>
              </div>
              <div
                className="mt-1.5 h-2.5 overflow-hidden rounded-[3px] border border-line-strong bg-canvas"
                style={{ width: `${Math.max(4, width)}%` }}
                role="img"
                aria-label={`${row.label}: ${row.present.toLocaleString()} of ${row.total.toLocaleString()} present, ${missing.toLocaleString()} missing`}
              >
                <div
                  className="h-full bg-[color:var(--color-violet)]"
                  style={{ width: `${fill}%` }}
                />
              </div>
              {row.meta && <p className="mt-1 text-[11px] text-ink-400">{row.meta}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
