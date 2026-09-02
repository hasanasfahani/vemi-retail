"use client";

/* Observed price spread per SKU, plotted as variance from that SKU's
   own RRP rather than in absolute dinars.

   A shared dinar axis would squash a 330ml can (≈1,000 IQD) against a
   2.25L bottle (≈2,500 IQD) and comparing them in absolute terms says
   nothing anyway. Indexed to RRP, every row is on one axis and the
   question the page actually asks — how far off list does this pack
   sell? — is readable straight down the column.

   The band runs min → max, the dot is the average, and the centre rule
   is RRP. Dinar values ride the row end, so nothing is gated behind a
   hover. */

import { useState } from "react";

export type BandRow = {
  id: string;
  label: string;
  meta?: string;
  min: number;
  avg: number;
  max: number;
  rrp: number;
  emphasis?: boolean;
};

const pctOf = (value: number, rrp: number) => ((value - rrp) / rrp) * 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

export default function PriceBand({ rows }: { rows: BandRow[] }) {
  const [hover, setHover] = useState<string | null>(null);

  /* One symmetric axis for every row, so bands are directly comparable. */
  const spread = Math.max(
    ...rows.flatMap((r) => [
      Math.abs(pctOf(r.min, r.rrp)),
      Math.abs(pctOf(r.max, r.rrp)),
    ]),
    6
  );
  const bound = Math.ceil((spread + 2) / 5) * 5;
  const scale = (pct: number) => ((pct + bound) / (bound * 2)) * 100;

  const ticks = [-bound, -bound / 2, 0, bound / 2, bound];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[12px] text-ink-700">
        <span className="flex items-center gap-1.5">
          <span
            className="h-[6px] w-[22px] rounded-full"
            style={{ background: "var(--color-chart-context)", opacity: 0.32 }}
          />
          Observed range
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-[9px] w-[9px] rounded-full"
            style={{ background: "var(--color-violet)" }}
          />
          Average
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-[14px] w-[2px]"
            style={{ background: "var(--color-ink-900)" }}
          />
          RRP
        </span>
      </div>

      {rows.map((row) => {
        const active = hover === row.id;
        const minPct = pctOf(row.min, row.rrp);
        const maxPct = pctOf(row.max, row.rrp);
        const avgPct = pctOf(row.avg, row.rrp);
        const left = scale(minPct);
        const width = Math.max(scale(maxPct) - left, 0.7);

        return (
          <div
            key={row.id}
            className="flex flex-col gap-1 py-[6px] sm:flex-row sm:items-center sm:gap-3"
            onMouseEnter={() => setHover(row.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(row.id)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            title={`${row.label}: ${row.min.toLocaleString()}–${row.max.toLocaleString()} IQD, average ${row.avg.toLocaleString()} against RRP ${row.rrp.toLocaleString()}`}
          >
            <div className="flex items-baseline justify-between gap-3 text-[13px] leading-tight sm:block sm:w-[164px] sm:shrink-0 sm:text-right">
              <span>
                <span
                  className={
                    row.emphasis ? "font-semibold text-ink-900" : "text-ink-700"
                  }
                >
                  {row.label}
                </span>
                {row.meta && (
                  <span className="block text-[11px] text-ink-400">{row.meta}</span>
                )}
              </span>
              <span className="mono shrink-0 whitespace-nowrap font-semibold text-ink-900 sm:hidden">
                {row.avg.toLocaleString()}
                <span
                  className="ml-1"
                  style={{
                    color: avgPct > 0 ? "var(--color-serious)" : "var(--color-good)",
                  }}
                >
                  {avgPct > 0 ? "+" : "−"}
                  {Math.abs(round1(avgPct))}%
                </span>
              </span>
            </div>

            <div className="relative h-[20px] min-w-0 flex-1">
              {/* recessive gridlines, solid hairlines */}
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full w-px"
                  style={{
                    left: `${scale(t)}%`,
                    background:
                      t === 0 ? "var(--color-ink-900)" : "var(--color-line)",
                  }}
                />
              ))}

              <div
                className="absolute top-1/2 h-[6px] -translate-y-1/2 rounded-full"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: row.emphasis
                    ? "var(--color-violet)"
                    : "var(--color-chart-context)",
                  opacity: active ? 0.5 : 0.32,
                }}
              />

              <div
                className="absolute top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${scale(avgPct)}%`,
                  background: row.emphasis
                    ? "var(--color-violet)"
                    : "var(--color-chart-context)",
                  boxShadow: "0 0 0 2px #fff",
                }}
              />
            </div>

            <div className="mono hidden w-[132px] shrink-0 text-right text-[13px] sm:block">
              <span className="font-semibold text-ink-900">
                {row.avg.toLocaleString()}
              </span>
              <span className="text-ink-400"> IQD </span>
              <span
                className="font-semibold"
                style={{
                  color:
                    avgPct > 0 ? "var(--color-serious)" : "var(--color-good)",
                }}
              >
                {avgPct > 0 ? "+" : "−"}
                {Math.abs(round1(avgPct))}%
              </span>
            </div>
          </div>
        );
      })}

      {/* axis */}
      <div className="mt-2 flex gap-3">
        <div className="hidden w-[164px] shrink-0 sm:block" />
        <div className="relative h-4 min-w-0 flex-1">
          {ticks.map((t) => (
            <span
              key={t}
              className="mono absolute top-0 -translate-x-1/2 text-[11px] text-ink-400"
              style={{ left: `${scale(t)}%` }}
            >
              {t > 0 ? `+${t}` : t}%
            </span>
          ))}
        </div>
        <div className="hidden w-[132px] shrink-0 sm:block" />
      </div>
    </div>
  );
}
