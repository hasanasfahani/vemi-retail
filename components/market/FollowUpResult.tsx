"use client";

/* THE RESULT CELL — the column the whole page exists to fill.

   Not a word but a comparison: how many of the requested outlets have
   been revisited, what the matched cohort read before and after, and
   the change with its own significance already applied. A result
   claimed before the cycle is finished says PRELIMINARY, because a
   partial answer presented as a final one is the failure this page is
   supposed to prevent. */

import { RESULT_LABEL, type Cohort, type RevisitResult } from "@/lib/market/followUp";
import { BAND_COLOR, type Band } from "./ui/health";

const BAND: Record<RevisitResult, Band> = {
  pending: "average",
  improved: "strong",
  "no-change": "average",
  worsened: "critical",
  mixed: "attention",
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
  const color = BAND_COLOR[BAND[result]];
  const revisited = cohort.matched.length;
  const requested = cohort.requested.length;

  return (
    <div className="min-w-0">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-[2px] text-[11px] font-semibold"
        style={{ background: `${color}1a`, color }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
        {RESULT_LABEL[result]}
        {preliminary && <span className="font-normal opacity-80">· preliminary</span>}
      </span>

      <p className="mono mt-1 text-[11px] text-ink-400">
        {revisited.toLocaleString()} / {requested.toLocaleString()} revisited
      </p>

      {cohort.baseline !== null && cohort.followUp !== null && !compact && (
        <p className="mono mt-0.5 text-[11.5px] text-ink-700">
          {cohort.baseline}
          {unit} → {cohort.followUp}
          {unit}
          <span
            className="ml-1.5 font-semibold"
            style={{ color: (cohort.delta ?? 0) >= 0 ? "var(--color-good)" : "var(--color-critical)" }}
          >
            {(cohort.delta ?? 0) > 0 ? "+" : ""}
            {cohort.delta}pt
          </span>
        </p>
      )}

      {cohort.baseline !== null && cohort.matched.length > 0 && !compact && (
        <p className="mono mt-0.5 text-[10.5px] text-ink-400">
          on the same {revisited} outlets · floor {cohort.floor}pt
        </p>
      )}
    </div>
  );
}
