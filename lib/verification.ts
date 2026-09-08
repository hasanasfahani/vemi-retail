/* ============================================================
   VERIFIED COMPLETION — did the shelf change, or just the checkbox?

   Priorities has always been able to say an action was closed. It has
   never been able to say whether closing it made any difference, and
   those are very different facts: one is a claim by the person who did
   the work, the other is an observation of the shelf.

   Everything here is DERIVED. No new Airtable field, no snapshot
   written at creation time, nothing that can drift out of step with
   the engine. The test is deliberately uniform across all ten rules:

       does the finding this action was created from still fire?

   A per-rule table of "fixed" tests was the obvious design and it is
   the wrong one — it would be a second implementation of every rule,
   maintained separately, free to disagree with the first. Asking the
   engine whether the finding survived reuses the rule itself, so a
   threshold change moves both at once by construction.

   WHAT THIS CANNOT SAY, and must never imply: that the action CAUSED
   the change. One outlet, no counterfactual. The wording throughout is
   "confirmed at re-audit", which is an observation. Attribution needs
   the control group noted at the bottom of this file.

   Nor is `slipped` a judgement of the person. They may have done
   everything right and the distributor did not deliver — which is
   itself worth knowing, and is the reason this state exists rather
   than being folded into "closed".
   ============================================================ */

import { RULE_IDS, type Insight } from "./insights";
import type { ActionRecord } from "./actionsShared";

export type Outcome =
  /* That outlet was not audited in the latest window — we have not
     been back, so there is nothing to report. Not a failure. */
  | "awaiting"
  /* Not audited in either window on hand. Distinct from `awaiting`
     because the wait is now long enough to be its own problem: an
     action closed against a door the rotation is not returning to. */
  | "unverifiable"
  /* Re-audited, and the finding is gone. */
  | "held"
  /* Re-audited, finding still fires but materially smaller. */
  | "partial"
  /* Re-audited, finding still fires at the same size or worse. */
  | "slipped"
  /* Nothing to check this against: either it was created by hand from
     the New Action form, or it came from a rule the engine no longer
     has.

     That second case is not hypothetical — R10 was merged into R1 when
     the rotating panel landed, and an action created from `r10:erb-302`
     would otherwise grade as HELD, because its finding is indeed
     absent from the current window. Absent because the rule was
     deleted, not because the shelf changed. Exactly the kind of false
     credit this whole feature exists to prevent, arriving through the
     back door. */
  | "untracked";

/* How much a finding has to shrink to count as partly fixed. Half is
   chosen because anything less is inside the range a single SKU coming
   back would move an outlet-level finding, and calling that "partly
   fixed" would flatter the queue. */
export const PARTIAL_THRESHOLD = 0.5;

export type Verification = {
  actionId: string;
  outcome: Outcome;
  /* The finding as it stands now, when it still fires. */
  current: Insight | null;
  /* What it was in the window before — the baseline `partial` is
     measured against. */
  previous: Insight | null;
  /* When the outlet was last seen, for the card to state. */
  auditedAt: string | null;
};

export type VerificationInput = {
  actions: ActionRecord[];
  /* Findings from the latest window, keyed by insight id. */
  current: Map<string, Insight>;
  /* Findings from the window before it. */
  previous: Map<string, Insight>;
  /* Outlet -> audit date, latest window. */
  auditedNow: Map<string, string>;
  /* Outlet ids audited in the previous window. */
  auditedBefore: Set<string>;
};

/* Which outlet an action is about, read off the finding id rather than
   a stored field — `r1:erb-502` names its own subject. Aggregate
   findings (`r2:Bakhtiari`, `r7:fixture-imbalance`) have no single
   outlet and fall through to the aggregate path below. */
function outletOf(insightId: string, current: Insight | null, previous: Insight | null): string | null {
  const fromFinding = current?.entities.posId ?? previous?.entities.posId;
  if (fromFinding) return fromFinding;
  const [, tail] = insightId.split(":");
  return tail && /^erb-\d+$/i.test(tail) ? tail.toLowerCase() : null;
}

export function verify(input: VerificationInput): Map<string, Verification> {
  const out = new Map<string, Verification>();

  for (const action of input.actions) {
    if (action.status !== "Done") continue;

    const id = action.insightId;
    /* A finding id whose rule the engine has dropped can never be
       re-checked, so it must not be graded on the finding's absence. */
    const ruleGone =
      action.rule !== undefined &&
      action.rule !== "" &&
      !RULE_IDS.includes(action.rule as never);

    if (!id || ruleGone) {
      out.set(action.id, {
        actionId: action.id,
        outcome: "untracked",
        current: null,
        previous: null,
        auditedAt: null,
      });
      continue;
    }

    const current = input.current.get(id) ?? null;
    const previous = input.previous.get(id) ?? null;
    const posId = outletOf(id, current, previous);

    /* Coverage first. An outlet-level finding cannot be judged at all
       until someone has been back to that door, and reporting one as
       fixed because it simply was not re-audited would be the same
       error as counting an unvisited outlet as having a clean shelf. */
    if (posId) {
      const auditedAt = input.auditedNow.get(posId) ?? null;
      if (!auditedAt) {
        out.set(action.id, {
          actionId: action.id,
          outcome: input.auditedBefore.has(posId) ? "awaiting" : "unverifiable",
          current,
          previous,
          auditedAt: null,
        });
        continue;
      }

      out.set(action.id, {
        actionId: action.id,
        outcome: gradeOutcome(current, previous),
        current,
        previous,
        auditedAt,
      });
      continue;
    }

    /* Aggregate findings — a district, a channel, the whole panel.
       They have no single door to re-audit, so they are graded on the
       same shrink test but will read `slipped` far more often: a
       district's share cannot resolve below the panel's detection
       floor, and a genuine improvement smaller than that is invisible
       here. The page says so rather than implying the work failed. */
    out.set(action.id, {
      actionId: action.id,
      outcome: gradeOutcome(current, previous),
      current,
      previous,
      auditedAt: null,
    });
  }

  return out;
}

function gradeOutcome(current: Insight | null, previous: Insight | null): Outcome {
  if (!current) return "held";
  if (previous && current.impact.value <= previous.impact.value * PARTIAL_THRESHOLD) {
    return "partial";
  }
  return "slipped";
}

/* ---------- the team number ----------

   Of the actions we COULD check, what share held. The denominator
   deliberately excludes `awaiting`, `unverifiable` and `untracked`:
   including them would let the rate fall because the rotation did not
   return to a door, which is a collection fact rather than a delivery
   one.

   Why this resists gaming: closing an action you did not do lowers it.
   You cannot raise the rate by working the queue harder, only by the
   shelf changing.

   The vector it does NOT close is cherry-picking — actioning only easy
   findings raises the rate honestly. That is why `recovered` rides
   alongside it: a high rate on a small number is visible for what it
   is, and neither figure is gameable while the other is in view. */
export type ConfirmationSummary = {
  closed: number;
  held: number;
  partial: number;
  slipped: number;
  awaiting: number;
  unverifiable: number;
  untracked: number;
  /* Actions with a gradeable outcome. */
  checkable: number;
  /* Percent of checkable actions that held, counting `partial` as
     half — a partly fixed shelf is partly fixed. Null when nothing is
     checkable yet, because 0% and "nothing to judge" are different. */
  confirmationRate: number | null;
  /* Facing-days no longer at risk across the findings that held. The
     counterweight to the rate. */
  recovered: number;
};

export function summarise(
  verifications: Iterable<Verification>
): ConfirmationSummary {
  const s: ConfirmationSummary = {
    closed: 0, held: 0, partial: 0, slipped: 0,
    awaiting: 0, unverifiable: 0, untracked: 0,
    checkable: 0, confirmationRate: null, recovered: 0,
  };

  for (const v of verifications) {
    s.closed += 1;
    s[v.outcome] += 1;
    if (v.outcome === "held") {
      s.recovered += v.previous?.impact.value ?? 0;
    }
    if (v.outcome === "partial") {
      s.recovered +=
        (v.previous?.impact.value ?? 0) - (v.current?.impact.value ?? 0);
    }
  }

  s.checkable = s.held + s.partial + s.slipped;
  s.confirmationRate = s.checkable
    ? Math.round(((s.held + s.partial * 0.5) / s.checkable) * 100)
    : null;
  s.recovered = Math.round(s.recovered);
  return s;
}

/* ---------- language ----------

   Observation, never attribution. "Confirmed at re-audit" is a fact
   about the shelf; "your action worked" is a causal claim this data
   cannot support from a single outlet. */
export const OUTCOME_LABEL: Record<Outcome, string> = {
  held: "Confirmed",
  partial: "Partly fixed",
  slipped: "Still open",
  awaiting: "Awaiting re-audit",
  unverifiable: "Not re-audited",
  untracked: "No finding attached",
};

export const OUTCOME_TONE: Record<Outcome, "good" | "warn" | "critical" | "muted"> = {
  held: "good",
  partial: "warn",
  slipped: "critical",
  awaiting: "muted",
  unverifiable: "muted",
  untracked: "muted",
};

export function describeOutcome(v: Verification): string {
  switch (v.outcome) {
    case "held":
      return `Re-audited ${v.auditedAt ?? "this window"} — the finding is gone.`;
    case "partial":
      return `Re-audited ${v.auditedAt ?? "this window"} — down from ${
        v.previous?.impact.label ?? "its previous size"
      } to ${v.current?.impact.label ?? "less"}, but not clear.`;
    case "slipped":
      return `Re-audited ${
        v.auditedAt ?? "this window"
      } — still ${v.current?.impact.label ?? "open"}. Worth checking whether the fix reached the shelf.`;
    case "awaiting":
      return "Closed, but this outlet was not in the latest window. Nothing to confirm against yet.";
    case "unverifiable":
      return "Closed, and the rotation has not returned to this outlet for two windows. Worth scheduling.";
    case "untracked":
      return "Created by hand rather than from a finding, so there is nothing to re-check.";
  }
}

/* ---------- the control group, for later ----------

   Everything above is observation. Attribution needs a comparison:
   outlets carrying the SAME finding where no action was taken. Under a
   rotating panel there are always plenty of them, which makes this a
   natural experiment rather than a study anyone has to design.

   Not computed yet — with a handful of actions the comparison would be
   noise wearing a percentage sign. Left here as the shape it should
   take, and the reason `actioned` is worth recording per finding from
   the start: once N is large enough, "actioned outlets recovered at
   71% against 43% for comparable un-actioned ones" is an effect
   estimate no quarterly competitor can produce. */
export function comparableUnactioned(
  rule: string,
  actionedInsightIds: Set<string>,
  candidates: Insight[]
): Insight[] {
  return candidates.filter(
    (i) => i.rule === rule && !actionedInsightIds.has(i.id)
  );
}
