/* The follow-up model, and the one rule it exists to enforce.

   Most of these tests are about a single failure mode: reporting an
   improvement by comparing one set of outlets against a different set.
   It is the most common way before-and-after reporting lies, it lies
   flatteringly, and nothing on the page would look wrong if it
   happened. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, loadMonth, followUps, clientBrand } from "./index";
import { issuesFor, scopeOf, rankedPos, expectedRange } from "./issues";
import {
  canCancel, cohortFloor, compareCohort, createRequest, posKpi, resultAcross,
  resultOf, seededRequests, statusOf, type FollowUpRequest,
} from "./followUp";

const sep = applyFilters(EMPTY_FILTERS, current);
const octRaw = await loadMonth("2026-10");
const oct = applyFilters({ ...EMPTY_FILTERS, month: "2026-10" }, octRaw);

const origin = { view: sep, full: sep };
const cycle = { view: oct, full: oct };

describe("issue records", () => {
  it("counts affected outlets and issues as different numbers", () => {
    const issues = issuesFor(sep, "availability");
    const scope = scopeOf(issues);
    expect(scope.issues).toBeGreaterThan(scope.affectedPos);
    /* The whole point of keeping them apart: one outlet can carry
       several gaps, and reporting the issue count as an outlet count
       overstates reach. */
    expect(scope.affectedPos).toBe(new Set(issues.map((i) => i.posId)).size);
  });

  it("gives every issue a stable id and a way back to the evidence", () => {
    for (const kpi of ["availability", "price", "posm", "assortment", "shelfShare"] as const) {
      const issues = issuesFor(sep, kpi);
      expect(issues.length).toBeGreaterThan(0);
      expect(new Set(issues.map((i) => i.id)).size).toBe(issues.length);
      for (const issue of issues.slice(0, 40)) {
        expect(issue.evidenceRef).toContain("@");
        expect(issue.governorate.length).toBeGreaterThan(2);
        expect(issue.kpi).toBe(kpi);
      }
    }
  });

  it("is deterministic — the same month yields the same records", () => {
    const a = issuesFor(sep, "posm").map((i) => i.id).sort();
    const b = issuesFor(sep, "posm").map((i) => i.id).sort();
    expect(a).toEqual(b);
  });

  it("names which lines a format should carry, not just how many", () => {
    /* An assortment gap report has to say WHICH SKU is missing, and
       `requiredSkus` only gives a count. */
    const grocery = expectedRange(sep, "grocery");
    const hyper = expectedRange(sep, "hypermarket");
    expect(grocery.length).toBeLessThan(hyper.length);
    for (const skuId of grocery) expect(hyper).toContain(skuId);
  });

  it("raises POSM issues only where the brand is actually stocked", () => {
    const issues = issuesFor(sep, "posm");
    const stocking = new Set(
      sep.cells
        .filter((c) => c.state === "in-stock" && c.skuId.startsWith("pepsi"))
        .map((c) => c.posId)
    );
    for (const issue of issues) expect(stocking.has(issue.posId)).toBe(true);
  });

  it("ranks outlets by a rule it can state out loud", () => {
    const issues = issuesFor(sep, "availability");
    const ranked = rankedPos(issues, sep);
    const weight = (posId: string) =>
      issues
        .filter((i) => i.posId === posId)
        .reduce((s, i) => s + (i.severity === "critical" ? 2 : 1), 0);
    expect(weight(ranked[0])).toBeGreaterThanOrEqual(weight(ranked[ranked.length - 1]));
  });
});

describe("matched cohorts", () => {
  const seed = followUps.find((f) => f.kpi === "availability")!;
  const request: FollowUpRequest = {
    id: seed.id,
    kpi: "availability",
    brandId: clientBrand.id,
    originMonth: seed.originMonth,
    cycle: seed.cycle,
    createdAt: seed.createdAt,
    posIds: seed.pos,
    issueIds: [],
  };

  it("compares the same outlets on both sides, never a different set", () => {
    const c = compareCohort(request.posIds, "availability", origin, cycle);
    expect(c.matched.length).toBeGreaterThan(0);
    expect(c.matched.length).toBeLessThanOrEqual(c.requested.length);
    for (const posId of c.matched) {
      expect(posKpi(sep, sep, posId, "availability")).not.toBeNull();
      expect(posKpi(oct, oct, posId, "availability")).not.toBeNull();
    }
    /* And the baseline is the matched subset's, not the whole
       request's — the two differ, which is the entire point. */
    const all = request.posIds
      .map((p) => posKpi(sep, sep, p, "availability"))
      .filter((v): v is number => v !== null);
    const wholeBaseline =
      Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10;
    expect(c.baseline).not.toBe(null);
    if (c.matched.length < c.requested.length) {
      expect(c.baseline).not.toBe(wholeBaseline);
    }
  });

  it("reports pending when the cycle has not happened", () => {
    const c = compareCohort(request.posIds, "availability", origin, null);
    expect(c.result).toBe("pending");
    expect(c.baseline).toBeNull();
    expect(c.matched).toEqual([]);
  });

  it("derives the change from the two figures it shows", () => {
    const c = compareCohort(request.posIds, "availability", origin, cycle);
    expect(c.delta).toBeCloseTo((c.followUp ?? 0) - (c.baseline ?? 0), 1);
  });

  it("recalculates under a SKU filter instead of quoting the whole range", () => {
    /* §18: filter to one line and the baseline, the follow-up and the
       change all have to describe that line. A stored baseline cannot
       do this, which is why none is stored. */
    const sku = "pepsi-pet-500";
    const sepSku = applyFilters({ ...EMPTY_FILTERS, skus: [sku] }, current);
    const octSku = applyFilters({ ...EMPTY_FILTERS, month: "2026-10", skus: [sku] }, octRaw);
    const filtered = compareCohort(
      request.posIds,
      "availability",
      { view: sepSku, full: sep },
      { view: octSku, full: oct }
    );
    const unfiltered = compareCohort(request.posIds, "availability", origin, cycle);
    expect(filtered.baseline).not.toBe(unfiltered.baseline);
    expect(filtered.matched.length).toBeLessThanOrEqual(unfiltered.matched.length);
  });
});

describe("the significance floor", () => {
  it("is coarser for a smaller cohort", () => {
    /* A 38-outlet cohort is nothing like as steady as 742 outlets, and
       reusing the market's 1.8pt floor would call noise an
       improvement. */
    const spread = Array.from({ length: 400 }, (_, i) => (i % 21) - 10);
    const big = cohortFloor(spread);
    const small = cohortFloor(spread.slice(0, 12));
    expect(small).toBeGreaterThan(big);
  });

  it("refuses to judge a cohort of one", () => {
    expect(cohortFloor([5])).toBe(100);
    expect(resultOf(9, cohortFloor([5]))).toBe("no-change");
  });

  it("calls a movement inside the floor no material change", () => {
    expect(resultOf(1.2, 4)).toBe("no-change");
    expect(resultOf(-1.2, 4)).toBe("no-change");
    expect(resultOf(6, 4)).toBe("improved");
    expect(resultOf(-6, 4)).toBe("worsened");
  });
});

describe("results across a hierarchy", () => {
  it("is mixed when parts disagree", () => {
    const part = (result: string) =>
      ({ result } as unknown as Parameters<typeof resultAcross>[0][number]);
    expect(resultAcross([part("improved"), part("worsened")])).toBe("mixed");
    expect(resultAcross([part("improved"), part("no-change")])).toBe("improved");
    expect(resultAcross([part("pending"), part("pending")])).toBe("pending");
  });
});

describe("status, kept apart from result", () => {
  const request = {
    id: "r", kpi: "availability", brandId: "pepsi", originMonth: "2026-09",
    cycle: "2026-10", createdAt: "2026-09-22", posIds: ["a", "b", "c"], issueIds: [],
  } as FollowUpRequest;

  it("walks from requested to completed on fieldwork, not on outcome", () => {
    expect(statusOf(request, 0, false, false)).toBe("requested");
    expect(statusOf(request, 0, true, false)).toBe("scheduled");
    expect(statusOf(request, 2, true, false)).toBe("in-progress");
    expect(statusOf(request, 3, true, false)).toBe("completed");
    expect(statusOf(request, 1, true, true)).toBe("completed");
  });

  it("reports a cancelled request as cancelled whatever the fieldwork says", () => {
    const cancelled = { ...request, cancelled: { at: "2026-09-30", reason: "Other" } };
    expect(statusOf(cancelled, 3, true, true)).toBe("cancelled");
  });

  it("refuses to cancel once evidence exists", () => {
    /* Withdrawing a request whose outlets were already revisited would
       delete an observation rather than a plan. */
    expect(canCancel("scheduled", 0)).toBe(true);
    expect(canCancel("in-progress", 7)).toBe(false);
    expect(canCancel("completed", 0)).toBe(false);
  });
});

describe("storage and seeding", () => {
  it("turns the payload's seeds into requests without inventing anything", () => {
    const seeded = seededRequests();
    expect(seeded.length).toBeGreaterThanOrEqual(4);
    for (const request of seeded) {
      expect(request.posIds.length).toBeGreaterThan(10);
      expect(request.cycle > request.originMonth).toBe(true);
      expect(request.brandId).toBe(clientBrand.id);
      /* Issue ids are derived, not persisted: an id built from the
         observation stays stable without being stored, and a stored one
         would go stale the moment the data was regenerated. */
      expect(request.issueIds).toEqual([]);
    }
  });

  it("carries only the outlets the active filter selected", () => {
    /* §4 — narrow to one SKU on the Performance page and the request
       must contain only the outlets with a gap on that SKU. */
    const sku = "pepsi-pet-500";
    const filtered = applyFilters({ ...EMPTY_FILTERS, skus: [sku] }, current);
    const issues = issuesFor(filtered, "availability");
    const request = createRequest({
      kpi: "availability",
      originMonth: filtered.month,
      cycle: "2026-10",
      posIds: [...new Set(issues.map((i) => i.posId))],
      issueIds: issues.map((i) => i.id),
    });

    const wide = issuesFor(sep, "availability");
    expect(request.posIds.length).toBeLessThan(new Set(wide.map((i) => i.posId)).size);
    for (const id of request.issueIds) expect(id).toContain(sku);
  });
});
