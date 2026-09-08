"use client";

/* OVERVIEW — the entry point, deliberately thin.

   This page was the Command Center: a verdict, a parked-findings strip,
   four KPIs, two composition bars, a district diverging chart, three
   decision blocks with their own charts, three pricing cards, a photo
   strip and a national map. Every one of those earned its place on the
   day it shipped, and together they made an entry point nobody could
   read in thirty seconds — which was the one job it had.

   What survives is what a reader actually orients on: how am I doing,
   and where. Four figures and one map. The single verdict line stays
   because without it the page can answer "how am I doing" but not
   "what do I do", and that sentence costs one paragraph rather than a
   section.

   The depth did not move behind a disclosure here — it moved to the
   operator pages, which is where someone who wants it is already
   going. Shelf, Out-of-Stock, Price Intelligence and Competitor Watch
   all run the same engine, scoped to whatever the filter says. */

import { useMemo } from "react";
import PageHeader from "@/components/portal/PageHeader";
import StatTile from "@/components/portal/charts/StatTile";
import DistrictHeat from "@/components/portal/DistrictHeat";
import FilterBar, { useFilters, useVisitData } from "@/components/portal/FilterBar";
import { kpiWatchTarget } from "@/lib/watchTargets";
import { scope } from "@/lib/portal";
import { applyFilters } from "@/lib/portalFilters";
import { generateInsights } from "@/lib/insights";
import { buildDecisions } from "@/lib/decisions";
import { formatImpact } from "@/lib/economics";
import ImpactBasis from "@/components/portal/ImpactBasis";
import { computeMetric } from "@/lib/monitorValue";
import {
  clientBrand,
  competitors,
  brandName,
  headline,
  coreTrend,
} from "@/lib/portalData";

export default function OverviewView() {
  const [filters, setFilters] = useFilters();
  const { data: visitData, loading } = useVisitData(filters.visit);
  const view = useMemo(
    () => applyFilters(filters, visitData),
    [filters, visitData]
  );

  /* One sentence, from the same rollup the operator pages' findings
     feed. Not a section — a line. */
  const { verdict, momentum } = useMemo(() => {
    const report = generateInsights(view);
    const { decisions } = buildDecisions(report);
    return { verdict: decisions[0] ?? null, momentum: report.momentum };
  }, [view]);

  const client = view.byBrand.find((b) => b.isClient);
  const rank = view.byBrand.findIndex((b) => b.isClient) + 1;
  const gaps = view.oosRows.length;
  /* Through the same function the Watchlist uses to take its readings,
     so a pinned compliance monitor can never disagree with the tile it
     was pinned from. */
  const compliance = useMemo(
    () =>
      computeMetric(
        { metric: "compliance", segmentType: "panel", segment: "", filters },
        visitData
      ) ?? 0,
    [filters, visitData]
  );

  const atRisk = view.oosRows.reduce((s, r) => s + r.facingDaysAtRisk, 0);

  return (
    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <PageHeader
        title="Overview"
        lead="How the shelf is holding, and where"
        posCount={view.posCount}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        resultLabel={`${view.posCount} of ${view.inScopeCount} outlets audited · ${view.coveragePct}% covered · ${scope.corePanelSize} core outlets carry the movement figures`}
      />

      {/* the one sentence */}
      <section className="mt-4 mb-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        {verdict ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className="dot"
                style={{
                  background:
                    verdict.severity === "critical"
                      ? "var(--color-critical)"
                      : "var(--color-warn)",
                }}
              />
              <span className="t-eyebrow">
                Your first move · {scope.dataAsOf}
              </span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              {verdict.headline}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              <span className="mono font-semibold text-ink-900">
                {formatImpact(verdict.impact.value)}
              </span>
              {" at stake across "}
              {verdict.outlets} outlet{verdict.outlets === 1 ? "" : "s"}.
            </p>
            <ImpactBasis className="mt-2.5" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              <span className="t-eyebrow">This window · {scope.dataAsOf}</span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              Nothing crossed a threshold in this window.
            </p>
            <p className="mt-1 text-sm text-ink-500">
              No district, channel, SKU or outlet is currently outside its
              expected range. We looked — that is the result.
            </p>
          </>
        )}

        {momentum?.conceding && momentum.rivalBrandId && (
          <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[13px] text-ink-700">
            <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="none" stroke="var(--color-critical)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M2.5 3.5 6 8l1.7-2.2L9.5 8" />
            </svg>
            <span>
              {clientBrand.name} lost {Math.abs(momentum.clientDelta)}pt of
              share against the previous window while{" "}
              <strong className="text-ink-900">
                {brandName(momentum.rivalBrandId)}
              </strong>{" "}
              gained {momentum.rivalDelta}pt.{" "}
              {/* The two windows sampled different outlets. A share move
                  of this size can come from the market or from the
                  panel, and the page is not able to tell them apart —
                  so it says which stores each figure rests on rather
                  than presenting the delta as settled. */}
              <span className="text-ink-400">
                Across {scope.previousPosCount} outlets then and{" "}
                {scope.posCount} now — different stores, so read the
                direction rather than the decimal.
              </span>
            </span>
          </p>
        )}
      </section>

      {/* the four figures */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="On-shelf availability"
          value={`${client?.availability ?? 0}%`}
          delta={headline.availabilityDelta}
          moved={headline.availabilityMoved}
          floorPt={coreTrend.availabilityFloorPt}
          goodDirection="up"
          footnote={`Level across ${view.posCount} outlets audited`}
          watch={kpiWatchTarget({
            metric: "availability",
            value: client?.availability ?? 0,
            visit: view.visit,
          })}
        />
        <StatTile
          label="Shelf share"
          value={`${client?.share ?? 0}%`}
          delta={headline.shelfShareDelta}
          moved={headline.shelfShareMoved}
          floorPt={coreTrend.shareFloorPt}
          goodDirection="up"
          footnote={`Rank ${rank} of ${competitors.length} in category`}
          watch={kpiWatchTarget({
            metric: "shelf-share",
            value: client?.share ?? 0,
            visit: view.visit,
          })}
        />
        <StatTile
          label="Price compliance"
          value={`${compliance}%`}
          footnote={`${clientBrand.name} SKUs at RRP ±5%`}
          watch={kpiWatchTarget({
            metric: "compliance",
            value: compliance,
            visit: view.visit,
            suggestedTarget: { value: 100, why: "Every line within RRP ±5%." },
          })}
        />
        <StatTile
          label="Open gaps"
          value={`${gaps}`}
          goodDirection="down"
          footnote={`${atRisk.toLocaleString()} facing-days at risk`}
          watch={kpiWatchTarget({
            metric: "gaps",
            value: gaps,
            visit: view.visit,
            suggestedTarget: { value: 0, why: "No gaps — the shelf as it should be." },
          })}
        />
      </div>

      {/* the one map */}
      <div className="mt-4">
        <DistrictHeat
          view={view}
          selectedAreas={filters.areas}
          onSelectArea={(name) =>
            setFilters({
              ...filters,
              areas: filters.areas.includes(name)
                ? filters.areas.filter((a) => a !== name)
                : [...filters.areas, name],
            })
          }
        />
      </div>

      <p className="mt-4 text-[12px] text-ink-400">
        Every figure here is computed from this window&apos;s audit data by a
        stated formula — no forecasting, no machine learning. Open any
        section under Operate for the detail behind it.
      </p>
    </div>
  );
}
