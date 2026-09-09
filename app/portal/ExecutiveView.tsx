"use client";

/* PAGE 1 · Executive Dashboard.

   Five sections, in the order a manager actually reads them: are we
   collecting the data we promised, is the market healthy, what needs
   attention, where is it, and who is winning where.

   Every figure comes from the same filtered view, so the KPI row, the
   insight cards, the map and the city comparison cannot disagree about
   what is in scope. */

import { useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/market/PageShell";
import { useTargets } from "@/components/market/useTargets";
import CoverageRing from "@/components/market/CoverageRing";
import InsightCard from "@/components/market/InsightCard";
import PosDrawer from "@/components/market/PosDrawer";
import MarketMap, { type MapPoint } from "@/components/market/map/MarketMap";
import MapLegend from "@/components/market/map/legend";
import { Card, StatCard } from "@/components/market/ui";
import { RankedBars } from "@/components/market/charts";
import { scoreBand, rateBand, type Band } from "@/components/market/ui/health";
import { generateInsights } from "@/lib/market/insights";
import {
  cities, cityName, contract, trends,
} from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";
import type { Targets } from "@/lib/market/settings";

/* The measures a reader can colour the map and rank the cities by.
   One list, used by both, so the two sections always offer the same
   vocabulary — and built from the LIVE targets, so editing a goal on
   the Setup page rebands the map and the city bars with it. */
type MetricId = "score" | "availability" | "shelfShare" | "posm" | "price";

function metricsFor(targets: Targets) {
  return [
    { id: "score" as const, label: "Execution score", unit: "", target: targets.score },
    { id: "availability" as const, label: "Availability", unit: "%", target: targets.availability },
    { id: "shelfShare" as const, label: "Shelf share", unit: "%", target: targets.shelfShare },
    { id: "posm" as const, label: "POSM", unit: "%", target: targets.posm },
    { id: "price" as const, label: "Price compliance", unit: "%", target: targets.price },
  ];
}

export default function ExecutiveView() {
  return (
    <PageShell>
      {(view) => <Dashboard view={view} />}
    </PageShell>
  );
}

function Dashboard({ view }: { view: MarketView }) {
  const targets = useTargets();
  const METRICS = useMemo(() => metricsFor(targets), [targets]);
  const [mapMetric, setMapMetric] = useState<MetricId>("score");
  const [cityMetric, setCityMetric] = useState<MetricId>("score");
  const [openPos, setOpenPos] = useState<string | null>(null);

  const report = useMemo(() => generateInsights(view), [view]);

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
      const value = score[mapMetric];
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
          meta: `${outlet.district}, ${cityName(outlet.cityId)}`,
        },
      ];
    });
  }, [view, mapMetric, METRICS]);

  const bandCounts = useMemo(() => {
    const counts: Record<Band, number> = { strong: 0, average: 0, attention: 0, critical: 0 };
    for (const p of points) counts[p.band] += 1;
    return counts;
  }, [points]);

  const cityRows = useMemo(() => {
    const metric = METRICS.find((m) => m.id === cityMetric)!;
    const scoreById = new Map(view.scores.map((s) => [s.posId, s]));
    return cities
      .map((city) => {
        const outlets = view.outlets.filter((p) => p.cityId === city.id);
        const values = outlets.flatMap((p) => {
          const s = scoreById.get(p.id);
          return s ? [s[cityMetric]] : [];
        });
        const mean = values.length
          ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
          : 0;
        return {
          id: city.id,
          label: city.name,
          value: mean,
          outlets: outlets.length,
          band: cityMetric === "score" ? scoreBand(mean) : rateBand(mean, metric.target),
        };
      })
      .filter((row) => row.outlets > 0)
      .sort((a, b) => b.value - a.value);
  }, [view, cityMetric, METRICS]);

  const metricOf = (id: MetricId) => METRICS.find((m) => m.id === id)!;

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- A · coverage ---------- */}
      <Card
        title="This month's audit coverage"
        lead={`${contract.category} execution across ${contract.country}, ${
          view.filters.cities.length ? "filtered scope" : "all six cities"
        }.`}
        footnote="Coverage is measured against the outlets in the current filter, not the national contract, so a filtered view answers the question it appears to ask."
      >
        <CoverageRing {...coverage} />
      </Card>

      {/* ---------- B · market health ---------- */}
      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Market health
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiTile label="Availability" value={view.kpi.availability} unit="%" target={targets.availability} trend={series.availability} href="/portal/performance?tab=availability" />
          <KpiTile label="Shelf share" value={view.client?.share ?? 0} unit="%" target={targets.shelfShare} trend={series.shelfShare} href="/portal/performance?tab=shelf" />
          <KpiTile label="Assortment" value={view.kpi.assortment} unit="%" target={targets.assortment} trend={series.assortment} href="/portal/performance?tab=assortment" />
          <KpiTile label="Price compliance" value={view.kpi.price} unit="%" target={targets.price} trend={series.price} href="/portal/performance?tab=pricing" />
          <KpiTile label="POSM" value={view.kpi.posm} unit="%" target={targets.posm} trend={series.posm} href="/portal/performance?tab=posm" />
          <KpiTile label="Execution score" value={view.kpi.score} target={targets.score} trend={series.score} href="/portal/performance" />
        </div>
      </section>

      {/* ---------- C · what needs attention ---------- */}
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            What needs attention
          </h2>
          <Link href="/portal/insights" className="text-[12px] font-semibold text-violet-ink hover:underline">
            All {report.all.length.toLocaleString()} findings
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {report.headlines.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>

      {/* ---------- D · the map ---------- */}
      <Card
        title="Where it is happening"
        lead={`${points.length.toLocaleString()} audited outlets, coloured by ${metricOf(mapMetric).label.toLowerCase()}.`}
        action={
          <MetricSwitch value={mapMetric} onChange={setMapMetric} metrics={METRICS} />
        }
        footnote="Outlets are placed within their district rather than surveyed to the street. Clusters take the colour of the worst outlet inside them, so a problem cannot be averaged out of view."
      >
        <div className="mb-2.5">
          <MapLegend counts={bandCounts} />
        </div>
        <MarketMap
          points={points}
          unit={metricOf(mapMetric).unit}
          onSelect={setOpenPos}
          height={440}
        />
      </Card>

      {/* ---------- E · city comparison ---------- */}
      <Card
        title="Market comparison"
        lead={`${metricOf(cityMetric).label} by city, across audited outlets.`}
        action={<MetricSwitch value={cityMetric} onChange={setCityMetric} metrics={METRICS} />}
      >
        <RankedBars
          rows={cityRows.map((row) => ({
            id: row.id,
            label: row.label,
            value: row.value,
            meta: `${row.outlets.toLocaleString()} audited outlets`,
          }))}
          max={100}
          par={metricOf(cityMetric).target}
          unit={metricOf(cityMetric).unit}
        />
      </Card>

      <PosDrawer posId={openPos} view={view} onClose={() => setOpenPos(null)} />
    </div>
  );
}

/* A KPI tile that navigates. The brief asks for click-through to the
   matching Performance tab, and the whole tile is the target rather
   than a link buried inside it. */
function KpiTile({
  label, value, unit, target, trend, href,
}: {
  label: string;
  value: number;
  unit?: string;
  target: number;
  trend: number[];
  href: string;
}) {
  /* Movement against last month, gated by the market detection floor:
     below it, the tile says "flat" rather than inventing a direction. */
  const delta = trend.length > 1 ? Math.round((trend[trend.length - 1] - trend[trend.length - 2]) * 10) / 10 : 0;
  return (
    <Link href={href} className="rounded-[14px] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-violet">
      <StatCard
        label={label}
        value={value}
        unit={unit}
        target={target}
        delta={delta}
        deltaFloor={1.8}
        deltaLabel="vs last month"
        trend={trend}
      />
    </Link>
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
