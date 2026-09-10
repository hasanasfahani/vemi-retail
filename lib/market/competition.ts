/* ============================================================
   COMPETITION — the same month, read as a contest.

   Everything here treats brands symmetrically: the client is one row
   among six, computed the same way as the rest. A scoreboard that
   measured the client generously and rivals meanly would be worse than
   no scoreboard, because it would be believed.
   ============================================================ */

import {
  brands, channels, clientBrand, districts, pos as allPos, skus,
} from "./index";
import type { MarketView } from "./filters";
import type { Cell } from "./types";

const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d === 0 ? 0 : r1((n / d) * 100));
const skuBrand = new Map(skus.map((s) => [s.id, s.brandId]));

/* ---------- A · the scoreboard ---------- */

export type BrandRow = {
  id: string;
  name: string;
  owner: string;
  isClient: boolean;
  /* On shelf where listed. */
  availability: number;
  share: number;
  facings: number;
  /* Average facings at the outlets that carry the brand — the number a
     category manager negotiates over, and a different question from
     total share. */
  perOutlet: number;
  outlets: number;
  /* Average price across COMPARABLE packs only — see the note on
     `comparableBasket`. */
  averagePrice: number;
  /* Where the brand sits against the category, mix-adjusted: each
     reading is divided by the average price of its own pack, and the
     ratios are averaged. 100 is category par, above is a premium
     position, below is value. */
  priceIndex: number;
  /* How much of the brand's range the index could actually judge. */
  comparableReadings: number;
  promo: number;
  display: number;
  /* Share of the brand's own facings that sit at eye level — how well
     it converts shelf into visibility. */
  visibility: number;
};

/* ---------- like-for-like pricing ----------

   A brand's raw average price is a mix figure, not a price position.
   Pepsi carries a 2.25L bottle no rival sells; averaging it in put
   Pepsi at a 116 index and Coca-Cola at 94, which reads as "Pepsi is
   16% more expensive" when the two brands are within a few dinars on
   every pack they both sell. That is a mix effect wearing a price
   label, and it would have sent someone into a pricing conversation
   that the data does not support.

   So two corrections, both stated on the page:

     · the basket is restricted to packs at least two brands sell —
       a pack with no rival entry has no price position to hold;
     · the index divides each reading by the average price of its OWN
       pack before averaging, so a brand's range cannot move it.
*/
function comparableBasket(view: MarketView) {
  const byPack = new Map<string, { prices: number[]; brands: Set<string> }>();
  for (const reading of view.prices) {
    const sku = skus.find((s) => s.id === reading.skuId);
    if (!sku) continue;
    const held = byPack.get(sku.pack) ?? { prices: [], brands: new Set<string>() };
    held.prices.push(reading.price);
    held.brands.add(sku.brandId);
    byPack.set(sku.pack, held);
  }

  const packMean = new Map<string, number>();
  const comparable = new Set<string>();
  for (const [pack, held] of byPack) {
    if (held.brands.size < 2) continue;
    comparable.add(pack);
    packMean.set(pack, held.prices.reduce((a, b) => a + b, 0) / held.prices.length);
  }
  return { comparable, packMean };
}

export function scoreboard(view: MarketView): BrandRow[] {
  const { comparable, packMean } = comparableBasket(view);
  const packOf = new Map(skus.map((s) => [s.id, s.pack]));
  const stocked = view.cells.filter((c) => c.state === "in-stock");
  const totalFacings = stocked.reduce((s, c) => s + c.facings, 0);
  const auditedOutlets = view.posCount || 1;

  const allPrices = view.prices;

  return brands
    .map((brand) => {
      const own = view.cells.filter((c) => skuBrand.get(c.skuId) === brand.id);
      const ownStocked = own.filter((c) => c.state === "in-stock");
      const facings = ownStocked.reduce((s, c) => s + c.facings, 0);
      const outlets = new Set(ownStocked.map((c) => c.posId)).size;
      const prices = allPrices.filter(
        (p) =>
          skuBrand.get(p.skuId) === brand.id &&
          comparable.has(packOf.get(p.skuId) ?? "")
      );
      const average = prices.length
        ? Math.round(prices.reduce((s, p) => s + p.price, 0) / prices.length)
        : 0;
      /* Mix-adjusted: each reading against its own pack's average. */
      const ratios = prices.map((p) => p.price / (packMean.get(packOf.get(p.skuId) ?? "") ?? p.price));
      const eyeFacings = ownStocked
        .filter((c) => c.position === "eye")
        .reduce((s, c) => s + c.facings, 0);
      const promos = view.promos.filter((p) => p.brandId === brand.id);

      return {
        id: brand.id,
        name: brand.name,
        owner: brand.owner,
        isClient: brand.client,
        availability: pct(ownStocked.length, own.length),
        share: pct(facings, totalFacings),
        facings,
        perOutlet: outlets ? r1(facings / outlets) : 0,
        outlets,
        averagePrice: average,
        priceIndex: ratios.length
          ? Math.round((ratios.reduce((a, b) => a + b, 0) / ratios.length) * 100)
          : 0,
        comparableReadings: prices.length,
        promo: pct(new Set(promos.filter((p) => p.promo).map((p) => p.posId)).size, auditedOutlets),
        display: pct(new Set(promos.filter((p) => p.display).map((p) => p.posId)).size, auditedOutlets),
        visibility: pct(eyeFacings, facings),
      };
    })
    .sort((a, b) => b.share - a.share);
}

/* ---------- C · price position ----------

   Price against shelf share, with availability as the third dimension.
   Three independent measures on one chart is the one place a bubble
   plot earns its keep: it answers "is anyone buying share with price?"
   in a single look. */

export type PricePoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  isClient: boolean;
};

export function pricePosition(view: MarketView): PricePoint[] {
  return scoreboard(view)
    .filter((row) => row.averagePrice > 0 && row.share > 0)
    .map((row) => ({
      id: row.id,
      name: row.name,
      x: row.averagePrice,
      y: row.share,
      z: row.availability,
      isClient: row.isClient,
    }));
}

/* ---------- D · who leads where ----------

   One row per district: the brand holding the most measured shelf,
   and by how much. A district rests on several outlets, which is the
   point — one shop's fixture is a thin basis for a claim about who is
   winning an area. */

export type DistrictLead = {
  id: string;
  district: string;
  governorateId: string;
  lat: number;
  lng: number;
  outlets: number;
  facings: number;
  leaderId: string;
  leaderShare: number;
  clientShare: number;
  /* Points between the leader and the client. Zero when the client
     leads. */
  margin: number;
};

export function districtLeads(view: MarketView, minOutlets = 3): DistrictLead[] {
  const byDistrict = new Map<string, Cell[]>();
  const posById = new Map(view.outlets.map((p) => [p.id, p]));

  for (const cell of view.cells) {
    if (cell.state !== "in-stock") continue;
    const outlet = posById.get(cell.posId);
    if (!outlet) continue;
    const key = `${outlet.governorateId}|${outlet.district}`;
    byDistrict.set(key, [...(byDistrict.get(key) ?? []), cell]);
  }

  const rows: DistrictLead[] = [];
  for (const [key, cells] of byDistrict) {
    const [governorateId, district] = key.split("|");
    const outletIds = new Set(cells.map((c) => c.posId));
    if (outletIds.size < minOutlets) continue;

    const total = cells.reduce((s, c) => s + c.facings, 0);
    const byBrand = brands.map((brand) => ({
      id: brand.id,
      facings: cells
        .filter((c) => skuBrand.get(c.skuId) === brand.id)
        .reduce((s, c) => s + c.facings, 0),
    }));
    const ranked = [...byBrand].sort((a, b) => b.facings - a.facings);
    const leader = ranked[0];
    const clientFacings = byBrand.find((b) => b.id === clientBrand.id)?.facings ?? 0;

    /* Centroid of the audited outlets themselves, not of the district
       polygon — the bubble should sit where the evidence is. */
    const points = [...outletIds].map((id) => posById.get(id)!).filter(Boolean);
    const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.lng, 0) / points.length;

    rows.push({
      id: key,
      district,
      governorateId,
      lat,
      lng,
      outlets: outletIds.size,
      facings: total,
      leaderId: leader.id,
      leaderShare: pct(leader.facings, total),
      clientShare: pct(clientFacings, total),
      margin: leader.id === clientBrand.id ? 0 : r1(pct(leader.facings, total) - pct(clientFacings, total)),
    });
  }

  return rows.sort((a, b) => b.facings - a.facings);
}

/* ---------- shelf battle by retailer ----------

   The brief asks for city, channel and RETAILER GROUP. The first two
   come from the shelf helper; this is the third. Independents are
   excluded: "Independent" is the absence of a group, not a group, and
   putting it in a chart about retailer groups would make it the
   biggest one. */

export function byRetailer(view: MarketView) {
  const posById = new Map(view.outlets.map((p) => [p.id, p]));
  const stocked = view.cells.filter((c) => c.state === "in-stock");
  const names = [...new Set(allPos.map((p) => p.retailer))].filter(
    (name) => name !== "Independent"
  );

  return names
    .map((retailer) => {
      const rows = stocked.filter((c) => posById.get(c.posId)?.retailer === retailer);
      const total = rows.reduce((s, c) => s + c.facings, 0);
      const shares = Object.fromEntries(
        brands.map((b) => [
          b.id,
          pct(
            rows.filter((c) => skuBrand.get(c.skuId) === b.id).reduce((s, c) => s + c.facings, 0),
            total
          ),
        ])
      );
      return {
        id: retailer,
        label: retailer,
        total,
        outlets: new Set(rows.map((c) => c.posId)).size,
        ...shares,
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
}

/* Districts the audit reached, for the map's own footnote. */
export const districtCount = districts.length;
export const channelCount = channels.length;
