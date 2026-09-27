import { describe, expect, it } from "vitest";
import { BETTER, deltaOutcome } from "./outcome";

describe("deltaOutcome", () => {
  it("reads a rise in a rate as better and a fall as worse", () => {
    expect(deltaOutcome(1.2, 0.5, BETTER.availability)).toBe("better");
    expect(deltaOutcome(-1.2, 0.5, BETTER.availability)).toBe("worse");
  });

  it("never renders more failures as good news", () => {
    expect(deltaOutcome(14, 0, BETTER.gapsFound)).toBe("worse");
    expect(deltaOutcome(-14, 0, BETTER.gapsFound)).toBe("better");
  });

  it("calls a change inside the detection floor flat, whatever its sign", () => {
    expect(deltaOutcome(0.4, 0.5, "up")).toBe("flat");
    expect(deltaOutcome(-0.4, 0.5, "down")).toBe("flat");
    expect(deltaOutcome(0, 0, "up")).toBe("flat");
  });

  it("leaves a change unjudged when the measure states no direction", () => {
    expect(deltaOutcome(29, 0)).toBe("neutral");
  });

  it("judges every scored measure by the direction its target lies in", () => {
    for (const k of ["availability", "shelfShare", "assortment", "price", "posm", "score"] as const) {
      expect(BETTER[k]).toBe("up");
    }
  });
});
