"use client";

/* A trailing series with its TARGET drawn on it.

   The plain sparkline showed a shape and left the reader to guess
   whether the shape was good. Here the target is a line across the
   plot, the area between the series and that line is tinted by which
   side it falls on, and the last point is marked — so the chart
   answers "are we there yet?" rather than only "which way is it
   going?".

   The y-scale always includes the target. A series drawn between 66
   and 68 with an 85 target off the top of the plot would look like a
   healthy climb. */

export default function TargetSpark({
  points,
  target,
  width = 132,
  height = 44,
  goodUp = true,
}: {
  points: number[];
  target: number;
  width?: number;
  height?: number;
  goodUp?: boolean;
}) {
  if (points.length < 2) return null;

  const pad = 4;
  const values = [...points, target];
  const min = Math.min(...values);
  const max = Math.max(...values);
  /* A little headroom, so the target line never sits on the frame. */
  const span = (max - min) || 1;
  const lo = min - span * 0.12;
  const hi = max + span * 0.12;

  const x = (i: number) => (i / (points.length - 1)) * (width - pad * 2) + pad;
  const y = (v: number) => height - pad - ((v - lo) / (hi - lo)) * (height - pad * 2);

  const line = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  const last = points[points.length - 1];
  const met = goodUp ? last >= target : last <= target;
  const color = met ? "var(--color-good)" : "var(--color-violet)";

  /* Fill between the series and the target line, which is the gap the
     reader is being asked to close. */
  const area =
    `${line} L${x(points.length - 1).toFixed(1)} ${y(target).toFixed(1)} ` +
    `L${x(0).toFixed(1)} ${y(target).toFixed(1)} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      role="img"
      aria-label={`Six cycles, latest ${last}, target ${target}`}
    >
      <path d={area} fill={color} opacity={0.12} />
      {/* the target */}
      <line
        x1={pad} y1={y(target)} x2={width - pad} y2={y(target)}
        stroke="var(--color-ink-400)" strokeWidth={1} strokeDasharray="3 2.5"
      />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((v, i) =>
        i === points.length - 1 ? null : (
          <circle key={i} cx={x(i)} cy={y(v)} r={1.4} fill={color} opacity={0.5} />
        )
      )}
      <circle
        cx={x(points.length - 1)}
        cy={y(last)}
        r={3}
        fill={color}
        stroke="white"
        strokeWidth={1.6}
      />
    </svg>
  );
}
