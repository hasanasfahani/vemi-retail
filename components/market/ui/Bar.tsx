/* An inline proportion — shelf share against par, a brand's slice of a
   ranked list, a compliance rate. The bar is the comparison; the
   number beside it is the fact, and both are always shown.

   `par` draws a reference tick, so a share bar can say "40% is the
   target" without a legend. */

export default function Bar({
  value,
  max = 100,
  par,
  color = "var(--color-violet)",
  height = 7,
  label,
}: {
  value: number;
  max?: number;
  par?: number;
  color?: string;
  height?: number;
  label?: string;
}) {
  const pct = max === 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const parPct = par === undefined || max === 0 ? null : Math.max(0, Math.min(100, (par / max) * 100));

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div
        className="relative min-w-0 flex-1 overflow-hidden rounded-full bg-canvas"
        style={{ height }}
        role="img"
        aria-label={label ?? `${value} of ${max}`}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
        {parPct !== null && (
          <span
            className="absolute top-0 h-full w-[2px] bg-ink-400"
            style={{ left: `${parPct}%` }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
