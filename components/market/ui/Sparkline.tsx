/* Six points of trailing context beside a KPI. Hand-drawn SVG: a chart
   library for eleven pixels of line would cost more than it carries.

   The last point is emphasised — the figure the tile states is the
   endpoint of this line, and the eye should land there. */

export default function Sparkline({
  points,
  width = 76,
  height = 26,
  color = "var(--color-violet)",
}: {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pad = 3;
  const x = (i: number) => (i / (points.length - 1)) * (width - pad * 2) + pad;
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${d} L${x(points.length - 1).toFixed(1)} ${height} L${x(0).toFixed(1)} ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <path d={area} fill={color} opacity={0.09} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r={2.6} fill={color} stroke="white" strokeWidth={1.4} />
    </svg>
  );
}
