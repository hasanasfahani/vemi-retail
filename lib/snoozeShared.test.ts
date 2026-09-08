/* The wake conditions, against hand-built fixtures.

   This is the one piece of the engine that CAN take synthetic input —
   `wakeReason` is a pure comparison of a stored baseline against a
   current finding, with no dependency on the master lists. So unlike
   the rule tests, which recompute against real audit rows, these are
   ordinary unit tests over cases chosen to sit exactly on each
   boundary.

   Everything here is a test of one property: the feature hides
   findings, so every ambiguous case must fail toward VISIBLE. */

import { describe, expect, test } from "vitest";
import {
  splitBySnooze,
  wakeReason,
  WAKE_GROWTH,
  toSnooze,
  type SnoozeRecord,
} from "./snoozeShared";
import type { Insight, Severity } from "./insights";

const VISIT = "2026-08-12";
const NEXT_VISIT = "2026-09-09";

function insight(over: Partial<Insight> & { id: string }): Insight {
  return {
    rule: "r1-persistent-gap",
    severity: "warning",
    headline: "a finding",
    detail: "",
    impact: { value: 100, unit: "facing-days", label: "100 facing-days" },
    confidence: "measured",
    scope: { outlets: 1, label: "ERB-101" },
    trend: "new",
    evidence: { href: "/dashboard/shelf", formula: "f", table: { columns: [], rows: [] } },
    entities: {},
    ...over,
  } as Insight;
}

function snooze(over: Partial<SnoozeRecord> = {}): SnoozeRecord {
  return {
    id: "rec1",
    insightId: "f1",
    rule: "r1-persistent-gap",
    headline: "a finding",
    reason: "kiosk, will never stock it",
    owner: "Hasan",
    snoozedAt: VISIT,
    untilVisit: VISIT,
    baselineImpact: 100,
    baselineSeverity: "warning" as Severity,
    ...over,
  };
}

describe("wakeReason", () => {
  test("a stable finding stays asleep for its cycle", () => {
    expect(wakeReason(snooze(), insight({ id: "f1" }), VISIT)).toBeNull();
  });

  test("a new visit expires a next-visit snooze", () => {
    expect(wakeReason(snooze(), insight({ id: "f1" }), NEXT_VISIT)).toBe("expired");
  });

  test("'until it worsens' survives a new visit", () => {
    expect(
      wakeReason(snooze({ untilVisit: "" }), insight({ id: "f1" }), NEXT_VISIT)
    ).toBeNull();
  });

  test("escalation wakes it even with no time bound", () => {
    expect(
      wakeReason(
        snooze({ untilVisit: "" }),
        insight({ id: "f1", severity: "critical" }),
        VISIT
      )
    ).toBe("escalated");
  });

  test("a finding that improves in severity stays asleep", () => {
    /* De-escalation must never wake something. The reader parked it
       when it was worse than this. */
    expect(
      wakeReason(
        snooze({ baselineSeverity: "critical" }),
        insight({ id: "f1", severity: "warning" }),
        VISIT
      )
    ).toBeNull();
  });

  test("growth wakes it exactly at the threshold, not before", () => {
    const justUnder = insight({
      id: "f1",
      impact: { value: 100 * WAKE_GROWTH - 0.01, unit: "facing-days", label: "" },
    });
    const exactly = insight({
      id: "f1",
      impact: { value: 100 * WAKE_GROWTH, unit: "facing-days", label: "" },
    });
    expect(wakeReason(snooze({ untilVisit: "" }), justUnder, VISIT)).toBeNull();
    expect(wakeReason(snooze({ untilVisit: "" }), exactly, VISIT)).toBe("grown");
  });

  test("a zero baseline cannot trigger the growth check", () => {
    /* 0 × 1.25 is 0, so every finding would clear it. Guarded, or a
       corrupt baseline would wake everything at once. */
    expect(
      wakeReason(
        snooze({ baselineImpact: 0, untilVisit: "" }),
        insight({ id: "f1", impact: { value: 1, unit: "facing-days", label: "" } }),
        VISIT
      )
    ).toBeNull();
  });

  test("escalation is reported ahead of expiry", () => {
    expect(
      wakeReason(snooze(), insight({ id: "f1", severity: "critical" }), NEXT_VISIT)
    ).toBe("escalated");
  });
});

describe("splitBySnooze", () => {
  const findings = [
    insight({ id: "f1" }),
    insight({ id: "f2" }),
    insight({ id: "f3", severity: "critical" }),
  ];

  test("un-snoozed findings pass straight through", () => {
    const split = splitBySnooze(findings, [], VISIT);
    expect(split.visible.map((i) => i.id)).toEqual(["f1", "f2", "f3"]);
    expect(split.asleep).toHaveLength(0);
  });

  test("a snoozed finding leaves the visible list", () => {
    const split = splitBySnooze(findings, [snooze({ insightId: "f2" })], VISIT);
    expect(split.visible.map((i) => i.id)).toEqual(["f1", "f3"]);
    expect(split.asleep.map((a) => a.insight.id)).toEqual(["f2"]);
  });

  test("a woken finding is BOTH visible and reported as woken", () => {
    /* The property that makes the mechanism trustworthy: something
       that wakes must return to the list, not merely be annotated. */
    const split = splitBySnooze(
      findings,
      [snooze({ insightId: "f3", baselineSeverity: "warning", untilVisit: "" })],
      VISIT
    );
    expect(split.visible.map((i) => i.id)).toContain("f3");
    expect(split.woken.map((w) => w.reason)).toEqual(["escalated"]);
    expect(split.asleep).toHaveLength(0);
  });

  test("a snooze for a finding that no longer exists is inert", () => {
    /* The finding was fixed, or the thresholds moved. A stale record
       must not remove anything else. */
    const split = splitBySnooze(findings, [snooze({ insightId: "gone" })], VISIT);
    expect(split.visible).toHaveLength(3);
    expect(split.asleep).toHaveLength(0);
  });
});

describe("toSnooze — hand-editable fields degrade safely", () => {
  test("an unreadable severity degrades to the lowest, never the highest", () => {
    /* This field is editable in Airtable. Reading a typo as "critical"
       would make escalation impossible and hide the finding forever;
       reading it as "watch" can only wake it early. For a feature
       whose job is hiding things, only one of those is safe. */
    const record = toSnooze({
      id: "rec1",
      createdTime: "2026-08-12T00:00:00.000Z",
      fields: { "Insight ID": "f1", "Baseline Severity": "CRITICAL!!" },
    });
    expect(record.baselineSeverity).toBe("watch");
    expect(
      wakeReason(record, insight({ id: "f1", severity: "warning" }), VISIT)
    ).toBe("escalated");
  });

  test("a missing snoozedAt falls back to the record's own createdTime", () => {
    const record = toSnooze({
      id: "rec1",
      createdTime: "2026-08-12T09:00:00.000Z",
      fields: { "Insight ID": "f1" },
    });
    expect(record.snoozedAt).toBe("2026-08-12T09:00:00.000Z");
    expect(record.untilVisit).toBe("");
  });
});
