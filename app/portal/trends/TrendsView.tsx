"use client";

/* PAGE 9 · Historical Trends.

   The rule this page exists to respect: Vemi audits a ROTATING panel,
   so a movement between two months can be the market changing or the
   sample changing, and only one of those is worth acting on.

   So every chart draws two lines. The solid one is every audited
   outlet — breadth, and the figure the rest of the portal quotes. The
   dashed one is the 400-outlet core panel, the same doors every month,
   and it is the only line where a movement means the market moved. The
   gap between them is itself informative: when they diverge, the
   month's sample is doing some of the talking.

   Nothing here implies the two are interchangeable, and the legend
   says which is which on every chart. */

import { PageHeader } from "@/components/vemi/PageHeader";
import { asOf, monthShort } from "@/lib/market/asOf";
import { useMemo, useState } from "react";
import PageShell from "@/components/market/PageShell";
import { useTargets } from "@/components/market/useTargets";
import { KPI_NAME } from "@/lib/market/kpiLabels";
import PosDrawer from "@/components/market/PosDrawer";
import { Card, DataTable, EmptyState, StatCard, Tabs, type Column } from "@/components/market/ui";
import Badge from "@/components/market/ui/Badge";
import Delta from "@/components/market/ui/Delta";
import { ChartLegend, TrendChart, MEASURE, SERIES3, threeSeriesRows } from "@/components/market/charts";
import { scoreBand } from "@/components/market/ui/health";
import { repeated, type RepeatedRow } from "@/lib/market/trendsView";
import { posRows } from "@/lib/market/pos";
import { applyFilters, EMPTY_FILTERS, type MarketView } from "@/lib/market/filters";
import {
  brands, clientBrand, contract, loadMonth, monthLabel, trends,
} from "@/lib/market";
import type { MonthData } from "@/lib/market/types";
import type { Targets } from "@/lib/market/settings";
import { useEffect } from "react";

type MeasureId =
  | "score" | "availability" | "shelfShare" | "posm" | "price" | "assortment";

/* Built from the live targets, so a goal edited on the Setup page
   moves the reference line on every chart here too. */
function measuresFor(targets: Targets) {
  return [
    { id: "score" as const, label: KPI_NAME.score, unit: "", target: targets.score },
    { id: "availability" as const, label: KPI_NAME.availability, unit: "%", target: targets.availability },
    { id: "shelfShare" as const, label: KPI_NAME.shelfShare, unit: "%", target: targets.shelfShare },
    { id: "posm" as const, label: KPI_NAME.posm, unit: "%", target: targets.posm },
    { id: "price" as const, label: KPI_NAME.price, unit: "%", target: targets.price },
    { id: "assortment" as const, label: KPI_NAME.assortment, unit: "%", target: targets.assortment },
  ];
}

/* One cycle back — the pair the repeated-outlet section compares. */
const PRIOR = "2026-08";

export default function TrendsView() {
  return <PageShell>{(view) => <Trends view={view} />}</PageShell>;
}

function Trends({ view }: { view: MarketView }) {
  const targets = useTargets();
  const MEASURES = useMemo(() => measuresFor(targets), [targets]);
  const [measure, setMeasure] = useState<MeasureId>("score");
  const [prior, setPrior] = useState<MonthData | null>(null);
  const [openPos, setOpenPos] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadMonth(PRIOR).then((data) => {
      if (live) setPrior(data);
    });
    return () => {
      live = false;
    };
  }, []);

  const active = MEASURES.find((m) => m.id === measure)!;

  /* The two populations, on one scale. */
  const series = useMemo(
    () =>
      trends.months.map((month, index) => ({
        label: month.short,
        market: trends.market[index]?.[measure] ?? 0,
        core: trends.core[index]?.[measure] ?? 0,
      })),
    [measure]
  );

  /* The one month worth flagging (brand: a single Signal dot, never a
     Signal series): the largest month-on-month move on the CORE panel,
     where the same doors make a move real, and only if it clears the
     core panel's detection floor. */
  const anomaly = useMemo(() => {
    let best: { x: string; move: number } | null = null;
    for (let i = 1; i < series.length; i++) {
      const move = Math.round((series[i].core - series[i - 1].core) * 10) / 10;
      if (Math.abs(move) >= 2.66 && (!best || Math.abs(move) > Math.abs(best.move))) best = { x: series[i].label, move };
    }
    return best;
  }, [series]);

  /* Brand share over the half — the comparison the brief names. */
  const brandSeries = useMemo(
    () =>
      trends.months.map((month, index) => {
        const point = trends.market[index];
        const row: Record<string, string | number> = { label: month.short };
        for (const brand of brands) row[brand.id] = point?.brandShare[brand.id] ?? 0;
        return row;
      }),
    []
  );

  const rows = useMemo(() => posRows(view), [view]);
  const priorView = useMemo(
    () => (prior ? applyFilters({ ...EMPTY_FILTERS, month: PRIOR }, prior) : null),
    [prior]
  );
  const repeatedRows = useMemo(
    () => (priorView ? repeated(priorView, view) : []),
    [priorView, view]
  );

  const first = trends.market[0];
  const last = trends.market[trends.market.length - 1];
  const coreFirst = trends.core[0];
  const coreLast = trends.core[trends.core.length - 1];

  const columns: Column<RepeatedRow>[] = [
    {
      id: "name",
      header: "Outlet",
      sortValue: (r) => r.name,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.name}</p>
          <p className="mono truncate text-xs text-ink-400">{r.location}</p>
        </div>
      ),
    },
    {
      id: "before",
      header: monthLabel(PRIOR),
      align: "right",
      sortValue: (r) => r.before,
      render: (r) => <span className="mono text-ink-500">{r.before}</span>,
    },
    {
      id: "after",
      header: monthLabel(view.month),
      align: "right",
      sortValue: (r) => r.after,
      render: (r) => <Badge band={scoreBand(r.after)} label={String(r.after)} size="sm" />,
    },
    {
      id: "delta",
      header: "Change",
      align: "right",
      sortValue: (r) => r.delta,
      csv: (r) => r.delta,
      render: (r) => <Delta value={r.delta} unit="" floor={0} />,
    },
    {
      id: "availability",
      header: "Availability",
      align: "right",
      sortValue: (r) => r.availabilityDelta,
      csv: (r) => r.availabilityDelta,
      render: (r) => (
        <span className="mono text-ink-700">
          {r.availabilityBefore}% → {r.availabilityAfter}%
        </span>
      ),
    },
  ];

  /* ---------- the page's words ---------- */
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const since = `vs ${monthShort(trends.months[0].id)}`;
  const marketMove = r1((last?.[measure] ?? 0) - (first?.[measure] ?? 0));
  const coreMove = r1((coreLast?.[measure] ?? 0) - (coreFirst?.[measure] ?? 0));
  const moved = (n: number) => (n === 0 ? "held flat" : `${n > 0 ? "rose" : "fell"} ${Math.abs(n)}${active.unit === "%" ? " pts" : ""}`);
  const headline = `${active.label} ${moved(marketMove)} across the half; on the same ${contract.corePanel} doors it ${moved(coreMove)}.`;
  const shares = threeSeriesRows(brandSeries);
  const shareFirst = shares[0];
  const shareLast = shares[shares.length - 1];
  const shareMove = shareFirst && shareLast ? r1(shareLast.portfolio - shareFirst.portfolio) : 0;
  const shareSoWhat = shareLast
    ? `Your portfolio holds ${shareLast.portfolio}% of the shelf, ${shareMove === 0 ? "unchanged" : `${shareMove > 0 ? "up" : "down"} ${Math.abs(shareMove)} pts`} ${since}; ${SERIES3[1].name} holds ${shareLast.competitor}%.`
    : "No shares were measured across the half.";

  const improved = repeatedRows.filter((r) => r.delta > 0).length;
  const worsened = repeatedRows.filter((r) => r.delta < 0).length;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`${contract.country} · ${contract.category} · ${monthShort(trends.months[0].id)} to ${monthShort(trends.months[trends.months.length - 1].id)}`}
        title={headline}
        description="Six cycles of the same measures, with the core panel beside the whole market so a moving sample is never mistaken for a moving market."
      />
      <p className="rounded-md bg-canvas px-4 py-3 text-sm text-ink-700">
        Vemi audits a rotating panel, so a month-to-month movement can be the market changing or
        the sample changing. Every chart below draws both: the whole audited market for the level,
        and the {contract.corePanel}-outlet core panel — the same doors every month — for movement.
        Where the two diverge, the sample is doing some of the talking.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`${active.label}, all audited`}
          value={last?.[measure] ?? 0}
          unit={active.unit}
          target={active.target}
          delta={Math.round(((last?.[measure] ?? 0) - (first?.[measure] ?? 0)) * 10) / 10}
          deltaFloor={1.81}
          deltaLabel={since}
        />
        <StatCard
          label={`${active.label}, core panel`}
          value={coreLast?.[measure] ?? 0}
          unit={active.unit}
          target={active.target}
          delta={Math.round(((coreLast?.[measure] ?? 0) - (coreFirst?.[measure] ?? 0)) * 10) / 10}
          deltaFloor={2.66}
          deltaLabel={since}
        />
        <StatCard
          label="Outlets audited"
          value={last?.outlets ?? 0}
          footnote={`${trends.months.length} cycles, ${monthLabel(trends.months[0].id)} to ${monthLabel(trends.months[trends.months.length - 1].id)}`}
        />
        <StatCard
          label="Repeated outlets"
          value={repeatedRows.length}
          footnote={`Audited in both ${monthLabel(PRIOR)} and ${monthLabel(view.month)}`}
        />
      </div>

      <Card
        title={active.label}
        lead="Six cycles, both populations."
        soWhat={
          anomaly
            ? `${headline} The one move that clears the core panel's floor is ${anomaly.x}, ${anomaly.move > 0 ? "up" : "down"} ${Math.abs(anomaly.move)}.`
            : headline
        }
        asOf={asOf(view.month)}
        base={`${last?.outlets ?? 0} outlets · ${contract.corePanel} core`}
        confidence="measured"
        action={
          <ChartLegend
            items={[
              { id: "market", name: "All audited (breadth)", color: MEASURE },
              { id: "core", name: `Core panel, same ${contract.corePanel} doors`, color: MEASURE, dashed: true },
            ]}
          />
        }
        footnote="The solid line states the level. The dashed line is the only one where a movement means the market moved rather than the sample. The Ink dashed line is the target; an amber dot marks the single month whose core-panel move clears the detection floor."
      >
        <div className="mb-3">
          <Tabs
            tabs={MEASURES.map((m) => ({ id: m.id, label: m.label }))}
            active={measure}
            onChange={(id) => setMeasure(id as MeasureId)}
          />
        </div>
        <TrendChart
          data={series}
          series={[
            { key: "market", name: "All audited" },
            { key: "core", name: "Core panel", dashed: true },
          ]}
          unit={active.unit}
          height={280}
          target={active.target}
          anomaly={anomaly ? { x: anomaly.x, key: "core" } : undefined}
          label={`${active.label} over six cycles, all audited and core panel, against a ${active.target}${active.unit} target`}
        />
      </Card>

      <Card
        title="Brand share across the half"
        lead={`${clientBrand.name} against the rest of the category, all audited outlets.`}
        soWhat={shareSoWhat}
        asOf={asOf(view.month)}
        base="all audited outlets"
        confidence="measured"
        action={
          <ChartLegend items={SERIES3.map((x) => ({ id: x.key, name: x.name, color: x.color }))} />
        }
        footnote="Market-level shares only. Comparing an individual store month to month is the section below, and nothing else on this page does it."
      >
        <TrendChart
          data={threeSeriesRows(brandSeries)}
          series={SERIES3.map((x) => ({ key: x.key, name: x.name, color: x.color }))}
          unit="%"
          height={300}
        />
      </Card>

      {/* ---------- repeated outlets ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="vm-h2 mb-4 text-ink-900">
            Repeated outlets
          </h2>
          <span className="mono text-xs text-ink-400">
            {improved} improved · {worsened} declined · {repeatedRows.length - improved - worsened} unchanged
          </span>
        </div>

        {repeatedRows.length === 0 ? (
          <Card>
            <EmptyState
              title="No outlet appears in both cycles"
              lead="A store-level comparison needs the same door audited twice. Widen the filters, or check a month where the core panel is in scope."
            />
          </Card>
        ) : (
          <Card
            padded={false}
            footnote={`Only outlets audited in both ${monthLabel(PRIOR)} and ${monthLabel(view.month)} appear here — the one population where comparing a single store means anything.`}
          >
            <DataTable
              rows={repeatedRows}
              columns={columns}
              rowKey={(r) => r.posId}
              searchable
              searchText={(r) => `${r.name} ${r.location}`}
              searchPlaceholder="Search repeated outlets…"
              defaultSort={{ id: "delta", dir: "desc" }}
              exportName="repeated-outlets"
              pageSize={12}
              onRowClick={(r) => setOpenPos(r.posId)}
            />
          </Card>
        )}
      </section>

      <PosDrawer posId={openPos} view={view} rows={rows} onClose={() => setOpenPos(null)} />
    </div>
  );
}
