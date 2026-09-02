"use client";

import { useMemo } from "react";
import PageHeader from "@/components/portal/PageHeader";
import FilterBar, {
  useFilters,
  useVisitData,
} from "@/components/portal/FilterBar";
import StatTile from "@/components/portal/charts/StatTile";
import RankedBar from "@/components/portal/charts/RankedBar";
import AvailabilityHeatmap from "@/components/portal/charts/AvailabilityHeatmap";
import StoreTable from "@/components/portal/charts/StoreTable";
import DistrictMap, {
  type DistrictDatum,
} from "@/components/portal/charts/DistrictMap";
import { scope } from "@/lib/portal";
import { applyFilters, matchingSkus } from "@/lib/portalFilters";
import {
  clientBrand,
  brandName,
  skuName,
  headline,
  posOf,
} from "@/lib/portalData";

export default function AvailabilityView() {
  const [filters, setFilters] = useFilters();
  const { data: visitData, loading } = useVisitData(filters.visit);
  const view = useMemo(
    () => applyFilters(filters, visitData),
    [filters, visitData]
  );
  const skus = useMemo(() => matchingSkus(filters), [filters]);

  const comparable =
    view.isLatestVisit &&
    filters.areas.length + filters.channels.length + filters.brands.length === 0;
  const worst = view.bySku[0];

  const categoryAvg = view.bySku.length
    ? Math.round(
        (view.bySku.reduce((s, r) => s + r.onShelfAvailability, 0) /
          view.bySku.length) *
          10
      ) / 10
    : 0;

  const clientSkus = view.bySku.filter((s) => s.brandId === clientBrand.id);
  const distributionAvg = clientSkus.length
    ? Math.round(
        (clientSkus.reduce((s, r) => s + r.distribution, 0) / clientSkus.length) *
          10
      ) / 10
    : 0;

  /* District rollup from the same filtered cells, so the city view can
     never disagree with the bars or the table below it. */
  const districts = useMemo<DistrictDatum[]>(() => {
    const acc = new Map<
      string,
      { outlets: Set<string>; listings: number; gaps: number }
    >();
    for (const cell of view.cells) {
      if (cell.state === "not-listed") continue;
      const area = posOf(cell.posId)!.area;
      const entry =
        acc.get(area) ?? { outlets: new Set<string>(), listings: 0, gaps: 0 };
      entry.outlets.add(cell.posId);
      entry.listings += 1;
      if (cell.state === "out-of-stock") entry.gaps += 1;
      acc.set(area, entry);
    }
    return [...acc.entries()].map(([name, e]) => {
      const gapRate = Math.round((e.gaps / e.listings) * 1000) / 10;
      return {
        name,
        outlets: e.outlets.size,
        value: gapRate,
        rows: [
          {
            label: "On shelf",
            value: `${Math.round((100 - gapRate) * 10) / 10}%`,
          },
          { label: "Out of shelf", value: `${gapRate}%`, tone: "critical" as const },
          { label: "Open gaps", value: `${e.gaps}` },
        ],
      };
    });
  }, [view]);

  const toggleDistrict = (name: string) =>
    setFilters({
      ...filters,
      areas: filters.areas.includes(name)
        ? filters.areas.filter((a) => a !== name)
        : [...filters.areas, name],
    });

  const rows = view.bySku.map((row) => ({
    id: row.skuId,
    label: skuName(row.skuId),
    value: row.onShelfAvailability,
    emphasis: row.brandId === clientBrand.id,
    meta: brandName(row.brandId),
  }));

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: loading ? 0.55 : 1 }}
      aria-busy={loading}
    >
      <PageHeader
        title="Availability"
        lead="SKU-level presence across the audited panel"
        posCount={view.posCount}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        resultLabel={`${view.posCount} outlets · ${view.skuCount} SKUs · ${view.listedCount.toLocaleString()} listings audited`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={`${clientBrand.name} on-shelf`}
          value={`${view.client?.availability ?? 0}%`}
          delta={comparable ? headline.availabilityDelta : undefined}
          footnote={comparable ? undefined : "In the current selection"}
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
        />
        <StatTile
          label="Open gaps"
          value={`${view.gapCount}`}
          goodDirection="down"
          footnote={
            comparable
              ? `${headline.activeOos} on your SKUs`
              : "In the current selection"
          }
        />
      </div>

      <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <h2 className="t-h3">On-shelf availability by SKU</h2>
        <p className="mt-1 mb-5 text-sm text-ink-500">
          Share of listing outlets where the SKU was physically on shelf.
          {worst && (
            <>
              {" "}Weakest first — {skuName(worst.skuId)}{" "}
              is the biggest gap at {worst.onShelfAvailability}%.
            </>
          )}
        </p>
        {rows.length ? (
          <RankedBar rows={rows} max={100} labelWidth={168} />
        ) : (
          <Empty />
        )}
      </section>

      <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <h2 className="t-h3">Erbil by district</h2>
        <p className="mt-1 mb-5 text-sm text-ink-500">
          Where the gaps concentrate across the city. Darker is a higher
          out-of-shelf rate; circle size is outlets audited. Click a district
          to filter this page to it.
        </p>
        {districts.length ? (
          <DistrictMap
            data={districts}
            selected={filters.areas}
            onSelect={toggleDistrict}
            legendLabel="Out-of-shelf rate"
            formatValue={(v) => `${v}%`}
          />
        ) : (
          <Empty />
        )}
      </section>

      <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <h2 className="t-h3">Outlet × SKU</h2>
        <p className="mt-1 mb-5 text-sm text-ink-500">
          {(view.posCount * view.skuCount).toLocaleString()} combinations audited
          on {scope.dataAsOf}. Depth of colour is facings held.
        </p>
        {view.posCount && view.skuCount ? (
          <AvailabilityHeatmap
            cells={view.cells}
            outlets={view.outlets}
            skus={skus}
          />
        ) : (
          <Empty />
        )}
      </section>

      <section className="mt-4 overflow-hidden rounded-[18px] border border-line bg-white">
        <div className="border-b border-line p-5 sm:p-6">
          <h2 className="t-h3">Outlet performance</h2>
          <p className="mt-1 text-sm text-ink-500">
            Worst first. Sort any column, or open an outlet for its full record.
          </p>
        </div>
        <StoreTable view={view} />
      </section>
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
