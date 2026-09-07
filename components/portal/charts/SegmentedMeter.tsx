"use client";

/* How much of a countable set is present — "this store carries 1 of
   your 4 SKUs", against the number its format normally carries.

   Segments rather than a continuous bar because the quantity is
   genuinely discrete and small: four SKUs are four things a person can
   count, and a smooth 25% bar would hide that. The benchmark is a tick
   on the track rather than a second bar, so the comparison reads as
   "how far short" without inventing a second series.

   Filled segments carry the brand accent because they are literally
   your presence on that shelf — the one place in the chart set where
   violet means the same thing it means everywhere else. */

import { useState } from "react";

export type MeterRow = {
  id: string;
  label: string;
  /* Segments present. */
  filled: number;
  /* Segments possible. */
  total: number;
  /* What this row's peer group normally carries, if there is one. */
  benchmark?: number;
  meta?: string;
};

type Props = {
  rows: MeterRow[];
  /* What one segment represents, for the count beside each row. */
  unitLabel?: string;
  benchmarkLabel?: string;
  labelWidth?: number;
};

export default function SegmentedMeter({
  rows,
  unitLabel = "SKUs",
  benchmarkLabel = "typical for this format",
  labelWidth = 118,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const widest = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center gap-4 pl-1 text-[12px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-[11px] w-[16px] rounded-[3px]"
            style={{ background: "var(--color-violet)" }}
          />
          carried
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-[11px] w-[16px] rounded-[3px]"
            style={{ background: "var(--color-comp-3)" }}
          />
          not listed
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-[13px] w-[2px]"
            style={{ background: "var(--color-ink-900)" }}
          />
          {benchmarkLabel}
        </span>
      </div>

      {rows.map((row) => {
        const active = hover === row.id;
        const short = row.benchmark !== undefined ? row.benchmark - row.filled : 0;
        return (
          <div
            key={row.id}
            className="flex flex-col gap-1 py-[6px] sm:flex-row sm:items-center sm:gap-3"
            style={{ "--label-w": `${labelWidth}px` } as React.CSSProperties}
            onMouseEnter={() => setHover(row.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(row.id)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            title={`${row.label} — carries ${row.filled} of ${row.total} ${unitLabel}${
              row.benchmark !== undefined
                ? `, ${benchmarkLabel} is ${row.benchmark}`
                : ""
            }`}
          >
            <div className="flex items-baseline justify-between gap-3 text-[13px] leading-tight sm:block sm:w-[var(--label-w)] sm:shrink-0 sm:text-right">
              <span className="font-semibold text-ink-900">{row.label}</span>
              {row.meta && (
                <span className="block text-[11px] text-ink-400">{row.meta}</span>
              )}
            </div>

            <div
              className="min-w-0 flex-1"
              style={{ opacity: hover && !active ? 0.55 : 1 }}
            >
              {/* The strip and its benchmark tick share one positioning
                  box. They used to be siblings under the flex column,
                  so the tick's percentage resolved against the full
                  plot width while the strip was clamped by maxWidth —
                  which put the "typical for this format" mark 400px
                  clear of the blocks it was meant to annotate. */}
              <div
                className="relative"
                style={{ width: `${(row.total / widest) * 100}%`, maxWidth: 260 }}
              >
                <div className="flex gap-[2px]">
                  {Array.from({ length: row.total }).map((_, i) => (
                    <span
                      key={i}
                      className="h-[13px] flex-1 rounded-[3px]"
                      style={{
                        background:
                          i < row.filled
                            ? "var(--color-violet)"
                            : "var(--color-comp-3)",
                      }}
                    />
                  ))}
                </div>
                {row.benchmark !== undefined && row.benchmark <= row.total && (
                  <span
                    className="pointer-events-none absolute top-[-3px] h-[19px] w-[2px]"
                    style={{
                      left: `calc(${(row.benchmark / row.total) * 100}% - 1px)`,
                      background: "var(--color-ink-900)",
                    }}
                    aria-hidden
                  />
                )}
              </div>
            </div>

            <div className="mono hidden w-[96px] shrink-0 text-right text-[12.5px] sm:block">
              <span className="font-semibold text-ink-900">
                {row.filled}/{row.total}
              </span>
              {short > 0 && (
                <span className="ml-1.5" style={{ color: "var(--color-critical)" }}>
                  −{short}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
