/* The quoting is the part worth testing. A governorate written
   "Nineveh, Mosul" or a label containing a quote silently shifts every
   column to its right in a file nobody opens until the figures are
   already in a meeting. */

import { describe, expect, it } from "vitest";
import { csvName, toCsvText } from "./csv";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current } from "./index";
import { DEFAULT_TARGETS } from "./settings";
import { BLOCKS, scopeForBlock } from "./reportBlocks";

describe("writing a CSV", () => {
  it("quotes a value containing a comma", () => {
    const text = toCsvText({ columns: ["Place", "n"], rows: [["Nineveh, Mosul", 4]] });
    expect(text).toBe('Place,n\n"Nineveh, Mosul",4');
  });

  it("doubles a quote inside a value", () => {
    expect(toCsvText({ columns: ["a"], rows: [['say "hi"']] })).toBe('a\n"say ""hi"""');
  });

  it("quotes a value containing a newline", () => {
    expect(toCsvText({ columns: ["a"], rows: [["one\ntwo"]] })).toContain('"one\ntwo"');
  });

  it("leaves an ordinary value alone", () => {
    expect(toCsvText({ columns: ["a", "b"], rows: [["Basra", 88.4]] })).toBe("a,b\nBasra,88.4");
  });

  it("makes a filename that survives a filesystem", () => {
    expect(csvName("vemi", "Q4 Baghdad review!", "Availability by governorate", "2026-09"))
      .toBe("vemi-q4-baghdad-review-availability-by-governorate-2026-09");
    expect(csvName("", undefined)).toBe("vemi-export");
  });
});

describe("every block's rows", () => {
  const ctx = (block: (typeof BLOCKS)[number]) => ({
    view: applyFilters(scopeForBlock(block, EMPTY_FILTERS), current),
    targets: DEFAULT_TARGETS,
  });

  it("is offered by every block in the catalogue", () => {
    /* A block with no download is allowed by the type, but a reader
       hitting one that silently offers nothing is a worse experience
       than a catalogue where the control is always there. */
    for (const block of BLOCKS) expect(block.csv, block.id).toBeTypeOf("function");
  });

  it("has a header for every column it writes", () => {
    for (const block of BLOCKS) {
      const table = block.csv!(ctx(block));
      expect(table.columns.length, block.id).toBeGreaterThan(1);
      for (const row of table.rows) {
        expect(row.length, `${block.id} row width`).toBe(table.columns.length);
      }
    }
  });

  it("writes rows for the scope it was given", () => {
    const basra = { ...EMPTY_FILTERS, governorates: ["basra"] };
    for (const block of BLOCKS) {
      const scoped = {
        view: applyFilters(scopeForBlock(block, basra), current),
        targets: DEFAULT_TARGETS,
      };
      expect(() => block.csv!(scoped), block.id).not.toThrow();
    }
  });

  it("survives a scope that reaches no outlet", () => {
    const nowhere = { ...EMPTY_FILTERS, retailers: ["Nowhere Group"] };
    for (const block of BLOCKS) {
      const scoped = {
        view: applyFilters(scopeForBlock(block, nowhere), current),
        targets: DEFAULT_TARGETS,
      };
      expect(() => block.csv!(scoped), block.id).not.toThrow();
    }
  });
});
