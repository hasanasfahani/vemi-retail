"use client";

/* PAGE 1 · Executive Dashboard.

   The order is the argument. A commercial director at Baghdad Soft
   Drinks opens this to find out how their OWN BRANDS are doing, so
   portfolio health leads. The market KPIs come second because they
   answer a different question — which execution dimension is weak,
   across everything — and a reader needs the first answer before the
   second one means anything. Then what needs attention, then where.

   Audit coverage is still here and still exact, but it is a strip
   rather than a hero: it is what the CONTRACT is judged on, not what
   the business is judged on, and it was taking the most valuable space
   on the page to say so.

   Every figure comes from the same filtered view, so the brand rings,
   the KPI row, the insight cards and the map cannot disagree about
   what is in scope. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/market/PageShell";
import { useTargets } from "@/components/market/useTargets";
import BrandHealthCard from "@/components/market/BrandHealthCard";
import GovernorateHealthCard from "@/components/market/GovernorateHealthCard";
import KpiCard from "@/components/market/KpiCard";
import CoverageStrip from "@/components/market/CoverageStrip";
import InsightCard from "@/components/market/InsightCard";
import PosDrawer from "@/components/market/PosDrawer";
import MarketMap, { type MapPoint } from "@/components/market/map/MarketMap";
import MapLegend from "@/components/market/map/legend";
import { Card, InfoTip } from "@/components/market/ui";
import { RankedBars } from "@/components/market/charts";
import { scoreBand, rateBand, type Band } from "@/components/market/ui/health";
import { topCards, type DecisionInsight } from "@/lib/market/insightModel";
import InsightDrawer from "@/components/market/InsightDrawer";
import WatchEye from "@/components/market/WatchEye";
import { KPI_NAME } from "@/lib/market/kpiLabels";
import { useDecisions } from "@/components/market/useDecisions";
import {
  isPortfolio, portfolioHealth, portfolioScore, BAND_WORD,
} from "@/lib/market/brandHealth";
import { governorateHealth } from "@/lib/market/governorateHealth";
import { applyFilters, type MarketView } from "@/lib/market/filters";
import {
  governorates, governorateName, clientBrand, contract, loadMonth, trends,
} from "@/lib/market";
import type { MonthData } from "@/lib/market/types";
import type { Targets } from "@/lib/market/settings";

/* The measures a reader can colour the map and rank the governorates by.
   One list, used by both, so the two sections always offer the same
   vocabulary — and built from the LIVE targets, so editing a goal on
   the Setup page rebands the map and the city bars with it. */
/* Deliberately a subset of the watchlist's own KPI names, so a bar in
   the governorate chart can be pinned by passing the metric straight
   through — no second vocabulary to keep in step with the first. */
type MetricId = "score" | "availability" | "shelfShare" | "posm" | "price";

function metricsFor(targets: Targets) {
  return [
    { id: "score" as const, label: KPI_NAME.score, unit: "", target: targets.score },
    { id: "availability" as const, label: KPI_NAME.availability, unit: "%", target: targets.availability },
    { id: "shelfShare" as const, label: KPI_NAME.shelfShare, unit: "%", target: targets.shelfShare },
    { id: "posm" as const, label: KPI_NAME.posm, unit: "%", target: targets.posm },
    { id: "price" as const, label: KPI_NAME.price, unit: "%", target: targets.price },
  ];
}

/* The cycle the health cards compare against. */
const PRIOR = "2026-08";

/* What each headline figure actually counts. Written out because a
   rate without its denominator is a number a reader has to take on
   trust — and because two of these are the exact questions this build
   got wrong at least once. */
const EXPLAIN: Record<string, React.ReactNode> = {
  availability: (
    <>
      Of the {clientBrand.name} lines an outlet <strong>lists</strong>, the share found in stock
      on the visit. The denominator is listings, never outlets: a shop that never carried 2.25L
      has not run out of it, and counting it as a failure would turn a range decision into a
      supply problem.
    </>
  ),
  shelfShare: (
    <>
      {clientBrand.name} facings as a share of every facing measured in the fixture — competitors
      included. The target is the contracted par; holding more than par earns no extra credit in
      the execution score, because shelf beyond the agreement does not offset an empty one
      elsewhere.
    </>
  ),
  assortment: (
    <>
      How much of the range each outlet carries, measured against what its own channel is
      expected to stock — six SKUs in a hypermarket, three in a grocery. Judging a corner shop
      against the hypermarket standard would invent a failure nobody can fix.
    </>
  ),
  price: (
    <>
      The share of {clientBrand.name} price readings within 5% of the recommended price, in
      either direction. Above list is a volume risk and below list is a margin risk, so the two
      are counted together here and separated on the Pricing tab.
    </>
  ),
  posm: (
    <>
      Of the point-of-sale material types <strong>checked</strong> at an outlet, the share found
      in place. Coolers, stands and displays are only checked in formats that can take them, so a
      corner shop is not marked down for lacking a floor stand.
    </>
  ),
  score: (
    <>
      One composite, weighted{" "}
      <strong>availability 30 · shelf 25 · assortment 20 · price 15 · POSM 10</strong>, computed
      at each outlet on the day it was audited and averaged from there. Shelf and assortment are
      capped at their targets so surplus in one cannot pay for a gap in another.
      <br />
      <br />
      It is a triage device, not a diagnosis: two outlets can both score 82 for entirely
      different reasons, which is why every score on this page is shown beside the component
      holding it down. A component with nothing to measure at an outlet is excluded and the
      weights renormalise.
    </>
  ),
  movement: (
    <>
      Movement is judged against a bootstrapped detection floor — the smallest change this panel
      can actually resolve. Anything below it reads <strong>flat</strong> rather than being given
      a direction, because Vemi audits a rotating panel and a small swing is usually the sample
      moving rather than the market.
    </>
  ),
};

export default function ExecutiveView() {
  return (
    <PageShell>
      {(view, _search, data) => <Dashboard view={view} data={data} />}
    </PageShell>
  );
}

function Dashboard({ view, data }: { view: MarketView; data: MonthData }) {
  const targets = useTargets();
  const METRICS = useMemo(() => metricsFor(targets), [targets]);
  const [mapMetric, setMapMetric] = useState<MetricId>("score");
  const [governorateMetric, setGovernorateMetric] = useState<MetricId>("score");
  const [openPos, setOpenPos] = useState<string | null>(null);
  const [openInsight, setOpenInsight] = useState<DecisionInsight | null>(null);

  const report = useDecisions(view);

  /* The per-outlet figures behind each headline. An average of 87%
     can describe a steady market or a split one, and the status chip
     is where that difference becomes visible. */
  const spread = useMemo(() => {
    const of = (key: "availability" | "shelfShare" | "assortment" | "price" | "posm") =>
      view.scores.map((s) => s[key]).filter((v): v is number => v !== null);
    return {
      availability: of("availability"),
      shelfShare: of("shelfShare"),
      assortment: of("assortment"),
      price: of("price"),
      posm: of("posm"),
    };
  }, [view]);

  /* Last cycle's rows, for the movement figure on each ring. They are
     fetched rather than shipped, so the cards state a level first and
     gain their delta a moment later. */
  const [prior, setPrior] = useState<MonthData | null>(null);
  useEffect(() => {
    let live = true;
    loadMonth(PRIOR).then((held) => {
      if (live) setPrior(held);
    });
    return () => {
      live = false;
    };
  }, []);

  /* Brand health is computed WITHOUT the brand and SKU filters, and
     deliberately so: the section is the company's portfolio, and a
     filter narrowed to one brand should focus it, not delete the other
     three. Outlet-level filters — city, channel, retailer — still
     apply, because narrowing WHERE you are looking is exactly what
     they are for. */
  const portfolioView = useMemo(
    () => applyFilters({ ...view.filters, brands: [], skus: [] }, data),
    [view.filters, data]
  );
  const priorPortfolioView = useMemo(
    () =>
      prior
        ? applyFilters({ ...view.filters, brands: [], skus: [], month: PRIOR }, prior)
        : null,
    [view.filters, prior]
  );
  /* City health is the client's own execution, so it keeps whatever
     brand filter is set — unlike the portfolio section, which is about
     the company's brands and cannot be narrowed to one of them. */
  const priorView = useMemo(
    () => (prior ? applyFilters({ ...view.filters, month: PRIOR }, prior) : null),
    [view.filters, prior]
  );

  const health = useMemo(
    () => portfolioHealth(portfolioView, priorPortfolioView),
    [portfolioView, priorPortfolioView]
  );

  /* Which brand the global filter has singled out, if it is one of the
     company's own. A rival selected there leaves this section alone —
     "portfolio health" must not quietly become a competitor's, and its
     price compliance would be judged against a list price Baghdad Soft
     Drinks does not set. */
  const focusBrand =
    view.filters.brands.length === 1 && isPortfolio(view.filters.brands[0])
      ? view.filters.brands[0]
      : null;
  const rivalSelected =
    view.filters.brands.length > 0 && view.filters.brands.every((id) => !isPortfolio(id));

  const focused = focusBrand ? health.filter((h) => h.brandId === focusBrand) : health;
  const companyScore = useMemo(() => portfolioScore(health), [health]);

  /* Governorates take the SAME composite, but shelf is scored against the
     contracted par rather than as conversion: this is one brand across
     several places, so the par is exactly the right yardstick. */
  const governorateHealthRows = useMemo(
    () => governorateHealth(view, priorView),
    [view, priorView]
  );

  /* Coverage is recomputed against the filter, not read off the
     contract: a Baghdad-filtered dashboard must say how much of
     BAGHDAD has been covered, or the ring is quietly answering a
     different question than the one on screen. */
  const coverage = useMemo(() => {
    const perDaySoFar = view.posCount / Math.max(1, contract.daysElapsed);
    const remaining = view.notAuditedCount;
    const perDayRequired = remaining / Math.max(1, contract.daysRemaining);
    return {
      audited: view.posCount,
      contracted: view.inScopeCount,
      pct: view.coveragePct,
      remaining,
      daysRemaining: contract.daysRemaining,
      perDaySoFar: Math.round(perDaySoFar * 10) / 10,
      perDayRequired: Math.round(perDayRequired * 10) / 10,
      onTrack: perDaySoFar >= perDayRequired,
    };
  }, [view]);

  /* The trailing six months of each KPI, for the sparklines. Market
     breadth, not the core panel: these tiles state levels, and levels
     come from every outlet audited. */
  const series = useMemo(() => {
    const of = (key: "score" | "availability" | "shelfShare" | "assortment" | "price" | "posm") =>
      trends.market.map((p) => p[key]);
    return {
      score: of("score"),
      availability: of("availability"),
      shelfShare: of("shelfShare"),
      assortment: of("assortment"),
      price: of("price"),
      posm: of("posm"),
    };
  }, []);

  const points = useMemo<MapPoint[]>(() => {
    const scoreById = new Map(view.scores.map((s) => [s.posId, s]));
    return view.outlets.flatMap((outlet) => {
      const score = scoreById.get(outlet.id);
      if (!score) return [];
      /* An outlet with nothing to measure on this metric is left OFF
         the map rather than pinned at zero — a red marker for "we have
         no reading here" is a lie in the most visible place on the
         page. */
      const value = score[mapMetric];
      if (value === null) return [];
      const metric = METRICS.find((m) => m.id === mapMetric)!;
      return [
        {
          id: outlet.id,
          name: outlet.name,
          lat: outlet.lat,
          lng: outlet.lng,
          value: Math.round(value * 10) / 10,
          band:
            mapMetric === "score" ? scoreBand(value) : rateBand(value, metric.target),
          meta: `${outlet.district}, ${governorateName(outlet.governorateId)}`,
        },
      ];
    });
  }, [view, mapMetric, METRICS]);

  const bandCounts = useMemo(() => {
    const counts: Record<Band, number> = { strong: 0, average: 0, attention: 0, critical: 0 };
    for (const p of points) counts[p.band] += 1;
    return counts;
  }, [points]);

  const governorateRows = useMemo(() => {
    const metric = METRICS.find((m) => m.id === governorateMetric)!;
    const scoreById = new Map(view.scores.map((s) => [s.posId, s]));
    return governorates
      .map((city) => {
        const outlets = view.outlets.filter((p) => p.governorateId === city.id);
        const values = outlets.flatMap((p) => {
          const s = scoreById.get(p.id);
          const v = s ? s[governorateMetric] : null;
          return v === null || v === undefined ? [] : [v];
        });
        const mean = values.length
          ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
          : 0;
        return {
          id: city.id,
          label: city.name,
          value: mean,
          outlets: outlets.length,
          band: governorateMetric === "score" ? scoreBand(mean) : rateBand(mean, metric.target),
        };
      })
      .filter((row) => row.outlets > 0)
      .sort((a, b) => b.value - a.value);
  }, [view, governorateMetric, METRICS]);

  const metricOf = (id: MetricId) => METRICS.find((m) => m.id === id)!;

  /* Month-over-month movement for a KPI tile, from the market trend
     line. Each tile pairs it with the detection floor for that measure,
     so anything the panel cannot resolve reads as flat. */
  const move = (key: keyof (typeof trends.market)[number]) => {
    const line = trends.market;
    if (line.length < 2) return 0;
    const last = line[line.length - 1][key];
    const prior = line[line.length - 2][key];
    if (typeof last !== "number" || typeof prior !== "number") return 0;
    return Math.round((last - prior) * 10) / 10;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- coverage, demoted to a strip ---------- */}
      <div className="relative">
        <CoverageStrip {...coverage} />
        <span className="absolute right-3.5 top-3">
          <InfoTip label="How coverage is measured">
            Outlets audited against the outlets the current filter selects — not against the
            national contract — so a filtered view answers the question it appears to ask.{" "}
            <strong>On track</strong> is arithmetic, not a mood: the rate achieved so far against
            the rate the remaining days require.
          </InfoTip>
        </span>
      </div>

      {/* ---------- 1 · market health ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Market health
          </h2>
          <span className="flex items-center gap-2">
            <p className="text-[11.5px] text-ink-400">
              Which execution dimension is weak, across everything audited
            </p>
            <InfoTip label="How these figures are measured">
              Each tile is a rate over what was actually observed this cycle across{" "}
              {view.posCount.toLocaleString()} audited outlets, with the target drawn on the track
              and through the trend. {EXPLAIN.movement}
            </InfoTip>
          </span>
        </div>
        {/* Six across only above 1536px. At 1280 the tiles were 154px
            wide, which is narrower than the words on them. */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <KpiCard explain={EXPLAIN.availability} label={KPI_NAME.availability} value={view.kpi.availability} target={targets.availability} trend={series.availability} spread={spread.availability} watch={{ kpi: "availability", month: view.month }} delta={move("availability")} deltaFloor={1.73} href="/portal/performance?tab=availability" />
          <KpiCard explain={EXPLAIN.shelfShare} label={KPI_NAME.shelfShare} value={view.client?.share ?? 0} target={targets.shelfShare} trend={series.shelfShare} spread={spread.shelfShare} watch={{ kpi: "shelfShare", month: view.month }} delta={move("shelfShare")} deltaFloor={1.81} href="/portal/performance?tab=shelf" />
          <KpiCard explain={EXPLAIN.assortment} label={KPI_NAME.assortment} value={view.kpi.assortment} target={targets.assortment} trend={series.assortment} spread={spread.assortment} watch={{ kpi: "assortment", month: view.month }} delta={move("assortment")} deltaFloor={1.8} href="/portal/performance?tab=assortment" />
          <KpiCard explain={EXPLAIN.price} label={KPI_NAME.price} value={view.kpi.price} target={targets.price} trend={series.price} spread={spread.price} watch={{ kpi: "price", month: view.month }} delta={move("price")} deltaFloor={1.8} href="/portal/performance?tab=pricing" />
          <KpiCard explain={EXPLAIN.posm} label={KPI_NAME.posm} value={view.kpi.posm} target={targets.posm} trend={series.posm} spread={spread.posm} watch={{ kpi: "posm", month: view.month }} delta={move("posm")} deltaFloor={1.8} href="/portal/performance?tab=posm" />
          <KpiCard isScore explain={EXPLAIN.score} label={KPI_NAME.score} value={view.kpi.score} unit="" target={targets.score} trend={series.score} watch={{ kpi: "score", month: view.month }} delta={move("score")} deltaFloor={1.8} band={scoreBand(view.kpi.score)} href="/portal/performance" />
        </div>
      </section>

      {/* ---------- 2 · portfolio brand health ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Portfolio brand health
          </h2>
          <div className="flex items-center gap-3">
            <InfoTip label="How this is scored">
              Each brand takes the portal&apos;s own composite — availability 30, shelf 25,
              assortment 20, price 15, POSM 10.{" "}
              <strong className="font-semibold text-ink-900">Shelf is scored as conversion</strong>{" "}
              here: the share of facings a brand holds against the share of shelf slots it is
              listed in. Judging Mountain Dew&apos;s 4% against {clientBrand.name}&apos;s 40% par
              would rate a small brand as failing for being small, which is size rather than
              health. POSM is recorded per outlet, not per brand, so each brand takes the material
              compliance of the outlets that stock it.
            </InfoTip>
            <p className="shrink-0 text-right">
              <span className="mono text-[11px] uppercase tracking-wide text-ink-400">
                Portfolio
              </span>
              <span className="ml-2 font-display text-[22px] font-bold leading-none tracking-tight text-ink-900">
                {companyScore}
              </span>
              <span className="mono ml-1 text-[11px] text-ink-400">/ 100</span>
            </p>
          </div>
        </div>

        {rivalSelected && (
          <p className="mb-2.5 rounded-[12px] border border-violet-100 bg-violet-050 px-3.5 py-2.5 text-[12px] leading-snug text-violet-ink">
            This section covers {contract.clientShort}&apos;s own brands, so the brand filter is not
            applied to it — a competitor&apos;s price compliance would be judged against a list
            price this company does not set. Everything below the KPI row still follows the filter.
          </p>
        )}

        <div
          className={`grid gap-3 ${
            focusBrand ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4"
          }`}
        >
          {focused.map((row) => (
            <BrandHealthCard
              key={row.brandId}
              health={row}
              focused={focusBrand === row.brandId}
              size={focusBrand ? 148 : 128}
              watch={
                <WatchEye
                  kpi="shelfShare"
                  scope={{ brandId: row.brandId }}
                  value={row.share}
                  target={targets.shelfShare}
                  month={view.month}
                  size="sm"
                />
              }
            />
          ))}

          {/* Focused on one brand: keep the rest of the house visible
              as a compact list, because a portfolio manager narrowing
              to Mirinda has not stopped owning the other three. */}
          {focusBrand && (
            <div className="flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)] sm:col-span-1 lg:col-span-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                The rest of the portfolio
              </h3>
              <ul className="mt-2 flex flex-col">
                {health
                  .filter((row) => row.brandId !== focusBrand)
                  .map((row) => (
                    <li
                      key={row.brandId}
                      className="flex items-center gap-2.5 border-b border-line py-2 last:border-0"
                    >
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-700">
                        {row.name}
                      </span>
                      <span className="mono text-[11.5px] text-ink-400">
                        {row.weakest.label} {row.weakest.display}
                      </span>
                      <span className="mono w-[30px] shrink-0 text-right text-[13px] font-semibold text-ink-900">
                        {row.score}
                      </span>
                      <span className="w-[92px] shrink-0 text-right text-[11px] text-ink-500">
                        {BAND_WORD[row.band]}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

      </section>

      {/* ---------- 3 · key decision insights ---------- */}
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Key decision insights
            <InfoTip label="How findings are chosen and ranked" align="left">
              Every card comes from a named rule with a stated formula and a threshold it had to
              clear to appear at all. Ranking weighs three measured things: how large the finding
              is by its own rule&rsquo;s scale, how much of the market&rsquo;s trading weight it
              touches, and how strong the evidence behind it is. No card is chosen by hand. The
              board takes one finding per rule, so it cannot fill with five versions of the same
              stockout.
            </InfoTip>
          </h2>
          <Link href="/portal/insights" className="text-[12px] font-semibold text-violet-ink hover:underline">
            All {report.cards.length.toLocaleString()} findings
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {topCards(report, 5).map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onOpen={setOpenInsight}
              childCount={report.children.get(insight.id)?.length ?? 0}
            />
          ))}
        </div>
      </section>

      {/* ---------- 4 · market health by governorate ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Market health by governorate
            </h2>
            <p className="mt-0.5 text-[12px] text-ink-400">
              Which market to look at, before opening the map to find where inside it
            </p>
          </div>
          <InfoTip label="How this is scored">
            Governorates take the same composite as the brands — availability 30, shelf 25, assortment
            20, price 15, POSM 10 — but shelf is scored against the contracted{" "}
            {targets.shelfShare}% par rather than as conversion. This is one brand across several
            places, so the par is the right yardstick: {clientBrand.name} holding less than it
            should in a city is a real shortfall, not an artefact of that city&apos;s size.
          </InfoTip>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {governorateHealthRows.map((row) => (
            <GovernorateHealthCard
              key={row.governorateId}
              health={row}
              watch={
                <WatchEye
                  kpi="score"
                  scope={{ governorateId: row.governorateId }}
                  value={row.score}
                  target={targets.score}
                  month={view.month}
                  size="sm"
                />
              }
            />
          ))}
        </div>
      </section>

      {/* ---------- 5 · where it is happening ---------- */}
      <Card
        title="Where it is happening"
        lead={`${points.length.toLocaleString()} audited outlets, coloured by ${metricOf(mapMetric).label.toLowerCase()}.`}
        action={
          <span className="flex items-center gap-2">
            <InfoTip label="How the map is coloured">
              Each point is one audited outlet, placed inside its district rather than surveyed to
              the street. A cluster is coloured by how its outlets <strong>typically</strong>{" "}
              score and ringed in red when any of them is critical — hover it for the count.
              Colouring a cluster by its worst outlet, as this once did, painted every bubble red
              at country zoom and told the reader nothing. Outlets with nothing to measure on the
              chosen metric are left off rather than shown at zero.
            </InfoTip>
            <MetricSwitch value={mapMetric} onChange={setMapMetric} metrics={METRICS} />
          </span>
        }
        footnote="Outlets are placed within their district rather than surveyed to the street. A cluster is coloured by how its outlets typically score and ringed in red when any of them is critical — hover it for the count."
      >
        <div className="mb-2.5">
          <MapLegend counts={bandCounts} />
        </div>
        <MarketMap
          points={points}
          unit={metricOf(mapMetric).unit}
          onSelect={setOpenPos}
          height={440}
          bandOf={(value) =>
            mapMetric === "score"
              ? scoreBand(value)
              : rateBand(value, metricOf(mapMetric).target)
          }
        />
      </Card>

      {/* ---------- 6 · market comparison ---------- */}
      <Card
        title="Market comparison"
        lead={`${metricOf(governorateMetric).label} by governorate, across audited outlets.`}
        action={
          <span className="flex items-center gap-2">
            <InfoTip label="How governorates are compared">
              The mean of the chosen measure across each governorate&apos;s audited outlets, with the tick
              on each bar marking the target. Coverage differs by governorate — Baghdad contributes 230
              outlets and Karbala 64 — so a governorate with fewer audited doors carries a wider margin
              of error than its bar suggests.
            </InfoTip>
            <MetricSwitch value={governorateMetric} onChange={setGovernorateMetric} metrics={METRICS} />
          </span>
        }
      >
        <RankedBars
          rows={governorateRows.map((row) => ({
            id: row.id,
            label: row.label,
            value: row.value,
            meta: `${row.outlets.toLocaleString()} audited outlets`,
            watch: (
              <WatchEye
                kpi={governorateMetric}
                scope={{ governorateId: row.id }}
                value={row.value}
                target={metricOf(governorateMetric).target}
                month={view.month}
                size="sm"
              />
            ),
          }))}
          max={100}
          par={metricOf(governorateMetric).target}
          unit={metricOf(governorateMetric).unit}
        />
      </Card>

      <InsightDrawer
        insight={openInsight}
        view={view}
        childrenFindings={openInsight ? report.children.get(openInsight.id) ?? [] : []}
        onClose={() => setOpenInsight(null)}
        onOpenPos={setOpenPos}
      />
      <PosDrawer posId={openPos} view={view} onClose={() => setOpenPos(null)} />
    </div>
  );
}

function MetricSwitch({
  value, onChange, metrics,
}: {
  value: MetricId;
  onChange: (id: MetricId) => void;
  metrics: { id: MetricId; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="sr-only">Metric</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MetricId)}
        className="rounded-[9px] border border-line-strong bg-white px-2 py-1 text-[12px] font-semibold text-ink-700 outline-none transition-colors hover:border-ink-400"
      >
        {metrics.map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </label>
  );
}
