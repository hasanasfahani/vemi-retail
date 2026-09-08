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

/* A trailing collection window, not a field visit.

   The audit runs a rolling daily schedule over a ROTATING panel, so
   there is no day on which the whole city was measured at once. A
   window is a period with its own set of audited outlets, each carrying
   its own audit date — and `outletsAudited` is deliberately less than
   the universe, because a rotating schedule does not reach everything
   and a portal that hides that cannot tell a client what they got. */
export type Window = {
  id: string;
  label: string;
  shortLabel: string;
  start: string;
  end: string;
  current: boolean;
  outletsAudited: number;
};

export type Meta = {
  city: string;
  category: string;
  windows: Window[];
  currentWindow: string;
  previousWindow: string;
  windowDays: number;
  /* Planned days between audits of the same outlet — the basis of every
     forward loss estimate in the product. */
  revisitIntervalDays: number;
  /* Outlets audited in EVERY window — the paired population. */
  corePanel: string[];
  corePanelSize: number;
  /* The outlet universe. Distinct from how many any one window reached. */
  posUniverse: number;
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
  /* When this outlet was actually seen inside the window. Under rolling
     collection freshness is a property of the outlet, never the panel. */
  auditedAt: string;
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
  /* Facings that outlet gives the SKU when it is stocked — the space
     actually lost, observed on the visit that found the gap. */
  normalFacings: number;
  /* Shelf space × the days until someone is next in that store.

     Deliberately AT RISK rather than "lost". A rotating panel observes
     a gap once; it cannot know how long the shelf has been empty,
     because that needs a previous observation of the same outlet. What
     it can say is that the gap keeps costing until the next audit, so
     the figure projects forward from a stated interval instead of
     measuring backwards from a date nobody recorded.

     The old `lostFacingDays` multiplied facings by an invented
     `daysOut`. Same unit, opposite direction, and only one of them is
     collectable. */
  facingDaysAtRisk: number;
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

/* ---------- the core panel ----------

   The one population in this dataset measured twice with the same
   doors on both sides. Every movement claim in the product is drawn
   from here; everything else reports a level. */
export type CoreBrandTrend = {
  brandId: string;
  share: number;
  previousShare: number;
  shareDelta: number;
  availability: number;
  previousAvailability: number;
  availabilityDelta: number;
  /* Whether the move clears the panel's own detection floor. A delta
     that does not is a reading, not a finding, and the product must
     not present it as one. */
  shareSignificant: boolean;
  availabilitySignificant: boolean;
};

export type CoreTrend = {
  outlets: number;
  windowDays: number;
  /* Smallest move this panel can tell from noise, bootstrapped from
     the panel's own outlets. */
  shareFloorPt: number;
  availabilityFloorPt: number;
  brands: CoreBrandTrend[];
};

export const meta = masterJson.meta as Meta;
export const coreTrend = masterJson.coreTrend as CoreTrend;
export const corePanel = new Set(meta.corePanel);
export const isCore = (posId: string) => corePanel.has(posId);
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

/* ---------- windows ----------

   One bundle per collection window holds the cells, gaps and shelf
   prices recorded across it, plus WHICH outlets were reached and when.
   The latest is imported statically because every page needs it on
   arrival; earlier windows are fetched only when the reader moves the
   date filter, so the default load carries one window rather than the
   whole history.

   The bundles store index tuples against the master lists — the same
   fact repeated 2,000 times as a string is what made the payload
   heavy — and are rehydrated once, here, on first use. */

type RawVisit = {
  visit: string;
  audited: [number, string][];
  matrix: [number, number, number, number][];
  oos: [number, number, number, [number, number][]][];
  observations: [number, number, number][];
};

export type VisitData = {
  visit: string;
  /* Outlets actually reached inside this window, with the date each was
     seen. An outlet absent from here was NOT AUDITED — which is not the
     same as an outlet with nothing on its shelf, and conflating the two
     is the headline risk of a rotating panel. */
  audited: { posId: string; auditedAt: string }[];
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
    audited: raw.audited.map(([p, auditedAt]) => ({
      posId: posIds[p],
      auditedAt,
    })),
    matrix: raw.matrix.map(([p, k, state, facings]) => ({
      posId: posIds[p],
      skuId: skuList[k].id,
      state: CELL_STATE[state],
      facings,
    })),
    oos: raw.oos.map(([p, k, normalFacings, rivals]) => ({
      posId: posIds[p],
      skuId: skuList[k].id,
      normalFacings,
      /* Forward from the audit, not backward from an unrecorded date. */
      facingDaysAtRisk: normalFacings * meta.revisitIntervalDays,
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

export const visits = meta.windows;
export const currentVisit = meta.currentWindow;
export const REVISIT_INTERVAL_DAYS = meta.revisitIntervalDays;

/* Outlets in the universe vs outlets this window reached. Kept apart on
   purpose — coverage is a number the client bought and can check. */
export const posUniverse = meta.posUniverse;

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
const clientAvail = availability.current.byBrand.find(
  (b) => b.brandId === clientBrand.id
)!;

const round1 = (n: number) => Math.round(n * 10) / 10;

const coreClient = coreTrend.brands.find((b) => b.brandId === clientBrand.id)!;

export const headline = {
  /* LEVELS come from everything audited — breadth is what a level
     wants. MOVEMENT comes from the core panel alone, because the same
     doors on both sides is the only way a delta means the market
     rather than the sample. The two populations differ, which is why
     each is labelled on screen rather than presented as one figure. */
  availability: clientAvail.availability,
  availabilityDelta: coreClient.availabilityDelta,
  availabilityMoved: coreClient.availabilitySignificant,
  shelfShare: clientShare.share,
  shelfShareDelta: coreClient.shareDelta,
  shelfShareMoved: coreClient.shareSignificant,
  activeOos: latest.oos.filter((r) => brandOf(skuOf(r.skuId)!.brandId)!.client)
    .length,
  totalOos: latest.oos.length,
  /* Shelf space standing empty until the next audit — forward from the
     visit, not backward from a date nobody recorded. The old figure
     summed `daysOut`, which a rotating panel cannot observe. */
  facingDaysAtRisk: latest.oos
    .filter((r) => skuOf(r.skuId)!.brandId === clientBrand.id)
    .reduce((sum, r) => sum + r.facingDaysAtRisk, 0),
  priceCompliance: round1(
    pricing.bySku
      .filter((p) => p.brandId === clientBrand.id)
      .reduce((sum, p, _, arr) => sum + p.compliance / arr.length, 0)
  ),
};
