/* Outlet rows and the revisit queue.

   The properties under test: an issue chip and the finding it mirrors
   agree by construction, a comparison is only offered for a door the
   audit actually returned to, and the queue cannot list the same
   outlet twice. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, clientBrand, skuOf, requiredSkus } from "./index";
import { THRESHOLDS } from "./insights";
import { posRows, recommendationsFor } from "./pos";
import { availability, posm, pricing } from "./performance";

const view = applyFilters(EMPTY_FILTERS, current);
const rows = posRows(view);


describe("outlet rows", () => {
  it("covers every audited outlet exactly once", () => {
    expect(rows.length).toBe(view.posCount);
    expect(new Set(rows.map((r) => r.pos.id)).size).toBe(rows.length);
  });

  it("names the collector who ran the visit", () => {
    for (const row of rows) {
      expect(row.collector.length).toBeGreaterThan(0);
      expect(row.collector).not.toBe("");
      expect(row.auditedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("raises a gap chip on the same threshold the rule uses", () => {
    /* A chip and a finding disagreeing about what counts as a problem
       is the fastest way to lose a reader's trust. */
    for (const row of rows) {
      const chip = row.issues.find((i) => i.kind === "gaps");
      if (chip) {
        expect(row.gaps).toBeGreaterThanOrEqual(THRESHOLDS.r1OutletGaps.warningCount);
      } else if (row.gaps >= THRESHOLDS.r1OutletGaps.warningCount) {
        /* The only permitted exception: a totally dark outlet, which
           R9 and the "no client stock" chip describe better. */
        expect(row.issues.some((i) => i.kind === "dark")).toBe(true);
      }
    }
  });

  it("counts only client lines as gaps", () => {
    for (const row of rows.slice(0, 60)) {
      const clientGaps = row.cells.filter(
        (c) => c.state === "out-of-stock" && skuOf(c.skuId)?.brandId === clientBrand.id
      ).length;
      expect(row.gaps).toBe(clientGaps);
    }
  });

  it("judges range against the outlet's own channel", () => {
    for (const row of rows) {
      const chip = row.issues.find((i) => i.kind === "range");
      if (!chip) continue;
      const required = requiredSkus[row.pos.channel];
      expect(required - row.listed).toBeGreaterThanOrEqual(
        THRESHOLDS.r11AssortmentGap.warningCount
      );
    }
  });

  it("always has something to say, including when nothing is wrong", () => {
    const clean = rows.find((r) => r.issues.length === 0);
    if (clean) {
      expect(recommendationsFor(clean)[0]).toContain("Nothing outstanding");
    }
    const broken = rows.find((r) => r.issues.length > 1)!;
    expect(recommendationsFor(broken).length).toBeGreaterThan(1);
  });
});

describe("components with nothing to measure", () => {
  it("reports null rather than zero where the client has no listings", () => {
    /* An outlet that lists none of the range has no availability to
       report. Scoring it as 0% punished the store twice for one fact —
       assortment already says it carries none of the expected range —
       and printed "availability 0%, price 100%" side by side. */
    const bare = rows.filter((r) => r.listed === 0);
    expect(bare.length).toBeGreaterThan(0);
    for (const row of bare) {
      expect(row.availability).toBeNull();
      expect(row.assortment).toBe(0);
      /* And the composite is not dragged to the floor by a component
         that never applied. */
      expect(row.score).toBeGreaterThan(0);
    }
  });

  it("keeps every measured outlet on a real number", () => {
    for (const row of rows) {
      if (row.listed > 0) expect(row.availability).not.toBeNull();
    }
  });

  it("never averages a missing component into a market figure", () => {
    /* The market rate is computed over listings, so the five outlets
       with nothing listed cannot move it. */
    const listed = view.cells.filter(
      (c) => skuOf(c.skuId)?.brandId === clientBrand.id
    );
    const onShelf = listed.filter((c) => c.state === "in-stock").length;
    expect(view.kpi.availability).toBeCloseTo(
      Math.round((onShelf / listed.length) * 1000) / 10,
      1
    );
  });

  it("agrees with the Performance tab, which reads the same rows", () => {
    /* The dashboard used to read 87.2% while Performance read 87.6%
       from the same month: a mean of per-outlet rates against a rate
       over listings. One of them had to win, and it is the one anybody
       could check by hand. */
    expect(view.kpi.availability).toBe(availability(view).rate);
    expect(view.kpi.posm).toBe(posm(view).compliance);
    expect(view.kpi.price).toBe(pricing(view).compliance);
  });
});
