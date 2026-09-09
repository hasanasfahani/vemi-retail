"use client";

/* Three measures at once — price on x, share on y, availability as the
   bubble. This is the one place a bubble chart earns its keep: it
   answers "is anyone buying share with price?" in a single look, and
   three separate bar charts would not.

   Every bubble is labelled on the plot, so identity never rests on
   colour alone. */

import {
  CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip, XAxis, YAxis, ZAxis, LabelList,
} from "recharts";
import ChartTooltip from "./ChartTooltip";
import { AXIS, GRID, brandColor } from "./theme";

export type Bubble = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  isClient?: boolean;
};

export default function BubbleScatter({
  points,
  xLabel,
  yLabel,
  xUnit = "",
  yUnit = "%",
  height = 320,
}: {
  points: Bubble[];
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  height?: number;
}) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  /* Padded domains, so no bubble sits half outside the plot. */
  const pad = (values: number[], factor: number) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = (max - min) || max || 1;
    return [Math.max(0, min - span * factor), max + span * factor] as [number, number];
  };

  return (
    <div style={{ height }} className="min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 24, bottom: 22, left: -6 }}>
          <CartesianGrid {...GRID} vertical />
          <XAxis
            type="number" dataKey="x" name={xLabel} domain={pad(xs, 0.18)}
            {...AXIS}
            tickFormatter={(v: number) => `${Math.round(v).toLocaleString()}${xUnit}`}
            label={{
              value: xLabel, position: "insideBottom", offset: -12,
              fill: "var(--color-ink-400)", fontSize: 11,
            }}
          />
          <YAxis
            type="number" dataKey="y" name={yLabel} domain={pad(ys, 0.22)}
            width={46}
            {...AXIS}
            tickFormatter={(v: number) => `${Math.round(v)}${yUnit}`}
          />
          <ZAxis type="number" dataKey="z" range={[220, 1500]} name="Availability" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "var(--color-line-strong)" }}
            content={
              <ChartTooltip
                format={(value, name) =>
                  name === xLabel
                    ? `${Math.round(value).toLocaleString()}${xUnit}`
                    : `${value}%`
                }
              />
            }
          />
          <Scatter data={points} isAnimationActive={false}>
            {points.map((point) => (
              <Cell
                key={point.id}
                fill={brandColor(point.id)}
                fillOpacity={point.isClient ? 0.92 : 0.78}
                stroke="white"
                strokeWidth={2}
              />
            ))}
            <LabelList
              dataKey="name"
              position="top"
              offset={10}
              style={{ fill: "var(--color-ink-500)", fontSize: 11, fontWeight: 600 }}
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
