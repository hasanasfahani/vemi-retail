/* The action queue's contract.

   The property under test throughout is that the board cannot award
   itself credit: "verified" is granted by re-running the rule that
   raised the action, never by a status control. */

import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, applyFilters } from "./filters";
import { current, loadMonth } from "./index";
import { RULE_IDS, generateInsights, type RuleId } from "./insights";
import {
  OWNERS, STAGE_IDS, seedActions, summarise, verify, type Action,
} from "./actions";

const view = applyFilters(EMPTY_FILTERS, current);
const report = generateInsights(view);
const previous = await loadMonth("2026-08");
const actions = seedActions(previous);

describe("seeding", () => {
  it("raises a real queue from the previous month's findings", () => {
    /* The brief asks for 30+ actions; more importantly, each one has
       to trace back to a finding rather than being written by hand. */
    expect(actions.length).toBeGreaterThanOrEqual(30);
    for (const action of actions) {
      expect(action.insightId.length).toBeGreaterThan(0);
      expect(RULE_IDS).toContain(action.rule);
      expect(action.raisedIn).toBe("2026-08");
    }
  });

  it("caps how much of the board any one rule can occupy", () => {
    /* 123 assortment gaps would bury every other kind of work under a
       single rule's output. */
    const perRule = new Map<RuleId, number>();
    for (const action of actions) {
      perRule.set(action.rule, (perRule.get(action.rule) ?? 0) + 1);
    }
    for (const count of perRule.values()) expect(count).toBeLessThanOrEqual(5);
    expect(perRule.size).toBeGreaterThan(3);
  });

  it("is deterministic, so the board does not reshuffle on reload", () => {
    const again = seedActions(previous);
    expect(again.map((a) => `${a.id}|${a.stage}|${a.owner}|${a.dueDate}`)).toEqual(
      actions.map((a) => `${a.id}|${a.stage}|${a.owner}|${a.dueDate}`)
    );
  });

  it("gives every action an owner, a stage and a recommendation", () => {
    for (const action of actions) {
      expect(OWNERS).toContain(action.owner);
      expect(STAGE_IDS).toContain(action.stage);
      expect(action.recommendation.length).toBeGreaterThan(15);
      expect(action.kpi.length).toBeGreaterThan(0);
    }
  });

  it("never seeds an action straight into verified or resolved", () => {
    /* Those two states are earned, not dealt. */
    for (const action of actions) {
      expect(action.stage).not.toBe("verified");
      expect(action.stage).not.toBe("resolved");
    }
  });
});

describe("verification", () => {
  it("asks the engine rather than reimplementing what 'fixed' means", () => {
    const outcomes = actions.map((a) => verify(a, report, view, RULE_IDS).outcome);
    /* A live board should show a mix: some held, some still firing,
       some not yet revisited. All-held or all-slipped would mean the
       check is not really running. */
    expect(new Set(outcomes).size).toBeGreaterThan(1);
    expect(outcomes.filter((o) => o === "held").length).toBeGreaterThan(0);
    expect(outcomes.filter((o) => o === "slipped").length).toBeGreaterThan(0);
  });

  it("refuses to report on outlets the panel has not returned to", () => {
    for (const action of actions) {
      const v = verify(action, report, view, RULE_IDS);
      if (v.outcome !== "awaiting") continue;
      /* Nothing re-audited means nothing to say — and that is not a
         failure, it is the rotating panel. */
      expect(v.reaudited).toBe(0);
      expect(v.note).toContain("not been back");
    }
  });

  it("never grades a deleted rule as held", () => {
    /* The false-credit path: a finding is absent because the rule went
       away, not because the shelf changed. */
    const orphan: Action = { ...actions[0], rule: "r99-gone" as RuleId };
    const v = verify(orphan, report, view, RULE_IDS);
    expect(v.outcome).toBe("untracked");
  });

  it("states what it saw, not what was intended", () => {
    for (const action of actions) {
      const v = verify(action, report, view, RULE_IDS);
      if (v.outcome === "held") {
        expect(v.reaudited).toBeGreaterThan(0);
        expect(v.note).toContain("re-audit");
        /* Never a causal claim: the audit observed a change, it did not
           prove the action produced it. */
        expect(v.note).not.toContain("fixed by");
      }
    }
  });
});

describe("summary", () => {
  it("counts each action into exactly one of open, verified or resolved", () => {
    const stats = summarise(actions);
    expect(stats.open + stats.verified + stats.resolved).toBe(stats.total);
  });
});
