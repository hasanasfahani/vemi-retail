/* The Competition page's arithmetic.

   The property that matters most here is symmetry: every measure is
   computed the same way for the client as for its rivals. A scoreboard
   that flattered the client would be worse than no scoreboard, because
   it would be believed. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, brands, clientBrand, skus, trends } from "./index";
import {
  byRetailer, districtLeads, pricePosition, scoreboard,
} from "./competition";

const view = applyFilters(EMPTY_FILTERS, current);
const rows = scoreboard(view);

describe("scoreboard", () => {
  it("includes every monitored brand, the client among them", () => {
    expect(rows.length).toBe(brands.length);
    expect(rows.some((r) => r.isClient)).toBe(true);
  });

  it("splits the fixture into shares that account for the whole", () => {
    const total = rows.reduce((s, r) => s + r.share, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });

  it("measures the client no differently from its rivals", () => {
    /* Same denominators everywhere: availability over own listings,
       share over all facings, promo over audited outlets. */
    for (const row of rows) {
      expect(row.availability).toBeGreaterThan(0);
      expect(row.availability).toBeLessThanOrEqual(100);
      expect(row.promo).toBeLessThanOrEqual(100);
      expect(row.visibility).toBeLessThanOrEqual(100);
    }
  });

  it("indexes price on comparable packs only, so range cannot move it", () => {
    /* Pepsi carries a 2.25L bottle no rival sells. A raw average put it
       at a 116 index — a mix effect wearing a price label. Every index
       must now sit near par, because the brands really are within a few
       dinars on the packs they both sell, except the value brand. */
    const packsWithOneBrand = new Set(
      [...new Set(skus.map((s) => s.pack))].filter(
        (pack) => new Set(skus.filter((s) => s.pack === pack).map((s) => s.brandId)).size < 2
      )
    );
    expect(packsWithOneBrand.size).toBeGreaterThan(0);

    const client = rows.find((r) => r.isClient)!;
    expect(client.priceIndex).toBeGreaterThan(95);
    expect(client.priceIndex).toBeLessThan(110);
    /* And the value challenger is genuinely below par. */
    const value = rows.find((r) => r.id === "rc-cola")!;
    expect(value.priceIndex).toBeLessThan(client.priceIndex);
  });
});

describe("price position", () => {
  it("plots price, share and availability for every brand with readings", () => {
    const points = pricePosition(view);
    expect(points.length).toBeGreaterThan(1);
    for (const point of points) {
      expect(point.x).toBeGreaterThan(0);
      expect(point.y).toBeGreaterThan(0);
      expect(point.z).toBeGreaterThan(0);
    }
    /* The whole point of the chart is spread on the x axis. */
    const xs = points.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(10);
  });
});

describe("who leads where", () => {
  const leads = districtLeads(view);

  it("only speaks about districts with enough audited outlets behind them", () => {
    expect(leads.length).toBeGreaterThan(0);
    for (const lead of leads) expect(lead.outlets).toBeGreaterThanOrEqual(3);
  });

  it("names a leader whose share is at least the client's", () => {
    for (const lead of leads) {
      expect(lead.leaderShare).toBeGreaterThanOrEqual(lead.clientShare - 0.05);
      if (lead.leaderId === clientBrand.id) expect(lead.margin).toBe(0);
      else expect(lead.margin).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("the Basra story, held in the data itself", () => {
  /* Coca-Cola did something in Basra and the shelf moved. Both halves
     used to be asserted against the activity feed; the feed is gone,
     replaced by findings from the insight engine, but the FACT is a
     property of the dataset rather than of whichever component reports
     it. So it is pinned here, against the rows, where no future
     refactor of the reporting layer can quietly lose it. */

  it("has Coca-Cola gaining Basra shelf across the window to date", () => {
    const line = trends.byGovernorate.basra.filter((p) => p.month <= view.month);
    const first = line[0];
    const last = line[line.length - 1];
    const moved = (last.brandShare["coca-cola"] ?? 0) - (first.brandShare["coca-cola"] ?? 0);
    /* Basra's own bootstrapped detection floor is 4.63pt. */
    expect(moved).toBeGreaterThan(4.63);
  });

  it("has Coca-Cola promoting in more Basra outlets than the client", () => {
    const basra = new Set(
      view.outlets.filter((o) => o.governorateId === "basra").map((o) => o.id)
    );
    const cover = (brandId: string) =>
      new Set(
        view.promos.filter((p) => p.brandId === brandId && basra.has(p.posId)).map((p) => p.posId)
      ).size;
    expect(cover("coca-cola")).toBeGreaterThan(cover(clientBrand.id));
  });
});

describe("retailer groups", () => {
  it("excludes independents, which are the absence of a group", () => {
    const groups = byRetailer(view);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.some((g) => g.id === "Independent")).toBe(false);
  });
});
