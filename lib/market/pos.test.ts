/* Outlet rows and the revisit queue.

   The properties under test: an issue chip and the finding it mirrors
   agree by construction, a comparison is only offered for a door the
   audit actually returned to, and the queue cannot list the same
   outlet twice. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, loadMonth, clientBrand, skuOf, requiredSkus } from "./index";
import { THRESHOLDS } from "./insights";
import { posRows, recommendationsFor } from "./pos";
import { seedActions } from "./actions";
import { comparisons, nextCycle, seedRevisits, type Candidate } from "./revisits";

const view = applyFilters(EMPTY_FILTERS, current);
const rows = posRows(view);
const previous = await loadMonth("2026-08");
const priorView = applyFilters({ ...EMPTY_FILTERS, month: "2026-08" }, previous);
const actions = seedActions(previous);

const candidates: Candidate[] = [...rows]
  .filter((r) => r.issues.length > 0)
  .sort((a, b) => a.score - b.score)
  .slice(0, 30)
  .map((r) => ({
    posId: r.pos.id,
    reason: r.issues[0].detail,
    priority: r.issues[0].severity === "critical" ? "high" : "medium",
  }));

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

describe("the revisit queue", () => {
  const revisits = seedRevisits(actions, current.month, candidates);

  it("reaches a month's worth of requests from both sources", () => {
    expect(revisits.length).toBeGreaterThanOrEqual(25);
    expect(revisits.some((r) => r.actionId !== null)).toBe(true);
    expect(revisits.some((r) => r.actionId === null)).toBe(true);
  });

  it("never lists the same outlet twice", () => {
    /* A queue that lists a door twice is a queue somebody double-runs. */
    expect(new Set(revisits.map((r) => r.posId)).size).toBe(revisits.length);
  });

  it("plans every request into a future cycle", () => {
    const planned = nextCycle(current.month);
    for (const revisit of revisits) {
      expect(revisit.plannedMonth).toBe(planned);
      expect(revisit.plannedMonth > current.month).toBe(true);
    }
  });

  it("is deterministic", () => {
    const again = seedRevisits(actions, current.month, candidates);
    expect(again.map((r) => `${r.posId}|${r.stage}|${r.requestedBy}`)).toEqual(
      revisits.map((r) => `${r.posId}|${r.stage}|${r.requestedBy}`)
    );
  });
});

describe("before and after", () => {
  const revisits = seedRevisits(actions, current.month, candidates);
  const pairs = comparisons(revisits, priorView, view);

  it("only compares doors the audit actually returned to", () => {
    for (const pair of pairs) {
      expect(priorView.auditedAt.has(pair.posId)).toBe(true);
      expect(view.auditedAt.has(pair.posId)).toBe(true);
    }
    /* And it declines to compare the rest rather than inventing one. */
    expect(pairs.length).toBeLessThanOrEqual(revisits.length);
  });

  it("states client gaps on both sides, so they agree with availability", () => {
    /* Counting every brand's stockouts here put "1 line out of stock"
       beside a client availability of 0%. */
    for (const pair of pairs) {
      if (pair.after.availability === 100) expect(pair.after.gaps).toBe(0);
      if (pair.before.availability === 100) expect(pair.before.gaps).toBe(0);
    }
  });

  it("computes the delta from the two audits it shows", () => {
    for (const pair of pairs) {
      expect(pair.delta.score).toBeCloseTo(pair.after.score - pair.before.score, 1);
      expect(pair.improved).toBe(pair.delta.score > 0);
    }
  });
});
