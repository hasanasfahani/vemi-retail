/* ============================================================
   PERFORMANCE — the arithmetic behind the five tabs.

   Pure functions over a filtered view, so the tab components stay
   presentational and every figure on the page can be re-derived (and
   tested) without rendering anything. Nothing here knows a city name.
   ============================================================ */

import {
  brands, channels, governorates, clientBrand, oosReasons, posmTypes,
  requiredSkus, skus, trends,
} from "./index";
import type { MarketView } from "./filters";
import type { Cell } from "./types";

const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d === 0 ? 0 : r1((n / d) * 100));
const mean = (values: number[]) =>
  values.length ? r1(values.reduce((a, b) => a + b, 0) / values.length) : 0;

const skuBrand = new Map(skus.map((s) => [s.id, s.brandId]));
const isClient = (c: Cell) => skuBrand.get(c.skuId) === clientBrand.id;

export const clientSkus = skus.filter((s) => s.brandId === clientBrand.id);

/* ---------- movement ----------

   How a measure moved since last month, read from the trend series
   that matches the current filter: one city selected reads that city's
   own line, anything else reads the market line. Without this, a
   Baghdad-filtered page would state a national movement beside a
   Baghdad figure and label it "vs last month".

   The floor comes back with the number, because a movement is only
   worth reporting against the panel's ability to detect it — and the
   smaller the slice, the coarser that ability. */
export type Movement = { delta: number; floor: number; scope: string };

const MARKET_FLOOR: Record<string, number> = {
  availability: 1.73, shelfShare: 1.81, score: 1.8, assortment: 1.8,
  price: 1.8, posm: 1.8,
};

/* Bootstrapped per-city share floors, from scripts/calibrate-insights.mjs. */
const GOVERNORATE_FLOOR: Record<string, number> = {
  baghdad: 3.09, basra: 4.63, erbil: 4.79, nineveh: 5.05, najaf: 4.90, karbala: 5.57,
};

export function movement(
  view: MarketView,
  key: "availability" | "shelfShare" | "score" | "assortment" | "price" | "posm"
): Movement {
  const single = view.filters.governorates.length === 1 ? view.filters.governorates[0] : null;
  const line = single ? trends.byGovernorate[single] : trends.market;
  if (!line || line.length < 2) return { delta: 0, floor: 99, scope: "no comparable month" };
  const last = line[line.length - 1];
  const prior = line[line.length - 2];
  return {
    delta: r1(last[key] - prior[key]),
    floor: single ? (GOVERNORATE_FLOOR[single] ?? 5) : (MARKET_FLOOR[key] ?? 1.8),
    scope: single ? governorates.find((c) => c.id === single)?.name ?? single : "all audited outlets",
  };
}

/* ---------- availability ---------- */

export function availability(view: MarketView) {
  const own = view.cells.filter(isClient);
  const posById = new Map(view.outlets.map((p) => [p.id, p]));

  const rate = (rows: Cell[]) => pct(rows.filter((c) => c.state === "in-stock").length, rows.length);

  const byGovernorate = governorates
    .map((city) => {
      const rows = own.filter((c) => posById.get(c.posId)?.governorateId === city.id);
      return {
        id: city.id,
        label: city.name,
        value: rate(rows),
        listings: rows.length,
        outlets: new Set(rows.map((c) => c.posId)).size,
      };
    })
    .filter((row) => row.listings > 0)
    .sort((a, b) => b.value - a.value);

  /* Client against the whole category in the same channel — the
     grouped pair the brief asks for. "We are at 88%" means something
     different when everyone else in that format is at 91%. */
  const byChannel = channels
    .map((channel) => {
      const rows = view.cells.filter((c) => posById.get(c.posId)?.channel === channel.id);
      const ours = rows.filter(isClient);
      return {
        id: channel.id,
        label: channel.name,
        client: rate(ours),
        category: rate(rows.filter((c) => !isClient(c))),
        listings: ours.length,
      };
    })
    .filter((row) => row.listings > 0);

  const bySku = clientSkus
    .map((sku) => {
      const rows = own.filter((c) => c.skuId === sku.id);
      const out = rows.filter((c) => c.state === "out-of-stock").length;
      return {
        id: sku.id,
        label: sku.name,
        value: rate(rows),
        listed: rows.length,
        out,
      };
    })
    .filter((row) => row.listed > 0)
    .sort((a, b) => a.value - b.value);

  /* Reasons are recorded on the gap itself, by the auditor who found
     it — not inferred here. */
  const clientGaps = view.gaps.filter((g) => skuBrand.get(g.skuId) === clientBrand.id);
  const byReason = oosReasons
    .map((reason) => ({
      id: reason.id,
      name: reason.name,
      value: clientGaps.filter((g) => g.reasonId === reason.id).length,
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  /* SKU × city out-of-stock counts — where the SKU story is
     concentrated, which is the question the demo narrative turns on. */
  const gapGrid = new Map<string, number>();
  for (const cell of own) {
    if (cell.state !== "out-of-stock") continue;
    const governorateId = posById.get(cell.posId)?.governorateId;
    if (!governorateId) continue;
    const key = `${cell.skuId}|${governorateId}`;
    gapGrid.set(key, (gapGrid.get(key) ?? 0) + 1);
  }

  const totalGaps = own.filter((c) => c.state === "out-of-stock").length;
  const worst = bySku[0];

  return {
    rate: rate(own),
    listings: own.length,
    gaps: totalGaps,
    byGovernorate,
    byChannel,
    bySku,
    byReason,
    gapAt: (skuId: string, governorateId: string) => gapGrid.get(`${skuId}|${governorateId}`) ?? null,
    /* "Pepsi 500ml accounts for 38% of detected Pepsi OOS cases" — the
       brief's own sentence, computed rather than written. */
    worstSku: worst
      ? { ...worst, shareOfGaps: pct(worst.out, totalGaps) }
      : null,
  };
}

/* ---------- shelf & visibility ---------- */

/* A row for the 100% stacked charts: the labelled dimension plus one
   share per brand, keyed by brand id. Recharts wants the series flat
   on the row, so the brand keys sit alongside the labels and the index
   signature says so out loud rather than leaving callers to cast. */
export type ShareRow = {
  id: string;
  label: string;
  total: number;
  [brandId: string]: string | number;
};

export function shelf(view: MarketView) {
  const posById = new Map(view.outlets.map((p) => [p.id, p]));
  const stocked = view.cells.filter((c) => c.state === "in-stock");
  const facings = (rows: Cell[]) => rows.reduce((s, c) => s + c.facings, 0);

  const shareIn = (rows: Cell[], brandId: string) => {
    const total = facings(rows);
    return total === 0 ? 0 : pct(facings(rows.filter((c) => skuBrand.get(c.skuId) === brandId)), total);
  };

  const byGovernorate: ShareRow[] = governorates
    .map((city) => {
      const rows = stocked.filter((c) => posById.get(c.posId)?.governorateId === city.id);
      return {
        id: city.id,
        label: city.name,
        total: facings(rows),
        ...Object.fromEntries(brands.map((b) => [b.id, shareIn(rows, b.id)])),
      };
    })
    .filter((row) => row.total > 0);

  const byChannel: ShareRow[] = channels
    .map((channel) => {
      const rows = stocked.filter((c) => posById.get(c.posId)?.channel === channel.id);
      return {
        id: channel.id,
        label: channel.name,
        total: facings(rows),
        ...Object.fromEntries(brands.map((b) => [b.id, shareIn(rows, b.id)])),
      };
    })
    .filter((row) => row.total > 0);

  const byBrand = brands
    .map((brand) => {
      const rows = stocked.filter((c) => skuBrand.get(c.skuId) === brand.id);
      const outlets = new Set(rows.map((c) => c.posId)).size;
      return {
        id: brand.id,
        name: brand.name,
        share: shareIn(stocked, brand.id),
        facings: facings(rows),
        /* Average facings per outlet that carries the brand — the
           number a category manager negotiates over, and a different
           question from total share. */
        perOutlet: outlets ? r1(facings(rows) / outlets) : 0,
        outlets,
      };
    })
    .sort((a, b) => b.share - a.share);

  const positions = (["eye", "upper", "lower"] as const).map((position) => {
    const rows = stocked.filter((c) => c.position === position);
    return {
      id: position,
      label: position === "eye" ? "Eye level" : position === "upper" ? "Upper shelf" : "Lower shelf",
      total: facings(rows),
      clientShare: shareIn(rows, clientBrand.id),
    };
  });

  /* Best and worst outlets by the client's own share of that shelf —
     the two ends of the same distribution, so a reader can see what
     "good" looks like beside what "bad" looks like. */
  const perOutlet = [...new Set(stocked.map((c) => c.posId))]
    .map((posId) => {
      const rows = stocked.filter((c) => c.posId === posId);
      return { posId, share: shareIn(rows, clientBrand.id), facings: facings(rows) };
    })
    .filter((row) => row.facings >= 12)
    .sort((a, b) => b.share - a.share);

  return {
    clientShare: shareIn(stocked, clientBrand.id),
    byGovernorate,
    byChannel,
    byBrand,
    positions,
    best: perOutlet.slice(0, 3),
    worst: perOutlet.slice(-3).reverse(),
  };
}

/* ---------- pricing ---------- */

export function pricing(view: MarketView) {
  const posById = new Map(view.outlets.map((p) => [p.id, p]));
  const compliant = (variance: number) => Math.abs(variance) <= 5;

  const bySku = skus
    .map((sku) => {
      const rows = view.prices.filter((p) => p.skuId === sku.id);
      if (!rows.length) return null;
      return {
        id: sku.id,
        name: sku.name,
        brandId: sku.brandId,
        rrp: sku.rrp,
        average: Math.round(mean(rows.map((p) => p.price))),
        compliance: pct(rows.filter((p) => compliant(p.variance)).length, rows.length),
        readings: rows.length,
        spread: {
          min: Math.min(...rows.map((p) => p.price)),
          max: Math.max(...rows.map((p) => p.price)),
        },
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const clientRows = view.prices.filter((p) => skuBrand.get(p.skuId) === clientBrand.id);

  /* A histogram of how far readings sit from list, in five-point
     bands. The shape is the story: a tight peak on nought is
     discipline, a long right tail is retailers marking up. */
  const BANDS = [
    { id: "under-10", label: "More than 10% under", test: (v: number) => v < -10 },
    { id: "under-5", label: "5–10% under", test: (v: number) => v < -5 && v >= -10 },
    { id: "at-list", label: "Within 5% of list", test: (v: number) => Math.abs(v) <= 5 },
    { id: "over-5", label: "5–10% over", test: (v: number) => v > 5 && v <= 10 },
    { id: "over-10", label: "More than 10% over", test: (v: number) => v > 10 },
  ];
  const distribution = BANDS.map((band) => ({
    id: band.id,
    label: band.label,
    value: clientRows.filter((p) => band.test(p.variance)).length,
  }));

  /* Deep enough that the table's city and SKU filters have something
     to work on. Twelve rows filtered by city returns one or two, which
     is a control that looks broken rather than a control that helps;
     the page still shows twelve at a time, worst first. */
  const outliers = [...clientRows]
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 120)
    .map((p) => ({
      ...p,
      outlet: posById.get(p.posId),
      sku: skus.find((s) => s.id === p.skuId),
    }));

  const byGovernorate = governorates
    .map((city) => {
      const rows = clientRows.filter((p) => posById.get(p.posId)?.governorateId === city.id);
      if (!rows.length) return null;
      return {
        id: city.id,
        label: city.name,
        average: Math.round(mean(rows.map((p) => p.price))),
        compliance: pct(rows.filter((p) => compliant(p.variance)).length, rows.length),
        readings: rows.length,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.compliance - a.compliance);

  return {
    compliance: pct(clientRows.filter((p) => compliant(p.variance)).length, clientRows.length),
    readings: clientRows.length,
    bySku,
    distribution,
    outliers,
    byGovernorate,
  };
}

/* ---------- assortment ---------- */

export function assortment(view: MarketView) {
  const posById = new Map(view.outlets.map((p) => [p.id, p]));
  const listedAt = new Map<string, Set<string>>();
  for (const cell of view.cells) {
    if (!isClient(cell)) continue;
    const held = listedAt.get(cell.posId) ?? new Set<string>();
    held.add(cell.skuId);
    listedAt.set(cell.posId, held);
  }

  /* Compliance is measured against what the CHANNEL is supposed to
     carry, not against the full range: a corner grocery was never
     expected to stock six SKUs, and judging it against six would
     manufacture a failure. */
  const perOutlet = view.outlets.map((outlet) => {
    const required = requiredSkus[outlet.channel] ?? clientSkus.length;
    const listed = listedAt.get(outlet.id)?.size ?? 0;
    return {
      posId: outlet.id,
      required,
      listed,
      compliance: pct(Math.min(listed, required), required),
    };
  });

  const penetration = clientSkus
    .map((sku) => {
      const outlets = view.cells.filter((c) => c.skuId === sku.id).length;
      return {
        id: sku.id,
        label: sku.name,
        value: pct(outlets, view.posCount),
        outlets,
        missing: view.posCount - outlets,
      };
    })
    .sort((a, b) => b.value - a.value);

  /* SKU × city penetration, the matrix the brief asks for. */
  const grid = new Map<string, number>();
  for (const cell of view.cells) {
    if (!isClient(cell)) continue;
    const governorateId = posById.get(cell.posId)?.governorateId;
    if (!governorateId) continue;
    grid.set(`${cell.skuId}|${governorateId}`, (grid.get(`${cell.skuId}|${governorateId}`) ?? 0) + 1);
  }
  const governorateOutlets = new Map(
    governorates.map((c) => [c.id, view.outlets.filter((p) => p.governorateId === c.id).length])
  );

  const byChannel = channels
    .map((channel) => {
      const rows = perOutlet.filter((row) => posById.get(row.posId)?.channel === channel.id);
      if (!rows.length) return null;
      return {
        id: channel.id,
        label: channel.name,
        value: mean(rows.map((r) => r.compliance)),
        required: requiredSkus[channel.id] ?? clientSkus.length,
        listed: mean(rows.map((r) => r.listed)),
        outlets: rows.length,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.value - a.value);

  return {
    compliance: mean(perOutlet.map((row) => row.compliance)),
    penetration,
    byChannel,
    penetrationAt: (skuId: string, governorateId: string) => {
      const total = governorateOutlets.get(governorateId) ?? 0;
      if (!total) return null;
      return pct(grid.get(`${skuId}|${governorateId}`) ?? 0, total);
    },
  };
}

/* ---------- POSM ---------- */

export function posm(view: MarketView) {
  const posById = new Map(view.outlets.map((p) => [p.id, p]));

  const byType = posmTypes
    .map((type) => {
      const rows = view.posm.filter((p) => p.typeId === type.id);
      return {
        id: type.id,
        label: type.name,
        value: pct(rows.filter((p) => p.present).length, rows.length),
        checked: rows.length,
        present: rows.filter((p) => p.present).length,
      };
    })
    .filter((row) => row.checked > 0)
    .sort((a, b) => b.value - a.value);

  const rateFor = (test: (posId: string) => boolean) => {
    const rows = view.posm.filter((p) => test(p.posId));
    return { value: pct(rows.filter((p) => p.present).length, rows.length), checked: rows.length };
  };

  const byGovernorate = governorates
    .map((city) => {
      const { value, checked } = rateFor((id) => posById.get(id)?.governorateId === city.id);
      const missing = view.posm.filter(
        (p) => !p.present && posById.get(p.posId)?.governorateId === city.id
      ).length;
      return { id: city.id, label: city.name, value, checked, missing };
    })
    .filter((row) => row.checked > 0)
    .sort((a, b) => a.value - b.value);

  const byChannel = channels
    .map((channel) => {
      const { value, checked } = rateFor((id) => posById.get(id)?.channel === channel.id);
      return { id: channel.id, label: channel.name, value, checked };
    })
    .filter((row) => row.checked > 0)
    .sort((a, b) => b.value - a.value);

  /* Outlets carrying the client with no material at all — the same
     population R13 reports, computed once here for the gallery. */
  const stocking = new Set(
    view.cells.filter((c) => isClient(c) && c.state === "in-stock").map((c) => c.posId)
  );
  const perOutlet = new Map<string, { n: number; present: number }>();
  for (const row of view.posm) {
    const held = perOutlet.get(row.posId) ?? { n: 0, present: 0 };
    held.n += 1;
    held.present += row.present ? 1 : 0;
    perOutlet.set(row.posId, held);
  }
  const bare = [...perOutlet]
    .filter(([posId, v]) => stocking.has(posId) && v.present === 0)
    .map(([posId]) => posId);

  const ranked = [...perOutlet]
    .map(([posId, v]) => ({ posId, value: pct(v.present, v.n), checked: v.n }))
    .filter((row) => row.checked >= 3)
    .sort((a, b) => b.value - a.value);

  return {
    compliance: pct(view.posm.filter((p) => p.present).length, view.posm.length),
    checked: view.posm.length,
    byType,
    byGovernorate,
    byChannel,
    bare,
    best: ranked.slice(0, 3),
    worst: ranked.slice(-3).reverse(),
  };
}
