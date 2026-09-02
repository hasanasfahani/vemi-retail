"use client";

import { useMemo } from "react";
import PageHeader from "@/components/portal/PageHeader";
import FilterBar, {
  useFilters,
  useVisitData,
} from "@/components/portal/FilterBar";
import StatTile from "@/components/portal/charts/StatTile";
import RankedBar from "@/components/portal/charts/RankedBar";
import SplitBar from "@/components/portal/charts/SplitBar";
import DistrictMap, {
  type DistrictDatum,
} from "@/components/portal/charts/DistrictMap";
import Delta from "@/components/portal/charts/Delta";
import { scope } from "@/lib/portal";
import { applyFilters } from "@/lib/portalFilters";
import {
  brands,
  brandName,
  clientBrand,
  competitors,
  skuOf,
  posOf,
  headline,
} from "@/lib/portalData";

const COOLER_PACKS = new Set(["can-330", "pet-500", "glass-300"]);

export default function ShelfShareView() {
  const [filters, setFilters] = useFilters();
  const { data: visitData, loading } = useVisitData(filters.visit);
  const view = useMemo(
    () => applyFilters(filters, visitData),
    [filters, visitData]
  );
  const comparable =
    view.isLatestVisit &&
    filters.areas.length + filters.channels.length + filters.brands.length === 0;

  /* Cooler vs ambient recomputed from the same filtered cells, so the
     split can never describe a different slice than the share bars. */
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

  /* District rollup: colour carries the share rivals hold, so more red
     is still more of the problem — the same reading rule as the other
     two maps, on a measure where higher is otherwise better. */
  const districts = useMemo<DistrictDatum[]>(() => {
    const acc = new Map<
      string,
      { outlets: Set<string>; total: number; mine: number }
    >();
    for (const cell of view.cells) {
      if (cell.state !== "in-stock") continue;
      const area = posOf(cell.posId)!.area;
      const entry =
        acc.get(area) ?? { outlets: new Set<string>(), total: 0, mine: 0 };
      entry.outlets.add(cell.posId);
      entry.total += cell.facings;
      if (skuOf(cell.skuId)!.brandId === clientBrand.id)
        entry.mine += cell.facings;
      acc.set(area, entry);
    }
    return [...acc.entries()].map(([name, e]) => {
      const share = e.total ? Math.round((e.mine / e.total) * 1000) / 10 : 0;
      return {
        name,
        outlets: e.outlets.size,
        value: Math.round((100 - share) * 10) / 10,
        rows: [
          { label: `${clientBrand.name} share`, value: `${share}%` },
          {
            label: "Held by rivals",
            value: `${Math.round((100 - share) * 10) / 10}%`,
            tone: "critical" as const,
          },
          { label: "Your facings", value: `${e.mine}` },
          { label: "Category facings", value: `${e.total}` },
        ],
      };
    });
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

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: loading ? 0.55 : 1 }}
      aria-busy={loading}
    >
      <PageHeader
        title="Shelf Share"
        lead="Your share of facings against the category"
        posCount={view.posCount}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        resultLabel={`${view.posCount} outlets · ${view.totalFacings.toLocaleString()} facings counted`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={`${clientBrand.name} shelf share`}
          value={`${client?.share ?? 0}%`}
          delta={comparable ? clientRow.shareDelta : undefined}
          footnote={comparable ? undefined : "In the current selection"}
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

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <h2 className="t-h3">Category shelf share</h2>
          <p className="mt-1 mb-5 text-sm text-ink-500">
            Share of all carbonated facings across {view.posCount} outlets.{" "}
            {clientBrand.name} highlighted.
          </p>
          {shareRows.length ? (
            <RankedBar
              rows={shareRows}
              max={Math.max(...view.byBrand.map((c) => c.share), 1)}
            />
          ) : (
            <Empty />
          )}
        </section>

        <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <h2 className="t-h3">Cooler vs ambient</h2>
          <p className="mt-1 mb-5 text-sm text-ink-500">
            Where each brand&apos;s facings sit. Chilled space drives impulse
            purchase; ambient drives take-home.
          </p>
          {splitRows.length ? (
            <SplitBar rows={splitRows} aLabel="Chilled cooler" bLabel="Ambient shelf" />
          ) : (
            <Empty />
          )}
        </section>
      </div>

      <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <h2 className="t-h3">Erbil by district</h2>
        <p className="mt-1 mb-5 text-sm text-ink-500">
          Where rivals hold the most shelf. Darker is a larger share of
          facings in competitors&apos; hands; circle size is outlets audited.
          Click a district to filter this page to it.
        </p>
        {districts.length ? (
          <DistrictMap
            data={districts}
            selected={filters.areas}
            onSelect={(name) =>
              setFilters({
                ...filters,
                areas: filters.areas.includes(name)
                  ? filters.areas.filter((a) => a !== name)
                  : [...filters.areas, name],
              })
            }
            legendLabel="Rival shelf share"
            formatValue={(v) => `${v}%`}
          />
        ) : (
          <Empty />
        )}
      </section>

      <section className="mt-4 overflow-hidden rounded-[18px] border border-line bg-white">
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
                            background: row.isClient
                              ? "var(--color-violet)"
                              : "var(--color-chart-context)",
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
                    <td className="mono px-5 py-2.5 text-right font-semibold text-ink-900">
                      {row.share}%
                    </td>
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

      <p className="mt-3 text-[12px] text-ink-400">
        Panel-wide: {clientBrand.name} holds {headline.shelfShare}% of category
        facings across all {scope.posCount} outlets.
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
