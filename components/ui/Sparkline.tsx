/* Tiny inline sparkline — 2px line, optional soft area, no axes. */
export default function Sparkline({
  data,
  color = "var(--color-violet)",
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
  const id = `sk-${data.join("-").slice(0, 12)}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {area && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.16" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${id})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}
