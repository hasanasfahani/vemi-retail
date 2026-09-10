/* A watch stores a question and a past reading. Everything else is
   recomputed, and these tests guard that line. */

import { describe, expect, it } from "vitest";
import { clientBrand, current, skuOf } from "./index";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import {
  WATCH_FLOOR_PT, WATCH_KPI_LABEL, WATCH_KPI_UNIT, getWatches, resetWatchesForTest,
  scopeLabel, scopeMatches, watchId, watchState, watchValue,
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

describe("adopting a stored list", () => {
  /* The suite runs in node, which has no storage. A three-line stub is
     enough: the store only ever calls getItem and setItem. */
  const held = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => held.get(k) ?? null,
    setItem: (k: string, v: string) => void held.set(k, v),
    removeItem: (k: string) => void held.delete(k),
  } as unknown as Storage;

  it("re-derives ids rather than trusting them", () => {
    /* When the scope gained brand, SKU and district, every id already
       in a browser was left in the old four-part shape — so a figure
       genuinely on the list showed an unwatched eye and clicking it
       added a second row for the same question. The id is a cached
       answer to "which question is this?", and the question is fully
       described by the kpi and scope beside it. */
    const legacy = [
      { ...make(), id: "availability|*|*|*" },
      { ...make({ kpi: "posm" }), id: "posm|*|*|*" },
    ];
    localStorage.setItem("vemi.watchlist.v1", JSON.stringify(legacy));
    resetWatchesForTest();
    const ids = getWatches().map((w) => w.id);
    expect(ids).toContain(watchId("availability", {}));
    expect(ids).toContain(watchId("posm", {}));
    expect(ids).not.toContain("availability|*|*|*");
  });

  it("folds two rows that turn out to be one question", () => {
    const dupes = [
      { ...make(), id: "availability|*|*|*", baseline: 70 },
      { ...make(), id: "availability|*|*|*|*|*|*", baseline: 88 },
    ];
    localStorage.setItem("vemi.watchlist.v1", JSON.stringify(dupes));
    resetWatchesForTest();
    const held = getWatches().filter((w) => w.kpi === "availability");
    expect(held).toHaveLength(1);
    /* The newer pin wins — it is what the reader last said. */
    expect(held[0].baseline).toBe(88);
  });

  it("survives a hand-edited value without losing the good rows", () => {
    localStorage.setItem(
      "vemi.watchlist.v1",
      JSON.stringify([null, { nonsense: true }, make()])
    );
    resetWatchesForTest();
    expect(getWatches()).toHaveLength(1);
  });
});

describe("a single line is a different question from the range", () => {
  it("reads a SKU-scoped assortment watch as that line's penetration", () => {
    /* This is what the SKU charts draw: the share of audited outlets
       carrying the line. Averaging outlets' whole-range scores would
       pin a number the reader never saw. */
    const sku = current.cells.find(() => true)!.skuId;
    const carrying = new Set(
      view.cells.filter((c) => c.skuId === sku).map((c) => c.posId)
    ).size;
    const expected = Math.round((carrying / view.outlets.length) * 1000) / 10;
    expect(watchValue(make({ kpi: "assortment", scope: { skuId: sku } }), view))
      .toBeCloseTo(expected, 1);
  });

  it("still reads an unscoped assortment watch as the range score", () => {
    const whole = watchValue(make({ kpi: "assortment" }), view);
    expect(whole).toBeCloseTo(view.kpi.assortment, 1);
  });
});

describe("the measures the tabs state directly", () => {
  it("counts gaps rather than reading the availability rate", () => {
    const gaps = view.cells.filter(
      (c) => skuOf(c.skuId)?.brandId === clientBrand.id && c.state === "out-of-stock"
    ).length;
    expect(watchValue(make({ kpi: "gapsFound" }), view)).toBe(gaps);
  });

  it("reports coverage against the outlets in scope, not the ones reached", () => {
    expect(watchValue(make({ kpi: "coverage" }), view)).toBeCloseTo(view.coveragePct, 1);
  });

  it("refuses a brand-scoped coverage watch", () => {
    /* Coverage is a property of the collection plan, not of a shelf.
       Answering it with the same number under a brand scope would let
       two different questions share one figure. */
    expect(watchValue(make({ kpi: "coverage", scope: { brandId: "coca-cola" } }), view)).toBeNull();
  });

  it("splits the two sides of off-list pricing", () => {
    const above = watchValue(make({ kpi: "priceAbove" }), view)!;
    const below = watchValue(make({ kpi: "priceBelow" }), view)!;
    const off = view.prices.filter(
      (p) => skuOf(p.skuId)?.brandId === clientBrand.id && Math.abs(p.variance) > 5
    ).length;
    expect(above + below).toBe(off);
  });

  it("reads the worst variance as a worst case, not an average", () => {
    const worst = watchValue(make({ kpi: "priceWorst" }), view)!;
    const every = view.prices
      .filter((p) => skuOf(p.skuId)?.brandId === clientBrand.id)
      .map((p) => Math.abs(p.variance));
    expect(worst).toBeCloseTo(Math.max(...every), 1);
  });

  it("gives every measure a label and a unit", () => {
    for (const kpi of Object.keys(WATCH_KPI_LABEL) as (keyof typeof WATCH_KPI_LABEL)[]) {
      expect(WATCH_KPI_LABEL[kpi], kpi).toBeTruthy();
      expect(WATCH_KPI_UNIT[kpi], kpi).toBeDefined();
    }
  });
});
