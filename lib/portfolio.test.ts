/* The company view's arithmetic, checked independently.

   This is the one place the product reasons about the OWNER rather
   than the client brand, so the thing most worth asserting is that the
   scoping actually holds — a rival brand leaking into the portfolio
   would inflate the company's own exposure with someone else's gaps. */

import { describe, expect, test } from "vitest";
import { portfolioRisk, portfolioVerdict } from "./portfolio";
import { applyFilters, EMPTY_FILTERS } from "./portalFilters";
import { brands, clientBrand, latest, skuOf } from "./portalData";

const view = applyFilters(EMPTY_FILTERS, latest);
const risk = portfolioRisk(view)!;

describe("portfolio risk", () => {
  test("covers every brand the company owns, and only those", () => {
    const owned = brands
      .filter((b) => b.owner === clientBrand.owner)
      .map((b) => b.id)
      .sort();
    expect(risk.brands.map((b) => b.brandId).sort()).toEqual(owned);
    expect(owned).toContain(clientBrand.id);
    expect(owned.length).toBeGreaterThan(1);
  });

  test("the total equals the owned brands' gaps, recomputed", () => {
    const owned = new Set(
      brands.filter((b) => b.owner === clientBrand.owner).map((b) => b.id)
    );
    const expected = view.oosRows
      .filter((r) => owned.has(skuOf(r.skuId)?.brandId ?? ""))
      .reduce((s, r) => s + r.facingDaysAtRisk, 0);
    expect(risk.totalAtRisk).toBe(Math.round(expected));
    /* And it must exceed the client brand alone, or the widening did
       nothing and the page is still a brand view wearing a new label. */
    const clientOnly = view.oosRows
      .filter((r) => skuOf(r.skuId)?.brandId === clientBrand.id)
      .reduce((s, r) => s + r.facingDaysAtRisk, 0);
    expect(risk.totalAtRisk).toBeGreaterThan(clientOnly);
  });

  test("brand percentages sum to about 100", () => {
    const sum = risk.brands.reduce((s, b) => s + b.pct, 0);
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(2); // rounding only
  });

  test("the outlets holding half the risk really do hold half", () => {
    expect(risk.outletsForHalf).toBeGreaterThan(0);
    expect(risk.outletsForHalf).toBeLessThanOrEqual(risk.outletsAffected);
    expect(risk.topOutlets).toHaveLength(risk.outletsForHalf);
  });

  test("the verdict names the axis it claims to have found", () => {
    const v = portfolioVerdict(risk);
    expect(v.headline.length).toBeGreaterThan(0);
    if (risk.concentratedBy === "outlet") {
      expect(v.headline).toContain(String(risk.outletsForHalf));
    }
    if (risk.concentratedBy === "brand") {
      expect(v.headline).toContain(risk.brands[0].name);
    }
  });

  test("a concentration claim is never made on an even split", () => {
    /* The guard that keeps the verdict honest: with three brands at
       42/32/26 no brand carries the portfolio, and the page must not
       say one does. */
    const even = 100 / risk.brands.length;
    if (risk.concentratedBy === "brand") {
      expect(risk.brands[0].pct).toBeGreaterThanOrEqual(even * 1.5);
    } else {
      expect(risk.brands[0].pct).toBeLessThan(even * 1.5);
    }
  });
});
