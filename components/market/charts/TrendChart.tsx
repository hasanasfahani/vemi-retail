"use client";

/* Change over time — the six-month lines every page eventually wants.

   Two things this component insists on. There is exactly ONE y-axis:
   two measures of different scale get two charts, never a second
   scale. And a series can declare `dashed`, which is how the market
   line (breadth, every audited outlet) and the core-panel line (the
   same 400 doors every month) sit on one chart without pretending to
   be the same population. */

import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import ChartTooltip, { type Fmt } from "./ChartTooltip";
import { AXIS, GRID, MEASURE } from "./theme";

export type Series = {
  key: string;
  name: string;
  color?: string;
  dashed?: boolean;
};

export default function TrendChart({
  data,
  series,
  xKey = "label",
  height = 220,
  domain,
  unit = "",
  format,
}: {
  data: Record<string, string | number>[];
  series: Series[];
  xKey?: string;
  height?: number;
  domain?: [number | "auto" | "dataMin", number | "auto" | "dataMax"];
  unit?: string;
  format?: Fmt;
}) {
  return (
    <div style={{ height }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -6 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey={xKey} {...AXIS} />
          <YAxis
            {...AXIS}
            width={44}
            domain={domain ?? ["auto", "auto"]}
            tickFormatter={(v: number) => `${v}${unit}`}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-line-strong)", strokeWidth: 1 }}
            content={<ChartTooltip format={format ?? ((v) => `${v}${unit}`)} />}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color ?? MEASURE}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "4 3" : undefined}
              dot={{ r: 2.5, strokeWidth: 0, fill: s.color ?? MEASURE }}
              activeDot={{ r: 4.5, strokeWidth: 2, stroke: "white" }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
