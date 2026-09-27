"use client";

/* THE RESULT CELL — the column the whole page exists to fill.

   Not a word but a comparison: how many of the requested outlets have
   been revisited, what the matched cohort read before and after, and
   the change with its own significance already applied. A result
   claimed before the cycle is finished says PRELIMINARY, because a
   partial answer presented as a final one is the failure this page is
   supposed to prevent. */

import { BandChip, type Tone } from "@/components/vemi/BandChip";
import { RESULT_LABEL, type Cohort, type RevisitResult } from "@/lib/market/followUp";

/* Outcomes in universal terms: improved green, mixed yellow, worsened
   red. "Pending" and "no material change" are not judgements, so they
   stay neutral rather than borrowing a band. */
const BAND: Record<RevisitResult, Tone> = {
  pending: "neutral",
  improved: "strong",
  "no-change": "neutral",
  worsened: "critical",
  mixed: "average",
};

export default function FollowUpResult({
  cohort,
  result,
  preliminary,
  unit = "%",
  compact,
}: {
  cohort: Cohort;
  result: RevisitResult;
  preliminary?: boolean;
  unit?: string;
  compact?: boolean;
}) {
  const revisited = cohort.matched.length;
  const requested = cohort.requested.length;

  return (
    <div className="min-w-0">
      <BandChip band={BAND[result]} label={RESULT_LABEL[result]} size="sm">
        {preliminary && <span className="font-normal opacity-80">· preliminary</span>}
      </BandChip>

      <p className="mono mt-1 text-xs text-text-muted">
        {revisited.toLocaleString()} / {requested.toLocaleString()} revisited
      </p>

      {cohort.baseline !== null && cohort.followUp !== null && !compact && (
        <p className="mono mt-0.5 text-xs text-text">
          {cohort.baseline}
          {unit} → {cohort.followUp}
          {unit}
          <span
            className="ml-1.5 font-semibold"
            style={{ color: "var(--vm-text)" }}
          >
            {(cohort.delta ?? 0) > 0 ? "+" : ""}
            {cohort.delta}pt
          </span>
        </p>
      )}

      {cohort.baseline !== null && cohort.matched.length > 0 && !compact && (
        <p className="mono mt-0.5 text-xs text-text-muted">
          on the same {revisited} outlets · floor {cohort.floor}pt
        </p>
      )}
    </div>
  );
}
