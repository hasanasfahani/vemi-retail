/* ============================================================
   CITY HEALTH.

   The same composite as everywhere else — availability 30, shelf 25,
   assortment 20, price 15, POSM 10 — computed per governorate, so a reader
   can see which market is healthy before opening the map to find out
   where inside it the problem sits.

   ONE DELIBERATE DIFFERENCE FROM THE BRAND CARDS. There, shelf had to
   be scored as conversion, because comparing brands of different sizes
   against one par would rate a small brand as failing for being small.
   Here the comparison is ONE brand across several places, so the par
   is exactly the right yardstick: Baghdad holding 31% where the
   contract expects 40% is a real shortfall, not an artefact of
   Baghdad's size. Same formula, different question, and the two
   sections say which is which.
   ============================================================ */

import { governorates, clientBrand, requiredSkus, scoreWeights, skus } from "./index";
import { getTargets } from "./settings";
import type { MarketView } from "./filters";
import { scoreBand, type Band } from "@/components/market/ui/health";
import type { ComponentId, HealthComponent } from "./brandHealth";

const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d === 0 ? 0 : r1((n / d) * 100));
const skuBrand = new Map(skus.map((s) => [s.id, s.brandId]));
const clientSkuCount = skus.filter((s) => s.brandId === clientBrand.id).length;

export type GovernorateHealth = {
  governorateId: string;
  name: string;
  /* The city the audit actually works. Nineveh's is Mosul. */
  capital: string;
  score: number;
  band: Band;
  delta: number | null;
  components: HealthComponent[];
  weakest: HealthComponent;
  outlets: number;
  share: number;
  /* Outlets the audit has NOT reached in this city yet — a low score
     over eleven outlets is a different fact from the same score over
     two hundred, and the card shows both. */
  inScope: number;
};

const LABEL: Record<ComponentId, string> = {
  availability: "Availability",
  shelfShare: "Shelf share",
  assortment: "Assortment",
  price: "Price compliance",
  posm: "POSM",
};

function healthFor(governorateId: string, view: MarketView): Omit<GovernorateHealth, "delta"> | null {
  const city = governorates.find((c) => c.id === governorateId);
  if (!city) return null;

  const outlets = view.outlets.filter((o) => o.governorateId === governorateId);
  if (outlets.length === 0) return null;
  const ids = new Set(outlets.map((o) => o.id));

  const cells = view.cells.filter((c) => ids.has(c.posId));
  const own = cells.filter((c) => skuBrand.get(c.skuId) === clientBrand.id);
  if (own.length === 0) return null;

  const stocked = own.filter((c) => c.state === "in-stock");
  const availability = pct(stocked.length, own.length);

  /* Shelf against the contracted par — see the note at the top. */
  const allStocked = cells.filter((c) => c.state === "in-stock");
  const totalFacings = allStocked.reduce((s, c) => s + c.facings, 0);
  const facings = stocked.reduce((s, c) => s + c.facings, 0);
  const share = pct(facings, totalFacings);
  const par = getTargets().shelfShare;
  const shelfScore = par === 0 ? 0 : Math.min(100, r1((share / par) * 100));

  const listedAt = new Map<string, number>();
  for (const cell of own) listedAt.set(cell.posId, (listedAt.get(cell.posId) ?? 0) + 1);
  let assortmentSum = 0;
  for (const outlet of outlets) {
    const listed = listedAt.get(outlet.id) ?? 0;
    const expected = Math.min(clientSkuCount, requiredSkus[outlet.channel] ?? clientSkuCount);
    assortmentSum += expected === 0 ? 0 : Math.min(100, (listed / expected) * 100);
  }
  const assortment = r1(assortmentSum / outlets.length);

  const readings = view.prices.filter(
    (p) => ids.has(p.posId) && skuBrand.get(p.skuId) === clientBrand.id
  );
  const price = pct(readings.filter((p) => Math.abs(p.variance) <= 5).length, readings.length);

  const posmRows = view.posm.filter((p) => ids.has(p.posId));
  const posm = pct(posmRows.filter((p) => p.present).length, posmRows.length);

  const components: HealthComponent[] = [
    { id: "availability", label: LABEL.availability, score: availability, weight: scoreWeights.availability, display: `${availability}% on shelf` },
    { id: "shelfShare", label: LABEL.shelfShare, score: shelfScore, weight: scoreWeights.shelfShare, display: `${share}% of the fixture` },
    { id: "assortment", label: LABEL.assortment, score: assortment, weight: scoreWeights.assortment, display: `${assortment}% of the expected range` },
    { id: "price", label: LABEL.price, score: price, weight: scoreWeights.price, display: `${price}% within 5% of list` },
    { id: "posm", label: LABEL.posm, score: posm, weight: scoreWeights.posm, display: `${posm}% of material present` },
  ];

  const score = Math.round(components.reduce((sum, part) => sum + part.score * part.weight, 0));
  const weakest = [...components].sort((a, b) => a.score - b.score)[0];

  return {
    governorateId,
    name: city.name,
    capital: city.capital,
    score,
    band: scoreBand(score),
    components,
    weakest,
    outlets: outlets.length,
    share,
    inScope: city.pos,
  };
}

export function governorateHealth(view: MarketView, previous?: MarketView | null): GovernorateHealth[] {
  return governorates
    .flatMap((city) => {
      const now = healthFor(city.id, view);
      if (!now) return [];
      const before = previous ? healthFor(city.id, previous) : null;
      return [{ ...now, delta: before ? now.score - before.score : null }];
    })
    .sort((a, b) => b.score - a.score);
}
