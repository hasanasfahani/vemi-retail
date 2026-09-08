"use client";

/* Shelf — Availability and Shelf Share merged.

   They were two pages independently filtering the same cells and
   independently rendering the same district map. One filter bar, one
   map (its metric switches with the tab), two content blocks behind
   a segmented control. */

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/portal/PageHeader";
import FilterBar, {
  useFilters,
  useVisitData,
} from "@/components/portal/FilterBar";
import StatTile from "@/components/portal/charts/StatTile";
import RankedBar from "@/components/portal/charts/RankedBar";
import SplitBar from "@/components/portal/charts/SplitBar";
import AvailabilityHeatmap from "@/components/portal/charts/AvailabilityHeatmap";
import StoreTable from "@/components/portal/charts/StoreTable";
import ChartStory from "@/components/portal/ChartStory";
import GoDeeper from "@/components/portal/GoDeeper";
import { useViewInsights } from "@/components/portal/useViewInsights";
import { brandShareWatchTarget, kpiWatchTarget } from "@/lib/watchTargets";
import QuadrantScatter from "@/components/portal/charts/QuadrantScatter";
import DivergingBar from "@/components/portal/charts/DivergingBar";
import DistrictHeat from "@/components/portal/DistrictHeat";
import Delta from "@/components/portal/charts/Delta";
import { scope } from "@/lib/portal";
import { applyFilters, matchingSkus } from "@/lib/portalFilters";
import {
  brands,
  brandName,
  clientBrand,
  competitors,
  skuName,
  skuOf,
  headline,
} from "@/lib/portalData";

type Mode = "availability" | "share";
const COOLER_PACKS = new Set(["can-330", "pet-500", "glass-300"]);

/* Pack codes are how the audit records a format; these are how a
   person says them. */
const PACK_LABEL: Record<string, string> = {
  "can-330": "330ml can",
  "pet-500": "500ml PET",
  "pet-1000": "1L PET",
  "pet-1500": "1.5L PET",
  "pet-2250": "2.25L PET",
  "glass-300": "300ml glass",
};

export default function ShelfView() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "share" ? "share" : "availability"
  );

  const [filters, setFilters] = useFilters();
  const { data: visitData, loading } = useVisitData(filters.visit);
  const view = useMemo(
    () => applyFilters(filters, visitData),
    [filters, visitData]
  );
  const skus = useMemo(() => matchingSkus(filters), [filters]);

  /* The engine, rerun against the current slice — so every "what this
     means" strip on this page describes the filtered view rather than
     the whole panel. */
  const insights = useViewInsights(view);

  const comparable =
    view.isLatestVisit &&
    filters.areas.length + filters.channels.length + filters.brands.length === 0;

  const toggleDistrict = (name: string) =>
    setFilters({
      ...filters,
      areas: filters.areas.includes(name)
        ? filters.areas.filter((a) => a !== name)
        : [...filters.areas, name],
    });

  /* ---------------- availability-mode derivations ---------------- */

  const worst = view.bySku[0];
  const categoryAvg = view.bySku.length
    ? Math.round(
        (view.bySku.reduce((s, r) => s + r.onShelfAvailability, 0) / view.bySku.length) * 10
      ) / 10
    : 0;
  const clientSkus = view.bySku.filter((s) => s.brandId === clientBrand.id);
  const distributionAvg = clientSkus.length
    ? Math.round(
        (clientSkus.reduce((s, r) => s + r.distribution, 0) / clientSkus.length) * 10
      ) / 10
    : 0;
  const availabilityRows = view.bySku.map((row) => ({
    id: row.skuId,
    label: skuName(row.skuId),
    value: row.onShelfAvailability,
    emphasis: row.brandId === clientBrand.id,
    meta: brandName(row.brandId),
  }));

  /* The line the SKU bars are judged against. Without it a 78% bar is
     a length with no verdict attached — against a 84% category average
     it is a laggard, against 71% it is a leader. */
  const categoryAvailability = availabilityRows.length
    ? Math.round(
        availabilityRows.reduce((s, r) => s + r.value, 0) /
          availabilityRows.length
      )
    : 0;

  /* ---------------- shelf-share-mode derivations ---------------- */

  const fixtures = useMemo(() => {
    const map = new Map<string, { cooler: number; ambient: number }>();
    for (const cell of view.cells) {
      if (cell.state !== "in-stock") continue;
      const sku = skuOf(cell.skuId)!;
      const entry = map.get(sku.brandId) ?? { cooler: 0, ambient: 0 };
      if (COOLER_PACKS.has(sku.pack)) entry.cooler += cell.facings;
      else entry.ambient += cell.facings;
      map.set(sku.brandId, entry);
    }
    return map;
  }, [view]);

  const client = view.client;
  const clientRow = competitors.find((c) => c.isClient)!;
  const leader = view.byBrand[0];
  const clientFixture = client ? fixtures.get(client.brandId) : undefined;
  const clientCoolerPct = clientFixture
    ? Math.round(
        (clientFixture.cooler / (clientFixture.cooler + clientFixture.ambient || 1)) * 100
      )
    : 0;
  const shareRows = view.byBrand.map((row) => ({
    id: row.brandId,
    label: brandName(row.brandId),
    value: row.share,
    emphasis: row.isClient,
    meta: brands.find((b) => b.id === row.brandId)?.owner,
  }));
  const splitRows = view.byBrand.map((row) => {
    const fx = fixtures.get(row.brandId) ?? { cooler: 0, ambient: 0 };
    return {
      id: row.brandId,
      label: brandName(row.brandId),
      a: fx.cooler,
      b: fx.ambient,
      emphasis: row.isClient,
    };
  });

  /* Pack mix — your share of each pack format against your citywide
     share. The portal could say "you hold 27.3%" but never which
     formats that average is made of, and the answer turns out to be
     the sharpest range finding in the panel: dominant in one pack,
     absent from others entirely. */
  const packMix = useMemo(() => {
    const acc = new Map<string, { mine: number; total: number }>();
    for (const cell of view.cells) {
      if (cell.state !== "in-stock") continue;
      const sku = skuOf(cell.skuId)!;
      const e = acc.get(sku.pack) ?? { mine: 0, total: 0 };
      e.total += cell.facings;
      if (sku.brandId === clientBrand.id) e.mine += cell.facings;
      acc.set(sku.pack, e);
    }
    const overall = view.client?.share ?? 0;
    return [...acc.entries()]
      .filter(([, e]) => e.total > 0)
      .map(([pack, e]) => {
        const share = Math.round((e.mine / e.total) * 1000) / 10;
        return {
          id: pack,
          label: PACK_LABEL[pack] ?? pack,
          delta: Math.round((share - overall) * 10) / 10,
          severity: (share === 0 ? "critical" : null) as "critical" | null,
          meta: `${share}% of ${Math.round(e.total).toLocaleString()} facings`,
        };
      })
      .sort((a, b) => a.delta - b.delta);
  }, [view]);

  /* Distribution against availability, every SKU in the category.
     Two numbers the page already shows as separate bars, plotted
     together so the DIAGNOSIS is the position: listed everywhere but
     empty is a replenishment problem; well-stocked but barely listed
     is a range problem. Opposite fixes, same two figures. */
  const skuQuadrant = useMemo(() => {
    const points = view.bySku.map((row) => ({
      id: row.skuId,
      label: skuName(row.skuId),
      x: row.distribution,
      y: row.onShelfAvailability,
      emphasis: row.brandId === clientBrand.id,
      meta: brandName(row.brandId),
    }));
    const avg = (ns: number[]) =>
      ns.length ? Math.round((ns.reduce((s, n) => s + n, 0) / ns.length) * 10) / 10 : 0;
    return {
      points,
      xDivider: avg(points.map((p) => p.x)),
      yDivider: avg(points.map((p) => p.y)),
    };
  }, [view]);

  /* The two district rollups that lived here — one for availability,
     one for share — are gone. Both fed the same map component with a
     different meaning for colour depending on which tab was active,
     which is precisely the confusion DistrictHeat exists to end: the
     measure is now a visible choice rather than a side effect of the
     tab you happen to be on. */


  const skuWatchTargets = useMemo(
    () =>
      Object.fromEntries(
        availabilityRows.map((r) => [
          r.id,
          {
            metric: "availability" as const,
            segmentType: "sku" as const,
            segment: r.id,
            label: `${r.label} availability`,
            currentValue: r.value,
            visit: view.visit,
            suggestedTarget: {
              value: categoryAvailability,
              why: `The ${categoryAvailability}% category average.`,
            },
          },
        ])
      ),
    [availabilityRows, categoryAvailability, view.visit]
  );

  const shareWatchTargets = useMemo(
    () =>
      Object.fromEntries(
        shareRows.map((r) => [
          r.id,
          brandShareWatchTarget({
            brandId: r.id,
            brandLabel: r.label,
            value: r.value,
            visit: view.visit,
          }),
        ])
      ),
    [shareRows, view.visit]
  );

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: loading ? 0.55 : 1 }}
      aria-busy={loading}
    >
      <PageHeader
        title="Shelf"
        lead="Availability and shelf share, in one view"
        posCount={view.posCount}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        resultLabel={`${view.posCount} outlets · ${view.totalFacings.toLocaleString()} facings counted`}
      />

      {/* mode toggle — same segmented-control pattern used on OOS */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          View
        </span>
        <div className="flex gap-1 rounded-lg bg-canvas p-1">
          {(
            [
              { value: "availability", label: "Availability" },
              { value: "share", label: "Shelf Share" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              aria-pressed={mode === option.value}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                mode === option.value
                  ? "bg-white text-ink-900 shadow-[var(--shadow-card)]"
                  : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "availability" ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label={`${clientBrand.name} on-shelf`}
              value={`${view.client?.availability ?? 0}%`}
              delta={comparable ? headline.availabilityDelta : undefined}
              footnote={comparable ? undefined : "In the current selection"}
              watch={kpiWatchTarget({
                metric: "availability",
                value: view.client?.availability ?? 0,
                visit: view.visit,
                filters,
                suggestedTarget: {
                  value: categoryAvg,
                  why: `The ${categoryAvg}% category average in this selection.`,
                },
              })}
            />
            <StatTile
              label="Category average"
              value={`${categoryAvg}%`}
              footnote="All brands in selection"
            />
            <StatTile
              label={`${clientBrand.name} distribution`}
              value={`${distributionAvg}%`}
              footnote="Average outlets listing each SKU"
              watch={kpiWatchTarget({
                metric: "distribution",
                value: distributionAvg,
                visit: view.visit,
                filters,
              })}
            />
            <StatTile
              label="Open gaps"
              value={`${view.gapCount}`}
              goodDirection="down"
              watch={kpiWatchTarget({
                metric: "gaps",
                value: view.gapCount,
                visit: view.visit,
                filters,
                suggestedTarget: { value: 0, why: "No gaps — the shelf as it should be." },
              })}
              footnote={comparable ? `${headline.activeOos} on your SKUs` : "In the current selection"}
            />
          </div>

          <div className="mt-4">
            {availabilityRows.length ? (
              <ChartStory
                title="On-shelf availability by SKU"
                subtitle={
                  worst
                    ? `Weakest first — ${skuName(worst.skuId)} is the biggest gap at ${worst.onShelfAvailability}%`
                    : "Weakest first"
                }
                howToRead={`Each bar is one SKU and its length is the share of listing outlets where it was physically on shelf. The hairline is the ${categoryAvailability}% category average, so bars left of it are below par. Violet is ${clientBrand.name}.`}
                findings={insights.forRules(
                  "r3-distribution-gap",
                  "r6-channel-gap"
                )}
                clean={`No SKU is far enough behind its peers to flag — hold the current listing and replenishment pattern.`}
                allClear="No listing gap in this selection"
                table={{
                  columns: ["SKU", "Brand", "On-shelf availability"],
                  rows: availabilityRows.map((r) => [
                    r.label,
                    r.meta ?? "—",
                    `${r.value}%`,
                  ]),
                }}
              >
                <RankedBar
                  rows={availabilityRows}
                  max={100}
                  labelWidth={168}
                  topN={8}
                  reference={{
                    value: categoryAvailability,
                    label: `category average ${categoryAvailability}%`,
                  }}
                  watchTargets={skuWatchTargets}
                />
              </ChartStory>
            ) : (
              <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
                <h2 className="t-h3">On-shelf availability by SKU</h2>
                <Empty />
              </section>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label={`${clientBrand.name} shelf share`}
              value={`${client?.share ?? 0}%`}
              delta={comparable ? clientRow.shareDelta : undefined}
              footnote={comparable ? undefined : "In the current selection"}
              watch={kpiWatchTarget({
                metric: "shelf-share",
                value: client?.share ?? 0,
                visit: view.visit,
                filters,
              })}
            />
            <StatTile
              label="Facings counted"
              value={(client?.facings ?? 0).toLocaleString()}
              footnote={`of ${view.totalFacings.toLocaleString()} in selection`}
            />
            <StatTile
              label="Gap to leader"
              value={
                leader && client && leader.brandId === client.brandId
                  ? "Leading"
                  : `${Math.round(((leader?.share ?? 0) - (client?.share ?? 0)) * 10) / 10}pt`
              }
              footnote={
                leader && client && leader.brandId === client.brandId
                  ? `Ahead of ${brandName(view.byBrand[1]?.brandId ?? "")}`
                  : `Behind ${brandName(leader?.brandId ?? "")}`
              }
            />
            <StatTile
              label="In chilled coolers"
              value={`${clientCoolerPct}%`}
              footnote="of your facings are cold-served"
            />
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
            {shareRows.length ? (
              <ChartStory
                title="Category shelf share"
                subtitle={`Share of all carbonated facings across ${view.posCount} outlets`}
                howToRead={`Each bar is a brand's share of every facing counted in this selection. Violet is ${clientBrand.name}; grey is the rest of the category.`}
                findings={insights.forRules(
                  "r2-district-deficit",
                  "r12-geographic-concentration"
                )}
                clean="No district in this selection is materially behind your citywide share."
                allClear="No district below threshold here"
                actionLabel="Create coverage action"
              >
                <RankedBar
                  rows={shareRows}
                  max={Math.max(...view.byBrand.map((c) => c.share), 1)}
                  watchTargets={shareWatchTargets}
                />
              </ChartStory>
            ) : (
              <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
                <h2 className="t-h3">Category shelf share</h2>
                <Empty />
              </section>
            )}

            {packMix.length ? (
              <ChartStory
                title="Where your share actually comes from"
                subtitle={`Your share of each pack format against your ${view.client?.share ?? 0}% overall`}
                howToRead={`Each row is a pack format. The centre line is your overall shelf share; bars to the right mean you over-index in that format, to the left you under-index. Red marks a format you hold none of.`}
                findings={insights.forRules("r7-fixture-imbalance")}
                clean="Your share is evenly spread across the formats you compete in."
                allClear="Format mix in balance"
                soWhat={packMixSoWhat(packMix)}
                actionLabel="Create range action"
                visit={view.visit}
                table={{
                  columns: ["Pack", "Your share", "vs overall"],
                  rows: packMix.map((p) => [
                    p.label,
                    p.meta ?? "—",
                    `${p.delta >= 0 ? "+" : ""}${p.delta}pt`,
                  ]),
                }}
              >
                <DivergingBar
                  rows={packMix}
                  baselineLabel={`your overall ${view.client?.share ?? 0}% share`}
                  unit="pt"
                  labelWidth={118}
                />
              </ChartStory>
            ) : null}

            {splitRows.length ? (
              <ChartStory
                title="Cooler vs ambient"
                subtitle="Chilled space drives impulse purchase; ambient drives take-home"
                howToRead="Each row is a brand and the bar splits its facings between the two fixture types. A brand leaning right is winning take-home space; leaning left, the cold shelf."
                findings={insights.forRules("r7-fixture-imbalance")}
                clean="Your split between chilled and ambient is in line — no space renegotiation needed in this window."
                allClear="Fixture split within range"
                actionLabel="Create space action"
              >
                <SplitBar
                  rows={splitRows}
                  aLabel="Chilled cooler"
                  bLabel="Ambient shelf"
                />
              </ChartStory>
            ) : (
              <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
                <h2 className="t-h3">Cooler vs ambient</h2>
                <Empty />
              </section>
            )}
          </div>
        </>
      )}

      <DistrictHeat
        view={view}
        selectedAreas={filters.areas}
        defaultMeasure="out-of-shelf"
        onSelectArea={toggleDistrict}
      />

      <GoDeeper
        id="shelf"
        items={
          mode === "availability"
            ? ["SKU quadrant", "Outlet × SKU heatmap", "Outlet performance table"]
            : ["Full brand breakdown"]
        }
      >
        {mode === "availability" ? (
          <>
            <div className="mt-4">
              {skuQuadrant.points.length ? (
                <ChartStory
                  title="Listed, or on the shelf?"
                  subtitle={`Every SKU in the selection · ${scope.dataAsOf}`}
                  howToRead={`Each dot is a SKU. Across is how many outlets list it; up is how often it is actually on shelf where listed. The lines are the panel averages (${skuQuadrant.xDivider}% and ${skuQuadrant.yDivider}%). Violet is ${clientBrand.name}.`}
                  findings={insights.forRules("r3-distribution-gap")}
                  clean="Your range sits with the category on both measures — no listing push needed."
                  allClear="No SKU behind its peers here"
                  soWhat="Bottom-right is a replenishment problem; top-left is a listing conversation. They look identical on a bar chart and need opposite fixes."
                  visit={view.visit}
                >
                  <QuadrantScatter
                    points={skuQuadrant.points}
                    xLabel="Distribution"
                    yLabel="On-shelf availability"
                    xDivider={skuQuadrant.xDivider}
                    yDivider={skuQuadrant.yDivider}
                    quadrants={{
                      topLeft: "Few stores, well stocked — list it wider",
                      topRight: "Wide and well stocked",
                      bottomLeft: "Few stores, often empty",
                      bottomRight: "Everywhere, often empty — replenish",
                    }}
                  />
                </ChartStory>
              ) : null}
            </div>
  
            <div className="mt-4">
              {view.posCount && view.skuCount ? (
                <ChartStory
                  title="Outlet × SKU"
                  subtitle={`${(view.posCount * view.skuCount).toLocaleString()} combinations across ${view.posCount} outlets audited ${scope.dataAsOf}`}
                  howToRead="Opens by district: each row is a district, each column a SKU, and the deeper the red the larger the share of that district's listings currently empty. Select a district to drop into its outlets, where colour switches to facings held and red marks a gap."
                  findings={insights.forRules("r1-outlet-gaps", "r9-dark-outlet")}
                  clean="Every listed SKU in this selection was on the shelf when its outlet was audited."
                  allClear="No gap in this selection"
                  actionLabel="Create replenishment action"
                >
                  <AvailabilityHeatmap
                    cells={view.cells}
                    outlets={view.outlets}
                    skus={skus}
                  />
                </ChartStory>
              ) : (
                <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
                  <h2 className="t-h3">Outlet × SKU</h2>
                  <Empty />
                </section>
              )}
            </div>
  
            <section className="mt-4 min-w-0 overflow-hidden rounded-[18px] border border-line bg-white">
              <div className="border-b border-line p-5 sm:p-6">
                <h2 className="t-h3">Outlet performance</h2>
                <p className="mt-1 text-sm text-ink-500">
                  Worst first. Sort any column, or open an outlet for its full record.
                </p>
              </div>
              <StoreTable view={view} />
            </section>
          </>
        ) : (
          <section className="mt-4 min-w-0 overflow-hidden rounded-[18px] border border-line bg-white">
            <div className="border-b border-line p-5 sm:p-6">
              <h2 className="t-h3">Full breakdown</h2>
              <p className="mt-1 text-sm text-ink-500">
                {comparable
                  ? `Movement measured against ${scope.previousVisit}.`
                  : "Movement is only shown for the latest visit on the full panel."}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-[12px] uppercase tracking-wide text-ink-400">
                    <th className="px-5 py-2.5 text-left font-semibold">Brand</th>
                    <th className="px-5 py-2.5 text-left font-semibold">Owner</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Facings</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Share</th>
                    <th className="px-5 py-2.5 text-right font-semibold">MoM</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Cooler</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Ambient</th>
                  </tr>
                </thead>
                <tbody>
                  {view.byBrand.map((row) => {
                    const comp = competitors.find((c) => c.brandId === row.brandId)!;
                    const fx = fixtures.get(row.brandId) ?? { cooler: 0, ambient: 0 };
                    return (
                      <tr
                        key={row.brandId}
                        className="border-b border-line last:border-0"
                        style={row.isClient ? { background: "var(--color-violet-050)" } : undefined}
                      >
                        <td className="px-5 py-2.5">
                          <span className="flex items-center gap-2">
                            <span
                              className="h-[10px] w-[10px] shrink-0 rounded-[2px]"
                              style={{
                                background: row.isClient ? "var(--color-violet)" : "var(--color-chart-context)",
                              }}
                            />
                            <span className={row.isClient ? "font-semibold text-ink-900" : "text-ink-700"}>
                              {brandName(row.brandId)}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-ink-500">
                          {brands.find((b) => b.id === row.brandId)?.owner}
                        </td>
                        <td className="mono px-5 py-2.5 text-right text-ink-700">{row.facings}</td>
                        <td className="mono px-5 py-2.5 text-right font-semibold text-ink-900">{row.share}%</td>
                        <td className="mono px-5 py-2.5 text-right">
                          {comparable ? <Delta value={comp.shareDelta} /> : <span className="text-ink-400">—</span>}
                        </td>
                        <td className="mono px-5 py-2.5 text-right text-ink-700">{fx.cooler}</td>
                        <td className="mono px-5 py-2.5 text-right text-ink-700">{fx.ambient}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </GoDeeper>

      <p className="mt-3 text-[12px] text-ink-400">
        Panel-wide: {clientBrand.name} holds {headline.shelfShare}% of category facings across all{" "}
        {scope.posCount} outlets.
      </p>
    </div>
  );
}

function Empty() {
  return (
    <p className="py-8 text-center text-sm text-ink-400">
      Nothing matches the current filters.
    </p>
  );
}

/* The move a pack-mix chart implies, stated from the data rather than
   written once and left to go stale. */
function packMixSoWhat(rows: { label: string; delta: number }[]) {
  const absent = rows.filter((r) => /0% of/.test(String((r as { meta?: string }).meta ?? "")));
  const worst = rows[0];
  if (absent.length) {
    return `You hold none of ${absent
      .map((a) => a.label)
      .join(" or ")} — a listing decision, not a replenishment one.`;
  }
  return worst && worst.delta < -5
    ? `${worst.label} runs ${Math.abs(worst.delta)}pt below your own average — the format worth arguing for.`
    : "No format is far enough off your average to act on in this window.";
}
