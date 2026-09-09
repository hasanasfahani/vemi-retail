"use client";

/* PAGE 4 · Insights — an intelligence feed, not a dashboard.

   Three sections, three different jobs:

     A · Top insights — what the engine ranks highest right now, with
         the working behind each one a click away.
     B · Opportunities — the same findings sorted by what they are
         worth in dinars, which is the only unit that ranks across
         facing-days, outlets and price readings.
     C · Market stories — the handful of narrative blocks whose test
         passes this month.

   Nothing on this page is written by hand. Every headline, figure and
   recommendation comes from a rule or a story template that had to
   pass its own condition to appear. */

import { useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/market/PageShell";
import InsightCard from "@/components/market/InsightCard";
import OpportunityCard from "@/components/market/OpportunityCard";
import StoryCard from "@/components/market/StoryCard";
import { Card, StatCard, Tabs, EmptyState } from "@/components/market/ui";
import { CATEGORY_LABEL, generateInsights, type Category } from "@/lib/market/insights";
import { marketStories } from "@/lib/market/stories";
import { formatIqd, impactAssumption } from "@/lib/market/economics";
import type { MarketView } from "@/lib/market/filters";

const FILTERS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "critical", label: CATEGORY_LABEL.critical },
  { id: "opportunity", label: CATEGORY_LABEL.opportunity },
  { id: "execution-gap", label: CATEGORY_LABEL["execution-gap"] },
  { id: "competitor", label: CATEGORY_LABEL.competitor },
];

export default function InsightsView() {
  return <PageShell>{(view) => <Insights view={view} />}</PageShell>;
}

function Insights({ view }: { view: MarketView }) {
  const [category, setCategory] = useState<Category | "all">("all");

  const report = useMemo(() => generateInsights(view), [view]);
  const stories = useMemo(() => marketStories(view), [view]);

  const shown = useMemo(
    () => (category === "all" ? report.all : report.byCategory[category]),
    [report, category]
  );

  /* Opportunities are the findings money can actually be attached to,
     largest first. Everything else stays in section A rather than
     being given a fabricated dinar figure to make the list longer. */
  const opportunities = useMemo(
    () =>
      report.all
        .filter((i) => i.money !== null && i.money > 0)
        .sort((a, b) => (b.money ?? 0) - (a.money ?? 0))
        .slice(0, 8),
    [report]
  );

  const exposed = opportunities.reduce((s, i) => s + (i.money ?? 0), 0);
  const critical = report.byCategory.critical.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Findings"
          value={report.all.length}
          footnote={`Across ${view.posCount.toLocaleString()} audited outlets`}
        />
        <StatCard
          label="Critical"
          value={critical}
          band={critical > 0 ? "critical" : "strong"}
          footnote="Findings the engine ranks as needing immediate attention"
        />
        <StatCard
          label="Exposed"
          value={`${formatIqd(exposed)}`}
          unit=" IQD"
          footnote="Modelled value of the top opportunities, until the next visit"
        />
        <StatCard
          label="Stories"
          value={stories.length}
          footnote={`of 5 narrative tests passing this month`}
        />
      </div>

      {/* ---------- A · top insights ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Top insights
          </h2>
          <span className="mono text-[11.5px] text-ink-400">
            Ranked by severity, then by impact per outlet within a unit
          </span>
        </div>

        <div className="mb-3">
          <Tabs
            tabs={FILTERS.map((f) => ({
              id: f.id,
              label: f.label,
              count: f.id === "all" ? report.all.length : report.byCategory[f.id].length,
            }))}
            active={category}
            onChange={(id) => setCategory(id as Category | "all")}
          />
        </div>

        {shown.length === 0 ? (
          <Card>
            <EmptyState
              title="Nothing in this category"
              lead="No finding in the current scope falls into this category. Widen the filters, or look at another category."
            />
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {shown.slice(0, 9).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}

        {shown.length > 9 && (
          <p className="mt-2.5 text-[12px] text-ink-500">
            Showing the 9 highest-ranked of {shown.length.toLocaleString()}.{" "}
            <Link href="/portal/actions" className="font-semibold text-violet-ink hover:underline">
              Raise a follow-up audit from the Performance tabs
            </Link>
            .
          </p>
        )}
      </section>

      {/* ---------- B · opportunities ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Opportunities, by what they are worth
          </h2>
          <span className="mono text-[11.5px] text-ink-400">
            {formatIqd(exposed)} IQD across {opportunities.length} findings
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {opportunities.map((insight, index) => (
            <OpportunityCard
              key={insight.id}
              insight={insight}
              rank={index + 1}
              max={opportunities[0]?.money ?? 1}
            />
          ))}
        </div>

        {impactAssumption && (
          <p className="mt-3 max-w-[92ch] rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[11.5px] leading-relaxed text-ink-500">
            {impactAssumption}
          </p>
        )}
      </section>

      {/* ---------- C · market stories ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Market stories
          </h2>
          <span className="mono text-[11.5px] text-ink-400">
            Each appears only while its condition holds
          </span>
        </div>

        {stories.length === 0 ? (
          <Card>
            <EmptyState
              title="No story passes its test in this scope"
              lead="Story blocks state a condition and appear only when the data meets it. In this filter, none of the five does."
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
