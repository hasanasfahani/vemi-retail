/* Identity is never colour alone: any chart with two or more series
   carries this, swatch and name together, in series order. A
   single-series chart takes no legend — its title already names it. */

export default function ChartLegend({
  items,
}: {
  items: { id: string; name: string; color: string; dashed?: boolean; outline?: string }[];
}) {
  if (items.length < 2) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-1.5 text-sm text-ink-700">
          {item.dashed ? (
            <svg width="16" height="4" aria-hidden className="shrink-0">
              <line x1="0" y1="2" x2="16" y2="2" stroke={item.color} strokeWidth="2" strokeDasharray="4 3" />
            </svg>
          ) : (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: item.color, boxShadow: item.outline ? `inset 0 0 0 1.5px ${item.outline}` : undefined }}
              aria-hidden
            />
          )}
          {item.name}
        </li>
      ))}
    </ul>
  );
}
