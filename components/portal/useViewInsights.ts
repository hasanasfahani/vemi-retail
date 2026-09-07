"use client";

/* The insight engine, run against whatever the filter bar currently
   says, for the operator pages.

   Command Center calls generateInsights once on the server for the
   unfiltered panel. Operator pages are client components whose view
   changes as the reader filters, so they call it here instead — same
   pure function, same rules, a smaller slice. Nothing about a finding
   changes between the two surfaces except its scope.

   Memoised on the view object, which applyFilters already returns
   fresh only when the filters or the visit actually change. */

import { useMemo } from "react";
import { generateInsights, type Insight, type RuleId } from "@/lib/insights";
import type { FilteredView } from "@/lib/portalFilters";

export function useViewInsights(view: FilteredView) {
  return useMemo(() => {
    const report = generateInsights(view);
    const all = [...report.presence, ...report.pricing];

    /* Findings for a chart, in the engine's own ranked order. A chart
       asks for the rules it is the evidence for; anything else stays
       off it, so a shelf chart never argues a pricing point. */
    const forRules = (...rules: RuleId[]): Insight[] =>
      all.filter((i) => rules.includes(i.rule));

    return { ...report, all, forRules };
  }, [view]);
}
