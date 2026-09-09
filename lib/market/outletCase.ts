/* ============================================================
   ONE OUTLET, TWO VISITS.

   What the drawer shows when an outlet is opened from a follow-up: the
   issues the original audit found, whether each is still there, the
   shelf as both visits recorded it, and the change between them.

   "Resolved" here means ONE THING ONLY: the issue that was raised is
   not present at the re-audit. It does not mean the request caused it.
   A delivery that finally arrived looks identical from a shelf, and
   the drawer says as much rather than implying a chain of cause.
   ============================================================ */

import { skuOf } from "./index";
import { issueKey, issuesFor, type Issue, type IssueKpi } from "./issues";
import { posKpi } from "./followUp";
import type { MonthPair } from "./followUpView";

export type IssueOutcome = "resolved" | "unresolved" | "awaiting";

export type CaseIssue = {
  issue: Issue;
  skuName: string | null;
  outcome: IssueOutcome;
};

export type OutletCase = {
  posId: string;
  kpi: IssueKpi;
  revisited: boolean;
  before: number | null;
  after: number | null;
  delta: number | null;
  issues: CaseIssue[];
  resolved: number;
  unresolved: number;
};

export function outletCase(
  posId: string,
  kpi: IssueKpi,
  origin: MonthPair,
  cycle: MonthPair | null
): OutletCase {
  const original = issuesFor(origin.view, kpi).filter((i) => i.posId === posId);

  const before = posKpi(origin.view, origin.full, posId, kpi);
  const after = cycle ? posKpi(cycle.view, cycle.full, posId, kpi) : null;
  const revisited = after !== null;

  /* The issues still standing at the re-audit, keyed so a September
     record and an October record of the same problem match. */
  const stillThere = new Set(
    cycle && revisited
      ? issuesFor(cycle.view, kpi)
          .filter((i) => i.posId === posId)
          .map(issueKey)
      : []
  );

  const issues: CaseIssue[] = original.map((issue) => ({
    issue,
    skuName: issue.skuId ? skuOf(issue.skuId)?.name ?? issue.skuId : null,
    outcome: !revisited
      ? "awaiting"
      : stillThere.has(issueKey(issue))
        ? "unresolved"
        : "resolved",
  }));

  return {
    posId,
    kpi,
    revisited,
    before,
    after,
    delta:
      before === null || after === null ? null : Math.round((after - before) * 10) / 10,
    issues,
    resolved: issues.filter((i) => i.outcome === "resolved").length,
    unresolved: issues.filter((i) => i.outcome === "unresolved").length,
  };
}
