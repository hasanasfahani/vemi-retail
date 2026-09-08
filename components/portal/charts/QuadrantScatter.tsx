"use client";

/* Two metrics at once, so the diagnosis falls out of the position.

   Distribution and availability are shown as separate bars today,
   which makes them look like two problems. They are not: a SKU listed
   everywhere but frequently empty needs replenishment, while one that
   is well-stocked wherever it is listed but carried in few stores
   needs a listing conversation. Same two numbers, opposite fixes —
   and a scatter is the only form where "which of the two" is read
   from where a point sits rather than by comparing two lists.

   Quadrant lines are the panel's own averages, not round numbers, so
   the labels describe this market rather than an imported standard. */

import { useState } from "react";

export type ScatterPoint = {
  id: string;
  label: string;
  x: number;
  y: number;
  emphasis?: boolean;
  meta?: string;
};

type Props = {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  /* Where the crosshairs sit — the panel averages. */
  xDivider: number;
  yDivider: number;
  /* Corner captions, clockwise from top-left. */
  quadrants: { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
  unit?: string;
};

export default function QuadrantScatter({
  points,
  xLabel,
  yLabel,
  xDivider,
  yDivider,
  quadrants,
  unit = "%",
}: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const pad = 6;
  const xMin = Math.max(0, Math.min(...xs, xDivider) - pad);
  const xMax = Math.min(100, Math.max(...xs, xDivider) + pad);
  const yMin = Math.max(0, Math.min(...ys, yDivider) - pad);
  const yMax = Math.min(100, Math.max(...ys, yDivider) + pad);

  const px = (v: number) => ((v - xMin) / (xMax - xMin || 1)) * 100;
  const py = (v: number) => 100 - ((v - yMin) / (yMax - yMin || 1)) * 100;

  const active = points.find((p) => p.id === hover);

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <div
          className="flex shrink-0 items-center justify-center text-[11px] font-semibold uppercase tracking-wide text-ink-400"
          style={{ writingMode: "vertical-rl", rotate: "180deg", width: 18 }}
        >
          {yLabel}
        </div>

        <div
          className="relative min-w-0 flex-1 rounded-[10px] border border-line bg-canvas"
          style={{ height: 260 }}
        >
          {/* quadrant dividers — the panel's own averages */}
          <span
            className="pointer-events-none absolute top-0 bottom-0 w-px"
            style={{ left: `${px(xDivider)}%`, background: "var(--color-line-strong)" }}
            aria-hidden
          />
          <span
            className="pointer-events-none absolute right-0 left-0 h-px"
            style={{ top: `${py(yDivider)}%`, background: "var(--color-line-strong)" }}
            aria-hidden
          />

          <span className="pointer-events-none absolute left-2 top-2 max-w-[45%] text-[10.5px] leading-tight text-ink-400">
            {quadrants.topLeft}
          </span>
          <span className="pointer-events-none absolute right-2 top-2 max-w-[45%] text-right text-[10.5px] leading-tight text-ink-400">
            {quadrants.topRight}
          </span>
          <span className="pointer-events-none absolute bottom-2 left-2 max-w-[45%] text-[10.5px] leading-tight text-ink-400">
            {quadrants.bottomLeft}
          </span>
          <span className="pointer-events-none absolute right-2 bottom-2 max-w-[45%] text-right text-[10.5px] leading-tight text-ink-400">
            {quadrants.bottomRight}
          </span>

          {points.map((p) => {
            const on = hover === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(p.id)}
                onBlur={() => setHover(null)}
                aria-label={`${p.label}: ${xLabel} ${p.x}${unit}, ${yLabel} ${p.y}${unit}`}
                /* The hit area is deliberately larger than the mark —
                   an 8px dot you must land on dead-centre is not a
                   target, it is a test. */
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-2 outline-none"
                style={{ left: `${px(p.x)}%`, top: `${py(p.y)}%` }}
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: p.emphasis ? 11 : 9,
                    height: p.emphasis ? 11 : 9,
                    background: p.emphasis
                      ? "var(--color-violet)"
                      : "var(--color-chart-context)",
                    boxShadow: on
                      ? "0 0 0 2px var(--color-paper), 0 0 0 4px var(--color-ink-900)"
                      : "0 0 0 2px var(--color-paper)",
                    opacity: hover && !on ? 0.5 : 1,
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-1.5 pl-[26px] text-center text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {xLabel}
      </div>

      {/* fixed read-out slot, so the plot never jumps */}
      <div className="mt-2 flex h-[34px] items-center rounded-lg bg-canvas px-3">
        {active ? (
          <span className="text-[13px]">
            <span className="font-semibold text-ink-900">{active.label}</span>
            {active.meta && <span className="text-ink-400"> · {active.meta}</span>}
            <span className="text-ink-400">
              {" "}
              · {xLabel.toLowerCase()}{" "}
            </span>
            <span className="mono font-semibold text-ink-900">
              {active.x}
              {unit}
            </span>
            <span className="text-ink-400"> · {yLabel.toLowerCase()} </span>
            <span className="mono font-semibold text-ink-900">
              {active.y}
              {unit}
            </span>
          </span>
        ) : (
          <span className="text-[13px] text-ink-400">
            Hover any point for its two figures. The lines are the panel
            average on each axis.
          </span>
        )}
      </div>
    </div>
  );
}
