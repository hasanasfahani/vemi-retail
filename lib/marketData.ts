import { coverage } from "@/lib/content";

/* ------------------------------------------------------------------
   Shared mock "market" model — the single source the interactive hero
   dashboard AND the coverage map both read from, so the whole page
   tells one coherent story. All values are illustrative.

   Health rule (drives map pin color + status badges):
     out-of-stock present  -> critical (red)
     else price violations  -> warn (amber)
     else                   -> good (green)
------------------------------------------------------------------ */

export type Health = "good" | "warn" | "critical";

export type CityPerf = {
  name: string;
  pos: number;
  updated: string;
  availability: number; // %
  shelfShare: number; // %
  oos: number; // SKUs out of stock
  violations: number; // price violations flagged
  shareTrend: number[]; // shelf share, W21–W28
  availTrend: number[]; // availability, W21–W28
  health: Health;
  headline: string; // one-line status for tooltips
};

const perf: Record<
  string,
  Omit<CityPerf, "name" | "pos" | "updated" | "health">
> = {
  Baghdad: {
    availability: 71, shelfShare: 28, oos: 12, violations: 2,
    shareTrend: [22, 23, 24, 24, 26, 27, 27, 28],
    availTrend: [74, 73, 72, 70, 71, 70, 72, 71],
    headline: "12 SKUs out of stock — action needed",
  },
  Basra: {
    availability: 78, shelfShare: 24, oos: 0, violations: 5,
    shareTrend: [20, 21, 21, 22, 22, 23, 23, 24],
    availTrend: [72, 73, 74, 75, 76, 77, 77, 78],
    headline: "5 price violations flagged",
  },
  Mosul: {
    availability: 74, shelfShare: 22, oos: 0, violations: 3,
    shareTrend: [19, 19, 20, 20, 21, 21, 22, 22],
    availTrend: [70, 71, 71, 72, 73, 73, 74, 74],
    headline: "3 price violations flagged",
  },
  Erbil: {
    availability: 82, shelfShare: 26, oos: 0, violations: 0,
    shareTrend: [23, 23, 24, 24, 25, 25, 26, 26],
    availTrend: [78, 79, 80, 80, 81, 81, 82, 82],
    headline: "All clear — no active alerts",
  },
  Najaf: {
    availability: 80, shelfShare: 25, oos: 0, violations: 0,
    shareTrend: [22, 22, 23, 23, 24, 24, 25, 25],
    availTrend: [76, 77, 78, 78, 79, 79, 80, 80],
    headline: "All clear — no active alerts",
  },
  Karbala: {
    availability: 79, shelfShare: 24, oos: 0, violations: 0,
    shareTrend: [21, 22, 22, 23, 23, 24, 24, 24],
    availTrend: [75, 76, 77, 77, 78, 78, 79, 79],
    headline: "All clear — no active alerts",
  },
  Sulaymaniyah: {
    availability: 83, shelfShare: 27, oos: 0, violations: 0,
    shareTrend: [24, 24, 25, 25, 26, 26, 27, 27],
    availTrend: [79, 80, 81, 81, 82, 82, 83, 83],
    headline: "All clear — no active alerts",
  },
  Duhok: {
    availability: 77, shelfShare: 21, oos: 0, violations: 0,
    shareTrend: [18, 19, 19, 20, 20, 21, 21, 21],
    availTrend: [73, 74, 74, 75, 75, 76, 76, 77],
    headline: "All clear — no active alerts",
  },
};

function healthOf(oos: number, violations: number): Health {
  if (oos > 0) return "critical";
  if (violations > 0) return "warn";
  return "good";
}

export const cities: CityPerf[] = coverage.cities.map((c) => {
  const p = perf[c.name];
  return {
    name: c.name,
    pos: c.pos,
    updated: c.updated,
    ...p,
    health: healthOf(p.oos, p.violations),
  };
});

export const cityByName = (name: string) =>
  cities.find((c) => c.name === name) ?? cities[0];

export const national = {
  citiesMonitored: cities.length,
  avgAvailability: Math.round(
    cities.reduce((s, c) => s + c.availability, 0) / cities.length
  ),
  avgShelfShare: Math.round(
    cities.reduce((s, c) => s + c.shelfShare, 0) / cities.length
  ),
  totalOos: cities.reduce((s, c) => s + c.oos, 0),
  totalViolations: cities.reduce((s, c) => s + c.violations, 0),
  citiesWithAlerts: cities.filter((c) => c.health !== "good").length,
};

export const healthColor: Record<Health, string> = {
  good: "var(--color-good)",
  warn: "var(--color-warn)",
  critical: "var(--color-critical)",
};

export const healthLabel: Record<Health, string> = {
  good: "Healthy",
  warn: "Price issue",
  critical: "Stock-out",
};

/* Per-city competitor benchmark (You + 3 rivals), derived from shelf share. */
export function competitorsFor(c: CityPerf) {
  return [
    { name: "Your brand", value: c.shelfShare, me: true },
    { name: "Competitor A", value: Math.max(8, c.shelfShare - 6), me: false },
    { name: "Competitor B", value: Math.max(6, c.shelfShare - 10), me: false },
    { name: "Competitor C", value: Math.max(4, c.shelfShare - 16), me: false },
  ];
}

/* Per-city SKU rows that reflect the city's live status. */
export function rowsFor(c: CityPerf) {
  const rows: { sku: string; facings: string; price: string; status: Health; label: string }[] = [];
  if (c.oos > 0)
    rows.push({ sku: "Cola 1L PET", facings: "0", price: "—", status: "critical", label: "Out of stock" });
  if (c.violations > 0)
    rows.push({ sku: "Orange 330ml", facings: "4", price: "1,000", status: "warn", label: "Price violation" });
  rows.push({ sku: "Cola 330ml", facings: "6", price: "750", status: "good", label: "In stock" });
  rows.push({ sku: "Water 500ml", facings: "8", price: "500", status: "good", label: "In stock" });
  rows.push({ sku: "Energy 250ml", facings: "3", price: "1,500", status: "good", label: "In stock" });
  return rows.slice(0, 4);
}
