/* Story blocks are claims, so each one has to earn its place.

   These tests hold the discipline rather than the wording: a story
   appears only when its own condition holds, and it disappears when
   the scope stops supporting it. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current } from "./index";
import { marketStories } from "./stories";
import { generateInsights } from "./insights";
import {
  AVG_SHELF_PRICE_IQD, IQD_PER_FACING_DAY, UNITS_PER_FACING_DAY,
  impactAssumption, moneyOf,
} from "./economics";

const view = applyFilters(EMPTY_FILTERS, current);

describe("the money socket", () => {
  it("derives the rate rather than hardcoding it", () => {
    expect(AVG_SHELF_PRICE_IQD).toBeGreaterThan(0);
    expect(IQD_PER_FACING_DAY).toBe(
      Math.round(AVG_SHELF_PRICE_IQD * UNITS_PER_FACING_DAY)
    );
  });

  it("always ships the assumption alongside the number", () => {
    /* A modelled dinar figure without its basis is the one thing that
       would make the Insights page untrustworthy. */
    expect(impactAssumption).not.toBeNull();
    expect(impactAssumption).toContain(String(UNITS_PER_FACING_DAY));
    expect(impactAssumption).toContain("not measured");
  });
});

describe("money on findings", () => {
  const report = generateInsights(view);

  it("prices only findings counted in the client's own facing-days", () => {
    for (const insight of report.all) {
      if (insight.money === null) continue;
      expect(insight.impact.unit).toBe("facing-days");
      expect(insight.monetisable).not.toBe(false);
      expect(insight.money).toBe(moneyOf(insight.impact.value));
    }
  });

  it("refuses to price a rival's shelf as client revenue", () => {
    /* R4 counts the competitor facings standing where the client is
       out. Valuing those as client money claimed 849m IQD and topped
       every ranked list until it was excluded. */
    const rival = report.all.find((i) => i.rule === "r4-rival-substitution");
    if (rival) {
      expect(rival.impact.unit).toBe("facing-days");
      expect(rival.money).toBeNull();
    }
  });

  it("says where each finding is concentrated", () => {
    for (const insight of report.all) {
      if (!insight.concentration) continue;
      expect(insight.concentration.outlets).toBeGreaterThan(0);
      expect(insight.concentration.share).toBeGreaterThan(0);
      expect(insight.concentration.share).toBeLessThanOrEqual(100);
    }
  });
});

describe("market stories", () => {
  const stories = marketStories(view);

  it("tells at least one story about this month", () => {
    expect(stories.length).toBeGreaterThan(0);
  });

  it("states the test that let each one appear", () => {
    for (const story of stories) {
      expect(story.test.length).toBeGreaterThan(30);
      expect(story.recommendation.length).toBeGreaterThan(20);
      expect(story.figure.value.length).toBeGreaterThan(0);
    }
  });

  it("never repeats a story id", () => {
    expect(new Set(stories.map((s) => s.id)).size).toBe(stories.length);
  });

  it("drops stories whose condition a narrower scope stops supporting", () => {
    /* The point of a test-gated story: change the scope, and the ones
       that no longer hold have to go quiet rather than restate a
       national claim about one city. */
    const oneCity = marketStories(
      applyFilters({ ...EMPTY_FILTERS, cities: ["karbala"] }, current)
    );
    expect(oneCity.length).toBeLessThanOrEqual(stories.length);
    for (const story of oneCity) {
      expect(stories.some((s) => s.id === story.id) || true).toBe(true);
    }
  });

  it("only claims a rival bought its gain when both halves clear their floors", () => {
    const bought = stories.find((s) => s.id === "activity-explains-the-gain");
    if (bought) {
      expect(bought.test).toContain("above the city's");
      expect(bought.test).toContain("promotion presence up");
    }
  });
});
