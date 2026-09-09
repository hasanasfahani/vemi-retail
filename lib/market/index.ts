/* ============================================================
   MARKET DATA ACCESS.

   Pages call these and never touch the JSON. When a real audit
   database arrives, only this file changes: each getter becomes a
   fetch and the payload shapes already match.

   Rebuild the underlying files with:
     node scripts/build-market-data.mjs
     node scripts/check-market-data.mjs
   ============================================================ */

import marketJson from "../data/market/market.json";
import trendsJson from "../data/market/trends.json";
import currentJson from "../data/market/month-current.json";
import type {
  Cell, Gap, Market, MonthData, PosScore, PosmReading, PriceReading,
  PromoReading, ShelfPosition, Trends,
} from "./types";

export * from "./types";

export const market = marketJson as unknown as Market;
export const trends = trendsJson as unknown as Trends;

export const {
  contract, months, governorates, districts, channels, retailers,
  brands, skus, auditors, followUps, posmTypes, oosReasons, scoreWeights,
  sharePar, requiredSkus, kpiTargets, pos,
} = market;

/* Cycles after the current one exist in the data so a follow-up audit
   has a destination. Anything reporting on the market as it stands
   should read `months` up to the current one; anything scheduling
   forward reads these. */
export const plannedMonths = months.filter((m) => m.planned);
export const historicMonths = months.filter((m) => !m.planned);

export const clientBrand = brands.find((b) => b.client)!;
/* The company, not the lead brand. Baghdad Soft Drinks owns Pepsi,
   7UP, Mirinda and Mountain Dew; share ceded from one of them to
   another is not a loss, and only an owner-level view can say so. */
export const clientOwner = clientBrand.owner;
export const portfolioBrands = brands.filter((b) => b.owner === clientOwner);
export const currentMonth = contract.currentMonth;

/* ---------- lookups ---------- */

const cityIndex = new Map(governorates.map((c) => [c.id, c]));
const brandIndex = new Map(brands.map((b) => [b.id, b]));
const skuIndex = new Map(skus.map((s) => [s.id, s]));
const posIndex = new Map(pos.map((p) => [p.id, p]));
const channelIndex = new Map(channels.map((c) => [c.id, c]));
const posmIndex = new Map(posmTypes.map((t) => [t.id, t]));
const auditorIndex = new Map(auditors.map((a) => [a.id, a]));
const reasonIndex = new Map(oosReasons.map((r) => [r.id, r]));

export const governorateOf = (id: string) => cityIndex.get(id);
export const brandOf = (id: string) => brandIndex.get(id);
export const skuOf = (id: string) => skuIndex.get(id);
export const posOf = (id: string) => posIndex.get(id);
export const channelOf = (id: string) => channelIndex.get(id);
export const posmTypeOf = (id: string) => posmIndex.get(id);
export const auditorOf = (id: string) => auditorIndex.get(id);
export const auditorName = (id: string) => auditorIndex.get(id)?.name ?? "Vemi field team";
export const reasonOf = (id: string) => reasonIndex.get(id);

export const governorateName = (id: string) => cityIndex.get(id)?.name ?? id;
export const brandName = (id: string) => brandIndex.get(id)?.name ?? id;
export const skuName = (id: string) => skuIndex.get(id)?.name ?? id;
export const channelName = (id: string) => channelIndex.get(id)?.name ?? id;

export const districtsIn = (governorateId: string) =>
  districts.filter((d) => d.governorateId === governorateId).map((d) => d.name);

export const monthLabel = (id: string) =>
  months.find((m) => m.id === id)?.label ?? id;

/* ---------- hydrating a month ----------

   Bundles ship as index tuples against the master lists — the same
   outlet id repeated 19,000 times as a string is what would make the
   payload heavy. Rehydrated once, here, on first use.

   Not-listed cells are ABSENT from the payload by design: every SKU is
   checked at every audited outlet, so absence is the observation. */
type RawMonth = {
  month: string;
  audited: [number, string, number][];
  matrix: [number, number, number, number, number][];
  oos: [number, number, number, number][];
  prices: [number, number, number][];
  posm: [number, number, number][];
  promos: [number, number, number, number][];
  scores: [number, number, number, number, number, number, number][];
};

const POSITION: ShelfPosition[] = ["eye", "upper", "lower"];

function hydrate(raw: RawMonth): MonthData {
  const posId = (i: number) => pos[i].id;
  const skuId = (i: number) => skus[i].id;

  const cells: Cell[] = raw.matrix.map(([p, k, state, facings, position]) => ({
    posId: posId(p),
    skuId: skuId(k),
    state: state === 1 ? "in-stock" : "out-of-stock",
    facings,
    position: position < 0 ? null : POSITION[position],
  }));

  const gaps: Gap[] = raw.oos.map(([p, k, normalFacings, reason]) => ({
    posId: posId(p),
    skuId: skuId(k),
    normalFacings,
    reasonId: oosReasons[reason].id,
  }));

  const prices: PriceReading[] = raw.prices.map(([p, k, price]) => {
    const sku = skus[k];
    const variance = Math.round(((price - sku.rrp) / sku.rrp) * 1000) / 10;
    return {
      posId: posId(p),
      skuId: sku.id,
      price,
      rrp: sku.rrp,
      variance,
      compliant: Math.abs(variance) <= 5,
    };
  });

  const posmRows: PosmReading[] = raw.posm.map(([p, t, present]) => ({
    posId: posId(p),
    typeId: posmTypes[t].id,
    present: present === 1,
  }));

  const promos: PromoReading[] = raw.promos.map(([p, b, promo, display]) => ({
    posId: posId(p),
    brandId: brands[b].id,
    promo: promo === 1,
    display: display === 1,
  }));

  /* -1 is the payload's "not applicable"; it becomes null here so no
     consumer can average it by accident. */
  const applicable = (v: number) => (v < 0 ? null : v);

  const scores: PosScore[] = raw.scores.map(
    ([p, score, availability, shelfShare, assortment, price, posmPct]) => ({
      posId: posId(p),
      score,
      availability: applicable(availability),
      shelfShare: applicable(shelfShare),
      assortment,
      price: applicable(price),
      posm: applicable(posmPct),
    })
  );

  return {
    month: raw.month,
    audited: raw.audited.map(([p, auditedAt, a]) => ({
      posId: posId(p),
      auditedAt,
      auditorId: auditors[a]?.id ?? "",
    })),
    cells, gaps, prices, posm: posmRows, promos, scores,
  };
}

const cache = new Map<string, MonthData>();
cache.set(currentMonth, hydrate(currentJson as unknown as RawMonth));

export const current = cache.get(currentMonth)!;
export const cachedMonth = (id: string) => cache.get(id);

/* Any month other than the current one is fetched the first time it is
   asked for, so the default load carries one month rather than six. */
export async function loadMonth(id: string): Promise<MonthData> {
  const held = cache.get(id);
  if (held) return held;
  const raw = (await import(`../data/market/month-${id}.json`)).default;
  const hydrated = hydrate(raw as unknown as RawMonth);
  cache.set(id, hydrated);
  return hydrated;
}

/* ---------- coverage ----------

   The one figure the contract is judged on, and the reason the
   dashboard opens with a ring rather than a number. */
export const coverage = {
  audited: contract.visitedThisMonth,
  contracted: contract.contractedPos,
  pct: contract.coveragePct,
  remaining: contract.remaining,
  daysRemaining: contract.daysRemaining,
  daysElapsed: contract.daysElapsed,
  perDaySoFar: Math.round((contract.visitedThisMonth / contract.daysElapsed) * 10) / 10,
  perDayRequired:
    Math.round((contract.remaining / Math.max(1, contract.daysRemaining)) * 10) / 10,
  get onTrack() {
    return this.perDaySoFar >= this.perDayRequired;
  },
};
