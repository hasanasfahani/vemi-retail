/* Shelf share as one ring, with the client's slice named in the middle.

   Hand-drawn arcs rather than a pie library: there are six slices in a
   fixed order with a fixed colour each, the legend has to carry the
   numbers anyway, and the centre has to state the one figure the page
   is about. A charting pie would give none of those for free.

   Slices are separated by a 2px surface gap, so neighbouring greys
   stay countable. */

import { brandColor } from "./theme";

export type Slice = { id: string; name: string; value: number };

/* A donut is not always about brands. Out-of-stock reasons, channel
   mixes and POSM types are categorical too, and running them through
   `brandColor` painted every slice the same fallback grey — a chart
   with one colour is a chart with no encoding.

   Fixed order, assigned by position and never cycled, so a reason
   keeps its colour when another one drops out of the filter. These are
   steps from the portal's own ramps rather than new hues, and the
   legend carries every value in text, so nothing rests on colour
   alone. */
export const CATEGORY_COLORS = [
  "var(--color-violet)",
  "var(--color-stock-2)",
  "var(--color-serious)",
  "var(--color-warn)",
  "#7c828f",
  "var(--color-comp-1)",
];

export default function ShareDonut({
  slices,
  size = 168,
  centerLabel,
  centerValue,
  palette = "brand",
}: {
  slices: Slice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  /* "brand" keys colour to the brand id, so Pepsi is the same violet
     in every chart. "category" assigns from a fixed sequence, for
     slices that are not brands. */
  palette?: "brand" | "category";
}) {
  const colorOf = (id: string, index: number) =>
    palette === "brand" ? brandColor(id) : CATEGORY_COLORS[index % CATEGORY_COLORS.length];

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
      color: colorOf(slice.id, i),
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
        {slices.map((slice, i) => (
          <li key={slice.id} className="flex items-center gap-2 py-[3px] text-[12.5px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: colorOf(slice.id, i) }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 leading-snug text-ink-700">{slice.name}</span>
            <span className="mono ml-auto font-semibold text-ink-900">
              {((slice.value / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
