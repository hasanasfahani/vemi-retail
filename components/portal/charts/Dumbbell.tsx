"use client";

/* Two points per row, joined by a rule — the house form.

   Deliberately NOT modelled as "previous" and "current". Any two-point
   comparison is this shape: July against August, you against a rival,
   cooler against ambient, this district against the city. So a row
   carries a generic pair `a` and `b`, and the caller names them once
   in the legend.

   `a` is drawn hollow and `b` solid, so the pair is distinguishable by
   shape before colour does any work — which also covers the small-move
   case, where the two marks overlap and the connector all but
   disappears. The overlapping mark gets a surface ring rather than a
   border so the pair stays countable at 0.3pt of separation. */

import { useState } from "react";

export type DumbbellRow = {
  id: string;
  label: string;
  a: number;
  b: number;
  emphasis?: boolean;
};

type Props = {
  rows: DumbbellRow[];
  /* Names for the two points — legend and tooltip use these. */
  aLabel: string;
  bLabel: string;
  unit?: string;
  /* Axis maximum; defaults to the largest value present, padded. */
  max?: number;
  labelWidth?: number;
};

const R = 5;

export default function Dumbbell({
  rows,
  aLabel,
  bLabel,
  unit = "%",
  max,
  labelWidth = 118,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const ceiling =
    max ?? Math.max(...rows.flatMap((r) => [r.a, r.b]), 1) * 1.08;
  const pct = (v: number) => Math.max(0, Math.min(100, (v / ceiling) * 100));

  return (
    <div className="w-full">
      {/* legend — always present, two series */}
      <div className="mb-2 flex flex-wrap items-center gap-4 pl-1 text-[12px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden>
            <circle
              cx="6"
              cy="6"
              r="4"
              fill="var(--color-paper)"
              stroke="var(--color-context-prior)"
              strokeWidth="2"
            />
          </svg>
          {aLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="12" height="12" aria-hidden>
            <circle cx="6" cy="6" r="4" fill="var(--color-chart-context)" />
          </svg>
          {bLabel}
        </span>
      </div>

      {rows.map((row) => {
        const active = hover === row.id;
        const aPct = pct(row.a);
        const bPct = pct(row.b);
        const delta = row.b - row.a;
        const solid = row.emphasis
          ? "var(--color-violet)"
          : "var(--color-chart-context)";
        const prior = row.emphasis
          ? "var(--color-chart-prior)"
          : "var(--color-context-prior)";

        return (
          <div
            key={row.id}
            className="group flex flex-col gap-1 py-[7px] sm:flex-row sm:items-center sm:gap-3"
            style={{ "--label-w": `${labelWidth}px` } as React.CSSProperties}
            onMouseEnter={() => setHover(row.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(row.id)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            title={`${row.label} — ${aLabel} ${row.a}${unit}, ${bLabel} ${row.b}${unit} (${
              delta >= 0 ? "+" : ""
            }${Math.round(delta * 10) / 10}${unit})`}
          >
            <div className="flex items-baseline justify-between gap-3 text-[13px] leading-tight sm:block sm:w-[var(--label-w)] sm:shrink-0 sm:text-right">
              <span
                className={
                  row.emphasis ? "font-semibold text-ink-900" : "text-ink-700"
                }
              >
                {row.label}
              </span>
              <span className="mono shrink-0 text-[12px] font-semibold text-ink-900 sm:hidden">
                {row.b}
                {unit}
              </span>
            </div>

            <div
              className="relative min-w-0 flex-1"
              style={{ height: 16, opacity: hover && !active ? 0.55 : 1 }}
            >
              {/* connector */}
              <span
                className="absolute top-1/2 block h-[2px] -translate-y-1/2"
                style={{
                  left: `${Math.min(aPct, bPct)}%`,
                  width: `${Math.abs(bPct - aPct)}%`,
                  background: prior,
                }}
              />
              {/* earlier point — hollow */}
              <span
                className="absolute top-1/2 block rounded-full"
                style={{
                  left: `${aPct}%`,
                  width: R * 2,
                  height: R * 2,
                  marginLeft: -R,
                  marginTop: -R,
                  background: "var(--color-paper)",
                  border: `2px solid ${prior}`,
                }}
              />
              {/* later point — solid, with a surface ring so it stays
                  countable when it overlaps its partner */}
              <span
                className="absolute top-1/2 block rounded-full"
                style={{
                  left: `${bPct}%`,
                  width: R * 2,
                  height: R * 2,
                  marginLeft: -R,
                  marginTop: -R,
                  background: solid,
                  boxShadow: "0 0 0 2px var(--color-paper)",
                }}
              />
            </div>

            <div className="mono hidden w-[86px] shrink-0 text-right text-[12.5px] sm:block">
              <span className="font-semibold text-ink-900">
                {row.b}
                {unit}
              </span>
              <span
                className="ml-1.5"
                style={{
                  color:
                    Math.abs(delta) < 0.05
                      ? "var(--color-ink-400)"
                      : delta > 0
                        ? "var(--color-good)"
                        : "var(--color-critical)",
                }}
              >
                {delta >= 0 ? "+" : ""}
                {Math.round(delta * 10) / 10}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
