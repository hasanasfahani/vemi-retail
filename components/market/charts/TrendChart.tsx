"use client";

/* Change over time (brand charts.md): 2px lines, no dots except the
   active point, horizontal gridlines only, ONE y-axis. A single series
   sits on a flat Violet 100 area; a target is an Ink dashed line; the
   one anomaly worth flagging gets a Signal dot, never a Signal series.

   A series can declare `dashed`, which is how the market line (every
   audited outlet) and the core-panel line (the same doors every month)
   share a chart without pretending to be the same population. */

import {
  Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import ChartTooltip, { type Fmt } from "./ChartTooltip";
import { AXIS, GRID, MEASURE, SIGNAL } from "./theme";

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
  target,
  anomaly,
  label,
}: {
  data: Record<string, string | number>[];
  series: Series[];
  xKey?: string;
  height?: number;
  domain?: [number | "auto" | "dataMin", number | "auto" | "dataMax"];
  unit?: string;
  format?: Fmt;
  target?: number;
  /* The single point to flag: the x value and the series it sits on. */
  anomaly?: { x: string; key: string };
  label?: string;
}) {
  const single = series.length === 1;
  const flagged = anomaly ? data.find((d) => String(d[xKey]) === anomaly.x) : undefined;
  return (
    <div
      style={{ height }}
      className="min-w-0"
      role="img"
      aria-label={label ?? `Trend of ${series.map((s) => s.name).join(", ")}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -4 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey={xKey} {...AXIS} axisLine={{ stroke: "var(--vm-chart-grid)" }} />
          <YAxis {...AXIS} width={48} domain={domain ?? ["auto", "auto"]} tickFormatter={(v: number) => `${v}${unit}`} />
          <Tooltip
            cursor={{ stroke: "var(--vm-line-strong)", strokeWidth: 1 }}
            content={<ChartTooltip format={format ?? ((v) => `${v}${unit}`)} />}
          />
          {single && (
            <Area
              type="monotone"
              dataKey={series[0].key}
              name={series[0].name}
              fill="var(--vm-chart-base)"
              fillOpacity={0.7}
              stroke="none"
              isAnimationActive={false}
              legendType="none"
              tooltipType="none"
            />
          )}
          {target !== undefined && (
            <ReferenceLine y={target} stroke="var(--vm-text)" strokeDasharray="4 3" strokeWidth={1} />
          )}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color ?? MEASURE}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "4 3" : undefined}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--vm-surface)" }}
              isAnimationActive={false}
            />
          ))}
          {flagged && anomaly && (
            <ReferenceDot
              x={anomaly.x}
              y={Number(flagged[anomaly.key])}
              r={5}
              fill={SIGNAL}
              stroke="var(--vm-surface)"
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
