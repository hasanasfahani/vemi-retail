import Link from "next/link";
import PageHeader from "@/components/portal/PageHeader";
import CoverageMap from "@/components/portal/CoverageMap";
import ShelfPhotos from "@/components/portal/ShelfPhotos";
import StatTile from "@/components/portal/charts/StatTile";
import InsightCard from "@/components/portal/InsightCard";
import DecisionBlock from "@/components/portal/DecisionBlock";
import ChartFrame from "@/components/portal/ChartFrame";
import DecisionAction from "@/components/portal/DecisionAction";
import DivergingBar from "@/components/portal/charts/DivergingBar";
import CompositionBar from "@/components/portal/charts/CompositionBar";
import { districtWatchTarget, kpiWatchTarget } from "@/lib/watchTargets";
import { scope } from "@/lib/portal";
import { EMPTY_FILTERS, applyFilters } from "@/lib/portalFilters";
import { generateInsights } from "@/lib/insights";
import { buildDecisions } from "@/lib/decisions";
import { chartFor, districtShares } from "@/lib/decisionCharts";
import { routeDraft } from "@/lib/actionDrafts";
import { formatImpact } from "@/lib/economics";
import {
  headline,
  clientBrand,
  competitors,
  brandName,
  latest,
} from "@/lib/portalData";

export const metadata = {
  title: "Command Center",
};

/* The Decision Layer's surface, rebuilt in Phase 13 around decisions
   rather than findings.

   The page used to rank findings against each other, and its top five
   came back as five separate stockouts — five boxes describing one
   move. Now the engine's output is rolled up by the move it implies,
   each decision leads with the chart that proves it, and the findings
   sit underneath the decision they belong to.

   The test this page is built against: an executive who reads only
   this page can name the three decisions they need to make this week. */
export default function CommandCenterPage() {
  const view = applyFilters(EMPTY_FILTERS, latest);
  const report = generateInsights(view);
  const { decisions, reprice } = buildDecisions(report);
  const { momentum, pricing } = report;

  const top = decisions.slice(0, 3);
  const rank = competitors.findIndex((c) => c.isClient) + 1;

  /* The structural finding and the district rows that prove it. */
  const concentration = report.presence.find(
    (i) => i.rule === "r12-geographic-concentration"
  );
  /* The chart shows every flagged district, but the sentence above it
     names only the ones that cluster — so each row says which it is,
     rather than leaving the reader to reconcile six bars against four
     names. */
  const clustered = new Set(
    concentration?.evidence.table.rows.map((r) => String(r[0])) ?? []
  );
  /* EVERY district, not only the flagged ones. A diverging chart whose
     rows are all on one side is just a bar chart with wasted space —
     and showing only what crossed a threshold would repeat exactly the
     failure this phase exists to fix, where a list shows its top few
     and the shape of the market stays invisible. The districts running
     ahead are what make "the weak ones are all in one place" legible. */
  const flaggedSeverity = new Map(
    report.presence
      .filter((i) => i.rule === "r2-district-deficit")
      .map((f) => [f.entities.area ?? "", f.severity])
  );
  const districtRows = districtShares(view).map((d) => ({
    id: d.area,
    label: d.area,
    delta: d.delta,
    severity:
      flaggedSeverity.get(d.area) === "critical"
        ? ("critical" as const)
        : flaggedSeverity.has(d.area)
          ? ("warning" as const)
          : null,
    meta: clustered.has(d.area)
      ? `${d.outlets} outlets · in the cluster`
      : `${d.outlets} outlets`,
  }));

  /* Watch pins as plain data, keyed by row id — this page is a Server
     Component, so a render callback could not cross to the chart. */
  const districtWatchTargets = Object.fromEntries(
    districtRows.map((d) => [
      d.id,
      districtWatchTarget({
        area: d.label,
        value: Math.round((headline.shelfShare + d.delta) * 10) / 10,
        cityAverage: headline.shelfShare,
        visit: view.visit,
      }),
    ])
  );

  return (
    <>
      <PageHeader title="Command Center" lead="The decisions this cycle" />

      {/* verdict — the 5-second read, now naming the move rather than
          the worst individual store */}
      <section className="mb-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        {top.length ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className="dot"
                style={{
                  background:
                    top[0].severity === "critical"
                      ? "var(--color-critical)"
                      : "var(--color-warn)",
                }}
              />
              <span className="t-eyebrow">
                Your first move this cycle · {scope.dataAsOf}
              </span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              {top[0].headline}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              <span className="mono font-semibold text-ink-900">
                {formatImpact(top[0].impact.value)}
              </span>
              {" at stake — "}
              {decisions.length > 1
                ? `${decisions.length - 1} more decision${
                    decisions.length > 2 ? "s" : ""
                  } below.`
                : "the only decision flagged this cycle."}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              <span className="t-eyebrow">This cycle · {scope.dataAsOf}</span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              Nothing crossed a threshold this cycle.
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
            Momentum: {clientBrand.name} lost {Math.abs(momentum.clientDelta)}pt of
            share this cycle while{" "}
            <strong className="text-ink-900">
              {brandName(momentum.rivalBrandId)}
            </strong>{" "}
            gained {momentum.rivalDelta}pt.
          </p>
        )}
      </section>

      {/* KPI row — unchanged, still the fastest orientation on the page */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="On-shelf availability"
          value={`${headline.availability}%`}
          delta={headline.availabilityDelta}
          goodDirection="up"
          watch={kpiWatchTarget({
            metric: "availability",
            value: headline.availability,
            visit: view.visit,
          })}
        />
        <StatTile
          label="Shelf share"
          value={`${headline.shelfShare}%`}
          delta={headline.shelfShareDelta}
          goodDirection="up"
          watch={kpiWatchTarget({
            metric: "shelf-share",
            value: headline.shelfShare,
            visit: view.visit,
          })}
          footnote={`Rank ${rank} of ${competitors.length} in category`}
        />
        <StatTile
          label="Price compliance"
          value={`${headline.priceCompliance}%`}
          watch={kpiWatchTarget({
            metric: "compliance",
            value: headline.priceCompliance,
            visit: view.visit,
            suggestedTarget: { value: 100, why: "Every line within RRP ±5%." },
          })}
          footnote={`Across ${clientBrand.name} SKUs at RRP ±5%`}
        />
        <StatTile
          label="Active out-of-stocks"
          value={`${headline.activeOos}`}
          goodDirection="down"
          watch={kpiWatchTarget({
            metric: "gaps",
            value: headline.activeOos,
            visit: view.visit,
            suggestedTarget: { value: 0, why: "No gaps — the shelf as it should be." },
          })}
          footnote={`${headline.oosDays} lost shelf-days this cycle`}
        />
      </div>

      {/* What KIND of cycle this is, before any card is read. The
          decision list answers "which is biggest"; this answers
          "is this a replenishment problem or a range problem", which
          is the question an executive actually decides against. */}
      {decisions.length > 1 && (
        <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <h2 className="t-h3">What kind of cycle this is</h2>
          <p className="mt-1 mb-4 text-sm text-ink-500">
            Every facing-day at stake, split by the move that would
            recover it.
          </p>
          <CompositionBar
            segments={decisions.map((d) => ({
              id: d.id,
              label: d.headline,
              value: d.impact.value,
            }))}
            unitNoun="facing-days"
          />
          <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-ink-500">
            <span className="font-semibold text-ink-700">How to read this. </span>
            One bar, split by decision type — the widest band is the kind of
            problem this cycle mostly is.
          </p>
        </section>
      )}

      {/* Market shape — R12, given its own slot rather than a place in
          the decision ranking.

          It is a different kind of statement: not "this is your biggest
          recoverable loss" but "this is the shape your losses are in".
          On raw impact it would rank last of five this cycle (1,600
          facing-days, the smallest group), which would bury the most
          structurally useful thing the engine finds. Ranking it against
          to-do items was the category error — a map is not a task. */}
      {concentration && (
        <section className="mt-4">
          <ChartFrame
            title={concentration.headline}
            subtitle={`${clientBrand.name} shelf share by district · ${scope.dataAsOf}`}
            howToRead="Each row is a district. The centre line is your citywide shelf share; bars to the left fall short of it, and colour marks how far past the reporting threshold each one sits."
            soWhat={concentration.detail}
            table={{
              columns: concentration.evidence.table.columns,
              rows: concentration.evidence.table.rows,
            }}
            action={
              <DecisionAction
                draft={routeDraft(concentration, view.visit)}
                label="Plan the route"
              />
            }
          >
            <DivergingBar
              rows={districtRows}
              baselineLabel={`your citywide ${clientBrand.name} share`}
              unit="pt"
              collapseMiddle={{ keepWorst: 6, keepBest: 3 }}
              watchTargets={districtWatchTargets}
            />
          </ChartFrame>
        </section>
      )}

      {/* the decisions */}
      <div className="mt-4 flex flex-col gap-4">
        {top.map((decision, i) => {
          const spec = chartFor(decision, view.posCount);
          return (
            <DecisionBlock
              key={decision.id + i}
              decision={decision}
              rank={i + 1}
              visit={view.visit}
              {...spec}
            />
          );
        })}
      </div>

      {top.length === 0 && (
        <p className="mt-4 rounded-[18px] border border-line bg-white p-8 text-center text-sm text-ink-400">
          No decision cleared the reporting threshold this cycle.
        </p>
      )}

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* pricing keeps its own currency and its own block */}
        <section className="min-w-0 rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="t-h3">{reprice ? reprice.headline : "Pricing watch"}</h2>
            <span className="text-[12px] text-ink-400">
              Breaching readings, not facing-days
            </span>
          </div>
          <p className="mb-1 text-sm text-ink-500">
            {reprice
              ? reprice.detail
              : "Outlets clustering price breaches — a different problem with a different fix, so it ranks in its own currency."}
          </p>
          {pricing.length ? (
            <ul>
              {pricing.slice(0, 3).map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : (
            <p className="flex items-center justify-center gap-1.5 py-6 text-center text-sm text-ink-400">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              No outlet is clustering price breaches this cycle.
            </p>
          )}
        </section>

        {/* photography — the trust lever */}
        <section className="min-w-0 rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="t-h3">From the shelf</h2>
            <p className="mt-1 text-sm text-ink-500">
              Geo-stamped in store on {scope.dataAsOf}. Every figure above
              traces back to frames like these.
            </p>
          </div>
          <ShelfPhotos />

          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13px]">
            <Row label="Outlets audited" value={`${scope.posCount}`} />
            <Row label="SKUs tracked" value={`${scope.skuCount}`} />
            <Row
              label="Category gaps found"
              value={`${headline.totalOos}`}
              tone="critical"
            />
          </dl>
        </section>
      </div>

      {/* coverage */}
      <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="t-h3">Coverage</h2>
          <p className="mt-1 text-sm text-ink-500">
            Live in {scope.city}. Select any governorate to see what it adds.
          </p>
        </div>
        <CoverageMap />
      </section>

      <p className="mt-4 text-[12px] text-ink-400">
        Every decision above is rolled up from findings generated by a stated
        formula over this cycle&apos;s audit data — no forecasting, no machine
        learning.{" "}
        <Link href="/dashboard/shelf" className="font-semibold text-violet-ink hover:underline">
          Open Shelf
        </Link>{" "}
        for the full detail behind any of it.
      </p>
    </>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "critical";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className="mono font-semibold"
        style={{
          color: tone === "critical" ? "var(--color-critical)" : "var(--color-ink-900)",
        }}
      >
        {value}
      </dd>
    </div>
  );
}
