"use client";

/* ONE FINDING, AS A DECISION.

   Four things, in the order a reader uses them: which conversation this
   starts, what was found, how big it is, and over how much of the
   market. Then a way in.

   No paragraph. Somebody scanning a page of these is choosing which one
   to open, not reading. The rule's own sentence, its evidence table and
   its formula are all one click away in the drawer, and every one of
   them was computed — nothing on this card is written here.

   The hero figure is whatever the rule actually measured, in the unit
   the rule measured it in. Facing-days and share points are not
   convertible, so the card states the unit rather than normalising
   findings into a single invented score. */

import type { DecisionInsight } from "@/lib/market/insightModel";
import { OUTCOME_LABEL } from "@/lib/market/insightModel";
import Badge from "./ui/Badge";
import type { Band } from "./ui/health";

/* Priority is how loud, outcome is what kind of conversation. The pill
   carries the outcome and takes its colour from priority, so both facts
   land in one badge rather than two competing for the same corner. */
const PRIORITY_BAND: Record<DecisionInsight["priorityBand"], Band> = {
  high: "critical",
  medium: "attention",
  low: "average",
};

/* Stated on any finding that claims a change, and only on those. A
   point-in-time finding makes no claim about time and saying
   "market sample" about it would imply one. */
const BASIS_LABEL: Record<DecisionInsight["comparisonBasis"], string | null> = {
  "point-in-time": null,
  "market-sample": "Market sample",
  "like-for-like": "Like-for-like",
};

export default function InsightCard({
  insight,
  onOpen,
  childCount = 0,
}: {
  insight: DecisionInsight;
  /* Opens the detail drawer. Without it the card falls back to the
     rule's own destination, so the card works on a page that has no
     drawer yet. */
  onOpen?: (insight: DecisionInsight) => void;
  /* How many narrower findings this one absorbed — the reader's cue
     that there is a breakdown behind it. */
  childCount?: number;
}) {
  const basis = BASIS_LABEL[insight.comparisonBasis];

  return (
    <article className="flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <Badge
          band={PRIORITY_BAND[insight.priorityBand]}
          label={OUTCOME_LABEL[insight.outcome]}
          size="sm"
        />
        {/* The count, not the rule's own scope wording. Some rules
            phrase their scope as "outlets with a client stockout" and
            others as "48 audited outlets", and a card that prints both
            styles in the same corner reads as two different fields. The
            wording belongs in the drawer, where it has room. */}
        <span className="mono shrink-0 text-[11px] text-ink-400">
          {insight.scope.outlets.toLocaleString()}{" "}
          {insight.scope.outlets === 1 ? "outlet" : "outlets"}
        </span>
      </div>

      {/* Two lines held open whatever the headline needs, so the
          figures line up across a row instead of stepping. */}
      <h3 className="mt-2 min-h-[2.7em] font-display text-[14px] font-bold leading-snug tracking-tight text-ink-900">
        {insight.headline}
      </h3>

      {/* The measured quantity, given the weight on the card that it
          has in the finding. */}
      <p className="mono mt-2.5 text-[19px] font-semibold leading-none tracking-tight text-ink-900">
        {insight.impact.label}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-400">
        <span>
          {insight.confidence === "measured"
            ? "Counted from field rows"
            : "Projected from a measured gap"}
        </span>
        {basis && (
          <>
            <span aria-hidden>·</span>
            <span className="font-semibold text-ink-500">{basis}</span>
          </>
        )}
        {insight.quality === "limited" && (
          <>
            <span aria-hidden>·</span>
            <span className="font-semibold text-amber-700">Limited sample</span>
          </>
        )}
        {childCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>
              {childCount} {childCount === 1 ? "outlet" : "outlets"} behind it
            </span>
          </>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 pt-0.5 [margin-top:auto]">
        {onOpen ? (
          <button
            type="button"
            onClick={() => onOpen(insight)}
            className="rounded-[9px] bg-violet px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-ink"
          >
            Open analysis
          </button>
        ) : (
          <a
            href={insight.cta.href}
            className="rounded-[9px] bg-violet px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-ink"
          >
            {insight.cta.label}
          </a>
        )}
      </div>
    </article>
  );
}
