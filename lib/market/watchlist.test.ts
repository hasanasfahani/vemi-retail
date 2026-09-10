/* A watch stores a question and a past reading. Everything else is
   recomputed, and these tests guard that line. */

import { describe, expect, it } from "vitest";
import { current } from "./index";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import {
  WATCH_FLOOR_PT, scopeLabel, scopeMatches, watchId, watchState, watchValue,
  type Watch,
} from "./watchlist";

const view = applyFilters(EMPTY_FILTERS, current);

const make = (over: Partial<Watch> = {}): Watch => ({
  id: "x",
  kpi: "availability",
  scope: {},
  target: 95,
  baseline: 80,
  baselineMonth: "2026-08",
  createdAt: "2026-08-01",
  ...over,
});

describe("identity", () => {
  it("treats the same measure over the same slice as one watch", () => {
    expect(watchId("availability", { governorateId: "basra" }))
      .toBe(watchId("availability", { governorateId: "basra" }));
  });

  it("keeps different slices apart", () => {
    expect(watchId("availability", { governorateId: "basra" }))
      .not.toBe(watchId("availability", { governorateId: "erbil" }));
    expect(watchId("availability", {})).not.toBe(watchId("posm", {}));
  });
});

describe("scope", () => {
  it("names the market when nothing narrows it", () => {
    expect(scopeLabel({})).toBe("All audited outlets");
  });

  it("says nothing while the reader is looking somewhere else", () => {
    /* A watch pinned on Basra answers no question at all under an
       Erbil filter, and showing a figure anyway would be answering a
       question nobody asked. */
    const erbil = applyFilters({ ...EMPTY_FILTERS, governorates: ["erbil"] }, current);
    expect(scopeMatches({ governorateId: "basra" }, erbil)).toBe(false);
    expect(scopeMatches({ governorateId: "erbil" }, erbil)).toBe(true);
    expect(scopeMatches({}, erbil)).toBe(true);
  });
});

describe("the figure now", () => {
  it("recomputes rather than reading anything stored", () => {
    const value = watchValue(make(), view);
    expect(value).toBeCloseTo(view.kpi.availability, 1);
  });

  it("narrows with the scope", () => {
    const basra = watchValue(make({ scope: { governorateId: "basra" } }), view);
    expect(basra).not.toBeNull();
    expect(basra).not.toBe(watchValue(make(), view));
  });

  it("returns null rather than zero where the slice has no outlets", () => {
    /* Zero would read as "nothing on shelf". Null reads as "nothing
       measured", which is the truth. */
    expect(watchValue(make({ scope: { governorateId: "nowhere" } }), view)).toBeNull();
  });

  it("measures every KPI it offers", () => {
    for (const kpi of ["availability", "shelfShare", "assortment", "price", "posm", "score"] as const) {
      expect(watchValue(make({ kpi }), view), kpi).not.toBeNull();
    }
  });
});

describe("state", () => {
  it("calls a target met, met", () => {
    expect(watchState(make(), 96, true)).toBe("reached");
  });

  it("does not call panel noise a trend", () => {
    /* The market's own bootstrapped floor is 1.81pt. Anything inside
       it is flat, not movement. */
    expect(watchState(make(), 80 + WATCH_FLOOR_PT - 0.1, true)).toBe("flat");
    expect(watchState(make(), 80 - WATCH_FLOOR_PT + 0.1, true)).toBe("flat");
  });

  it("reads real movement in both directions", () => {
    expect(watchState(make(), 88, true)).toBe("improving");
    expect(watchState(make(), 72, true)).toBe("slipping");
  });

  it("says nothing when the filter has narrowed the slice away", () => {
    expect(watchState(make(), 88, false)).toBe("out-of-scope");
    expect(watchState(make(), null, true)).toBe("out-of-scope");
  });
});
