/* ============================================================
   THE OUTLET VIEW.

   One row per audited outlet with everything the Explorer table and
   the detail drawer need, plus the issues found at that door.

   "Issues" are not a new analysis. They are the same conditions the
   rules engine tests, evaluated at one outlet — stated here in the
   short form a chip needs rather than the sentence a card needs. The
   thresholds are imported from the engine so a chip and a finding can
   never disagree about what counts as a problem.
   ============================================================ */

import {
  auditorName, channelName, cityName, clientBrand, kpiTargets, requiredSkus,
  skuOf, sharePar,
} from "./index";
import { THRESHOLDS } from "./insights";
import type { MarketView } from "./filters";
import type { Cell, Pos } from "./types";

const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (n: number, d: number) => (d === 0 ? 0 : r1((n / d) * 100));

export type IssueKind =
  | "gaps" | "dark" | "price" | "range" | "posm" | "share";

export type Issue = {
  kind: IssueKind;
  label: string;
  detail: string;
  severity: "critical" | "warning";
};

export type PosRow = {
  pos: Pos;
  auditedAt: string;
  collector: string;
  score: number;
  availability: number;
  shelfShare: number;
  assortment: number;
  price: number;
  posm: number;
  /* Client lines listed at this door, and how many were empty. */
  listed: number;
  gaps: number;
  facings: number;
  issues: Issue[];
  cells: Cell[];
};

export function posRows(view: MarketView): PosRow[] {
  const scoreById = new Map(view.scores.map((s) => [s.posId, s]));
  const cellsByPos = new Map<string, Cell[]>();
  for (const cell of view.cells) {
    cellsByPos.set(cell.posId, [...(cellsByPos.get(cell.posId) ?? []), cell]);
  }
  const pricesByPos = new Map<string, typeof view.prices>();
  for (const row of view.prices) {
    pricesByPos.set(row.posId, [...(pricesByPos.get(row.posId) ?? []), row]);
  }
  const posmByPos = new Map<string, { n: number; present: number }>();
  for (const row of view.posm) {
    const held = posmByPos.get(row.posId) ?? { n: 0, present: 0 };
    held.n += 1;
    held.present += row.present ? 1 : 0;
    posmByPos.set(row.posId, held);
  }

  /* Channel medians for the range check — the same comparison R11
     makes, so a chip here and a finding there agree by construction. */
  const listedPerOutlet = new Map<string, number>();
  for (const [posId, cells] of cellsByPos) {
    listedPerOutlet.set(
      posId,
      cells.filter((c) => skuOf(c.skuId)?.brandId === clientBrand.id).length
    );
  }

  return view.outlets.flatMap((outlet) => {
    const score = scoreById.get(outlet.id);
    const cells = cellsByPos.get(outlet.id) ?? [];
    if (!score) return [];

    const own = cells.filter((c) => skuOf(c.skuId)?.brandId === clientBrand.id);
    const gaps = own.filter((c) => c.state === "out-of-stock");
    const stocked = cells.filter((c) => c.state === "in-stock");
    const facings = stocked.reduce((s, c) => s + c.facings, 0);
    const clientFacings = stocked
      .filter((c) => skuOf(c.skuId)?.brandId === clientBrand.id)
      .reduce((s, c) => s + c.facings, 0);

    const prices = pricesByPos.get(outlet.id) ?? [];
    const breaches = prices.filter(
      (p) => skuOf(p.skuId)?.brandId === clientBrand.id && Math.abs(p.variance) > 5
    );
    const posmHeld = posmByPos.get(outlet.id) ?? { n: 0, present: 0 };
    const required = requiredSkus[outlet.channel] ?? own.length;

    const issues: Issue[] = [];

    if (own.length > 0 && gaps.length === own.length) {
      issues.push({
        kind: "dark",
        label: "No client stock",
        detail: `All ${own.length} listed ${clientBrand.name} lines were out of stock.`,
        severity: "critical",
      });
    } else if (gaps.length >= THRESHOLDS.r1OutletGaps.warningCount) {
      issues.push({
        kind: "gaps",
        label: `${gaps.length} lines empty`,
        detail: `${gaps.length} of ${own.length} listed ${clientBrand.name} SKUs were out of stock on the visit.`,
        severity:
          gaps.length >= THRESHOLDS.r1OutletGaps.criticalCount ? "critical" : "warning",
      });
    }

    if (breaches.length >= THRESHOLDS.r5PriceCluster.warningCount) {
      issues.push({
        kind: "price",
        label: `${breaches.length} mispriced`,
        detail: `${breaches.length} ${clientBrand.name} lines priced more than 5% away from RRP.`,
        severity:
          breaches.length >= THRESHOLDS.r5PriceCluster.criticalCount ? "critical" : "warning",
      });
    }

    const short = required - own.length;
    if (short >= THRESHOLDS.r11AssortmentGap.warningCount) {
      issues.push({
        kind: "range",
        label: `${short} SKUs short`,
        detail: `Carries ${own.length} ${clientBrand.name} SKUs against ${required} expected in ${channelName(outlet.channel)}.`,
        severity:
          short >= THRESHOLDS.r11AssortmentGap.criticalCount ? "critical" : "warning",
      });
    }

    if (posmHeld.n > 0 && posmHeld.present === 0 && clientFacings > 0) {
      issues.push({
        kind: "posm",
        label: "No POSM",
        detail: `Stocks ${clientBrand.name} and carries none of the ${posmHeld.n} agreed material types.`,
        severity: "critical",
      });
    }

    const share = pct(clientFacings, facings);
    if (facings > 0 && share < sharePar * 100 * 0.6) {
      issues.push({
        kind: "share",
        label: `${share}% of shelf`,
        detail: `${clientBrand.name} holds ${share}% of measured facings here against a ${Math.round(sharePar * 100)}% par.`,
        severity: "warning",
      });
    }

    return [
      {
        pos: outlet,
        auditedAt: view.auditedAt.get(outlet.id) ?? "",
        collector: auditorName(view.auditedBy.get(outlet.id) ?? ""),
        score: score.score,
        availability: score.availability,
        shelfShare: score.shelfShare,
        assortment: score.assortment,
        price: score.price,
        posm: score.posm,
        listed: own.length,
        gaps: gaps.length,
        facings: clientFacings,
        issues,
        cells,
      },
    ];
  });
}

/* What to do about this door, derived from the issues found there. The
   drawer shows these; the Action Center is where they become tracked
   work. */
export function recommendationsFor(row: PosRow): string[] {
  const out: string[] = [];
  for (const issue of row.issues) {
    if (issue.kind === "dark") out.push(`Emergency replenishment — the door lists ${clientBrand.name} and sells none of it.`);
    if (issue.kind === "gaps") out.push(`Prioritise replenishment of the ${row.gaps} empty ${clientBrand.name} lines.`);
    if (issue.kind === "price") out.push("Raise the pricing breach with the retailer.");
    if (issue.kind === "range") out.push("Sell the missing range in on the next visit.");
    if (issue.kind === "posm") out.push("Fit the agreed point-of-sale material.");
    if (issue.kind === "share") out.push("Negotiate facings at the next range review.");
  }
  if (out.length === 0) {
    out.push(`Nothing outstanding — ${row.pos.name} met every threshold the audit checks.`);
  }
  return out;
}

export const kpiTargetsForDrawer = [
  { key: "availability" as const, label: "Availability", target: kpiTargets.availability },
  { key: "shelfShare" as const, label: "Shelf share", target: Math.round(sharePar * 100) },
  { key: "assortment" as const, label: "Assortment", target: kpiTargets.assortment },
  { key: "price" as const, label: "Price", target: kpiTargets.price },
  { key: "posm" as const, label: "POSM", target: kpiTargets.posm },
];

export const locationOf = (outlet: Pos) =>
  `${outlet.district}, ${cityName(outlet.cityId)}`;
