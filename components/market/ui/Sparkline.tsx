/* Six points of trailing context beside a KPI. Hand-drawn SVG: a chart
   library for eleven pixels of line would cost more than it carries.
   Violet 2px line on a flat Violet 100 area; the last point is marked,
   because the figure the tile states is the endpoint of this line. */

export default function Sparkline({
  points,
  width = 76,
  height = 26,
  color = "var(--vm-chart-1)",
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
      <path d={area} fill="var(--vm-chart-base)" opacity={0.8} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(points.length - 1)} cy={y(points[points.length - 1])} r={3} fill={color} stroke="var(--vm-surface)" strokeWidth={1.5} />
    </svg>
  );
}
