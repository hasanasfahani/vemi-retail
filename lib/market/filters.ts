/* ============================================================
   GLOBAL FILTERS.

   Five dimensions travel in the URL — date range, city, channel,
   brand, SKU — so a filtered view is shareable, survives a reload, and
   still says what it is three pages later. Search does NOT: it is a
   different kind of act, scoped to the table in front of you, and
   carrying it across pages would silently empty a page nobody thought
   they had narrowed.

   Every figure in the portal is computed through `applyFilters`, so a
   KPI, a chart and a table on one page can never disagree about what
   is in scope.
   ============================================================ */

import {
  brands, clientBrand, current, months, pos, skus,
  type MonthData, type Pos,
} from "./index";

export type Filters = {
  /* Month id, or "" for the whole six-month range where a page
     supports it. Defaults to the current month. */
  month: string;
  governorates: string[];
  channels: string[];
  retailers: string[];
  brands: string[];
  skus: string[];
};

export const EMPTY_FILTERS: Filters = {
  month: current.month,
  governorates: [],
  channels: [],
  retailers: [],
  brands: [],
  skus: [],
};

export const FILTER_KEYS = ["governorates", "channels", "retailers", "brands", "skus"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export const FILTER_META: Record<FilterKey, { label: string; noun: string }> = {
  governorates: { label: "Governorate", noun: "governorates" },
  channels: { label: "Channel", noun: "channels" },
  retailers: { label: "Retailer", noun: "retailers" },
  brands: { label: "Brand", noun: "brands" },
  skus: { label: "SKU", noun: "SKUs" },
};

/* The month is always set, so it only counts as a filter when it is
   not the current one. */
export function activeCount(f: Filters): number {
  return (
    FILTER_KEYS.reduce((n, k) => n + f[k].length, 0) +
    (f.month === current.month ? 0 : 1)
  );
}

/* ---------- URL ---------- */

const PARAM: Record<FilterKey, string> = {
  governorates: "governorate", channels: "channel", retailers: "retailer",
  brands: "brand", skus: "sku",
};

export function filtersFromParams(params: URLSearchParams): Filters {
  const read = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
  const month = params.get("month");
  return {
    month: month && months.some((m) => m.id === month) ? month : current.month,
    governorates: read(PARAM.governorates),
    channels: read(PARAM.channels),
    retailers: read(PARAM.retailers),
    brands: read(PARAM.brands),
    skus: read(PARAM.skus),
  };
}

export function filtersToQuery(f: Filters): string {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    if (f[key].length) params.set(PARAM[key], f[key].join(","));
  }
  if (f.month !== current.month) params.set("month", f.month);
  const q = params.toString();
  return q ? `?${q}` : "";
}

/* ---------- applying ---------- */

export function matchingPos(f: Filters): Pos[] {
  return pos.filter(
    (p) =>
      (f.governorates.length === 0 || f.governorates.includes(p.governorateId)) &&
      (f.channels.length === 0 || f.channels.includes(p.channel)) &&
      (f.retailers.length === 0 || f.retailers.includes(p.retailer))
  );
}

export function matchingSkus(f: Filters): string[] {
  return skus
    .filter(
      (s) =>
        (f.brands.length === 0 || f.brands.includes(s.brandId)) &&
        (f.skus.length === 0 || f.skus.includes(s.id))
    )
    .map((s) => s.id);
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d === 0 ? 0 : r1((n / d) * 100));

export type MarketView = ReturnType<typeof applyFilters>;

export function applyFilters(f: Filters, data: MonthData) {
  /* Two populations, kept apart deliberately. `inScope` is every outlet
     the filter selects — the universe the reader is asking about.
     `audited` is the subset the audit actually REACHED this month.
     Under a rotating panel those differ, and every rate below divides
     by the second: an outlet nobody visited must never be counted as
     one with an empty shelf. The gap between them is the coverage
     figure the contract is judged on. */
  const inScope = matchingPos(f);
  const auditedAt = new Map(data.audited.map((a) => [a.posId, a.auditedAt]));
  /* Who ran each visit, so a drawer can name the collector and a
     revisit can be routed back to them. */
  const auditedBy = new Map(data.audited.map((a) => [a.posId, a.auditorId]));
  const audited = inScope.filter((p) => auditedAt.has(p.id));
  const posIds = new Set(audited.map((p) => p.id));
  const skuIds = new Set(matchingSkus(f));

  const cells = data.cells.filter(
    (c) => posIds.has(c.posId) && skuIds.has(c.skuId)
  );
  const gaps = data.gaps.filter((g) => posIds.has(g.posId) && skuIds.has(g.skuId));
  const prices = data.prices.filter((p) => posIds.has(p.posId) && skuIds.has(p.skuId));
  const posmRows = data.posm.filter((p) => posIds.has(p.posId));
  /* Promotions are observed per brand, so the brand filter applies
     here the same way the SKU filter applies to cells. */
  const brandIds = new Set(f.brands.length ? f.brands : brands.map((b) => b.id));
  const promoRows = data.promos.filter(
    (p) => posIds.has(p.posId) && brandIds.has(p.brandId)
  );
  const scores = data.scores.filter((s) => posIds.has(s.posId));

  const skuBrand = new Map(skus.map((s) => [s.id, s.brandId]));
  const inStock = cells.filter((c) => c.state === "in-stock");
  const totalFacings = inStock.reduce((s, c) => s + c.facings, 0);

  /* Brand rollup, recomputed from the filtered cells rather than read
     off a precomputed total. */
  const byBrand = brands
    .filter((b) => f.brands.length === 0 || f.brands.includes(b.id))
    .map((brand) => {
      const own = cells.filter((c) => skuBrand.get(c.skuId) === brand.id);
      const stocked = own.filter((c) => c.state === "in-stock");
      const facings = stocked.reduce((s, c) => s + c.facings, 0);
      return {
        brandId: brand.id,
        name: brand.name,
        owner: brand.owner,
        isClient: brand.client,
        facings,
        share: pct(facings, totalFacings),
        availability: pct(stocked.length, own.length),
        gaps: own.filter((c) => c.state === "out-of-stock").length,
        eyeLevel: pct(
          stocked.filter((c) => c.position === "eye").length,
          stocked.length
        ),
      };
    })
    .sort((a, b) => b.share - a.share);

  /* Skips outlets where the component did not apply. Averaging a null
     as zero is how "no client lines listed here" becomes "availability
     0%" and drags a market figure down with a store that never had the
     range. */
  const mean = (pickValue: (s: (typeof scores)[number]) => number | null) => {
    const held = scores.map(pickValue).filter((v): v is number => v !== null);
    return held.length ? r1(held.reduce((a, b) => a + b, 0) / held.length) : 0;
  };

  /* The rate KPIs are computed from the ROWS, not from a mean of
     per-outlet rates, because those are different statistics and the
     portal was quoting both: the dashboard read 87.2% availability
     while the Performance tab read 87.6% from the same month. A rate
     over listings is the one anybody would check by hand, so it wins,
     and now both surfaces read it. */
  const clientCells = cells.filter((c) => skuBrand.get(c.skuId) === clientBrand.id);
  const clientPrices = prices.filter((p) => skuBrand.get(p.skuId) === clientBrand.id);

  return {
    filters: f,
    month: data.month,
    /* outlets */
    outlets: audited,
    auditedAt,
    auditedBy,
    posCount: audited.length,
    inScopeCount: inScope.length,
    notAuditedCount: inScope.length - audited.length,
    coveragePct: pct(audited.length, inScope.length),
    /* rows */
    cells, gaps, prices, posm: posmRows, promos: promoRows, scores,
    /* rollups */
    byBrand,
    client: byBrand.find((b) => b.isClient),
    totalFacings,
    /* headline KPIs, all from the same filtered rows */
    kpi: {
      /* Composites and per-outlet ratios stay outlet-means; rates are
         weighted by what was actually observed. */
      score: Math.round(mean((s) => s.score)),
      assortment: mean((s) => s.assortment),
      availability: pct(
        clientCells.filter((c) => c.state === "in-stock").length,
        clientCells.length
      ),
      shelfShare: pct(
        inStock
          .filter((c) => skuBrand.get(c.skuId) === clientBrand.id)
          .reduce((s, c) => s + c.facings, 0),
        totalFacings
      ),
      price: pct(clientPrices.filter((p) => p.compliant).length, clientPrices.length),
      posm: pct(posmRows.filter((p) => p.present).length, posmRows.length),
    },
  };
}
