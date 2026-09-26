import { describe, expect, it } from "vitest";
import { asOf, monthShort, priorMonthId, vsPrior } from "./asOf";
import { contract } from "./index";

describe("asOf", () => {
  it("names the prior month as the comparison window", () => {
    expect(priorMonthId(contract.currentMonth)).toBe("2026-08");
    expect(vsPrior()).toBe("vs Aug 2026");
    expect(monthShort("2026-09")).toBe("Sep 2026");
  });
  it("dates the open cycle by its elapsed days and a closed one by month", () => {
    expect(asOf()).toBe(`As of ${contract.daysElapsed} Sep 2026`);
    expect(asOf("2026-07")).toBe("Jul 2026 cycle");
  });
});
