/* Tiny inline sparkline — 2px Violet line on a flat Violet 100 area
   (brand: no gradients), the endpoint marked, no axes. */
export default function Sparkline({
  data,
  color = "var(--vm-chart-1)",
  width = 108,
  height = 34,
  area = true,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  area?: boolean;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const stepX = (width - pad * 2) / (data.length - 1);
  const pts = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (d - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const areaPath = `${line} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {area && <path d={areaPath} fill="var(--vm-chart-base)" opacity={0.8} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} stroke="var(--vm-surface)" strokeWidth="1.5" />
    </svg>
  );
}
