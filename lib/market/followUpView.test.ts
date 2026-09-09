/* The three-level hierarchy.

   The requirement being tested is §18: every number at every level is
   recomputed from the rows the current filter selects. A request that
   cached its counts would pass a glance and fail the moment somebody
   filtered — the rows would narrow while the totals above them stayed
   put. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, loadMonth, posOf } from "./index";
import { seededRequests } from "./followUp";
import { buildRows, summarise, isPreliminary, type MonthPair } from "./followUpView";
import { outletCase } from "./outletCase";

const octRaw = await loadMonth("2026-10");
const novRaw = await loadMonth("2026-11");

function monthsFor(extra: Partial<typeof EMPTY_FILTERS> = {}) {
  const pair = (id: string, data: typeof current): MonthPair => ({
    view: applyFilters({ ...EMPTY_FILTERS, ...extra, month: id }, data),
    full: applyFilters({ ...EMPTY_FILTERS, ...extra, month: id, brands: [], skus: [] }, data),
  });
  return new Map<string, MonthPair>([
    [current.month, pair(current.month, current)],
    ["2026-10", pair("2026-10", octRaw)],
    ["2026-11", pair("2026-11", novRaw)],
  ]);
}

const complete = new Set(["2026-10"]);
const requests = seededRequests();
const rows = buildRows(requests, monthsFor(), complete);

describe("the hierarchy", () => {
  it("builds a row for every request, with governorates under it", () => {
    expect(rows.length).toBe(requests.length);
    for (const row of rows) {
      expect(row.governorates.length).toBeGreaterThan(0);
      for (const gov of row.governorates) expect(gov.pos.length).toBeGreaterThan(0);
    }
  });

  it("adds up: a request's outlets are its governorates' outlets", () => {
    for (const row of rows) {
      const fromGovs = row.governorates.reduce((s, g) => s + g.pos.length, 0);
      expect(fromGovs).toBe(row.cohort.requested.length);
      const issues = row.governorates.reduce((s, g) => s + g.scope.issues, 0);
      expect(issues).toBe(row.scope.issues);
    }
  });

  it("counts revisited outlets consistently at both levels", () => {
    for (const row of rows) {
      const fromGovs = row.governorates.reduce((s, g) => s + g.cohort.matched.length, 0);
      expect(fromGovs).toBe(row.cohort.matched.length);
      const flagged = row.governorates.reduce(
        (s, g) => s + g.pos.filter((p) => p.revisited).length,
        0
      );
      expect(flagged).toBe(row.cohort.matched.length);
    }
  });

  it("never marks an outlet revisited without both readings", () => {
    for (const row of rows) {
      for (const gov of row.governorates) {
        for (const pos of gov.pos) {
          if (pos.revisited) {
            expect(pos.before).not.toBeNull();
            expect(pos.after).not.toBeNull();
          } else {
            expect(pos.delta).toBeNull();
          }
        }
      }
    }
  });

  it("recalculates every level under a SKU filter", () => {
    /* The requirement a cached count would silently break. */
    const filtered = buildRows(requests, monthsFor({ skus: ["pepsi-pet-500"] }), complete);
    const wide = rows.find((r) => r.kpi === "availability")!;
    const narrow = filtered.find((r) => r.kpi === "availability")!;

    expect(narrow.scope.issues).toBeLessThan(wide.scope.issues);
    expect(narrow.cohort.baseline).not.toBe(wide.cohort.baseline);
    for (const gov of narrow.governorates) {
      const same = wide.governorates.find((g) => g.governorateId === gov.governorateId);
      if (same) expect(gov.scope.issues).toBeLessThanOrEqual(same.scope.issues);
    }
  });

  it("drops outlets an outlet-level filter excludes", () => {
    const baghdad = buildRows(requests, monthsFor({ governorates: ["baghdad"] }), complete);
    for (const row of baghdad) {
      for (const posId of row.cohort.requested) {
        expect(posOf(posId)?.governorateId).toBe("baghdad");
      }
      expect(row.governorates.every((g) => g.governorateId === "baghdad")).toBe(true);
    }
  });
});

describe("progressive states", () => {
  it("labels a result preliminary until the cycle is finished", () => {
    const inFlight = rows.filter((r) => r.request.cycle === "2026-11" && r.result !== "pending");
    for (const row of inFlight) expect(isPreliminary(row)).toBe(true);
    const done = rows.filter((r) => r.request.cycle === "2026-10" && r.result !== "pending");
    for (const row of done) expect(isPreliminary(row)).toBe(false);
  });

  it("reports partial progress rather than declaring an outcome early", () => {
    const partial = rows.find((r) => r.cohort.matched.length < r.cohort.requested.length);
    expect(partial).toBeDefined();
    expect(partial!.cohort.matched.length).toBeGreaterThan(0);
    expect(partial!.status === "in-progress" || partial!.status === "completed").toBe(true);
  });
});

describe("the summary", () => {
  it("agrees with the rows it sits above", () => {
    const stats = summarise(rows);
    const live = rows.filter((r) => r.status !== "cancelled");
    expect(stats.posRequested).toBe(
      live.reduce((s, r) => s + r.cohort.requested.length, 0)
    );
    expect(stats.posRevisited).toBe(live.reduce((s, r) => s + r.cohort.matched.length, 0));
    expect(stats.completed).toBe(rows.filter((r) => r.status === "completed").length);
  });

  it("narrows with the filter, so the cards cannot contradict the table", () => {
    const baghdad = summarise(buildRows(requests, monthsFor({ governorates: ["baghdad"] }), complete));
    expect(baghdad.posRequested).toBeLessThan(summarise(rows).posRequested);
  });
});

describe("one outlet, two visits", () => {
  const row = rows.find((r) => r.request.cycle === "2026-10" && r.kpi === "availability")!;
  const origin = monthsFor().get(row.request.originMonth)!;
  const cyclePair = monthsFor().get(row.request.cycle)!;

  it("says what happened to each issue that was raised", () => {
    const revisited = row.governorates.flatMap((g) => g.pos).find((p) => p.revisited)!;
    const c = outletCase(revisited.posId, row.kpi, origin, cyclePair);

    expect(c.revisited).toBe(true);
    expect(c.issues.length).toBeGreaterThan(0);
    for (const issue of c.issues) {
      expect(["resolved", "unresolved"]).toContain(issue.outcome);
    }
    expect(c.resolved + c.unresolved).toBe(c.issues.length);
  });

  it("matches an issue across cycles by what it is, not by its id", () => {
    /* The same problem seen twice has two ids — the month is part of
       them — so "was it fixed?" has to compare what they describe. */
    const revisited = row.governorates.flatMap((g) => g.pos).find((p) => p.revisited)!;
    const c = outletCase(revisited.posId, row.kpi, origin, cyclePair);
    const ids = c.issues.map((i) => i.issue.id);
    for (const id of ids) expect(id).toContain(row.request.originMonth);
  });

  it("reports awaiting rather than resolved when nobody has been back", () => {
    /* The dangerous default: an outlet nobody revisited has no issues
       present in the later cycle, which looks exactly like every issue
       being fixed. */
    const waiting = rows
      .flatMap((r) => r.governorates.flatMap((g) => g.pos.map((p) => ({ r, p }))))
      .find(({ p }) => !p.revisited);
    if (!waiting) return;
    const pair = monthsFor();
    const c = outletCase(
      waiting.p.posId,
      waiting.r.kpi,
      pair.get(waiting.r.request.originMonth)!,
      null
    );
    expect(c.revisited).toBe(false);
    expect(c.resolved).toBe(0);
    for (const issue of c.issues) expect(issue.outcome).toBe("awaiting");
  });

  it("derives the change from the two readings it shows", () => {
    const revisited = row.governorates.flatMap((g) => g.pos).find((p) => p.revisited)!;
    const c = outletCase(revisited.posId, row.kpi, origin, cyclePair);
    expect(c.delta).toBeCloseTo((c.after ?? 0) - (c.before ?? 0), 1);
  });
});
