"use client";

/* Composition over a dimension — shelf share by brand across months,
   cities or channels. Segments carry a 2px white gap so adjacent
   brands stay separable without an outline, and the stack order is
   fixed by BRAND_ORDER rather than by size. */

import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import ChartTooltip, { type Fmt } from "./ChartTooltip";
import { AXIS, GRID } from "./theme";

export type StackSeries = { key: string; name: string; color: string };

export default function StackedBars({
  data,
  series,
  xKey = "label",
  height = 240,
  unit = "%",
  max,
  format,
  layout = "vertical",
}: {
  data: Record<string, string | number>[];
  series: StackSeries[];
  xKey?: string;
  height?: number;
  unit?: string;
  max?: number;
  format?: Fmt;
  /* "vertical" = bars stand up (months across the bottom).
     "horizontal" = bars lie down (a ranked list of cities). */
  layout?: "vertical" | "horizontal";
}) {
  const flat = layout === "horizontal";
  return (
    <div style={{ height }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={flat ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 10, bottom: 0, left: flat ? 8 : -6 }}
          barCategoryGap={flat ? "22%" : "34%"}
        >
          <CartesianGrid {...GRID} vertical={flat} horizontal={!flat} />
          {flat ? (
            <>
              <XAxis type="number" domain={[0, max ?? 100]} {...AXIS} tickFormatter={(v: number) => `${v}${unit}`} />
              <YAxis type="category" dataKey={xKey} width={96} {...AXIS} />
            </>
          ) : (
            <>
              <XAxis dataKey={xKey} {...AXIS} />
              <YAxis width={44} domain={[0, max ?? 100]} {...AXIS} tickFormatter={(v: number) => `${v}${unit}`} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "var(--color-canvas)" }}
            content={<ChartTooltip format={format ?? ((v) => `${v}${unit}`)} />}
          />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stackId="a"
              fill={s.color}
              stroke="white"
              strokeWidth={2}
              radius={i === series.length - 1 ? (flat ? [0, 4, 4, 0] : [4, 4, 0, 0]) : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
