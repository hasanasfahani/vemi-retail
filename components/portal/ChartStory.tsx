"use client";

/* A chart on an operator page, wearing the same chassis the executive
   surfaces use.

   The difference from DecisionBlock is altitude, not structure.
   Command Center rolls findings up into a decision and leads with the
   move. An operator is already inside one subject — shelf, pricing,
   competitors — so here the chart leads and the engine's findings ride
   underneath it, scoped to whatever the filter bar currently says.

   That scoping is the point. It is the Phase 8 requirement (P8-11)
   that was written down and never built: "operator pages carry a what
   this means strip from the same engine, scoped to active filters".
   Filtering to one district now genuinely changes what the strip says,
   because the engine reruns against the filtered view rather than
   reading a panel-wide figure. */

import type { ReactNode } from "react";
import ChartFrame from "@/components/portal/ChartFrame";
import DecisionAction from "@/components/portal/DecisionAction";
import type { Insight } from "@/lib/insights";
import { draftFromFindings } from "@/lib/actionDrafts";

type Props = {
  title: string;
  subtitle?: string;
  howToRead: string;
  /* Engine findings this chart is the evidence for, already scoped to
     the active filters. Empty means the view is clean. */
  findings: Insight[];
  /* What the chart says when nothing is flagged — still a decision,
     usually "hold what you are doing". */
  clean: string;
  /* The muted line beside it, naming what was checked. */
  allClear: string;
  /* Overrides the top finding's own wording when the chart implies
     something broader than any single finding does. */
  soWhat?: string;
  actionLabel?: string;
  /* The visit in view, stamped onto any monitor created from here. */
  visit?: string;
  table?: { columns: string[]; rows: (string | number)[][] };
  children: ReactNode;
};

export default function ChartStory({
  title,
  subtitle,
  howToRead,
  findings,
  clean,
  allClear,
  soWhat,
  actionLabel = "Create action",
  visit = "",
  table,
  children,
}: Props) {
  const top = findings[0];

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      howToRead={howToRead}
      soWhat={soWhat ?? (top ? top.detail : clean)}
      allClear={allClear}
      table={table}
      action={
        top ? (
          <DecisionAction
            draft={draftFromFindings(findings, title, visit)}
            label={actionLabel}
          />
        ) : undefined
      }
    >
      {children}
    </ChartFrame>
  );
}
