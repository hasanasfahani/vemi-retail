/* Chart colour, decided once (brand v1.0, plan D2).

   Three rules the whole portal obeys:

   1. SERIES ORDER IS MEANING. The brand allows three series: the
      client (Violet, chart-1), the key competitor (Ink, chart-2) and
      everyone else (Slate, chart-3). Share charts default to exactly
      those three — "Your portfolio", the strongest rival, "Others" —
      built from each row's brand figures by `threeSeriesRows`.

   2. Colour follows the ENTITY, never its rank. Pepsi is the same
      violet whether it sits first or fourth, so a filter that drops a
      brand cannot repaint the survivors.

   3. Where a chart is about the portfolio itself, it may split it
      ("Split portfolio"): the client's brands step down one violet ramp
      (Violet, Violet 400, Violet 300, Violet 100 with an outline) so
      the portfolio still reads as one body of colour, while rivals keep
      Ink and Slate. */

import { brands, portfolioBrands } from "@/lib/market";

const PORTFOLIO_RAMP = [
  "var(--vm-portfolio-1)",
  "var(--vm-portfolio-2)",
  "var(--vm-portfolio-3)",
  "var(--vm-portfolio-4)",
];

const portfolioIds = new Set(portfolioBrands.map((b) => b.id));

/* The key competitor is the strongest brand outside the client's
   portfolio — derived, so re-pointing the portal at another client
   re-derives it. */
export const keyCompetitor = brands
  .filter((b) => !portfolioIds.has(b.id))
  .sort((a, b) => b.strength - a.strength)[0];

/* Fixed draw order, so a stack keeps its band order between months and
   between pages: portfolio (client first), the key competitor, others. */
export const BRAND_ORDER = [
  ...portfolioBrands.filter((b) => b.client).map((b) => b.id),
  ...portfolioBrands.filter((b) => !b.client).map((b) => b.id),
  keyCompetitor.id,
  ...brands.filter((b) => !portfolioIds.has(b.id) && b.id !== keyCompetitor.id).map((b) => b.id),
];

export const BRAND_COLOR: Record<string, string> = Object.fromEntries(
  BRAND_ORDER.map((id) => {
    if (portfolioIds.has(id)) {
      const i = BRAND_ORDER.filter((x) => portfolioIds.has(x)).indexOf(id);
      return [id, PORTFOLIO_RAMP[Math.min(i, PORTFOLIO_RAMP.length - 1)]];
    }
    return [id, id === keyCompetitor.id ? "var(--vm-chart-2)" : "var(--vm-chart-3)"];
  })
);

export const brandColor = (id: string) => BRAND_COLOR[id] ?? "var(--vm-chart-3)";

/* The lightest portfolio step (Violet 100) disappears on a white card,
   so it is drawn with a Violet outline. Returns the stroke a mark
   needs, or undefined. */
export const brandOutline = (id: string) =>
  brandColor(id) === "var(--vm-portfolio-4)" ? "var(--vm-portfolio-1)" : undefined;

export const orderedBrands = () =>
  [...brands].sort((a, b) => BRAND_ORDER.indexOf(a.id) - BRAND_ORDER.indexOf(b.id));

/* ---- The three brand series (plan D2) ---------------------------- */

export const SERIES3 = [
  { key: "portfolio", name: "Your portfolio", color: "var(--vm-chart-1)" },
  { key: "competitor", name: keyCompetitor.name, color: "var(--vm-chart-2)" },
  { key: "others", name: "Others", color: "var(--vm-chart-3)" },
] as const;

/* Adds portfolio / competitor / others to rows keyed by brand id (the
   shape every brand-share breakdown already has). Values are summed,
   so shares stay shares and counts stay counts. */
export function threeSeriesRows<T extends Record<string, string | number>>(
  rows: T[]
): (T & { portfolio: number; competitor: number; others: number })[] {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return rows.map((row) => {
    let portfolio = 0;
    let others = 0;
    for (const b of brands) {
      const v = Number(row[b.id] ?? 0);
      if (portfolioIds.has(b.id)) portfolio += v;
      else if (b.id !== keyCompetitor.id) others += v;
    }
    return {
      ...row,
      portfolio: r1(portfolio),
      competitor: r1(Number(row[keyCompetitor.id] ?? 0)),
      others: r1(others),
    };
  });
}

/* The series a brand chart draws: three by default, the full split on
   request. */
export function brandSeries(split: boolean) {
  return split
    ? orderedBrands().map((b) => ({ key: b.id, name: b.name, color: brandColor(b.id), outline: brandOutline(b.id) }))
    : SERIES3.map((s) => ({ ...s, outline: undefined as string | undefined }));
}

/* ---- Axes and grid (brand charts.md) -----------------------------
   Horizontal gridlines only, in chart-grid. Axis labels mono 12 Slate.
   No axis line on the value axis. */
export const AXIS = {
  stroke: "var(--vm-chart-grid)",
  tick: { fill: "var(--vm-text-muted)", fontSize: 12, fontFamily: "var(--vm-font-mono)" },
  tickLine: false,
  axisLine: false,
} as const;

export const GRID = {
  stroke: "var(--vm-chart-grid)",
  strokeDasharray: "0",
  vertical: false,
} as const;

/* One measure, one hue: the default mark where the series is not a
   brand (execution score, coverage, compliance). The earlier point of a
   dumbbell is Violet 400, drawn hollow. */
export const MEASURE = "var(--vm-chart-1)";
export const MEASURE_PRIOR = "var(--vm-portfolio-2)";

/* The anomaly flag: one Signal dot with a 2px surface ring, never a
   series. */
export const SIGNAL = "var(--vm-signal)";

/* A brand swatch's style: its colour, plus the outline the lightest
   portfolio step needs to hold on a white card. */
export const brandSwatch = (id: string) => ({
  background: brandColor(id),
  boxShadow: brandOutline(id) ? `inset 0 0 0 1.5px ${brandOutline(id)}` : undefined,
});
