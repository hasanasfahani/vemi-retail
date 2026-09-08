/* The verification state machine, against hand-built fixtures.

   `verify` is a pure comparison of two engine outputs plus a coverage
   set, so unlike the rule tests these are ordinary unit tests over
   cases chosen to sit on each boundary.

   The property under all of them: a claim about the shelf is only ever
   made when the shelf was actually looked at. Every ambiguous case
   must fail toward "we cannot say". */

import { describe, expect, test } from "vitest";
import {
  verify,
  summarise,
  PARTIAL_THRESHOLD,
  type VerificationInput,
} from "./verification";
import type { Insight } from "./insights";
import type { ActionRecord } from "./actionsShared";

function finding(id: string, impact: number, posId?: string): Insight {
  return {
    id,
    rule: "r1-outlet-gaps",
    severity: "warning",
    headline: id,
    detail: "",
    impact: { value: impact, unit: "facing-days", label: `${impact} facing-days at risk` },
    confidence: "measured",
    scope: { outlets: 1, label: posId ?? "panel" },
    trend: "new",
    evidence: { href: "/dashboard/shelf", formula: "f", table: { columns: [], rows: [] } },
    entities: posId ? { posId } : {},
  } as Insight;
}

function action(over: Partial<ActionRecord> = {}): ActionRecord {
  return {
    id: `act-${over.insightId ?? "x"}`,
    title: "t",
    insightId: "r1:erb-502",
    rule: "r1-outlet-gaps",
    where: "ERB-502",
    owner: "Hasan",
    status: "Done",
    items: [],
    createdAt: "2026-08-01T00:00:00.000Z",
    ...over,
  } as ActionRecord;
}

function input(over: Partial<VerificationInput> = {}): VerificationInput {
  return {
    actions: [action()],
    current: new Map(),
    previous: new Map([["r1:erb-502", finding("r1:erb-502", 300, "erb-502")]]),
    auditedNow: new Map([["erb-502", "2026-08-09"]]),
    auditedBefore: new Set(["erb-502"]),
    ...over,
  };
}

const only = (i: VerificationInput) => [...verify(i).values()][0];

describe("outcomes", () => {
  test("finding gone at re-audit is held", () => {
    expect(only(input()).outcome).toBe("held");
  });

  test("finding still firing at the same size is slipped", () => {
    const still = new Map([["r1:erb-502", finding("r1:erb-502", 300, "erb-502")]]);
    expect(only(input({ current: still })).outcome).toBe("slipped");
  });

  test("a finding that grew is slipped, never partial", () => {
    const worse = new Map([["r1:erb-502", finding("r1:erb-502", 500, "erb-502")]]);
    expect(only(input({ current: worse })).outcome).toBe("slipped");
  });

  test("partial fires exactly at the shrink threshold, not before", () => {
    const atThreshold = new Map([
      ["r1:erb-502", finding("r1:erb-502", 300 * PARTIAL_THRESHOLD, "erb-502")],
    ]);
    const justAbove = new Map([
      ["r1:erb-502", finding("r1:erb-502", 300 * PARTIAL_THRESHOLD + 1, "erb-502")],
    ]);
    expect(only(input({ current: atThreshold })).outcome).toBe("partial");
    expect(only(input({ current: justAbove })).outcome).toBe("slipped");
  });

  test("an un-audited outlet is never graded, however good it looks", () => {
    /* THE CENTRAL GUARD. With no current finding the naive read is
       "held" — but the finding is absent because nobody went, not
       because the shelf changed. Reporting that as fixed is the same
       error as counting an unvisited outlet as clean. */
    const v = only(input({ auditedNow: new Map() }));
    expect(v.outcome).toBe("awaiting");
    expect(v.auditedAt).toBeNull();
  });

  test("two windows without a re-audit escalates to unverifiable", () => {
    const v = only(input({ auditedNow: new Map(), auditedBefore: new Set() }));
    expect(v.outcome).toBe("unverifiable");
  });

  test("an action with no finding is untracked, not held", () => {
    const v = only(input({ actions: [action({ insightId: undefined })] }));
    expect(v.outcome).toBe("untracked");
  });

  test("a finding from a deleted rule is untracked, never held", () => {
    /* R10 was merged into R1 when the rotating panel landed. An action
       created from r10:erb-302 finds no current finding — because the
       RULE is gone, not the gap. Grading that as held would hand out
       credit for a refactor. */
    const v = only(
      input({
        actions: [
          action({ insightId: "r10:erb-302", rule: "r10-new-gap-cluster" }),
        ],
        previous: new Map(),
      })
    );
    expect(v.outcome).toBe("untracked");
  });

  test("a live rule with a vanished finding is still held", () => {
    /* The guard must not swallow the real case. */
    const v = only(input({ actions: [action({ rule: "r1-outlet-gaps" })] }));
    expect(v.outcome).toBe("held");
  });

  test("only Done actions are graded at all", () => {
    const open = verify(input({ actions: [action({ status: "Open" })] }));
    expect(open.size).toBe(0);
  });

  test("aggregate findings are graded without an outlet", () => {
    /* r2:Bakhtiari has no posId — it must still grade rather than
       falling into the coverage branch and reading as awaiting. */
    const acts = [action({ insightId: "r2:Bakhtiari", where: "Bakhtiari" })];
    const prev = new Map([["r2:Bakhtiari", finding("r2:Bakhtiari", 400)]]);
    const v = only(input({ actions: acts, previous: prev, auditedNow: new Map() }));
    expect(v.outcome).toBe("held");
  });
});

describe("the confirmation rate", () => {
  const build = (outcomes: string[]) =>
    summarise(
      outcomes.map((o, i) => ({
        actionId: `a${i}`,
        outcome: o as never,
        current: o === "slipped" ? finding("x", 300) : o === "partial" ? finding("x", 100) : null,
        previous: finding("x", 300),
        auditedAt: "2026-08-09",
      }))
    );

  test("excludes what could not be checked", () => {
    /* A rate that fell because the rotation skipped a door would be
       measuring collection, not delivery. */
    const s = build(["held", "slipped", "awaiting", "unverifiable", "untracked"]);
    expect(s.closed).toBe(5);
    expect(s.checkable).toBe(2);
    expect(s.confirmationRate).toBe(50);
  });

  test("partial counts as half", () => {
    expect(build(["held", "partial"]).confirmationRate).toBe(75);
  });

  test("nothing checkable yields null, not zero", () => {
    /* 0% says every action failed. Null says we have not been back.
       Rendering the first when the second is true would be the worst
       lie this feature could tell. */
    const s = build(["awaiting", "awaiting"]);
    expect(s.confirmationRate).toBeNull();
    expect(s.checkable).toBe(0);
  });

  test("closing work you did not do lowers the rate", () => {
    /* The anti-gaming property, stated as a test. */
    const honest = build(["held", "held"]);
    const padded = build(["held", "held", "slipped", "slipped"]);
    expect(padded.confirmationRate!).toBeLessThan(honest.confirmationRate!);
  });

  test("recovered counts only what actually came back", () => {
    const s = build(["held", "partial", "slipped"]);
    /* held returns its full 300; partial returns 300 - 100; slipped
       returns nothing. */
    expect(s.recovered).toBe(500);
  });
});
