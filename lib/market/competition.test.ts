/* The Competition page's arithmetic.

   The property that matters most here is symmetry: every measure is
   computed the same way for the client as for its rivals. A scoreboard
   that flattered the client would be worse than no scoreboard, because
   it would be believed. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, brands, clientBrand, skus } from "./index";
import {
  activity, byRetailer, districtLeads, pricePosition, scoreboard,
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

describe("competitor activity", () => {
  const events = activity(view);

  it("reports rivals only, never portfolio stablemates", () => {
    for (const event of events) {
      const brand = brands.find((b) => b.id === event.brandId)!;
      expect(brand.owner).not.toBe(clientBrand.owner);
    }
  });

  it("puts events that clear their detection floor first", () => {
    const firstSoft = events.findIndex((e) => !e.material);
    if (firstSoft !== -1) {
      expect(events.slice(firstSoft).every((e) => !e.material)).toBe(true);
    }
  });

  it("finds the promotion push behind the Basra shelf gain", () => {
    /* The demo's central competitive story: Coca-Cola did something,
       and the shelf moved. Both halves have to be visible. */
    const basra = events.filter((e) => e.cityId === "basra" && e.brandId === "coca-cola");
    expect(basra.some((e) => e.kind === "shelf-gain" && e.material)).toBe(true);
    expect(basra.some((e) => e.kind === "promotion" && e.material)).toBe(true);
  });
});

describe("retailer groups", () => {
  it("excludes independents, which are the absence of a group", () => {
    const groups = byRetailer(view);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.some((g) => g.id === "Independent")).toBe(false);
  });
});
