"use client";

/* Ranked horizontal bars in the emphasis form: the client brand wears
   the accent, everything else is de-emphasis gray. Identity is carried
   by the row label, so hue never has to do that job.

   Marks: ≤ 24px thick, 4px rounded data-end, square at the baseline,
   grown from one baseline. Value at the tip.

   Phase 13 (W4) adds the three things a twenty-row list needed to stay
   readable:

     topN       show the head, keep the tail one click away. A flat
                twenty-row list is precise and unscannable; the reader
                almost always wants the worst few and the option to
                check the rest.
     reference  one hairline for the number the bars are being judged
                against — a peer median, a target, your own average.
                Without it a bar is a length with no verdict attached.
     previous   a ghost bar behind the current one, so "is this better
                or worse than last visit" is answered in the same shape
                rather than in a separate delta column. */

import { useState } from "react";
import WatchButton, { type WatchTarget } from "@/components/portal/WatchButton";

export type BarRow = {
  id: string;
  label: string;
  value: number;
  emphasis?: boolean;
  /* Optional second line under the label — channel, pack, owner. */
  meta?: string;
  /* Same measure at the previous visit, drawn as a ghost behind. */
  previous?: number;
};

type Props = {
  rows: BarRow[];
  /* Axis maximum; defaults to the largest value. */
  max?: number;
  /* A string, not a formatter: props cross the server/client boundary
     and functions cannot. */
  unit?: string;
  labelWidth?: number;
  /* Rows shown before "show all"; omit to show every row. */
  topN?: number;
  /* The line the bars are judged against. */
  reference?: { value: number; label: string };
  /* Names the ghost series in the legend — only rendered when at least
     one row carries a `previous`. */
  previousLabel?: string;
  /* Per-row Watch pins, keyed by row id. Deliberately DATA, not a
     render function: Command Center and Digest are Server Components,
     and a function prop cannot cross that boundary — the same
     constraint that turned `format` into a `unit` string back in
     Phase 5. The chart is a client component, so it renders the
     button itself from this map. */
  watchTargets?: Record<string, WatchTarget>;
};

export default function RankedBar({
  rows,
  max,
  unit = "%",
  labelWidth = 132,
  topN,
  reference,
  previousLabel = "previous visit",
  watchTargets,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const ceiling = Math.max(
    max ?? Math.max(...rows.map((r) => r.value), 1),
    reference?.value ?? 0
  );
  const hasGhost = rows.some((r) => r.previous !== undefined);
  const collapsed = topN !== undefined && !expanded && rows.length > topN;
  const shown = collapsed ? rows.slice(0, topN) : rows;
  const hidden = rows.length - shown.length;

  return (
    <div className="w-full">
      {(hasGhost || reference) && (
        <div
          className="mb-2 flex flex-wrap items-center gap-4 text-[12px] text-ink-500"
          style={{ paddingLeft: labelWidth + 12 }}
        >
          {hasGhost && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-[8px] w-[16px] rounded-[2px]"
                style={{ background: "var(--color-comp-2)" }}
              />
              {previousLabel}
            </span>
          )}
          {reference && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-[14px] w-[2px]"
                style={{ background: "var(--color-ink-900)" }}
              />
              {reference.label}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {shown.map((row) => {
          const width = Math.max((row.value / ceiling) * 100, 0.8);
          const ghostWidth =
            row.previous !== undefined
              ? Math.max((row.previous / ceiling) * 100, 0.8)
              : null;
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
              title={
                row.previous !== undefined
                  ? `${row.label}: ${row.value}${unit} (was ${row.previous}${unit})`
                  : `${row.label}: ${row.value}${unit}`
              }
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
                {/* ghost first, so the current bar sits on top of it */}
                {ghostWidth !== null && (
                  <div
                    className="absolute top-1/2 h-[14px] -translate-y-1/2 rounded-r-[4px]"
                    style={{
                      width: `${ghostWidth}%`,
                      background: "var(--color-comp-2)",
                    }}
                    aria-hidden
                  />
                )}
                <div
                  className="relative h-[14px] rounded-r-[4px] transition-opacity"
                  style={{
                    width: `${width}%`,
                    background: row.emphasis
                      ? "var(--color-violet)"
                      : "var(--color-chart-context)",
                    opacity: hover && !active ? 0.55 : 1,
                  }}
                />
                {reference && (
                  <span
                    className="pointer-events-none absolute top-[-3px] h-[20px] w-[2px]"
                    style={{
                      left: `calc(${(reference.value / ceiling) * 100}% - 1px)`,
                      background: "var(--color-ink-900)",
                    }}
                    aria-hidden
                  />
                )}
              </div>

              <div className="mono hidden w-[54px] shrink-0 text-right text-[13px] font-semibold text-ink-900 sm:block">
                {row.value}
                {unit}
              </div>

              {watchTargets?.[row.id] && (
                <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <WatchButton target={watchTargets[row.id]} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {topN !== undefined && rows.length > topN && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 text-[12.5px] font-semibold text-violet-ink hover:underline"
          style={{ marginLeft: labelWidth + 12 }}
        >
          {collapsed ? `Show all ${rows.length} — ${hidden} more` : "Show fewer"}
        </button>
      )}
    </div>
  );
}
