"use client";

/* Bars over a dimension, in two modes (brand charts.md: bars ≤28px,
   3px top radius, horizontal gridlines only).

   `stacked` (the default) is for COMPOSITION — shares of one fixture
   that add up to the whole. Segments carry a 2px surface gap so
   adjacent series stay separable, and the order is the series order,
   never size.

   `grouped` is for COMPARISON — independent measures side by side.
   Stacking two RATES would draw a bar reaching 175% of nothing. */

import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import ChartTooltip, { type Fmt } from "./ChartTooltip";
import { AXIS, GRID } from "./theme";

export type StackSeries = { key: string; name: string; color: string; outline?: string };

export default function StackedBars({
  data,
  series,
  xKey = "label",
  height = 240,
  unit = "%",
  max,
  format,
  layout = "vertical",
  mode = "stacked",
  label,
}: {
  data: Record<string, string | number>[];
  series: StackSeries[];
  xKey?: string;
  height?: number;
  unit?: string;
  max?: number;
  format?: Fmt;
  /* "vertical" = bars stand up; "horizontal" = bars lie down. */
  layout?: "vertical" | "horizontal";
  mode?: "stacked" | "grouped";
  /* The summary a screen reader hears for the whole chart. */
  label?: string;
}) {
  const flat = layout === "horizontal";
  const stacked = mode === "stacked";
  /* A 100% stack sums to 100 give or take rounding (100.2). Left to
     itself recharts widens the axis to fit that sliver and prints ticks
     like "99.99999%", so a given max is held with fixed, rounded ticks. */
  const top = max ?? 100;
  const ticks = [0, top / 4, top / 2, (top * 3) / 4, top].map((t) => Math.round(t * 10) / 10);
  const tick = (v: number) => `${Math.round(v * 10) / 10}${unit}`;
  const summary =
    label ?? `${stacked ? "Stacked" : "Grouped"} bars of ${series.map((s) => s.name).join(", ")} by ${xKey}`;
  return (
    <div style={{ height }} className="min-w-0" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={flat ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 12, bottom: 0, left: flat ? 8 : -4 }}
          barCategoryGap={flat ? "24%" : stacked ? "34%" : "26%"}
          barGap={stacked ? 0 : 4}
          maxBarSize={28}
        >
          <CartesianGrid {...GRID} vertical={flat} horizontal={!flat} />
          {flat ? (
            <>
              <XAxis type="number" domain={[0, top]} ticks={ticks} allowDataOverflow {...AXIS} tickFormatter={tick} />
              <YAxis type="category" dataKey={xKey} width={104} {...AXIS} tick={{ ...AXIS.tick, fill: "var(--vm-text)" }} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...AXIS} axisLine={{ stroke: "var(--vm-chart-grid)" }} />
              <YAxis width={48} domain={[0, top]} ticks={ticks} allowDataOverflow {...AXIS} tickFormatter={tick} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "var(--vm-primary-tint)", opacity: 0.6 }}
            content={<ChartTooltip format={format ?? ((v) => `${v}${unit}`)} />}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stackId={stacked ? "a" : undefined}
              fill={s.color}
              stroke={s.outline ?? "var(--vm-surface)"}
              strokeWidth={s.outline ? 1.5 : stacked ? 2 : 0}
              radius={
                stacked
                  ? i === series.length - 1
                    ? flat ? [0, 3, 3, 0] : [3, 3, 0, 0]
                    : 0
                  : flat ? [0, 3, 3, 0] : [3, 3, 0, 0]
              }
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
