/* Portfolio brand health.

   The properties that matter: the composite is the same one the rest
   of the portal quotes, the shelf component does not punish a brand
   for being small, and the section stays the company's own house even
   when the global filter points somewhere else. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, loadMonth, portfolioBrands, scoreWeights, clientBrand } from "./index";
import { isPortfolio, portfolioHealth, portfolioScore } from "./brandHealth";

const view = applyFilters(EMPTY_FILTERS, current);
const previous = await loadMonth("2026-08");
const priorView = applyFilters({ ...EMPTY_FILTERS, month: "2026-08" }, previous);
const rows = portfolioHealth(view, priorView);

describe("the composite", () => {
  it("covers every brand the company owns, and nobody else's", () => {
    expect(rows.length).toBe(portfolioBrands.length);
    for (const row of rows) expect(isPortfolio(row.brandId)).toBe(true);
    expect(rows.some((r) => r.brandId === "coca-cola")).toBe(false);
  });

  it("weights the five components exactly as the execution score does", () => {
    for (const row of rows) {
      const recomputed = Math.round(
        row.components.reduce((sum, part) => sum + part.score * part.weight, 0)
      );
      expect(row.score).toBe(recomputed);
      const weights = Object.fromEntries(row.components.map((c) => [c.id, c.weight]));
      expect(weights.availability).toBe(scoreWeights.availability);
      expect(weights.shelfShare).toBe(scoreWeights.shelfShare);
      expect(weights.assortment).toBe(scoreWeights.assortment);
      expect(weights.price).toBe(scoreWeights.price);
      expect(weights.posm).toBe(scoreWeights.posm);
    }
  });

  it("keeps every component inside the range a score can occupy", () => {
    for (const row of rows) {
      expect(row.score).toBeGreaterThanOrEqual(0);
      expect(row.score).toBeLessThanOrEqual(100);
      for (const part of row.components) {
        expect(part.score).toBeGreaterThanOrEqual(0);
        expect(part.score).toBeLessThanOrEqual(100);
      }
    }
  });

  it("does not punish a brand for being small", () => {
    /* The whole reason shelf is scored as conversion. Against Pepsi's
       40% par, Mountain Dew's 4% share would score 10 and drag its
       composite to a number that describes size, not health. */
    const dew = rows.find((r) => r.brandId === "mountain-dew")!;
    const shelf = dew.components.find((c) => c.id === "shelfShare")!;
    expect(dew.share).toBeLessThan(10);
    expect(shelf.score).toBeGreaterThan(dew.share * 2);
    expect(dew.score).toBeGreaterThan(50);
  });

  it("caps conversion at 100, so a big brand cannot bank credit for size", () => {
    const lead = rows.find((r) => r.isClient)!;
    const shelf = lead.components.find((c) => c.id === "shelfShare")!;
    expect(shelf.score).toBeLessThanOrEqual(100);
  });

  it("names the weakest component by its score, not by its digits", () => {
    for (const row of rows) {
      const lowest = [...row.components].sort((a, b) => a.score - b.score)[0];
      expect(row.weakest.id).toBe(lowest.id);
      expect(row.weakest.display.length).toBeGreaterThan(3);
    }
  });

  it("ranks the portfolio strongest first, with the lead brand ahead", () => {
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].score).toBeGreaterThanOrEqual(rows[i].score);
    }
    expect(rows[0].brandId).toBe(clientBrand.id);
  });
});

describe("movement", () => {
  it("compares against the previous cycle when it is available", () => {
    for (const row of rows) expect(row.delta).not.toBeNull();
  });

  it("states a level and no movement before the previous cycle loads", () => {
    /* A card that invented a delta while last month's rows were still
       in flight would be showing a number it does not have. */
    for (const row of portfolioHealth(view, null)) {
      expect(row.delta).toBeNull();
      expect(row.score).toBeGreaterThan(0);
    }
  });
});

describe("scope", () => {
  it("follows outlet filters, because narrowing WHERE is the point of them", () => {
    const baghdad = portfolioHealth(
      applyFilters({ ...EMPTY_FILTERS, governorates: ["baghdad"] }, current),
      null
    );
    expect(baghdad.length).toBe(rows.length);
    const national = rows.find((r) => r.isClient)!;
    const local = baghdad.find((r) => r.isClient)!;
    expect(local.outlets).toBeLessThan(national.outlets);
  });

  it("weights the portfolio figure by facings, not by brand count", () => {
    /* An unweighted mean would let three small brands outvote the one
       carrying a third of the fixture. */
    const unweighted = Math.round(
      rows.reduce((s, r) => s + r.score, 0) / rows.length
    );
    const weighted = portfolioScore(rows);
    expect(weighted).toBeGreaterThan(unweighted);
    expect(weighted).toBeLessThanOrEqual(rows[0].score);
  });
});
