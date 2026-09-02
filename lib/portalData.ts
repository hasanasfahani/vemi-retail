/* ============================================================
   Portal data access.

   The pages call these functions and never touch the JSON directly.
   When the audit database is live, only this file changes: each
   getter becomes a fetch, and the payload shapes already match.

   Regenerate the underlying files with:
     node scripts/build-portal-data.mjs
   ============================================================ */

import masterJson from "./data/master.json";
import availabilityJson from "./data/availability.json";
import shelfShareJson from "./data/shelf-share.json";
import pricingJson from "./data/pricing.json";
import competitorsJson from "./data/competitors.json";
import photosJson from "./data/photos.json";
import currentVisitJson from "./data/visit-current.json";

/* ---------- shapes ---------- */

export type Snapshot = { id: string; label: string; current: boolean };

export type Meta = {
  city: string;
  category: string;
  snapshots: Snapshot[];
  currentSnapshot: string;
  previousSnapshot: string;
  posCount: number;
  skuCount: number;
};

export type Brand = {
  id: string;
  name: string;
  owner: string;
  client: boolean;
};

export type Sku = {
  id: string;
  brandId: string;
  pack: string;
  name: string;
  rrp: number;
};

export type Pos = {
  id: string;
  code: string;
  area: string;
  channel: "Hypermarket" | "Supermarket" | "Mini-market" | "Grocery";
  name?: string;
};

export type CellState = "in-stock" | "out-of-stock" | "not-listed";

export type MatrixCell = {
  posId: string;
  skuId: string;
  state: CellState;
  facings: number;
};

export type SkuAvailability = {
  skuId: string;
  brandId: string;
  distribution: number;
  availability: number;
  onShelfAvailability: number;
};

export type PosAvailability = {
  posId: string;
  skusListed: number;
  skusInStock: number;
  availability: number;
  clientAvailability: number;
};

export type BrandAvailability = { brandId: string; availability: number };

export type BrandShare = {
  brandId: string;
  facings: number;
  share: number;
  coolerFacings: number;
  ambientFacings: number;
};

export type RivalInStock = {
  brandId: string;
  skuId: string;
  facings: number;
};

export type OosRow = {
  posId: string;
  skuId: string;
  daysOut: number;
  persistent: boolean;
  /* Facings that outlet gives the SKU when it is stocked — the space
     actually lost, and what makes the gap costable on either visit. */
  normalFacings: number;
  /* Shelf space × time: the one number that ranks gaps by what they
     are costing rather than by how long they have been open. */
  lostFacingDays: number;
  /* Same pack, same outlet, competitor brands on shelf — the
     substitution the shopper makes when you are absent. */
  rivalsInStock: RivalInStock[];
};

export type SkuPricing = {
  skuId: string;
  brandId: string;
  rrp: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  observations: number;
  compliance: number;
};

export type PriceObservation = {
  posId: string;
  skuId: string;
  price: number;
  rrp: number;
  variance: number;
  outlier: boolean;
};

export type CompetitorRow = {
  brandId: string;
  isClient: boolean;
  share: number;
  shareDelta: number;
  availability: number;
  availabilityDelta: number;
  activeOos: number;
  skuCount: number;
};

export type Photo = {
  id: string;
  file: string;
  posId: string;
  capturedAt: string;
  auditRef: string;
};

/* ---------- getters ---------- */

export const meta = masterJson.meta as Meta;
export const brands = masterJson.brands as Brand[];
export const skus = masterJson.skus as Sku[];
export const pos = masterJson.pos as Pos[];

export const clientBrand = brands.find((b) => b.client)!;

export const availability = {
  current: availabilityJson.current as {
    bySku: SkuAvailability[];
    byPos: PosAvailability[];
    byBrand: BrandAvailability[];
  },
  previous: availabilityJson.previous as {
    bySku: SkuAvailability[];
    byPos: PosAvailability[];
    byBrand: BrandAvailability[];
  },
};

export const shelfShare = {
  current: shelfShareJson.current as BrandShare[],
  previous: shelfShareJson.previous as BrandShare[],
};

export const pricing = {
  bySku: pricingJson.bySku as SkuPricing[],
};

export const competitors = competitorsJson.rows as CompetitorRow[];
export const photos = photosJson.rows as Photo[];

/* ---------- visits ----------

   One bundle per field visit holds that day's cells, gaps and shelf
   prices. The latest is imported statically because every page needs
   it on arrival; any earlier visit is fetched only when the reader
   moves the date filter to it, so the default load carries one visit
   rather than the whole history.

   The bundles store index tuples against the master lists — the same
   fact repeated 2,000 times as a string is what made the payload
   heavy — and are rehydrated once, here, on first use. */

type RawVisit = {
  visit: string;
  matrix: [number, number, number, number][];
  oos: [number, number, number, number, number, [number, number][]][];
  observations: [number, number, number][];
};

export type VisitData = {
  visit: string;
  matrix: MatrixCell[];
  oos: OosRow[];
  observations: PriceObservation[];
};

const CELL_STATE: CellState[] = ["not-listed", "in-stock", "out-of-stock"];

function hydrate(raw: RawVisit): VisitData {
  const posIds = masterJson.pos.map((p) => p.id);
  const skuList = masterJson.skus as Sku[];

  return {
    visit: raw.visit,
    matrix: raw.matrix.map(([p, k, state, facings]) => ({
      posId: posIds[p],
      skuId: skuList[k].id,
      state: CELL_STATE[state],
      facings,
    })),
    oos: raw.oos.map(([p, k, daysOut, persistent, normalFacings, rivals]) => ({
      posId: posIds[p],
      skuId: skuList[k].id,
      daysOut,
      persistent: persistent === 1,
      normalFacings,
      lostFacingDays: normalFacings * daysOut,
      rivalsInStock: rivals.map(([rk, facings]) => ({
        brandId: skuList[rk].brandId,
        skuId: skuList[rk].id,
        facings,
      })),
    })),
    observations: raw.observations.map(([p, k, price]) => {
      const sku = skuList[k];
      const variance = Math.round(((price - sku.rrp) / sku.rrp) * 1000) / 10;
      return {
        posId: posIds[p],
        skuId: sku.id,
        price,
        rrp: sku.rrp,
        variance,
        outlier: Math.abs(variance) > 10,
      };
    }),
  };
}

export const visits = meta.snapshots;
export const currentVisit = meta.currentSnapshot;

export const isKnownVisit = (id: string) => visits.some((v) => v.id === id);

export const visitLabel = (id: string) =>
  visits.find((v) => v.id === id)?.label ?? id;

const visitCache = new Map<string, VisitData>();
visitCache.set(currentVisit, hydrate(currentVisitJson as RawVisit));

/* Already in memory? Use it. Otherwise the caller awaits `loadVisit`. */
export const cachedVisit = (id: string) => visitCache.get(id);

export async function loadVisit(id: string): Promise<VisitData> {
  const cached = visitCache.get(id);
  if (cached) return cached;
  const raw = (await import(`./data/visit-${id}.json`)).default as RawVisit;
  const hydrated = hydrate(raw);
  visitCache.set(id, hydrated);
  return hydrated;
}

/* The latest visit, for headline figures and anywhere a page reports
   the panel as it stands today. */
export const latest = visitCache.get(currentVisit)!;
export const oos = latest.oos;

/* ---------- lookups ---------- */

const brandIndex = new Map(brands.map((b) => [b.id, b]));
const skuIndex = new Map(skus.map((s) => [s.id, s]));
const posIndex = new Map(pos.map((p) => [p.id, p]));

export const brandOf = (id: string) => brandIndex.get(id);
export const skuOf = (id: string) => skuIndex.get(id);
export const posOf = (id: string) => posIndex.get(id);

export const brandName = (id: string) => brandIndex.get(id)?.name ?? id;
export const skuName = (id: string) => skuIndex.get(id)?.name ?? id;

/* Outlets are reported by code; the fascia is shown only where we
   hold photography for it. */
export const posLabel = (id: string) => {
  const p = posIndex.get(id);
  if (!p) return id;
  return p.name ? `${p.code} · ${p.name}` : p.code;
};

/* Shelf photography for an outlet.

   The field app currently returns the same frame set for every outlet
   in the panel; only ERB-204 has frames captured under its own audit
   reference. Callers get a flag so the UI can say which it is holding
   rather than implying every fascia was shot separately. */
export const photosFor = (posId: string) => {
  const own = photos.filter((p) => p.posId === posId);
  return { frames: own.length ? own : photos, isOwn: own.length > 0 };
};

/* ---------- headline figures ---------- */

const clientShare = shelfShare.current.find((s) => s.brandId === clientBrand.id)!;
const clientSharePrev = shelfShare.previous.find((s) => s.brandId === clientBrand.id)!;
const clientAvail = availability.current.byBrand.find(
  (b) => b.brandId === clientBrand.id
)!;
const clientAvailPrev = availability.previous.byBrand.find(
  (b) => b.brandId === clientBrand.id
)!;

const round1 = (n: number) => Math.round(n * 10) / 10;

export const headline = {
  availability: clientAvail.availability,
  availabilityDelta: round1(clientAvail.availability - clientAvailPrev.availability),
  shelfShare: clientShare.share,
  shelfShareDelta: round1(clientShare.share - clientSharePrev.share),
  activeOos: latest.oos.filter((r) => brandOf(skuOf(r.skuId)!.brandId)!.client)
    .length,
  totalOos: latest.oos.length,
  oosDays: latest.oos
    .filter((r) => skuOf(r.skuId)!.brandId === clientBrand.id)
    .reduce((sum, r) => sum + r.daysOut, 0),
  priceCompliance: round1(
    pricing.bySku
      .filter((p) => p.brandId === clientBrand.id)
      .reduce((sum, p, _, arr) => sum + p.compliance / arr.length, 0)
  ),
};
