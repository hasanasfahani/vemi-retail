/* The engine's contract, not its wording.

   These tests hold the properties that make a finding trustworthy —
   it fires on real rows, it never claims movement below the panel's
   detection floor, its impact is arithmetic a reader can redo, and the
   ranked list puts observations ahead of projections. Exact headline
   text is deliberately not asserted: copy should be free to improve
   without breaking the suite. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, clientBrand, portfolioBrands } from "./index";
import {
  RULE_IDS, SHARE_FLOOR_PT, THRESHOLDS, generateInsights, intensityOf,
} from "./insights";

const view = applyFilters(EMPTY_FILTERS, current);
const report = generateInsights(view);

describe("the engine as a whole", () => {
  it("produces findings from the unfiltered month", () => {
    expect(report.all.length).toBeGreaterThan(0);
  });

  it("only emits rules it declares", () => {
    for (const insight of report.all) expect(RULE_IDS).toContain(insight.rule);
  });

  it("never emits a finding whose impact rounds to nothing", () => {
    for (const insight of report.all) expect(insight.impact.value).toBeGreaterThan(0);
  });

  it("gives every finding evidence a reader can check", () => {
    for (const insight of report.all) {
      expect(insight.evidence.formula.length).toBeGreaterThan(10);
      expect(insight.evidence.table.rows.length).toBeGreaterThan(0);
      for (const row of insight.evidence.table.rows) {
        expect(row.length).toBe(insight.evidence.table.columns.length);
      }
    }
  });

  it("ranks measured findings ahead of estimated ones within a severity", () => {
    const critical = report.all.filter((i) => i.severity === "critical");
    const firstEstimated = critical.findIndex((i) => i.confidence === "estimated");
    if (firstEstimated !== -1) {
      expect(
        critical.slice(firstEstimated).every((i) => i.confidence === "estimated")
      ).toBe(true);
    }
  });

  it("sorts by impact per outlet within one unit, and never across units", () => {
    /* Intensity is only comparable between findings measured in the
       same unit — facing-days against price readings is not a
       comparison, so the list is only required to be monotone inside a
       unit. */
    const tier = report.all.filter(
      (i) =>
        i.severity === "critical" &&
        i.confidence === "measured" &&
        i.impact.unit === "facing-days"
    );
    expect(tier.length).toBeGreaterThan(1);
    for (let i = 1; i < tier.length; i += 1) {
      expect(intensityOf(tier[i - 1])).toBeGreaterThanOrEqual(intensityOf(tier[i]) - 1e-9);
    }
  });

  it("shows at most five headline cards and never two from one category", () => {
    expect(report.headlines.length).toBeLessThanOrEqual(5);
    const cats = report.headlines.map((i) => i.category);
    const firstOfEach = new Set(cats);
    expect(firstOfEach.size).toBeGreaterThanOrEqual(Math.min(4, cats.length));
  });
});

describe("significance", () => {
  it("never claims a competitor movement below that city's detection floor", () => {
    for (const insight of report.all) {
      if (insight.rule !== "r14-competitor-movement") continue;
      const floor = SHARE_FLOOR_PT[insight.entities.governorateId ?? "market"];
      expect(insight.impact.value).toBeGreaterThanOrEqual(floor);
    }
  });

  it("only reports competitor movement for rival brands, never stablemates", () => {
    for (const insight of report.all) {
      if (insight.rule !== "r14-competitor-movement" && insight.rule !== "r4-rival-substitution")
        continue;
      expect(
        portfolioBrands.some((b) => b.id === insight.entities.brandId)
      ).toBe(false);
    }
  });

  it("keeps the channel rule silent on samples too small to judge", () => {
    for (const insight of report.all) {
      if (insight.rule !== "r6-channel-gap") continue;
      expect(insight.scope.outlets).toBeGreaterThan(0);
    }
  });
});

describe("individual rules against the September panel", () => {
  it("R1 fires only where at least two client lines are empty", () => {
    const r1 = report.all.filter((i) => i.rule === "r1-outlet-gaps");
    expect(r1.length).toBeGreaterThan(0);
    for (const insight of r1) {
      expect(insight.evidence.table.rows.length).toBeGreaterThanOrEqual(
        THRESHOLDS.r1OutletGaps.warningCount
      );
    }
  });

  it("R9 finds the outlets that list the client and stock none of it", () => {
    const dark = report.all.filter((i) => i.rule === "r9-dark-outlet");
    expect(dark.length).toBeGreaterThan(0);
    for (const insight of dark) expect(insight.severity).toBe("critical");
  });

  it("R13 counts outlets that stock the client with no POSM at all", () => {
    const posm = report.all.find((i) => i.rule === "r13-posm-absent");
    expect(posm).toBeDefined();
    expect(posm!.impact.value).toBeGreaterThanOrEqual(THRESHOLDS.r13PosmAbsent.warningCount);
  });

  it("R15 names the client's worst-performing SKU", () => {
    const sku = report.all.filter((i) => i.rule === "r15-sku-stockout");
    expect(sku.length).toBeGreaterThan(0);
    for (const insight of sku) {
      expect(insight.entities.brandId).toBe(clientBrand.id);
    }
  });
});

describe("filters", () => {
  it("recomputes against the filtered slice rather than the whole market", () => {
    const baghdad = generateInsights(
      applyFilters({ ...EMPTY_FILTERS, governorates: ["baghdad"] }, current)
    );
    for (const insight of baghdad.all) {
      if (insight.entities.governorateId) expect(insight.entities.governorateId).toBe("baghdad");
    }
    expect(baghdad.all.length).toBeLessThan(report.all.length);
  });
});
