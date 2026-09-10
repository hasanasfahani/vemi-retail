/* THE TEST THIS PHASE EXISTS FOR.

   Every block was written for one page, under that page's filters. A
   custom report puts it under any scope the reader chooses, including
   ones the original page could never produce — a single kiosk in
   Karbala, one SKU, a brand filter on a chart built to compare brands.

   So each block is rendered under a set of deliberately awkward scopes
   and asked only to survive. Rendering is done with react-dom/server
   rather than a DOM: these are pure functions returning elements, and
   what needs proving is that they do not throw on a slice with no rows
   in it. */

import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { current } from "./index";
import { EMPTY_FILTERS, applyFilters, type Filters } from "./filters";
import { DEFAULT_TARGETS } from "./settings";
import {
  BLOCKS, BLOCK_BY_ID, BLOCK_GROUPS, blocksInGroup, scopeForBlock,
  type BlockContext, type BlockDef,
} from "./reportBlocks";

/* The same two steps the report page takes: resolve the block's own
   filters, then build the one view it is given. */
const contextFor = (block: BlockDef, filters: Filters): BlockContext => ({
  view: applyFilters(scopeForBlock(block, filters), current),
  targets: DEFAULT_TARGETS,
});

/* Each of these has broken something at least once elsewhere in this
   build: an empty denominator, a single-outlet slice, a brand filter on
   a comparison, a period that is not the current one. */
const SCOPES: [string, Filters][] = [
  ["the whole market", EMPTY_FILTERS],
  ["one governorate", { ...EMPTY_FILTERS, governorates: ["karbala"] }],
  ["one channel", { ...EMPTY_FILTERS, channels: ["kiosk"] }],
  ["a governorate and a channel", { ...EMPTY_FILTERS, governorates: ["karbala"], channels: ["kiosk"] }],
  ["one brand", { ...EMPTY_FILTERS, brands: ["pepsi"] }],
  ["one rival brand", { ...EMPTY_FILTERS, brands: ["coca-cola"] }],
  ["one SKU", { ...EMPTY_FILTERS, skus: ["sku-pepsi-500-pet"] }],
  ["a combination that reaches nothing", {
    ...EMPTY_FILTERS,
    governorates: ["karbala"],
    channels: ["hypermarket"],
    retailers: ["Nowhere Group"],
  }],
];

describe("the catalogue", () => {
  it("gives every block a unique id", () => {
    const ids = BLOCKS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("puts every block in a group that exists, and leaves no group empty", () => {
    for (const block of BLOCKS) expect(BLOCK_GROUPS).toContain(block.group);
    for (const group of BLOCK_GROUPS) expect(blocksInGroup(group).length, group).toBeGreaterThan(0);
  });

  it("gives every block a label, a description and a width", () => {
    for (const block of BLOCKS) {
      expect(block.label, block.id).toBeTruthy();
      expect(block.description, block.id).toBeTruthy();
      expect(["half", "full"], block.id).toContain(block.width);
    }
  });

  it("is reachable by id", () => {
    for (const block of BLOCKS) expect(BLOCK_BY_ID.get(block.id)).toBe(block);
  });
});

describe("every block survives every scope", () => {
  for (const [name, filters] of SCOPES) {
    it(`renders under ${name}`, () => {
      for (const block of BLOCKS) {
        const ctx = contextFor(block, filters);
        expect(() => renderToStaticMarkup(block.render(ctx) as never), `${block.id} under ${name}`)
          .not.toThrow();
      }
    });
  }
});

describe("a comparison is not a comparison with five of six brands removed", () => {
  /* Tested on `scopeForBlock` rather than on rendered markup. Charts
     render nothing under react-dom/server — recharts needs a measured
     container — so comparing two rendered strings would have compared
     two empty wrappers and passed whatever the blocks did. The contract
     is which FILTERS a block is computed over, so that is what is
     asserted. */

  it("drops brand and SKU for the blocks that compare brands", () => {
    const narrow: Filters = { ...EMPTY_FILTERS, brands: ["pepsi"], skus: ["sku-pepsi-500-pet"] };
    for (const block of BLOCKS.filter((b) => b.ignoresBrandFilter)) {
      const out = scopeForBlock(block, narrow);
      expect(out.brands, block.id).toEqual([]);
      expect(out.skus, block.id).toEqual([]);
    }
  });

  it("keeps brand and SKU for every other block", () => {
    const narrow: Filters = { ...EMPTY_FILTERS, brands: ["pepsi"], skus: ["sku-pepsi-500-pet"] };
    for (const block of BLOCKS.filter((b) => !b.ignoresBrandFilter)) {
      expect(scopeForBlock(block, narrow).brands, block.id).toEqual(["pepsi"]);
    }
  });

  it("never drops an OUTLET dimension, whatever the block declares", () => {
    /* Ignoring the brand filter must not mean ignoring the filters. A
       shelf battle scoped to Basra kiosks in August is still that
       question. */
    const narrow: Filters = {
      month: "2026-08",
      governorates: ["basra"],
      channels: ["kiosk"],
      retailers: ["Independent"],
      brands: ["pepsi"],
      skus: [],
    };
    for (const block of BLOCKS) {
      const out = scopeForBlock(block, narrow);
      expect(out.month, block.id).toBe("2026-08");
      expect(out.governorates, block.id).toEqual(["basra"]);
      expect(out.channels, block.id).toEqual(["kiosk"]);
      expect(out.retailers, block.id).toEqual(["Independent"]);
    }
  });

  it("marks every brand-comparison block, and only those", () => {
    /* A block that draws all six brands and does NOT declare this would
       silently collapse to one column under a brand filter. */
    const flagged = BLOCKS.filter((b) => b.ignoresBrandFilter).map((b) => b.id).sort();
    expect(flagged).toEqual([
      "availability-by-channel",
      "competition-leads",
      "competition-price-position",
      "competition-scoreboard",
      "health-brands",
      "price-distance-by-sku",
      "shelf-battle-governorate",
      "shelf-by-brand",
    ]);
  });
});

describe("the picker's schematic", () => {
  it("gives every block a shape the glyph knows how to draw", () => {
    /* A new block with a typo'd shape would render an empty square in
       the picker and nowhere else — silent, and exactly the kind of
       thing nobody notices until a reader asks why one row is blank. */
    const drawable = ["tiles", "bars", "dots", "gap", "split", "stacked", "donut", "grid", "table"];
    for (const block of BLOCKS) expect(drawable, block.id).toContain(block.shape);
  });

  it("does not draw everything the same way", () => {
    /* Twenty-two entries wearing one glyph would be a list with a
       decoration rather than a list with a preview. */
    expect(new Set(BLOCKS.map((b) => b.shape)).size).toBeGreaterThanOrEqual(6);
  });
});
