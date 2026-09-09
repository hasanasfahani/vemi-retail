/* ============================================================
   THE FOLLOW-UP HIERARCHY.

   Request → Governorate → POS, with every number at every level
   recomputed from the rows the current filter selects. Nothing is
   cached on the request, and that is deliberate: §18 requires a SKU
   filter to move the baseline, the follow-up and the change at all
   three levels, and a request carrying a stored count cannot do it.

   The cost is that this recomputes on every filter change. The
   alternative is a page where the rows say one thing and the totals
   above them say another, which is worse than slow.
   ============================================================ */

import { governorateOf, posOf } from "./index";
import type { MarketView } from "./filters";
import { issuesFor, scopeOf, type IssueKpi, type Scope } from "./issues";
import {
  compareCohort, posKpi, resultAcross, statusOf,
  type Cohort, type FollowUpRequest, type RequestStatus, type RevisitResult,
} from "./followUp";

export type MonthPair = { view: MarketView; full: MarketView };

export type FollowUpPos = {
  posId: string;
  name: string;
  code: string;
  district: string;
  retailer: string;
  channel: string;
  governorateId: string;
  issues: number;
  before: number | null;
  after: number | null;
  delta: number | null;
  revisited: boolean;
};

export type FollowUpGovernorate = {
  governorateId: string;
  name: string;
  capital: string;
  scope: Scope;
  cohort: Cohort;
  pos: FollowUpPos[];
};

export type FollowUpRow = {
  request: FollowUpRequest;
  kpi: IssueKpi;
  scope: Scope;
  cohort: Cohort;
  status: RequestStatus;
  /* The result taken across governorates, so a request whose parts
     disagree reads Mixed rather than an average describing neither. */
  result: RevisitResult;
  governorates: FollowUpGovernorate[];
  /* Has the follow-up cycle's fieldwork started, and has it finished?
     Both are properties of the CYCLE, not of the request. */
  cycleAudited: boolean;
  cycleComplete: boolean;
};

export function buildRows(
  requests: FollowUpRequest[],
  months: Map<string, MonthPair>,
  completeCycles: Set<string>
): FollowUpRow[] {
  const rows: FollowUpRow[] = [];

  for (const request of requests) {
    const origin = months.get(request.originMonth);
    if (!origin) continue;
    const cycle = months.get(request.cycle) ?? null;

    /* Outlet-level filters — governorate, channel, retailer — narrow
       the request itself: an outlet the filter excludes is not part of
       the question being asked. */
    const inScope = new Set(origin.view.outlets.map((p) => p.id));
    const posIds = request.posIds.filter((id) => inScope.has(id));

    /* The issues this request was raised against, recomputed under the
       active filter rather than read off the request. */
    const selected = new Set(posIds);
    const issues = issuesFor(origin.view, request.kpi).filter((i) => selected.has(i.posId));
    const scope = scopeOf(issues);

    const cohort = compareCohort(posIds, request.kpi, origin, cycle);
    const matched = new Set(cohort.matched);

    /* --- governorate level --- */
    const byGov = new Map<string, string[]>();
    for (const posId of posIds) {
      const gov = posOf(posId)?.governorateId;
      if (gov) byGov.set(gov, [...(byGov.get(gov) ?? []), posId]);
    }

    const governorates: FollowUpGovernorate[] = [...byGov.entries()]
      .map(([governorateId, ids]) => {
        const govIssues = issues.filter((i) => i.governorateId === governorateId);
        const gov = governorateOf(governorateId);
        return {
          governorateId,
          name: gov?.name ?? governorateId,
          capital: gov?.capital ?? "",
          scope: scopeOf(govIssues),
          cohort: compareCohort(ids, request.kpi, origin, cycle),
          pos: ids
            .map((posId): FollowUpPos | null => {
              const outlet = posOf(posId);
              if (!outlet) return null;
              const before = posKpi(origin.view, origin.full, posId, request.kpi);
              const after = cycle
                ? posKpi(cycle.view, cycle.full, posId, request.kpi)
                : null;
              return {
                posId,
                name: outlet.name,
                code: outlet.code,
                district: outlet.district,
                retailer: outlet.retailer,
                channel: outlet.channel,
                governorateId,
                issues: govIssues.filter((i) => i.posId === posId).length,
                before,
                after,
                delta:
                  before === null || after === null
                    ? null
                    : Math.round((after - before) * 10) / 10,
                revisited: matched.has(posId),
              };
            })
            .filter((row): row is FollowUpPos => row !== null)
            .sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999)),
        };
      })
      .sort((a, b) => b.scope.affectedPos - a.scope.affectedPos);

    const cycleAudited = Boolean(cycle);
    const cycleComplete = completeCycles.has(request.cycle);

    rows.push({
      request,
      kpi: request.kpi,
      scope,
      cohort,
      status: statusOf(request, cohort.matched.length, cycleAudited, cycleComplete),
      result: resultAcross(governorates.map((g) => g.cohort)),
      governorates,
      cycleAudited,
      cycleComplete,
    });
  }

  return rows;
}

/* ---------- page summary ----------

   Counted from the rows on screen, so it agrees with the table
   underneath it under every filter. */
export function summarise(rows: FollowUpRow[]) {
  const live = rows.filter((r) => r.status !== "cancelled");
  return {
    active: live.filter((r) => r.status !== "completed").length,
    posRequested: live.reduce((s, r) => s + r.cohort.requested.length, 0),
    posScheduled: live
      .filter((r) => r.cycleAudited)
      .reduce((s, r) => s + r.cohort.requested.length, 0),
    posRevisited: live.reduce((s, r) => s + r.cohort.matched.length, 0),
    completed: rows.filter((r) => r.status === "completed").length,
  };
}

/* A result claimed before the cycle is finished is PRELIMINARY, and
   saying so is the difference between reporting and guessing. */
export const isPreliminary = (row: FollowUpRow) =>
  row.result !== "pending" && !row.cycleComplete;
