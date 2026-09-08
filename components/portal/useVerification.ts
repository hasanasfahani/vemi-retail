"use client";

/* Assembling the verification input.

   `verify` is pure and takes two windows' findings plus a coverage
   set. Getting the second window is the only asynchronous part: the
   latest ships with the page, the one before it is fetched on demand.
   Until it arrives every closed action reads `awaiting`, which is the
   correct thing to say while we genuinely do not know. */

import { useEffect, useMemo, useState } from "react";
import { generateInsights, type Insight } from "@/lib/insights";
import { applyFilters, EMPTY_FILTERS } from "@/lib/portalFilters";
import { latest, loadVisit, meta, type VisitData } from "@/lib/portalData";
import { summarise, verify } from "@/lib/verification";
import type { ActionRecord } from "@/lib/actionsShared";

const index = (findings: Insight[]) =>
  new Map(findings.map((f) => [f.id, f]));

export function useVerification(actions: ActionRecord[] | null) {
  const [previousData, setPreviousData] = useState<VisitData | null>(null);

  useEffect(() => {
    let live = true;
    loadVisit(meta.previousWindow).then((d) => {
      if (live) setPreviousData(d);
    });
    return () => {
      live = false;
    };
  }, []);

  return useMemo(() => {
    const now = generateInsights(applyFilters(EMPTY_FILTERS, latest));
    const before = previousData
      ? generateInsights(applyFilters(EMPTY_FILTERS, previousData))
      : null;

    const verifications = verify({
      actions: actions ?? [],
      current: index([...now.presence, ...now.pricing]),
      previous: before ? index([...before.presence, ...before.pricing]) : new Map(),
      auditedNow: new Map(latest.audited.map((a) => [a.posId, a.auditedAt])),
      auditedBefore: new Set(previousData?.audited.map((a) => a.posId) ?? []),
    });

    return {
      verifications,
      summary: summarise(verifications.values()),
      /* The previous window is what `partial` is measured against, so
         a card should not claim a size comparison before it lands. */
      ready: previousData !== null,
    };
  }, [actions, previousData]);
}
