"use client";

/* PAGE 4 · Insights — quantitative findings, ranked.

   One list, chipped by the decision each finding supports rather than
   by the rule that found it. Every card is an object the engine
   produced: the headline, the figure, the scope and the rank all come
   from a rule that had to clear its own calibrated threshold to appear
   at all. Nothing on this page is written by hand.

   Findings that only restate a wider one are not here — they are the
   breakdown behind it. The count on each card says how many. */

import { useMemo, useState } from "react";
import PageShell from "@/components/market/PageShell";
import InsightCard from "@/components/market/InsightCard";
import { useDecisions } from "@/components/market/useDecisions";
import { Card, StatCard, Tabs, EmptyState } from "@/components/market/ui";
import { OUTCOMES, OUTCOME_LABEL, type Outcome } from "@/lib/market/insightModel";
import type { MarketView } from "@/lib/market/filters";

export default function InsightsView() {
  return <PageShell>{(view) => <Insights view={view} />}</PageShell>;
}

function Insights({ view }: { view: MarketView }) {
  const [outcome, setOutcome] = useState<Outcome | "all">("all");
  const report = useDecisions(view);

  const shown = outcome === "all" ? report.cards : report.byOutcome[outcome];

  const high = report.cards.filter((i) => i.priorityBand === "high").length;
  const competitive = report.cards.filter((i) => i.benchmark === "rival").length;
  const behind = report.all.length - report.cards.length;

  /* Only the chips that have something under them. Seven tabs, four of
     them empty, teaches a reader that the filters do not work. */
  const tabs = useMemo(
    () => [
      { id: "all" as const, label: "Everything", count: report.cards.length },
      ...OUTCOMES.filter((o) => report.byOutcome[o].length > 0).map((o) => ({
        id: o,
        label: OUTCOME_LABEL[o],
        count: report.byOutcome[o].length,
      })),
    ],
    [report]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Findings"
          value={report.cards.length}
          footnote={`Across ${view.posCount.toLocaleString()} audited outlets`}
        />
        <StatCard
          label="High priority"
          value={high}
          band={high > 0 ? "critical" : "strong"}
          footnote="Ranked on size, commercial reach and evidence"
        />
        <StatCard
          label="Competitive"
          value={competitive}
          footnote="Findings measured against a rival rather than a target"
        />
        <StatCard
          label="Outlets behind them"
          value={behind}
          footnote="Single-outlet findings folded into the market finding they belong to"
        />
      </div>

      <section>
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            What the audit found
          </h2>
          <span className="mono text-[11.5px] text-ink-400">
            Ranked by size, commercial reach and strength of evidence
          </span>
        </div>

        <div className="mb-3">
          <Tabs tabs={tabs} active={outcome} onChange={(id) => setOutcome(id as Outcome | "all")} />
        </div>

        {shown.length === 0 ? (
          <Card>
            <EmptyState
              title="Nothing in this scope clears its detection threshold"
              lead="Every rule states a condition and a size it has to reach before it will speak. In the current filter, none of them does. Widen the filters, or look at another decision."
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                childCount={report.children.get(insight.id)?.length ?? 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
