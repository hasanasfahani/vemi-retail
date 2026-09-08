"use client";

/* Bars either side of a baseline — "how does this compare to my own
   average", which is the shape of three rules at once (district
   deficit, channel gap, fixture imbalance).

   Position carries direction: left of the line is behind, right is
   ahead. Colour carries SEVERITY, not direction — and it uses the same
   status tokens as the insight pills, so a red bar and a red pill mean
   the same thing on the same page. The brand accent is never spent
   here; violet means "you" everywhere else in the product and is not
   borrowed to mean "above average". */

import { useState } from "react";
import WatchButton, { type WatchTarget } from "@/components/portal/WatchButton";

export type DivergingRow = {
  id: string;
  label: string;
  /* Signed distance from the baseline, in the unit below. */
  delta: number;
  severity?: "critical" | "warning" | null;
  meta?: string;
};

type Props = {
  rows: DivergingRow[];
  baselineLabel: string;
  unit?: string;
  /* Reference lines drawn on the deficit side, e.g. the rule's own
     warning and critical thresholds. */
  thresholds?: { value: number; label: string }[];
  labelWidth?: number;
  /* Per-row Watch pins, keyed by row id — data rather than a render
     function, so a Server Component page can pass them. See the note
     in RankedBar. */
  watchTargets?: Record<string, WatchTarget>;
};

export default function DivergingBar({
  rows,
  baselineLabel,
  unit = "pt",
  thresholds = [],
  labelWidth = 132,
  watchTargets,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const span = Math.max(...rows.map((r) => Math.abs(r.delta)), 1) * 1.1;
  /* Zero sits proportionally, so the two sides stay on one scale. */
  const zeroPct = 50;
  const toPct = (v: number) => (v / span) * 50;

  const colorFor = (row: DivergingRow) =>
    row.severity === "critical"
      ? "var(--color-critical)"
      : row.severity === "warning"
        ? "var(--color-warn)"
        : "var(--color-comp-1)";

  return (
    <div className="w-full">
      <div className="relative">
        {/* threshold rules, deficit side */}
        {thresholds.map((t) => (
          <span
            key={t.label}
            className="pointer-events-none absolute top-0 bottom-5 w-px"
            style={{
              left: `calc(${labelWidth}px + ${zeroPct - toPct(Math.abs(t.value))}% * (100% - ${labelWidth}px) / 100%)`,
              background: "var(--color-line)",
            }}
            aria-hidden
          />
        ))}

        {rows.map((row) => {
          const active = hover === row.id;
          const w = Math.abs(toPct(row.delta));
          const behind = row.delta < 0;
          return (
            <div
              key={row.id}
              className="group flex flex-col gap-0.5 py-[5px] sm:flex-row sm:items-center sm:gap-3"
              style={{ "--label-w": `${labelWidth}px` } as React.CSSProperties}
              onMouseEnter={() => setHover(row.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(row.id)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              title={`${row.label} — ${row.delta >= 0 ? "+" : ""}${row.delta}${unit} against ${baselineLabel}${row.meta ? ` · ${row.meta}` : ""}`}
            >
              <div className="flex items-baseline justify-between gap-3 text-[13px] leading-tight sm:block sm:w-[var(--label-w)] sm:shrink-0 sm:text-right">
                <span
                  className={
                    row.severity ? "font-semibold text-ink-900" : "text-ink-700"
                  }
                >
                  {row.label}
                </span>
                {row.meta && (
                  <span className="block text-[11px] text-ink-400">
                    {row.meta}
                  </span>
                )}
              </div>

              <div
                className="relative min-w-0 flex-1"
                style={{ height: 13, opacity: hover && !active ? 0.55 : 1 }}
              >
                <span
                  className="absolute top-0 bottom-0 w-px"
                  style={{ left: `${zeroPct}%`, background: "var(--color-line-strong)" }}
                  aria-hidden
                />
                <span
                  className="absolute top-0 block h-[11px] rounded-[3px]"
                  style={{
                    left: behind ? `${zeroPct - w}%` : `${zeroPct}%`,
                    width: `${Math.max(w, 0.4)}%`,
                    background: colorFor(row),
                  }}
                />
                <span
                  className="mono absolute top-[-1px] text-[11.5px] font-semibold"
                  style={{
                    left: behind ? undefined : `calc(${zeroPct + w}% + 6px)`,
                    right: behind ? `calc(${100 - zeroPct + w}% + 6px)` : undefined,
                    color: row.severity ? "var(--color-ink-900)" : "var(--color-ink-400)",
                  }}
                >
                  {row.delta >= 0 ? "+" : ""}
                  {row.delta}
                </span>
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

      <div
        className="mt-1 text-[11.5px] text-ink-400"
        style={{ paddingLeft: labelWidth }}
      >
        <span style={{ marginLeft: `calc(${zeroPct}% - 60px)` }}>
          {baselineLabel}
        </span>
      </div>
    </div>
  );
}
