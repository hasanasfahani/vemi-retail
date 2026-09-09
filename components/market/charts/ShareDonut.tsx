/* Shelf share as one ring, with the client's slice named in the middle.

   Hand-drawn arcs rather than a pie library: there are six slices in a
   fixed order with a fixed colour each, the legend has to carry the
   numbers anyway, and the centre has to state the one figure the page
   is about. A charting pie would give none of those for free.

   Slices are separated by a 2px surface gap, so neighbouring greys
   stay countable. */

import { brandColor } from "./theme";

export type Slice = { id: string; name: string; value: number };

export default function ShareDonut({
  slices,
  size = 168,
  centerLabel,
  centerValue,
}: {
  slices: Slice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = 2;

  /* Each arc starts where the ones before it ended. Written as a scan
     over the running total rather than a mutated accumulator — the
     React compiler rightly refuses a variable reassigned during
     render. */
  const arcs = slices.map((slice, i) => {
    const before = slices.slice(0, i).reduce((sum, s) => sum + s.value, 0);
    const len = (slice.value / total) * c;
    return {
      id: slice.id,
      dash: `${Math.max(0, len - gap)} ${c - Math.max(0, len - gap)}`,
      offset: -((before / total) * c),
      color: brandColor(slice.id),
    };
  });

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {arcs.map((arc) => (
              <circle
                key={arc.id}
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeDasharray={arc.dash}
                strokeDashoffset={arc.offset}
              />
            ))}
          </g>
        </svg>
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <span className="font-display text-[22px] font-bold leading-none tracking-tight text-ink-900">
              {centerValue}
            </span>
            <span className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
              {centerLabel}
            </span>
          </div>
        )}
      </div>

      <ul className="min-w-[150px] flex-1 flex-col gap-1.5">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-2 py-[3px] text-[12.5px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: brandColor(slice.id) }}
              aria-hidden
            />
            <span className="min-w-0 truncate text-ink-700">{slice.name}</span>
            <span className="mono ml-auto font-semibold text-ink-900">
              {((slice.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
