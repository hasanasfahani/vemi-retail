/* Verify Impact reports what the Action Center measured. These tests
   guard the one thing that would be worst to get wrong: a second,
   quietly different, account of the same before-and-after. */

import { describe, expect, it } from "vitest";
import { current } from "./index";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import type { Cohort, FollowUpRequest } from "./followUp";
import type { FollowUpRow } from "./followUpView";
import { verifyImpact } from "./verifyImpact";

const view = applyFilters(EMPTY_FILTERS, current);
const posIds = view.outlets.slice(0, 30).map((o) => o.id);

const request: FollowUpRequest = {
  id: "req-1",
  kpi: "availability",
  brandId: "pepsi",
  originMonth: "2026-08",
  cycle: "2026-09",
  createdAt: "2026-08-20",
  posIds,
  issueIds: [],
};

const cohort = (over: Partial<Cohort> = {}): Cohort => ({
  requested: posIds,
  matched: posIds.slice(0, 24),
  baseline: 74,
  followUp: 86,
  delta: 12,
  floor: 6.2,
  result: "improved",
  ...over,
});

const row = (over: Partial<FollowUpRow> = {}): FollowUpRow => ({
  request,
  kpi: "availability",
  scope: { affectedPos: 30, issues: 54 },
  cohort: cohort(),
  status: "completed",
  result: "improved",
  governorates: [],
  cycleAudited: true,
  cycleComplete: true,
  ...over,
});

describe("verify impact", () => {
  it("reads the cohort rather than recomputing it", () => {
    const [insight] = verifyImpact([row()], view);
    /* Every number in the evidence table must be one the Action Center
       already measured. A rounding difference here is the first sign
       of a second implementation. */
    const cells = insight.evidence.table.rows.flat().join(" ");
    expect(cells).toContain("74%");
    expect(cells).toContain("86%");
    expect(cells).toContain("+12pt");
    expect(cells).toContain("6.2pt");
    expect(insight.affected).toEqual(cohort().matched);
  });

  it("opens the request instead of a second before-and-after", () => {
    const [insight] = verifyImpact([row()], view);
    expect(insight.cta.href).toBe("/portal/actions?request=req-1");
  });

  it("calls an improvement a win and a fall a risk", () => {
    const [up] = verifyImpact([row()], view);
    expect(up.direction).toBe("win");
    const [down] = verifyImpact(
      [row({ result: "worsened", cohort: cohort({ delta: -9, followUp: 65, result: "worsened" }) })],
      view
    );
    expect(down.direction).toBe("risk");
    expect(down.headline).toContain("fell");
  });

  it("treats a mixed result as a risk, not as half a win", () => {
    const [mixed] = verifyImpact([row({ result: "mixed" })], view);
    expect(mixed.direction).toBe("risk");
    expect(mixed.headline).toContain("both ways");
  });

  it("says so in the sentence when the cycle is still in the field", () => {
    const [pre] = verifyImpact([row({ cycleComplete: false })], view);
    expect(pre.detail).toContain("still in the field");
    expect(pre.quality).toBe("medium");
  });

  it("stays silent on requests that have no result yet", () => {
    expect(verifyImpact([row({ result: "pending" })], view)).toHaveLength(0);
    expect(verifyImpact([row({ status: "cancelled" })], view)).toHaveLength(0);
  });

  it("labels itself like-for-like, because the outlets are the same ones", () => {
    const [insight] = verifyImpact([row()], view);
    expect(insight.comparisonBasis).toBe("like-for-like");
    expect(insight.outcome).toBe("verify-impact");
  });

  it("keeps its grammar when one outlet was reached", () => {
    const [one] = verifyImpact(
      [row({ cohort: cohort({ matched: posIds.slice(0, 1) }) })],
      view
    );
    expect(one.headline).toContain("1 revisited outlet");
    expect(one.headline).not.toContain("1 revisited outlets");
  });
});
