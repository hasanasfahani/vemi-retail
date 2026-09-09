/* The arithmetic behind the Performance tabs.

   These hold the properties that keep the five tabs honest — the right
   denominators, rates that cannot exceed 100, movement measured
   against the slice actually on screen — rather than the exact figures,
   which move whenever the generator is re-run. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, clientBrand, kpiTargets, requiredSkus, skus } from "./index";
import {
  assortment, availability, movement, posm, pricing, shelf,
} from "./performance";

const view = applyFilters(EMPTY_FILTERS, current);
const baghdad = applyFilters({ ...EMPTY_FILTERS, governorates: ["baghdad"] }, current);

describe("availability", () => {
  const a = availability(view);

  it("divides by listings, never by outlets", () => {
    /* An outlet that never carried a SKU has not run out of it. If the
       denominator were outlets, every rate here would be a distribution
       figure wearing an availability label. */
    const listedCells = view.cells.filter(
      (c) => skus.find((s) => s.id === c.skuId)?.brandId === clientBrand.id
    ).length;
    expect(a.listings).toBe(listedCells);
    expect(a.rate).toBeLessThanOrEqual(100);
  });

  it("names the worst SKU and what share of gaps it owns", () => {
    expect(a.worstSku).not.toBeNull();
    expect(a.worstSku!.shareOfGaps).toBeGreaterThan(0);
    expect(a.worstSku!.shareOfGaps).toBeLessThanOrEqual(100);
    /* Worst-first ordering is the whole point of the ranked list. */
    for (let i = 1; i < a.bySku.length; i += 1) {
      expect(a.bySku[i - 1].value).toBeLessThanOrEqual(a.bySku[i].value);
    }
  });

  it("reports reasons recorded by the auditor, summing to the gaps found", () => {
    const counted = a.byReason.reduce((s, r) => s + r.value, 0);
    expect(counted).toBe(a.gaps);
  });

  it("compares the client to the rest of the category, not to itself", () => {
    for (const row of a.byChannel) {
      expect(row.client).toBeLessThanOrEqual(100);
      expect(row.category).toBeLessThanOrEqual(100);
    }
  });
});

describe("shelf", () => {
  const s = shelf(view);

  it("splits the fixture into shares that account for the whole", () => {
    const total = s.byBrand.reduce((sum, b) => sum + b.share, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });

  it("separates share from position", () => {
    for (const position of s.positions) {
      expect(position.total).toBeGreaterThan(0);
      expect(position.clientShare).toBeLessThanOrEqual(100);
    }
  });

  it("ranks best and worst from the same distribution", () => {
    expect(s.best[0].share).toBeGreaterThanOrEqual(s.worst[0].share);
  });
});

describe("pricing", () => {
  const p = pricing(view);

  it("bands every client reading exactly once", () => {
    const banded = p.distribution.reduce((s, b) => s + b.value, 0);
    expect(banded).toBe(p.readings);
  });

  it("puts the largest variances at the top of the outliers", () => {
    for (let i = 1; i < p.outliers.length; i += 1) {
      expect(Math.abs(p.outliers[i - 1].variance)).toBeGreaterThanOrEqual(
        Math.abs(p.outliers[i].variance)
      );
    }
  });

  it("keeps compliance consistent with the at-list band", () => {
    const atList = p.distribution.find((b) => b.id === "at-list")!.value;
    expect(Math.round((atList / p.readings) * 1000) / 10).toBeCloseTo(p.compliance, 1);
  });
});

describe("assortment", () => {
  const a = assortment(view);

  it("judges each outlet against its own channel's expected range", () => {
    /* A grocery was never asked to carry six SKUs. Judging it against
       the hypermarket standard would invent a failure nobody can fix. */
    for (const row of a.byChannel) {
      expect(row.required).toBe(requiredSkus[row.id]);
      expect(row.value).toBeLessThanOrEqual(100);
    }
  });

  it("reports penetration as a share of audited outlets", () => {
    for (const row of a.penetration) {
      expect(row.outlets + row.missing).toBe(view.posCount);
      expect(row.value).toBeLessThanOrEqual(100);
    }
  });
});

describe("POSM", () => {
  const p = posm(view);

  it("counts only material types actually checked at that outlet", () => {
    const checked = p.byType.reduce((s, t) => s + t.checked, 0);
    expect(checked).toBe(p.checked);
  });

  it("finds outlets stocking the client with no material at all", () => {
    expect(p.bare.length).toBeGreaterThan(0);
    expect(p.compliance).toBeLessThan(kpiTargets.posm);
  });
});

describe("movement", () => {
  it("reads the city's own line when one city is filtered", () => {
    const market = movement(view, "availability");
    const city = movement(baghdad, "availability");
    expect(market.scope).toBe("all audited outlets");
    expect(city.scope).toBe("Baghdad");
    /* A national movement stated beside a Baghdad figure would be a
       different question wearing the same label. */
    expect(city.delta).not.toBe(market.delta);
  });

  it("carries a coarser detection floor for a smaller slice", () => {
    expect(movement(baghdad, "availability").floor).toBeGreaterThan(
      movement(view, "availability").floor
    );
  });
});
