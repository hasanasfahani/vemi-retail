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
import { ConfidenceBadge } from "@/components/vemi/ConfidenceBadge";
import { Button, buttonClass } from "@/components/vemi/Button";
import Icon from "@/components/vemi/Icon";

/* Priority is how loud, outcome is what kind of conversation. Both are
   said in one mono tag (the drawer's header chip carries priority as a
   band). In the client portal priority is urgency, so high and medium
   carry the status colour and glyph (red octagon, orange triangle);
   low is not a warning and stays muted. */
const PRIORITY_WORD: Record<DecisionInsight["priorityBand"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};
const PRIORITY_TONE: Record<DecisionInsight["priorityBand"], string> = {
  high: "text-status-critical-text",
  medium: "text-status-attention-text",
  low: "text-text-muted",
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
    <article className="flex min-w-0 flex-col rounded-lg border border-line bg-surface p-6">
      {/* The outcome is a neutral mono tag (colour is not a category);
          priority is said in words with its urgency glyph. */}
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-xs font-medium uppercase tracking-[0.1em] text-text-muted">
          <span className={PRIORITY_TONE[insight.priorityBand]}>
            {insight.priorityBand !== "low" && (
              <Icon
                name={insight.priorityBand === "high" ? "alert-octagon" : "alert-triangle"}
                className="-mt-0.5 mr-1 inline h-3.5 w-3.5 align-middle"
              />
            )}
            {PRIORITY_WORD[insight.priorityBand]}
          </span>{" "}
          · {OUTCOME_LABEL[insight.outcome]}
        </span>
        {/* The count, not the rule's own scope wording, so every card
            prints the same field in the same corner. */}
        <span className="shrink-0 font-mono text-xs text-text-muted">
          {insight.scope.outlets.toLocaleString()} {insight.scope.outlets === 1 ? "outlet" : "outlets"}
        </span>
      </div>

      {/* Two lines held open whatever the headline needs, so the
          figures line up across a row instead of stepping. */}
      <h3 className="mt-3 min-h-[56px] text-lg font-semibold leading-7 text-text">{insight.headline}</h3>

      {/* The measured quantity, given the weight on the card that it
          has in the finding. */}
      <p className="tnum mt-3 text-[28px] leading-9">{insight.impact.label}</p>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-text-muted">
        <ConfidenceBadge level={insight.confidence === "measured" ? "measured" : "estimated"} size="sm" />
        {basis && <span className="font-medium text-text">{basis}</span>}
        {insight.quality === "limited" && <ConfidenceBadge level="stale" size="sm">Limited sample</ConfidenceBadge>}
        {childCount > 0 && (
          <span>
            {childCount} {childCount === 1 ? "outlet" : "outlets"} behind it
          </span>
        )}
      </div>

      <div className="mt-auto pt-5">
        {onOpen ? (
          <Button variant="secondary" size="sm" onClick={() => onOpen(insight)}>
            Open analysis
          </Button>
        ) : (
          <a href={insight.cta.href} className={buttonClass("secondary", { size: "sm" })}>
            {insight.cta.label}
          </a>
        )}
      </div>
    </article>
  );
}
