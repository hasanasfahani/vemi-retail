/* ============================================================
   PORTFOLIO BRAND HEALTH.

   Baghdad Soft Drinks owns four brands in this category, and the
   Execution Score the rest of the portal quotes describes only one of
   them. This computes the same composite — availability 30, shelf 25,
   assortment 20, price 15, POSM 10 — for every brand in the
   portfolio, so the company can see its own house before it looks at
   the competition.

   THE ONE COMPONENT THAT COULD NOT BE COPIED STRAIGHT ACROSS is shelf
   share. The client's score measures its share against a 40% par, and
   that par is Pepsi's. Scoring Mountain Dew's 4% against it would rate
   a small brand as catastrophic for being small, which is not health —
   it is size, and the portfolio already knows its brands are different
   sizes.

   So the shelf component asks a fairer question: does the brand hold
   the space its distribution has earned? Facings share divided by
   listing share, capped at 100. A brand listed in 16% of the audited
   shelf slots and holding 16% of the facings converts perfectly; one
   holding 4% while listed in 13% is being shelved thinly wherever it
   is stocked, which is a real and fixable problem rather than an
   artefact of being a smaller brand.

   POSM is recorded per OUTLET, not per brand — an auditor photographs
   a cooler, not a cooler's brand attribution — so each brand takes the
   POSM compliance of the outlets that stock it. The cards say so.
   ============================================================ */

import { brands, clientBrand, portfolioBrands, requiredSkus, scoreWeights, skus } from "./index";
import type { MarketView } from "./filters";
import { scoreBand, type Band } from "@/components/market/ui/health";

const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d === 0 ? 0 : r1((n / d) * 100));
const skuBrand = new Map(skus.map((s) => [s.id, s.brandId]));
const skuCount = new Map(
  brands.map((b) => [b.id, skus.filter((s) => s.brandId === b.id).length])
);

export type ComponentId = "availability" | "shelfShare" | "assortment" | "price" | "posm";

export type HealthComponent = {
  id: ComponentId;
  label: string;
  /* The 0–100 figure that enters the composite. */
  score: number;
  weight: number;
  /* What the reader should be shown, in the unit that measure is
     naturally stated in — the shelf component scores a conversion
     ratio but a reader wants the share. */
  display: string;
};

export type BrandHealth = {
  brandId: string;
  name: string;
  isClient: boolean;
  score: number;
  band: Band;
  /* Change against the previous cycle, when a previous cycle is
     loaded. Null until it is. */
  delta: number | null;
  components: HealthComponent[];
  weakest: HealthComponent;
  outlets: number;
  facings: number;
  share: number;
};

const LABEL: Record<ComponentId, string> = {
  availability: "Availability",
  shelfShare: "Shelf share",
  assortment: "Assortment",
  price: "Price compliance",
  posm: "POSM",
};

/* The composite, for one brand, over one filtered view. */
function healthFor(brandId: string, view: MarketView): Omit<BrandHealth, "delta"> | null {
  const brand = brands.find((b) => b.id === brandId);
  if (!brand) return null;

  const own = view.cells.filter((c) => skuBrand.get(c.skuId) === brandId);
  if (own.length === 0) return null;

  const stocked = own.filter((c) => c.state === "in-stock");
  const availability = pct(stocked.length, own.length);

  /* --- shelf: conversion, not raw share --- */
  const allStocked = view.cells.filter((c) => c.state === "in-stock");
  const totalFacings = allStocked.reduce((s, c) => s + c.facings, 0);
  const facings = stocked.reduce((s, c) => s + c.facings, 0);
  const facingsShare = pct(facings, totalFacings);
  const listingShare = pct(own.length, view.cells.length);
  const conversion = listingShare === 0 ? 0 : Math.min(100, r1((facingsShare / listingShare) * 100));

  /* --- assortment: against what the format expects, capped at the
     brand's own range. A four-SKU brand cannot be six SKUs short. --- */
  const posById = new Map(view.outlets.map((p) => [p.id, p]));
  const listedAt = new Map<string, number>();
  for (const cell of own) listedAt.set(cell.posId, (listedAt.get(cell.posId) ?? 0) + 1);
  let assortmentSum = 0;
  for (const [posId, listed] of listedAt) {
    const outlet = posById.get(posId);
    if (!outlet) continue;
    const expected = Math.min(
      skuCount.get(brandId) ?? listed,
      requiredSkus[outlet.channel] ?? listed
    );
    assortmentSum += expected === 0 ? 0 : Math.min(100, (listed / expected) * 100);
  }
  const assortment = listedAt.size === 0 ? 0 : r1(assortmentSum / listedAt.size);

  /* --- price: readings within 5% of the brand's own RRP --- */
  const readings = view.prices.filter((p) => skuBrand.get(p.skuId) === brandId);
  const price = pct(readings.filter((p) => Math.abs(p.variance) <= 5).length, readings.length);

  /* --- POSM: the outlets that stock this brand --- */
  const stocking = new Set(stocked.map((c) => c.posId));
  const posmRows = view.posm.filter((p) => stocking.has(p.posId));
  const posm = pct(posmRows.filter((p) => p.present).length, posmRows.length);

  const components: HealthComponent[] = [
    {
      id: "availability",
      label: LABEL.availability,
      score: availability,
      weight: scoreWeights.availability,
      display: `${availability}% on shelf`,
    },
    {
      id: "shelfShare",
      label: LABEL.shelfShare,
      score: conversion,
      weight: scoreWeights.shelfShare,
      display: `${facingsShare}% of the fixture`,
    },
    {
      id: "assortment",
      label: LABEL.assortment,
      score: assortment,
      weight: scoreWeights.assortment,
      display: `${assortment}% of the expected range`,
    },
    {
      id: "price",
      label: LABEL.price,
      score: price,
      weight: scoreWeights.price,
      display: `${price}% within 5% of list`,
    },
    {
      id: "posm",
      label: LABEL.posm,
      score: posm,
      weight: scoreWeights.posm,
      display: `${posm}% of material present`,
    },
  ];

  const score = Math.round(
    components.reduce((sum, part) => sum + part.score * part.weight, 0)
  );

  /* The weakest COMPONENT SCORE, not the smallest number on the card —
     a 4% shelf share is not worse than a 58% assortment just because
     the digits are smaller. */
  const weakest = [...components].sort((a, b) => a.score - b.score)[0];

  return {
    brandId,
    name: brand.name,
    isClient: brand.id === clientBrand.id,
    score,
    band: scoreBand(score),
    components,
    weakest,
    outlets: stocking.size,
    facings,
    share: facingsShare,
  };
}

/* Every portfolio brand, strongest first.

   `previous` is optional: without it the cards state a level and no
   movement, which is the honest thing to show before last cycle's rows
   have loaded. */
export function portfolioHealth(
  view: MarketView,
  previous?: MarketView | null
): BrandHealth[] {
  return portfolioBrands
    .flatMap((brand) => {
      const now = healthFor(brand.id, view);
      if (!now) return [];
      const before = previous ? healthFor(brand.id, previous) : null;
      return [{ ...now, delta: before ? now.score - before.score : null }];
    })
    .sort((a, b) => b.score - a.score);
}

/* The portfolio as one figure — facings-weighted, because a company's
   health is not the unweighted average of a flagship and three small
   brands. */
export function portfolioScore(rows: BrandHealth[]): number {
  const weight = rows.reduce((s, r) => s + r.facings, 0);
  if (weight === 0) return 0;
  return Math.round(rows.reduce((s, r) => s + r.score * r.facings, 0) / weight);
}

export const BAND_WORD: Record<Band, string> = {
  strong: "Strong",
  average: "Average",
  attention: "Needs attention",
  critical: "Critical",
};

/* Is a brand one of the company's own? The section is about the
   portfolio, so a rival selected in the global filter must not quietly
   become "portfolio health" — and its price compliance would be
   measured against a list price the company does not set. */
export const isPortfolio = (brandId: string) =>
  portfolioBrands.some((b) => b.id === brandId);
