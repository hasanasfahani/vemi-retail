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

import { useMemo, useState } from "react";
import PageShell from "@/components/market/PageShell";
import { useTargets } from "@/components/market/useTargets";
import PosDrawer from "@/components/market/PosDrawer";
import { Card, DataTable, EmptyState, StatCard, Tabs, type Column } from "@/components/market/ui";
import Badge from "@/components/market/ui/Badge";
import Delta from "@/components/market/ui/Delta";
import { ChartLegend, TrendChart, brandColor, MEASURE } from "@/components/market/charts";
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
    { id: "score" as const, label: "Execution score", unit: "", target: targets.score },
    { id: "availability" as const, label: "Availability", unit: "%", target: targets.availability },
    { id: "shelfShare" as const, label: "Share of shelf", unit: "%", target: targets.shelfShare },
    { id: "posm" as const, label: "POSM", unit: "%", target: targets.posm },
    { id: "price" as const, label: "Price compliance", unit: "%", target: targets.price },
    { id: "assortment" as const, label: "Assortment", unit: "%", target: targets.assortment },
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
          <p className="mono truncate text-[11px] text-ink-400">{r.location}</p>
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

  const improved = repeatedRows.filter((r) => r.delta > 0).length;
  const worsened = repeatedRows.filter((r) => r.delta < 0).length;

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-500">
        Vemi audits a rotating panel, so a month-to-month movement can be the market changing or
        the sample changing. Every chart below draws both: the whole audited market for the level,
        and the {contract.corePanel}-outlet core panel — the same doors every month — for movement.
        Where the two diverge, the sample is doing some of the talking.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`${active.label}, all audited`}
          value={last?.[measure] ?? 0}
          unit={active.unit}
          target={active.target}
          delta={Math.round(((last?.[measure] ?? 0) - (first?.[measure] ?? 0)) * 10) / 10}
          deltaFloor={1.81}
          deltaLabel="across the half"
        />
        <StatCard
          label={`${active.label}, core panel`}
          value={coreLast?.[measure] ?? 0}
          unit={active.unit}
          target={active.target}
          delta={Math.round(((coreLast?.[measure] ?? 0) - (coreFirst?.[measure] ?? 0)) * 10) / 10}
          deltaFloor={2.66}
          deltaLabel="across the half"
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
        action={
          <ChartLegend
            items={[
              { id: "market", name: "All audited (breadth)", color: MEASURE },
              { id: "core", name: `Core panel, same ${contract.corePanel} doors`, color: MEASURE, dashed: true },
            ]}
          />
        }
        footnote="The solid line states the level. The dashed line is the only one where a movement means the market moved rather than the sample."
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
        />
      </Card>

      <Card
        title="Brand share across the half"
        lead={`${clientBrand.name} against the rest of the category, all audited outlets.`}
        action={
          <ChartLegend
            items={brands.map((b) => ({ id: b.id, name: b.name, color: brandColor(b.id) }))}
          />
        }
        footnote="Market-level shares only. Comparing an individual store month to month is the section below, and nothing else on this page does it."
      >
        <TrendChart
          data={brandSeries}
          series={brands.map((b) => ({ key: b.id, name: b.name, color: brandColor(b.id) }))}
          unit="%"
          height={300}
        />
      </Card>

      {/* ---------- repeated outlets ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Repeated outlets
          </h2>
          <span className="mono text-[11.5px] text-ink-400">
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
