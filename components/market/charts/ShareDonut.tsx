/* Share of a whole, as a CompositionBar (brand charts.md: avoid pies).

   The file and component keep their old name so every caller keeps
   working, but the ring is gone: one 100% bar in a fixed order, the
   headline figure above it, and a legend that carries every value in
   text — so nothing rests on colour or on judging arc lengths.

   Segments are separated by a 2px surface gap so neighbours stay
   countable; the lightest portfolio step carries a violet outline. */

import { brandColor, brandOutline } from "./theme";

export type Slice = { id: string; name: string; value: number };

/* Categorical sets that are not brands (out-of-stock reasons, channel
   mixes, POSM types): assigned by position and never cycled, so a
   category keeps its colour when another drops out of the filter. The
   first three are the series colours; beyond three, the portfolio
   ramp continues (violet on the Vemi surface, blue in the portal). The legend carries every value in text. */
export const CATEGORY_COLORS = [
  "var(--vm-chart-1)",
  "var(--vm-chart-2)",
  "var(--vm-chart-3)",
  "var(--vm-portfolio-2)",
  "var(--vm-portfolio-3)",
  "var(--vm-line-strong)",
];

export default function ShareDonut({
  slices,
  centerLabel,
  centerValue,
  palette = "brand",
}: {
  slices: Slice[];
  /* Kept for callers; the bar takes its container's width. */
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  /* "brand" keys colour to the brand id, so Pepsi is the same colour in
     every chart; "category" assigns from the fixed sequence. */
  palette?: "brand" | "category";
}) {
  const colorOf = (id: string, index: number) =>
    palette === "brand" ? brandColor(id) : CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  const outlineOf = (id: string) => (palette === "brand" ? brandOutline(id) : undefined);

  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const pct = (v: number) => (v / total) * 100;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {(centerValue || centerLabel) && (
        <div className="flex items-baseline gap-2">
          {centerValue && <span className="tnum text-[28px] leading-none">{centerValue}</span>}
          {centerLabel && <span className="vm-label">{centerLabel}</span>}
        </div>
      )}
      <div
        className="flex h-6 w-full overflow-hidden rounded-sm"
        role="img"
        aria-label={slices.map((s) => `${s.name} ${pct(s.value).toFixed(1)}%`).join(", ")}
      >
        {slices.map((slice, i) => (
          <span
            key={slice.id}
            className="h-full border-r-2 border-white last:border-r-0"
            style={{
              width: `${pct(slice.value)}%`,
              background: colorOf(slice.id, i),
              boxShadow: outlineOf(slice.id) ? `inset 0 0 0 1.5px ${outlineOf(slice.id)}` : undefined,
            }}
            title={`${slice.name} ${pct(slice.value).toFixed(1)}%`}
          />
        ))}
      </div>
      <ul className="flex flex-col">
        {slices.map((slice, i) => (
          <li key={slice.id} className="flex items-center gap-2 border-b border-line py-1.5 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{
                background: colorOf(slice.id, i),
                boxShadow: outlineOf(slice.id) ? `inset 0 0 0 1.5px ${outlineOf(slice.id)}` : undefined,
              }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 text-text">{slice.name}</span>
            <span className="mono ml-auto font-semibold text-text">{pct(slice.value).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { ShareDonut as CompositionBar };
