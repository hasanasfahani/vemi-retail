/* ============================================================
   VERIFY IMPACT.

   The one outcome category that is not detected from the current
   panel. A follow-up result is a fact about a REQUEST — which outlets
   somebody asked us to look at again, what they measured before, and
   what the same outlets measured after — so it cannot be a function of
   this month's view alone, and it does not live in insights.ts.

   IT ALSO DOES NOT RE-DERIVE ANYTHING. Every number below is read off
   the row the Action Center already built with `compareCohort`, which
   carries the matched-outlet rule (a door counts only with a reading at
   BOTH ends) and the cohort's own bootstrapped floor. A second
   implementation of before-and-after would eventually disagree with the
   first, and the two surfaces would be quietly telling a reader
   different things about the same request.

   So the card summarises, and Open Analysis goes to the request.
   ============================================================ */

import { KPI_LABEL, type IssueKpi } from "./issues";
import { RESULT_LABEL, cycleLabel, type FollowUpRequest } from "./followUp";
import type { FollowUpRow } from "./followUpView";
import type { MarketView } from "./filters";
import {
  bandOf,
  priorityOf,
  qualityOf,
  scopeWeight,
  type DecisionInsight,
} from "./insightModel";
import { plural, type Insight } from "./insights";

const r1 = (n: number) => Math.round(n * 10) / 10;
const signed = (n: number) => `${n > 0 ? "+" : ""}${r1(n)}`;

/* The unit each KPI is measured in, so a headline never says "12pt"
   about something counted in listings. */
const UNIT: Record<IssueKpi, string> = {
  availability: "pt",
  shelfShare: "pt",
  assortment: "pt",
  price: "pt",
  posm: "pt",
};

/* A result is only worth a card once it is a result. Pending requests
   belong in the Action Center, where the reader can see what is still
   in the field; repeating them here as findings would put the same
   "waiting" on two pages. */
const REPORTABLE = new Set(["improved", "worsened", "mixed"]);

export function verifyImpact(rows: FollowUpRow[], view: MarketView): DecisionInsight[] {
  const out: DecisionInsight[] = [];

  for (const row of rows) {
    if (row.status === "cancelled") continue;
    if (!REPORTABLE.has(row.result)) continue;

    const { cohort, request, kpi } = row;
    const delta = cohort.delta;
    if (delta === null || cohort.baseline === null || cohort.followUp === null) continue;

    const improved = delta > 0;
    const unit = UNIT[kpi];
    const label = KPI_LABEL[kpi];
    const matched = cohort.matched.length;

    /* PRELIMINARY IS PART OF THE FINDING, not a footnote on it. A
       result claimed before the cycle's fieldwork is finished can still
       move, and a reader deciding what to do next needs that in the
       sentence rather than under it. */
    const preliminary = !row.cycleComplete;

    const base: Insight = {
      id: `v1-${request.id}`,
      rule: "v1-follow-up-result",
      category: improved ? "opportunity" : "critical",
      severity: row.result === "mixed" ? "watch" : improved ? "watch" : "critical",
      headline:
        row.result === "mixed"
          ? `${label} moved both ways across the ${cycleLabel(request.cycle)} follow-up`
          : `${label} ${improved ? "improved" : "fell"} ${signed(delta)}${unit} across ${plural(matched, "revisited outlet")}`,
      detail:
        `${matched} of the ${cohort.requested.length} outlets in the ${cycleLabel(request.originMonth)} ${label.toLowerCase()} request were reached again in ${cycleLabel(request.cycle)} and had a comparable reading at both ends. Across those same doors ${label.toLowerCase()} moved from ${r1(cohort.baseline)}% to ${r1(cohort.followUp)}%, against a ${r1(cohort.floor)}${unit} floor for a cohort this size.` +
        (preliminary ? ` The cycle is still in the field, so this result can still move.` : ""),
      impact: { value: Math.abs(r1(delta)), unit: "outlets", label: `${signed(delta)}${unit} like-for-like` },
      confidence: "measured",
      scope: { outlets: matched, label: plural(matched, "revisited outlet") },
      /* Into the Action Center, at the request — not to a second copy
         of the before-and-after. */
      cta: { href: `/portal/actions?request=${request.id}`, label: "Open the request" },
      affected: cohort.matched,
      money: null,
      evidence: {
        formula: `${label.toLowerCase()} at the SAME outlets in ${cycleLabel(request.originMonth)} and ${cycleLabel(request.cycle)}, counting only doors with a reading at both ends; reported against the cohort's own bootstrapped floor of ${r1(cohort.floor)}${unit}`,
        table: {
          columns: ["Scope", label],
          rows: [
            [`${cycleLabel(request.originMonth)} baseline`, `${r1(cohort.baseline)}%`],
            [`${cycleLabel(request.cycle)} follow-up`, `${r1(cohort.followUp)}%`],
            ["Change", `${signed(delta)}${unit}`],
            ["Detection floor", `${r1(cohort.floor)}${unit}`],
            ["Outlets matched", `${matched} of ${cohort.requested.length}`],
          ],
        },
      },
      entities: { brandId: request.brandId },
    };

    const reach = scopeWeight(base, view);
    /* A preliminary result is exactly as measured as a final one — the
       same doors, the same readings — but it rests on a cycle that is
       not finished, and quality is where the portal says so. */
    const quality = preliminary ? "medium" : qualityOf(base, view);
    const priority = priorityOf(base, reach, quality);

    out.push({
      ...base,
      outcome: "verify-impact",
      /* Already the answer to a follow-up; there is nothing to raise. */
      kpi: null,
      benchmark: "prior-period",
      /* Set per finding, not per rule: this is the one detector that
         can report either. */
      direction: improved && row.result !== "mixed" ? "win" : "risk",
      comparisonBasis: "like-for-like",
      axis: "market",
      phenomenon: `v1-follow-up-result:${request.id}`,
      reach: Math.round(reach * 1000) / 1000,
      quality,
      priority,
      priorityBand: bandOf(priority),
    });
  }

  return out;
}

/* What the Action Center already knows, said once for a card that has
   to explain where its number came from. */
export const resultLabel = (row: FollowUpRow) => RESULT_LABEL[row.result];
export type { FollowUpRequest };
