"use client";

/* One place the decision layer is assembled, so three pages cannot end
   up holding three slightly different reports.

   Follow-up results are folded in here rather than in `decide` itself,
   because they come from the browser's own request store — which the
   server has never seen. Everything else is a pure function of the
   filtered view. */

import { useMemo } from "react";
import type { MarketView } from "@/lib/market/filters";
import { generateInsights } from "@/lib/market/insights";
import { decide, type DecisionReport } from "@/lib/market/insightModel";
import { verifyImpact } from "@/lib/market/verifyImpact";
import type { FollowUpRow } from "@/lib/market/followUpView";

export function useDecisions(view: MarketView, rows: FollowUpRow[] = []): DecisionReport {
  return useMemo(
    () => decide(generateInsights(view).all, view, verifyImpact(rows, view)),
    [view, rows]
  );
}
