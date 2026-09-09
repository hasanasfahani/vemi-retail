/* Targets, people and the line between a goal and a threshold.

   The property that matters most: moving a target must reband the
   portal WITHOUT silencing the engine. A problem that disappears
   because somebody lowered a goal is the failure this separation
   exists to prevent. */

import { afterEach, describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, kpiTargets } from "./index";
import {
  DEFAULT_TARGETS, TARGET_META, USERS, getTargets, resetTargets, setTarget,
  targetsAreCustom, userName,
} from "./settings";
import { generateInsights, THRESHOLDS } from "./insights";
import { posRows, kpiTargetsForDrawer } from "./pos";
import { buildReport } from "./report";
import { OWNERS, seedActions } from "./actions";

const view = applyFilters(EMPTY_FILTERS, current);

afterEach(() => {
  resetTargets();
});

describe("targets", () => {
  it("starts from the contracted values", () => {
    expect(getTargets().availability).toBe(kpiTargets.availability);
    expect(getTargets().posm).toBe(kpiTargets.posm);
    expect(targetsAreCustom()).toBe(false);
  });

  it("moves every surface that bands by a target", () => {
    const before = buildReport(view).kpis.find((k) => k.id === "posm")!;
    setTarget("posm", 60);
    const after = buildReport(view).kpis.find((k) => k.id === "posm")!;

    expect(before.target).toBe(kpiTargets.posm);
    expect(after.target).toBe(60);
    /* The value is unchanged — only the judgement of it moves. */
    expect(after.value).toBe(before.value);
    expect(after.band).not.toBe(before.band);
  });

  it("reaches the drawer, which read a frozen copy until it became a function", () => {
    setTarget("availability", 70);
    const drawer = kpiTargetsForDrawer().find((k) => k.key === "availability")!;
    expect(drawer.target).toBe(70);
  });

  it("does NOT change what the engine flags", () => {
    /* A target is a contractual goal; a threshold is calibrated to the
       spread this market shows. Letting the first move the second would
       mean a finding could be silenced by shifting a goalpost. */
    const before = generateInsights(view);
    setTarget("availability", 40);
    setTarget("posm", 40);
    setTarget("assortment", 40);
    const after = generateInsights(view);

    expect(after.all.length).toBe(before.all.length);
    expect(after.all.map((i) => i.id)).toEqual(before.all.map((i) => i.id));
    /* And the thresholds themselves are untouched constants. */
    expect(THRESHOLDS.r13PosmAbsent.warningCount).toBe(20);
  });

  it("clamps a target into a range a percentage can occupy", () => {
    setTarget("price", 999);
    expect(getTargets().price).toBe(100);
    setTarget("price", -20);
    expect(getTargets().price).toBe(1);
  });

  it("restores the contracted values", () => {
    setTarget("score", 50);
    expect(targetsAreCustom()).toBe(true);
    resetTargets();
    expect(getTargets()).toEqual(DEFAULT_TARGETS);
    expect(targetsAreCustom()).toBe(false);
  });

  it("bands an outlet's issue chips against the live target", () => {
    const before = posRows(view).filter((r) => r.issues.some((i) => i.kind === "share")).length;
    setTarget("shelfShare", 90);
    const after = posRows(view).filter((r) => r.issues.some((i) => i.kind === "share")).length;
    /* A higher bar means more outlets fall under it. */
    expect(after).toBeGreaterThan(before);
  });

  it("covers every target the portal bands by", () => {
    for (const meta of TARGET_META) {
      expect(DEFAULT_TARGETS[meta.id]).toBeGreaterThan(0);
      expect(meta.hint.length).toBeGreaterThan(10);
    }
  });
});

describe("users", () => {
  it("is the one list ownership points at", async () => {
    const roles = USERS.map((u) => u.role);
    expect(OWNERS).toEqual(roles);

    const { loadMonth } = await import("./index");
    const actions = seedActions(await loadMonth("2026-08"));
    for (const action of actions) {
      expect(roles).toContain(action.owner);
      /* And every owner resolves to a person, not a bare role. */
      expect(userName(action.owner)).not.toBe(action.owner);
    }
  });

  it("gives every user an access level and a status", () => {
    for (const user of USERS) {
      expect(user.name.length).toBeGreaterThan(2);
      expect(user.access.length).toBeGreaterThan(0);
      expect(["Active", "Invited"]).toContain(user.status);
    }
  });
});
