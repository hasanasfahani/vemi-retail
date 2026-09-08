/* ============================================================
   Filter model.

   One shared shape across every page, held in the URL so a filtered
   view can be sent to a colleague and survives a reload — the way a
   real analytics tool behaves.

   Filtering is applied to the audit matrix and every derived figure is
   recomputed from the filtered cells, so a KPI, a chart and a table on
   the same page can never disagree about what is in scope.
   ============================================================ */

import {
  brands,
  pos as allPos,
  skus,
  clientBrand,
  currentVisit,
  isKnownVisit,
  type Pos,
  type VisitData,
} from "./portalData";

export type Filters = {
  areas: string[];
  channels: string[];
  brands: string[];
  /* Which field visit is in view. Defaults to the latest. */
  visit: string;
};

export const EMPTY_FILTERS: Filters = {
  areas: [],
  channels: [],
  brands: [],
  visit: currentVisit,
};

export const allAreas = [...new Set(allPos.map((p) => p.area))].sort();
export const allChannels: Pos["channel"][] = [
  "Hypermarket",
  "Supermarket",
  "Mini-market",
  "Grocery",
];

/* The visit is always set, so it only counts as a filter when it is
   not the latest one. */
export function filterCount(f: Filters) {
  return (
    f.areas.length +
    f.channels.length +
    f.brands.length +
    (f.visit === currentVisit ? 0 : 1)
  );
}

/* ---------- URL <-> state ---------- */

export function filtersFromParams(params: URLSearchParams): Filters {
  const read = (key: string) =>
    (params.get(key) ?? "").split(",").filter(Boolean);
  const visit = params.get("visit");
  return {
    areas: read("area"),
    channels: read("channel"),
    brands: read("brand"),
    visit: visit && isKnownVisit(visit) ? visit : currentVisit,
  };
}

export function filtersToQuery(f: Filters): string {
  const params = new URLSearchParams();
  if (f.areas.length) params.set("area", f.areas.join(","));
  if (f.channels.length) params.set("channel", f.channels.join(","));
  if (f.brands.length) params.set("brand", f.brands.join(","));
  if (f.visit !== currentVisit) params.set("visit", f.visit);
  const q = params.toString();
  return q ? `?${q}` : "";
}

/* ---------- applying ---------- */

export function matchingPos(f: Filters) {
  return allPos.filter(
    (p) =>
      (f.areas.length === 0 || f.areas.includes(p.area)) &&
      (f.channels.length === 0 || f.channels.includes(p.channel))
  );
}

export function matchingSkus(f: Filters) {
  return skus.filter(
    (s) => f.brands.length === 0 || f.brands.includes(s.brandId)
  );
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d === 0 ? 0 : round1((n / d) * 100));

export type FilteredView = ReturnType<typeof applyFilters>;

/* The caller supplies the visit's data — pages hold it in state so a
   date change can await the bundle without blocking the first paint. */
export function applyFilters(f: Filters, data: VisitData) {
  /* Two different populations, kept apart deliberately.

     `inScope` is every outlet the filter selects — the universe the
     reader is asking about. `posIds` is the subset the audit actually
     REACHED inside this window. Under a rotating panel those differ,
     and every rate in this function divides by the second: an outlet
     nobody visited must never be counted as one with an empty shelf.

     The difference between the two is the coverage figure. */
  const inScope = matchingPos(f);
  const auditedAt = new Map(data.audited.map((a) => [a.posId, a.auditedAt]));
  const audited = inScope.filter((p) => auditedAt.has(p.id));
  const posIds = new Set(audited.map((p) => p.id));
  const skuIds = new Set(matchingSkus(f).map((s) => s.id));

  const cells = data.matrix.filter(
    (c) => posIds.has(c.posId) && skuIds.has(c.skuId)
  );

  const inStock = cells.filter((c) => c.state === "in-stock");
  const listed = cells.filter((c) => c.state !== "not-listed");
  const gaps = cells.filter((c) => c.state === "out-of-stock");

  const skuBrand = new Map(skus.map((s) => [s.id, s.brandId]));
  const totalFacings = inStock.reduce((sum, c) => sum + c.facings, 0);

  /* Brand rollup, recomputed from the filtered cells rather than read
     off the unfiltered payload. */
  const byBrand = brands
    .filter((b) => f.brands.length === 0 || f.brands.includes(b.id))
    .map((brand) => {
      const own = cells.filter((c) => skuBrand.get(c.skuId) === brand.id);
      const ownStocked = own.filter((c) => c.state === "in-stock");
      const facings = ownStocked.reduce((sum, c) => sum + c.facings, 0);
      return {
        brandId: brand.id,
        isClient: brand.client,
        facings,
        share: pct(facings, totalFacings),
        availability: pct(
          ownStocked.length,
          own.filter((c) => c.state !== "not-listed").length
        ),
        gaps: own.filter((c) => c.state === "out-of-stock").length,
        skuCount: skus.filter(
          (s) => s.brandId === brand.id && skuIds.has(s.id)
        ).length,
      };
    })
    .sort((a, b) => b.share - a.share);

  const bySku = [...skuIds]
    .map((skuId) => {
      const own = cells.filter((c) => c.skuId === skuId);
      const ownListed = own.filter((c) => c.state !== "not-listed");
      return {
        skuId,
        brandId: skuBrand.get(skuId)!,
        distribution: pct(ownListed.length, posIds.size),
        onShelfAvailability: pct(
          own.filter((c) => c.state === "in-stock").length,
          ownListed.length
        ),
      };
    })
    .sort((a, b) => a.onShelfAvailability - b.onShelfAvailability);

  const byPos = [...posIds]
    .map((posId) => {
      const own = cells.filter((c) => c.posId === posId);
      const ownListed = own.filter((c) => c.state !== "not-listed");
      const clientCells = own.filter(
        (c) => skuBrand.get(c.skuId) === clientBrand.id
      );
      return {
        posId,
        skusListed: ownListed.length,
        skusInStock: own.filter((c) => c.state === "in-stock").length,
        availability: pct(
          own.filter((c) => c.state === "in-stock").length,
          ownListed.length
        ),
        clientAvailability: pct(
          clientCells.filter((c) => c.state === "in-stock").length,
          clientCells.filter((c) => c.state !== "not-listed").length
        ),
        gaps: own.filter((c) => c.state === "out-of-stock").length,
      };
    })
    .sort((a, b) => a.availability - b.availability);

  const oosRows = data.oos.filter(
    (r) => posIds.has(r.posId) && skuIds.has(r.skuId)
  );

  const priceRows = data.observations.filter(
    (o) => posIds.has(o.posId) && skuIds.has(o.skuId)
  );

  const client = byBrand.find((b) => b.isClient);

  return {
    posIds,
    skuIds,
    cells,
    posCount: posIds.size,
    skuCount: skuIds.size,
    inStockCount: inStock.length,
    listedCount: listed.length,
    gapCount: gaps.length,
    totalFacings,
    byBrand,
    bySku,
    byPos,
    oosRows,
    priceRows,
    client,
    outlets: audited,
    /* Outlet -> the date it was seen. Findings state their own audit
       date rather than implying the whole panel shares one. */
    auditedAt,
    /* Coverage: what the filter asked for vs what was actually reached.
       A rate computed over `posCount` while the reader assumes
       `inScopeCount` is the quiet way a rotating panel misleads. */
    inScopeCount: inScope.length,
    notAuditedCount: inScope.length - audited.length,
    coveragePct: inScope.length
      ? Math.round((audited.length / inScope.length) * 1000) / 10
      : 0,
    visit: data.visit,
    /* Deltas are only meaningful when an earlier visit exists and no
       slice is applied — the stored movement is panel-wide. */
    isLatestVisit: data.visit === currentVisit,
  };
}
