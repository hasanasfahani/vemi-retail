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
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/market/PageShell";
import InsightCard from "@/components/market/InsightCard";
import InsightDrawer from "@/components/market/InsightDrawer";
import PosDrawer from "@/components/market/PosDrawer";
import { useDecisions } from "@/components/market/useDecisions";
import { Card, StatCard, Tabs, EmptyState } from "@/components/market/ui";
import { OUTCOMES, OUTCOME_LABEL, type DecisionInsight, type Outcome } from "@/lib/market/insightModel";
import type { MarketView } from "@/lib/market/filters";

export default function InsightsView() {
  return <PageShell>{(view) => <Insights view={view} />}</PageShell>;
}

function Insights({ view }: { view: MarketView }) {
  const [outcome, setOutcome] = useState<Outcome | "all">("all");
  /* Two drawers, deliberately stacked rather than exclusive: opening an
     outlet from inside a finding should not throw the finding away. */
  const [override, setOverride] = useState<string | null | undefined>(undefined);
  const [openPos, setOpenPos] = useState<string | null>(null);
  const report = useDecisions(view);

  /* A finding is addressable. `?insight=<id>` opens its drawer, so a
     link to one lands on the finding rather than on the page it was
     found on — and the same id opens the same drawer from the
     dashboard, the Competition page or somebody else's message.

     Held as an ID rather than as the object: the report is recomputed
     whenever the filters move, and a stored object would go on
     displaying figures the current filter has already changed.

     Read straight from the URL rather than copied into state by an
     effect, so a link arrives with the drawer already open in the
     first render the server sends. `override` is what this session has
     since clicked; undefined means it has clicked nothing and the URL
     still speaks. */
  const params = useSearchParams();
  const openId = override === undefined ? params.get("insight") : override;
  const open = openId ? report.all.find((i) => i.id === openId) ?? null : null;

  const show = (insight: DecisionInsight | null) => {
    setOverride(insight?.id ?? null);
    const next = new URLSearchParams(window.location.search);
    if (insight) next.set("insight", insight.id);
    else next.delete("insight");
    const query = next.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

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
          /* No band on an empty scope. A green "Strong" beside a zero
             reads as good news, and a filter that reached no audited
             outlet has not delivered good news — it has delivered
             nothing to judge. */
          band={report.cards.length === 0 ? undefined : high > 0 ? "critical" : "strong"}
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
                onOpen={show}
                childCount={report.children.get(insight.id)?.length ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      <InsightDrawer
        insight={open}
        view={view}
        childrenFindings={open ? report.children.get(open.id) ?? [] : []}
        onClose={() => show(null)}
        onOpenPos={setOpenPos}
      />
      <PosDrawer posId={openPos} view={view} onClose={() => setOpenPos(null)} />
    </div>
  );
}
