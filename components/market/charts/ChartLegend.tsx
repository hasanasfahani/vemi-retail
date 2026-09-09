/* Identity is never colour alone: any chart with two or more series
   carries this, and swatch plus name sit together. A single-series
   chart takes no legend — its title already names it. */

export default function ChartLegend({
  items,
}: {
  items: { id: string; name: string; color: string; dashed?: boolean }[];
}) {
  if (items.length < 2) return null;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
          {item.dashed ? (
            <span
              className="h-[2px] w-4 shrink-0 rounded-full"
              style={{
                backgroundImage: `repeating-linear-gradient(to right, ${item.color} 0 4px, transparent 4px 7px)`,
              }}
              aria-hidden
            />
          ) : (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: item.color }}
              aria-hidden
            />
          )}
          {item.name}
        </li>
      ))}
    </ul>
  );
}
