/* ============================================================
   ISSUE RECORDS.

   Everything the follow-up flow does — count affected outlets, export a
   gap report, select POS for a revisit, recompute a baseline under a
   filter — needs the same thing: the gaps a cycle found, as individual
   addressable records rather than as an aggregate.

   TWO COUNTS, KEPT APART EVERYWHERE. An outlet with three empty lines
   is ONE affected POS and THREE issues. Collapsing them is the fastest
   way to a page that says "91 issues" while meaning outlets, and the
   two numbers diverge by a factor of one and a half in this dataset.

   Records are DERIVED, never stored. A stored issue would drift from
   the audit the moment the data was regenerated; an id built from the
   observation itself stays stable without being persisted.
   ============================================================ */

import {
  channelName, clientBrand, governorateName, requiredSkus, skuOf, skus,
} from "./index";
import { getTargets } from "./settings";
import type { MarketView } from "./filters";

export type IssueKpi = "availability" | "shelfShare" | "assortment" | "price" | "posm";

export const KPI_LABEL: Record<IssueKpi, string> = {
  availability: "Availability",
  shelfShare: "Shelf & visibility",
  assortment: "Assortment",
  price: "Pricing",
  posm: "POSM",
};

/* What the export and the drawer call the thing that is wrong. */
export type Issue = {
  id: string;
  kpi: IssueKpi;
  brandId: string;
  skuId: string | null;
  posId: string;
  posName: string;
  posCode: string;
  governorateId: string;
  governorate: string;
  district: string;
  retailer: string;
  channel: string;
  auditedAt: string;
  /* Which visit saw it. There are no photographs, so evidence is the
     visit's identity — outlet, date, collector — and the drawn shelf
     that belongs to it. */
  evidenceRef: string;
  type: string;
  severity: "critical" | "warning";
};

const clientSkus = skus.filter((s) => s.brandId === clientBrand.id);

/* The range a format is expected to carry, as a LIST rather than a
   count. `requiredSkus` says a grocery should hold three client lines
   but not which three, and "which" is exactly what an assortment gap
   report has to name. The answer is the lines that sell widest: rank
   the client's SKUs by how many audited outlets list them, and the top
   N are what a format of that size should stock. Deterministic, stated,
   and it moves with the market rather than with an opinion. */
export function expectedRange(view: MarketView, channel: string): string[] {
  const listedIn = new Map<string, number>();
  for (const cell of view.cells) {
    if (skuOf(cell.skuId)?.brandId !== clientBrand.id) continue;
    listedIn.set(cell.skuId, (listedIn.get(cell.skuId) ?? 0) + 1);
  }
  const expected = requiredSkus[channel] ?? clientSkus.length;
  return [...clientSkus]
    .sort((a, b) => (listedIn.get(b.id) ?? 0) - (listedIn.get(a.id) ?? 0))
    .slice(0, expected)
    .map((s) => s.id);
}

function base(view: MarketView, posId: string) {
  const outlet = view.outlets.find((p) => p.id === posId);
  if (!outlet) return null;
  const auditedAt = view.auditedAt.get(posId) ?? "";
  return {
    posId,
    posName: outlet.name,
    posCode: outlet.code,
    governorateId: outlet.governorateId,
    governorate: governorateName(outlet.governorateId),
    district: outlet.district,
    retailer: outlet.retailer,
    channel: channelName(outlet.channel),
    auditedAt,
    evidenceRef: `${outlet.code}@${auditedAt}`,
    brandId: clientBrand.id,
  };
}

/* ---------- the five kinds ---------- */

export function issuesFor(view: MarketView, kpi: IssueKpi): Issue[] {
  const targets = getTargets();
  const out: Issue[] = [];
  const month = view.month;

  if (kpi === "availability") {
    for (const cell of view.cells) {
      if (cell.state !== "out-of-stock") continue;
      if (skuOf(cell.skuId)?.brandId !== clientBrand.id) continue;
      const b = base(view, cell.posId);
      if (!b) continue;
      /* Every listed client line at this outlet empty is a different
         problem from one of six, and the severity says so. */
      const own = view.cells.filter(
        (c) => c.posId === cell.posId && skuOf(c.skuId)?.brandId === clientBrand.id
      );
      const dark = own.every((c) => c.state === "out-of-stock");
      out.push({
        ...b,
        id: `availability:${month}:${cell.posId}:${cell.skuId}`,
        kpi,
        skuId: cell.skuId,
        type: dark ? "No client stock at all" : "Listed but out of stock",
        severity: dark ? "critical" : "warning",
      });
    }
    return out;
  }

  if (kpi === "price") {
    for (const reading of view.prices) {
      if (skuOf(reading.skuId)?.brandId !== clientBrand.id) continue;
      if (Math.abs(reading.variance) <= 5) continue;
      const b = base(view, reading.posId);
      if (!b) continue;
      out.push({
        ...b,
        id: `price:${month}:${reading.posId}:${reading.skuId}`,
        kpi,
        skuId: reading.skuId,
        type: `${reading.variance > 0 ? "Above" : "Below"} list by ${Math.abs(reading.variance)}%`,
        severity: Math.abs(reading.variance) > 10 ? "critical" : "warning",
      });
    }
    return out;
  }

  if (kpi === "posm") {
    /* Only where the brand is actually on shelf: material missing at an
       outlet that stocks none of the range is the range's problem. */
    const stocking = new Set(
      view.cells
        .filter((c) => c.state === "in-stock" && skuOf(c.skuId)?.brandId === clientBrand.id)
        .map((c) => c.posId)
    );
    const byPos = new Map<string, number>();
    for (const row of view.posm) {
      if (row.present) continue;
      byPos.set(row.posId, (byPos.get(row.posId) ?? 0) + 1);
    }
    for (const row of view.posm) {
      if (row.present || !stocking.has(row.posId)) continue;
      const b = base(view, row.posId);
      if (!b) continue;
      const checked = view.posm.filter((p) => p.posId === row.posId).length;
      const missing = byPos.get(row.posId) ?? 0;
      out.push({
        ...b,
        id: `posm:${month}:${row.posId}:${row.typeId}`,
        kpi,
        skuId: null,
        type: `${row.typeId.replace("-", " ")} missing`,
        severity: missing === checked ? "critical" : "warning",
      });
    }
    return out;
  }

  if (kpi === "assortment") {
    for (const outlet of view.outlets) {
      const expected = expectedRange(view, outlet.channel);
      const listed = new Set(
        view.cells.filter((c) => c.posId === outlet.id).map((c) => c.skuId)
      );
      const missing = expected.filter((skuId) => !listed.has(skuId));
      if (missing.length === 0) continue;
      const b = base(view, outlet.id);
      if (!b) continue;
      for (const skuId of missing) {
        out.push({
          ...b,
          id: `assortment:${month}:${outlet.id}:${skuId}`,
          kpi,
          skuId,
          type: "Expected in this format, not listed",
          severity: missing.length >= expected.length / 2 ? "critical" : "warning",
        });
      }
    }
    return out;
  }

  /* shelfShare — one issue per outlet, because a share is a property of
     the fixture rather than of a line. */
  const fixture = new Map<string, { own: number; all: number }>();
  for (const cell of view.cells) {
    if (cell.state !== "in-stock") continue;
    const held = fixture.get(cell.posId) ?? { own: 0, all: 0 };
    held.all += cell.facings;
    if (skuOf(cell.skuId)?.brandId === clientBrand.id) held.own += cell.facings;
    fixture.set(cell.posId, held);
  }
  for (const [posId, held] of fixture) {
    if (held.all === 0) continue;
    const share = Math.round((held.own / held.all) * 1000) / 10;
    if (share >= targets.shelfShare) continue;
    const b = base(view, posId);
    if (!b) continue;
    out.push({
      ...b,
      id: `shelfShare:${month}:${posId}`,
      kpi,
      skuId: null,
      type: `${share}% of the fixture against a ${targets.shelfShare}% par`,
      severity: share < targets.shelfShare / 2 ? "critical" : "warning",
    });
  }
  return out;
}

/* ---------- the two counts, named ---------- */

export type Scope = { affectedPos: number; issues: number };

export function scopeOf(issues: Issue[]): Scope {
  return { affectedPos: new Set(issues.map((i) => i.posId)).size, issues: issues.length };
}

/* Which outlets a follow-up should visit first.

   Stated rather than hidden, because a ranked selection nobody can
   inspect is the kind of black box the rest of this portal avoids:
   count the issues at the outlet, weight the critical ones double, and
   break ties on the volume the outlet turns. */
export function rankedPos(issues: Issue[], view: MarketView): string[] {
  const weight = new Map<string, number>();
  for (const issue of issues) {
    weight.set(issue.posId, (weight.get(issue.posId) ?? 0) + (issue.severity === "critical" ? 2 : 1));
  }
  const volume = new Map(view.outlets.map((p) => [p.id, p.volume]));
  return [...weight.entries()]
    .sort((a, b) => b[1] - a[1] || (volume.get(b[0]) ?? 0) - (volume.get(a[0]) ?? 0))
    .map(([posId]) => posId);
}

export const RANKING_RULE =
  "Outlets are ranked by how many issues each carries, counting a critical issue twice, with the outlet's trading volume breaking ties.";
