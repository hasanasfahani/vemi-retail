/* ============================================================
   SNOOZE — deciding not to act, on the record.

   Phase 8 listed this under out-of-scope as "dismissing or snoozing an
   insight — needs persistence, arrives with Phase 9". Phase 9 shipped
   persistence and this came along for the ride, so every cycle a
   reader has consciously deprioritised comes back looking identical
   to one nobody has read. The queue cannot distinguish "considered and
   declined" from "never opened", which is the difference between a
   list someone trusts and a list someone stops reading.

   THE DESIGN DECISION: there is no permanent dismiss.

   A gap you dismissed in August is still costing money in December,
   and a control that hides it forever converts a finding into a
   silence nobody revisits. Every snooze therefore has a wake
   condition, and there are exactly two:

     "next visit"       sleeps through this cycle, back at the next
                        audit. The default, because the audit cadence
                        is the natural unit of "not right now".

     "until it worsens" no time bound, but wakes the moment the
                        finding gets materially worse. For the genuine
                        "I know about this and I'm accepting it" case —
                        a kiosk that will never carry 2.25L PET.

   Both wake early on escalation. A finding that was a warning and is
   now critical is not the finding that was snoozed, and continuing to
   hide it would be the product lying by omission.

   Pure and secret-free, so it is safe in a route handler and in a
   "use client" component alike.
   ============================================================ */

import type { Insight, Severity } from "./insights";

export const SNOOZES_FIELD = {
  insightId: "Insight ID",
  rule: "Rule",
  headline: "Headline",
  reason: "Reason",
  owner: "Owner",
  snoozedAt: "Snoozed At",
  untilVisit: "Until Visit",
  baselineImpact: "Baseline Impact",
  baselineSeverity: "Baseline Severity",
} as const;

/* Deliberately all text / number / date fields — no single-selects.
   The Airtable token carries data.records read/write but NOT
   schema:write, so a select option that doesn't exist yet cannot be
   created from here; a write of an unknown option just fails. Every
   value below is free-form for that reason. */

export type SnoozeUntil = "next-visit" | "worsens";

export type SnoozeRecord = {
  id: string;
  insightId: string;
  rule: string;
  headline: string;
  reason: string;
  owner: string;
  snoozedAt: string;
  /* The visit this finding sleeps THROUGH. Empty means "until it
     worsens" — no time bound, only the escalation checks. */
  untilVisit: string;
  baselineImpact: number;
  baselineSeverity: Severity;
};

/* How much a finding has to grow before a snooze stops applying.
   25% is chosen to sit clear of the rounding noise in facing-days —
   a gap ageing by a day or two moves impact a few percent, which is
   the finding continuing rather than a new one. */
export const WAKE_GROWTH = 1.25;

const SEVERITY_RANK: Record<Severity, number> = {
  watch: 0,
  warning: 1,
  critical: 2,
};

export type WakeReason = "escalated" | "grown" | "expired";

/* Why this finding is awake despite a snooze — or null if it sleeps.

   Order matters for the message the reader sees: escalation is the
   most alarming reason and is checked first, so a finding that both
   escalated and expired says the more urgent thing. */
export function wakeReason(
  snooze: SnoozeRecord,
  insight: Insight,
  currentVisit: string
): WakeReason | null {
  if (SEVERITY_RANK[insight.severity] > SEVERITY_RANK[snooze.baselineSeverity]) {
    return "escalated";
  }
  if (
    snooze.baselineImpact > 0 &&
    insight.impact.value >= snooze.baselineImpact * WAKE_GROWTH
  ) {
    return "grown";
  }
  /* An empty untilVisit is the "until it worsens" case: no expiry, so
     the two checks above are the only way out. */
  if (snooze.untilVisit && currentVisit > snooze.untilVisit) return "expired";
  return null;
}

export function describeWake(reason: WakeReason): string {
  switch (reason) {
    case "escalated":
      return "back because its severity rose";
    case "grown":
      return `back because its impact grew more than ${Math.round(
        (WAKE_GROWTH - 1) * 100
      )}%`;
    case "expired":
      return "back because a new visit has been audited";
  }
}

/* Splitting a report's findings into what the reader should see and
   what they have parked.

   Returns BOTH halves on purpose. A snoozed finding is never simply
   gone from the product — the surface shows a count and can reveal
   them — because a hidden list nobody can enumerate is exactly the
   silence this design set out to avoid. */
export type SnoozeSplit = {
  visible: Insight[];
  asleep: { insight: Insight; snooze: SnoozeRecord }[];
  /* Snoozes whose finding woke itself back up, so the surface can say
     why something the reader parked has returned. */
  woken: { insight: Insight; snooze: SnoozeRecord; reason: WakeReason }[];
};

export function splitBySnooze(
  findings: Insight[],
  snoozes: SnoozeRecord[],
  currentVisit: string
): SnoozeSplit {
  const byInsight = new Map(snoozes.map((s) => [s.insightId, s]));
  const split: SnoozeSplit = { visible: [], asleep: [], woken: [] };

  for (const insight of findings) {
    const snooze = byInsight.get(insight.id);
    if (!snooze) {
      split.visible.push(insight);
      continue;
    }
    const reason = wakeReason(snooze, insight, currentVisit);
    if (reason) {
      split.visible.push(insight);
      split.woken.push({ insight, snooze, reason });
    } else {
      split.asleep.push({ insight, snooze });
    }
  }
  return split;
}

/* ---------- Airtable mapping ---------- */

type RawRecord = { id: string; createdTime: string; fields?: Record<string, unknown> };

export function hasInsightId(record: RawRecord): boolean {
  const v = record.fields?.[SNOOZES_FIELD.insightId];
  return typeof v === "string" && v.trim().length > 0;
}

export function toSnooze(record: RawRecord): SnoozeRecord {
  const f = record.fields ?? {};
  const severity = f[SNOOZES_FIELD.baselineSeverity];
  return {
    id: record.id,
    insightId: ((f[SNOOZES_FIELD.insightId] as string) ?? "").trim(),
    rule: (f[SNOOZES_FIELD.rule] as string) ?? "",
    headline: (f[SNOOZES_FIELD.headline] as string) ?? "",
    reason: (f[SNOOZES_FIELD.reason] as string) ?? "",
    owner: (f[SNOOZES_FIELD.owner] as string) ?? "",
    snoozedAt: (f[SNOOZES_FIELD.snoozedAt] as string) || record.createdTime,
    untilVisit: (f[SNOOZES_FIELD.untilVisit] as string) ?? "",
    baselineImpact: Number(f[SNOOZES_FIELD.baselineImpact] ?? 0),
    /* Anything unrecognised degrades to the LOWEST severity, so an
       unreadable baseline can only ever wake a finding early. Failing
       toward visibility is the only safe direction for a feature whose
       job is hiding things. */
    baselineSeverity:
      severity === "critical" || severity === "warning" ? severity : "watch",
  };
}
