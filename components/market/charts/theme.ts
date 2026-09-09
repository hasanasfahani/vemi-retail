/* Chart colour, decided once.

   Two rules the whole portal obeys:

   1. Colour follows the ENTITY, never its rank. Pepsi is the same
      violet whether it sits first or fourth, so a filter that drops a
      brand cannot repaint the survivors.
   2. The client's portfolio carries hue; everyone else is grey. This
      is not decoration — it is the argument the portal exists to make.
      Baghdad Soft Drinks' four brands step down one violet ramp so the
      portfolio reads as one body of colour, and Coca-Cola and RC Cola
      sit in neutrals so their share reads as ground, not as a rival
      accent competing for the eye.

   Coca-Cola gets the darkest neutral because it is the real
   competitor: it must be separable from RC Cola at a glance, which
   equal greys would not be. */

import { brands } from "@/lib/market";

export const BRAND_COLOR: Record<string, string> = {
  pepsi: "var(--color-violet)",
  "7up": "var(--color-stock-3)",
  mirinda: "var(--color-stock-2)",
  "mountain-dew": "var(--color-stock-1)",
  "coca-cola": "#7c828f",
  "rc-cola": "var(--color-comp-1)",
};

export const brandColor = (id: string) => BRAND_COLOR[id] ?? "var(--color-comp-2)";

/* Fixed draw order, so a stack keeps its band order between months and
   between pages: portfolio first, then competitors by size. */
export const BRAND_ORDER = [
  "pepsi", "7up", "mirinda", "mountain-dew", "coca-cola", "rc-cola",
];

export const orderedBrands = () =>
  [...brands].sort(
    (a, b) => BRAND_ORDER.indexOf(a.id) - BRAND_ORDER.indexOf(b.id)
  );

/* Shared axis / grid styling — recessive by construction: the data is
   the ink, the frame is a whisper. */
export const AXIS = {
  stroke: "var(--color-line-strong)",
  tick: { fill: "var(--color-ink-400)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

export const GRID = {
  stroke: "var(--color-line)",
  strokeDasharray: "0",
  vertical: false,
} as const;

/* One measure, one hue: the default line colour where the series is
   not a brand (execution score, coverage, compliance). */
export const MEASURE = "var(--color-violet)";
export const MEASURE_PRIOR = "var(--color-chart-prior)";
