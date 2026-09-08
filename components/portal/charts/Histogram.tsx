"use client";

/* Distribution across ordered bins — how a population is shaped, not
   how one item scores.

   Two uses in this product, and both answer a question no per-item
   chart can: how OLD are the gaps, and which SIDE of RRP do prices
   fall on. A ranked list of twenty SKUs cannot say "nothing is ever
   priced below list"; a distribution says it in one glance.

   Bins are ordered, so the ramp is sequential rather than categorical
   — position carries the meaning and colour only marks which bins sit
   outside the acceptable band. */

import { useState } from "react";

export type HistogramBin = {
  id: string;
  label: string;
  count: number;
  /* Outside the acceptable band — drawn in the status colour. */
  flagged?: boolean;
};

type Props = {
  bins: HistogramBin[];
  /* Names what one unit is, for the hover read-out. */
  unitNoun: string;
  /* Labels the shaded run of bins that count as healthy. */
  bandLabel?: string;
  /* Which bins form that band, by id. */
  bandIds?: string[];
};

export default function Histogram({
  bins,
  unitNoun,
  bandLabel,
  bandIds = [],
}: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(...bins.map((b) => b.count), 1);
  const total = bins.reduce((s, b) => s + b.count, 0);
  const band = new Set(bandIds);

  return (
    <div className="w-full">
      {bandLabel && (
        <div className="mb-2 flex items-center gap-1.5 text-[12px] text-ink-500">
          <span
            className="inline-block h-[11px] w-[16px] rounded-[3px]"
            style={{ background: "var(--color-comp-3)" }}
          />
          {bandLabel}
        </div>
      )}

      <div className="flex items-end gap-[3px]" style={{ height: 132 }}>
        {bins.map((bin) => {
          const active = hover === bin.id;
          const h = Math.max((bin.count / max) * 100, bin.count ? 3 : 0.8);
          return (
            <div
              key={bin.id}
              className="flex min-w-0 flex-1 flex-col justify-end"
              style={{ height: "100%" }}
              onMouseEnter={() => setHover(bin.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(bin.id)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              title={`${bin.label}: ${bin.count} ${unitNoun}${
                total ? ` (${Math.round((bin.count / total) * 100)}%)` : ""
              }`}
            >
              <span
                className="mono mb-1 text-center text-[11px] font-semibold text-ink-900"
                style={{ opacity: bin.count ? 1 : 0.35 }}
              >
                {bin.count}
              </span>
              <div
                className="rounded-t-[4px]"
                style={{
                  height: `${h}%`,
                  background: bin.flagged
                    ? "var(--color-critical)"
                    : band.has(bin.id)
                      ? "var(--color-comp-3)"
                      : "var(--color-violet)",
                  opacity: hover && !active ? 0.55 : 1,
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex gap-[3px]">
        {bins.map((bin) => (
          <span
            key={bin.id}
            className="min-w-0 flex-1 text-center text-[11px] leading-tight text-ink-500"
          >
            {bin.label}
          </span>
        ))}
      </div>
    </div>
  );
}
