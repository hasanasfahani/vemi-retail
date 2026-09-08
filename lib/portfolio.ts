/* ============================================================
   THE COMPANY VIEW.

   Every other surface in this product reasons about the client BRAND.
   Overview reasons about the company that owns it — Baghdad Soft
   Drinks holds Pepsi, 7UP and Mirinda — and that is not the same
   question with a bigger number. Share ceded by Pepsi to 7UP is not a
   loss at all, and a brand-scoped page reports it as one.

   What a company-level reader needs from a verdict is not "which
   outlet is worst", which is an operator's question and lives on
   Out-of-Stock. It is WHICH AXIS their exposure sits on, because the
   two answers have different owners:

     concentrated by BRAND   one brand carries the risk. That is a
                             supply conversation, owned by whoever runs
                             that brand's distribution.
     concentrated by OUTLET  a few doors carry it across every brand.
                             That is a coverage problem, owned by field
                             ops, and no amount of brand-level work
                             fixes it.

   So this computes both concentrations and lets the sharper one lead.
   On the current window the portfolio splits 42/32/26 across three
   brands — nearly even — while half the exposure sits in 13 of 45
   affected doors. Not a brand problem. A door problem.
   ============================================================ */

import { brands, clientBrand, posOf, skuOf, brandName } from "./portalData";
import type { FilteredView } from "./portalFilters";

/* Half the risk in this share of the affected doors or fewer counts as
   concentrated. A third would be arbitrary; this is the point at which
   a rep's day can plausibly cover the head of the distribution. */
const OUTLET_CONCENTRATION = 0.35;
/* A brand counts as carrying the portfolio when it holds this multiple
   of an even split — scales with how many brands the company owns
   rather than hardcoding a percentage. */
const BRAND_CONCENTRATION = 1.5;

export type PortfolioRisk = {
  owner: string;
  totalAtRisk: number;
  brands: { brandId: string; name: string; value: number; pct: number }[];
  outletsAffected: number;
  /* Smallest number of outlets holding half the exposure. */
  outletsForHalf: number;
  topOutlets: string[];
  concentratedBy: "brand" | "outlet" | "neither";
};

export function portfolioRisk(view: FilteredView): PortfolioRisk | null {
  const owner = clientBrand.owner;
  const owned = new Set(
    brands.filter((b) => b.owner === owner).map((b) => b.id)
  );

  const byBrand = new Map<string, number>();
  const byOutlet = new Map<string, number>();
  let total = 0;

  for (const row of view.oosRows) {
    const brandId = skuOf(row.skuId)?.brandId;
    if (!brandId || !owned.has(brandId)) continue;
    byBrand.set(brandId, (byBrand.get(brandId) ?? 0) + row.facingDaysAtRisk);
    byOutlet.set(row.posId, (byOutlet.get(row.posId) ?? 0) + row.facingDaysAtRisk);
    total += row.facingDaysAtRisk;
  }
  if (!total) return null;

  const brandRows = [...byBrand.entries()]
    .map(([brandId, value]) => ({
      brandId,
      name: brandName(brandId),
      value: Math.round(value),
      pct: Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);

  const outletRows = [...byOutlet.entries()].sort((a, b) => b[1] - a[1]);
  let running = 0;
  let half = 0;
  for (const [, value] of outletRows) {
    if (running / total >= 0.5) break;
    running += value;
    half += 1;
  }

  const evenSplit = 100 / Math.max(brandRows.length, 1);
  const brandConcentrated =
    brandRows.length > 1 && brandRows[0].pct >= evenSplit * BRAND_CONCENTRATION;
  const outletConcentrated =
    outletRows.length > 1 && half / outletRows.length <= OUTLET_CONCENTRATION;

  return {
    owner,
    totalAtRisk: Math.round(total),
    brands: brandRows,
    outletsAffected: outletRows.length,
    outletsForHalf: half,
    topOutlets: outletRows
      .slice(0, half)
      .map(([posId]) => posOf(posId)?.code ?? posId),
    /* Brand wins ties: if one brand genuinely carries the portfolio,
       that is the more specific instruction, and it holds even when
       those gaps also cluster geographically. */
    concentratedBy: brandConcentrated
      ? "brand"
      : outletConcentrated
        ? "outlet"
        : "neither",
  };
}

/* The verdict, in the imperative, at company altitude. */
export function portfolioVerdict(risk: PortfolioRisk): {
  headline: string;
  detail: string;
} {
  const top = risk.brands[0];
  const brandCount = risk.brands.length;

  if (risk.concentratedBy === "brand") {
    return {
      headline: `Fix supply on ${top.name} — it carries ${top.pct}% of your shelf risk`,
      detail: `${risk.owner} is exposed across ${brandCount} brands, but ${top.name} alone accounts for ${top.pct}% of it. That is one distribution conversation, not a field problem.`,
    };
  }

  if (risk.concentratedBy === "outlet") {
    return {
      headline: `Work ${risk.outletsForHalf} outlets — they hold half your portfolio's shelf risk`,
      detail: `Your exposure splits ${risk.brands
        .map((b) => `${b.pct}%`)
        .join(" / ")} across ${brandCount} brands — close to even, so no single brand is the cause. It concentrates on the door instead: ${risk.outletsForHalf} of ${risk.outletsAffected} affected outlets carry half of it.`,
    };
  }

  return {
    headline: `Your shelf risk is spread — no single brand or store leads it`,
    detail: `${risk.totalAtRisk.toLocaleString()} facing-days at risk across ${brandCount} brands and ${risk.outletsAffected} outlets, with neither axis concentrated. This is a coverage baseline to lift, not a fault to fix.`,
  };
}
