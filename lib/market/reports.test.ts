/* A report holds a name and an ordered list of references. It holds no
   figures, and these tests are mostly about the two places that is easy
   to get wrong: what a block is computed over, and what survives a
   trip through a URL. */

import { beforeEach, describe, expect, it } from "vitest";
import { EMPTY_FILTERS } from "./filters";
import {
  DEFAULT_REPORT_NAME, addBlock, byRecency, createReport, decodeReport, deleteReport,
  duplicateBlock, encodeReport, findReport, getReports, hasScope, moveBlock, removeBlock,
  renameReport, resetReportsForTest, resolveScope, saveReports, setBlockScope, setBlockTitle,
  upsertReport,
} from "./reports";

const held = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => held.get(k) ?? null,
  setItem: (k: string, v: string) => void held.set(k, v),
  removeItem: (k: string) => void held.delete(k),
} as unknown as Storage;

beforeEach(() => {
  held.clear();
  resetReportsForTest();
});

describe("scope", () => {
  it("inherits the header when a block says nothing", () => {
    const base = { ...EMPTY_FILTERS, governorates: ["baghdad"] };
    expect(resolveScope(base, undefined)).toEqual(base);
    expect(resolveScope(base, {})).toEqual(base);
  });

  it("REPLACES a dimension rather than adding to it", () => {
    /* A block scoped to Basra means Basra. Merging would give "Basra as
       well as whatever the header had", which is a third slice neither
       the header nor the block asked for. */
    const base = { ...EMPTY_FILTERS, governorates: ["baghdad"], channels: ["kiosk"] };
    const out = resolveScope(base, { governorates: ["basra"] });
    expect(out.governorates).toEqual(["basra"]);
    /* Untouched dimensions still come from the header. */
    expect(out.channels).toEqual(["kiosk"]);
  });

  it("lets a block pin its own period", () => {
    const out = resolveScope(EMPTY_FILTERS, { month: "2026-08" });
    expect(out.month).toBe("2026-08");
  });

  it("does not count an empty override as an override", () => {
    /* Storing one would put a scope chip on a block doing exactly what
       the header says, which teaches the reader to ignore the chip. */
    expect(hasScope(undefined)).toBe(false);
    expect(hasScope({})).toBe(false);
    expect(hasScope({ governorates: [] })).toBe(false);
    expect(hasScope({ governorates: ["basra"] })).toBe(true);
    expect(hasScope({ month: "2026-08" })).toBe(true);
  });

  it("drops the key when an override is cleared", () => {
    let report = addBlock(createReport(), "availability-by-governorate");
    const id = report.blocks[0].id;
    report = setBlockScope(report, id, { governorates: ["basra"] });
    expect(report.blocks[0].scope).toBeDefined();
    report = setBlockScope(report, id, {});
    expect("scope" in report.blocks[0]).toBe(false);
  });
});

describe("editing", () => {
  it("keeps a usable name rather than refusing a blank one", () => {
    expect(renameReport(createReport(), "   ").name).toBe(DEFAULT_REPORT_NAME);
    expect(renameReport(createReport(), " Q4 review ").name).toBe("Q4 review");
  });

  it("gives every block its own instance id, so one chart can appear twice", () => {
    let report = createReport();
    report = addBlock(report, "shelf-battle");
    report = addBlock(report, "shelf-battle");
    expect(report.blocks).toHaveLength(2);
    expect(report.blocks[0].id).not.toBe(report.blocks[1].id);
    expect(report.blocks[0].blockId).toBe(report.blocks[1].blockId);
  });

  it("puts a duplicate beside its original, not at the end", () => {
    /* A duplicate is nearly always the first half of "and now change
       this one's scope". */
    let report = createReport();
    report = addBlock(report, "a");
    report = addBlock(report, "b");
    report = duplicateBlock(report, report.blocks[0].id);
    expect(report.blocks.map((x) => x.blockId)).toEqual(["a", "a", "b"]);
    expect(report.blocks[0].id).not.toBe(report.blocks[1].id);
  });

  it("carries the original's scope into the duplicate", () => {
    let report = addBlock(createReport(), "a", { governorates: ["basra"] });
    report = duplicateBlock(report, report.blocks[0].id);
    expect(report.blocks[1].scope).toEqual({ governorates: ["basra"] });
  });

  it("moves a block and clamps a target past either end", () => {
    let report = createReport();
    for (const id of ["a", "b", "c"]) report = addBlock(report, id);
    const first = report.blocks[0].id;
    expect(moveBlock(report, first, 2).blocks.map((x) => x.blockId)).toEqual(["b", "c", "a"]);
    expect(moveBlock(report, first, 99).blocks.map((x) => x.blockId)).toEqual(["b", "c", "a"]);
    expect(moveBlock(report, first, -5).blocks.map((x) => x.blockId)).toEqual(["a", "b", "c"]);
  });

  it("removes only the instance asked for", () => {
    let report = createReport();
    report = addBlock(report, "a");
    report = addBlock(report, "a");
    report = removeBlock(report, report.blocks[0].id);
    expect(report.blocks).toHaveLength(1);
  });

  it("stamps updatedAt on every edit, so the rail can order by recency", async () => {
    const report = addBlock(createReport(), "a");
    await new Promise((r) => setTimeout(r, 2));
    expect(addBlock(report, "b").updatedAt > report.createdAt).toBe(true);
  });

  it("clears a block title rather than storing an empty one", () => {
    let report = addBlock(createReport(), "a");
    const id = report.blocks[0].id;
    report = setBlockTitle(report, id, "Baghdad only");
    expect(report.blocks[0].title).toBe("Baghdad only");
    report = setBlockTitle(report, id, "  ");
    expect("title" in report.blocks[0]).toBe(false);
  });
});

describe("the share link", () => {
  const build = () => {
    let report = renameReport(createReport(), "Q4 Baghdad review");
    report = addBlock(report, "availability-by-governorate");
    report = addBlock(report, "shelf-battle", { governorates: ["basra"], month: "2026-08" });
    return setBlockTitle(report, report.blocks[0].id, "Where we are short");
  };

  it("survives a round trip with its name, blocks, scopes and titles", () => {
    const source = build();
    const back = decodeReport(encodeReport(source))!;
    expect(back).not.toBeNull();
    expect(back.name).toBe(source.name);
    expect(back.blocks.map((b) => b.blockId)).toEqual(source.blocks.map((b) => b.blockId));
    expect(back.blocks[1].scope).toEqual({ governorates: ["basra"], month: "2026-08" });
    expect(back.blocks[0].title).toBe("Where we are short");
  });

  it("gives the reader their own copy, not a shared object", () => {
    /* Two people editing one id would be two people disagreeing about
       one report with no server to arbitrate. */
    const source = build();
    const back = decodeReport(encodeReport(source))!;
    expect(back.id).not.toBe(source.id);
    expect(back.blocks[0].id).not.toBe(source.blocks[0].id);
  });

  it("carries a name outside Latin-1", () => {
    /* `btoa` on a string throws on Arabic, which is entirely likely
       here — hence the UTF-8 encode. */
    const source = renameReport(createReport(), "تقرير بغداد");
    expect(decodeReport(encodeReport(source))!.name).toBe("تقرير بغداد");
  });

  it("returns null for a truncated or hand-edited link", () => {
    expect(decodeReport("not-a-real-link")).toBeNull();
    expect(decodeReport(encodeReport(build()).slice(0, 12))).toBeNull();
    expect(decodeReport("")).toBeNull();
  });

  it("stays short enough to paste", () => {
    let report = renameReport(createReport(), "Everything, everywhere");
    for (let i = 0; i < 20; i += 1) report = addBlock(report, `block-number-${i}`);
    expect(encodeReport(report).length).toBeLessThan(1500);
  });
});

describe("storage", () => {
  it("adds, replaces and deletes by id", () => {
    const a = createReport("A");
    const b = createReport("B");
    upsertReport(a);
    upsertReport(b);
    expect(getReports()).toHaveLength(2);
    upsertReport({ ...a, name: "A renamed" });
    expect(getReports()).toHaveLength(2);
    expect(findReport(a.id)?.name).toBe("A renamed");
    deleteReport(a.id);
    expect(getReports().map((r) => r.id)).toEqual([b.id]);
  });

  it("survives a hand-edited value without losing the good rows", () => {
    localStorage.setItem("vemi.reports.v1", JSON.stringify([null, { junk: 1 }, createReport("Real")]));
    resetReportsForTest();
    expect(getReports()).toHaveLength(1);
    expect(getReports()[0].name).toBe("Real");
  });

  it("survives a value that is not a list at all", () => {
    localStorage.setItem("vemi.reports.v1", "{}");
    resetReportsForTest();
    expect(getReports()).toEqual([]);
  });

  it("orders by what was touched last, not by what was made first", () => {
    const old = { ...createReport("Old"), updatedAt: "2026-09-01T00:00:00.000Z" };
    const fresh = { ...createReport("Fresh"), updatedAt: "2026-09-09T00:00:00.000Z" };
    saveReports([old, fresh]);
    expect(byRecency(getReports()).map((r) => r.name)).toEqual(["Fresh", "Old"]);
  });
});
