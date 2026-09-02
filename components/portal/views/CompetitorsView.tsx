"use client";

import { useMemo } from "react";
import PageHeader from "@/components/portal/PageHeader";
import FilterBar, {
  useFilters,
  useVisitData,
} from "@/components/portal/FilterBar";
import StatTile from "@/components/portal/charts/StatTile";
import RankedBar from "@/components/portal/charts/RankedBar";
import Delta from "@/components/portal/charts/Delta";
import { scope } from "@/lib/portal";
import { applyFilters } from "@/lib/portalFilters";
import { brands, brandName, clientBrand, competitors } from "@/lib/portalData";

export default function CompetitorsView() {
  const [filters, setFilters] = useFilters();
  const { data: visitData, loading } = useVisitData(filters.visit);
  const view = useMemo(
    () => applyFilters(filters, visitData),
    [filters, visitData]
  );
  const comparable =
    view.isLatestVisit &&
    filters.areas.length + filters.channels.length + filters.brands.length === 0;

  const client = view.client;
  const leader = view.byBrand[0];
  const rank = view.byBrand.findIndex((b) => b.isClient) + 1;
  const availabilityRank =
    [...view.byBrand]
      .sort((a, b) => b.availability - a.availability)
      .findIndex((b) => b.isClient) + 1;

  const sameOwner = view.byBrand.filter(
    (r) =>
      !r.isClient &&
      brands.find((b) => b.id === r.brandId)?.owner === clientBrand.owner
  );
  const portfolioShare =
    Math.round(
      ((client?.share ?? 0) + sameOwner.reduce((s, r) => s + r.share, 0)) * 10
    ) / 10;

  /* Both charts keep the same brand order, so a colour never moves. */
  const shareRows = view.byBrand.map((c) => ({
    id: c.brandId,
    label: brandName(c.brandId),
    value: c.share,
    emphasis: c.isClient,
    meta: brands.find((b) => b.id === c.brandId)?.owner,
  }));

  const availRows = view.byBrand.map((c) => ({
    id: c.brandId,
    label: brandName(c.brandId),
    value: c.availability,
    emphasis: c.isClient,
    meta: `${c.skuCount} SKUs tracked`,
  }));

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: loading ? 0.55 : 1 }}
      aria-busy={loading}
    >
      <PageHeader
        title="Competitor Watch"
        lead="How the rest of the category is performing"
        posCount={view.posCount}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        resultLabel={`${view.byBrand.length} brands · ${view.posCount} outlets · ${view.totalFacings.toLocaleString()} facings`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Category position"
          value={rank ? `#${rank}` : "—"}
          footnote={`of ${view.byBrand.length} brands in selection`}
        />
        <StatTile
          label="Lead over next brand"
          value={
            leader && client && leader.brandId === client.brandId
              ? `${Math.round((client.share - (view.byBrand[1]?.share ?? 0)) * 10) / 10}pt`
              : `−${Math.round(((leader?.share ?? 0) - (client?.share ?? 0)) * 10) / 10}pt`
          }
          footnote={
            leader && client && leader.brandId === client.brandId
              ? `Ahead of ${brandName(view.byBrand[1]?.brandId ?? "")}`
              : `Behind ${brandName(leader?.brandId ?? "")}`
          }
        />
        <StatTile
          label={`${clientBrand.owner} portfolio`}
          value={`${portfolioShare}%`}
          footnote={`${clientBrand.name} plus ${sameOwner.length} stablemate${sameOwner.length === 1 ? "" : "s"}`}
        />
        <StatTile
          label="Availability rank"
          value={availabilityRank ? `#${availabilityRank}` : "—"}
          footnote={`${client?.availability ?? 0}% on-shelf`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <h2 className="t-h3">Shelf share</h2>
          <p className="mt-1 mb-5 text-sm text-ink-500">
            Share of category facings across {view.posCount} outlets.
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
          <h2 className="t-h3">On-shelf availability</h2>
          <p className="mt-1 mb-5 text-sm text-ink-500">
            Share of listing outlets where stock was actually present.
          </p>
          {availRows.length ? <RankedBar rows={availRows} max={100} /> : <Empty />}
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-[18px] border border-line bg-white">
        <div className="border-b border-line p-5 sm:p-6">
          <h2 className="t-h3">Side by side</h2>
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
                <th className="px-5 py-2.5 text-right font-semibold">SKUs</th>
                <th className="px-5 py-2.5 text-right font-semibold">Share</th>
                <th className="px-5 py-2.5 text-right font-semibold">MoM</th>
                <th className="px-5 py-2.5 text-right font-semibold">Availability</th>
                <th className="px-5 py-2.5 text-right font-semibold">MoM</th>
                <th className="px-5 py-2.5 text-right font-semibold">Open gaps</th>
              </tr>
            </thead>
            <tbody>
              {view.byBrand.map((row) => {
                const comp = competitors.find((c) => c.brandId === row.brandId)!;
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
                        {row.isClient && (
                          <span
                            className="pill"
                            style={{
                              background: "var(--color-violet-100)",
                              color: "var(--color-violet-ink)",
                            }}
                          >
                            You
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-ink-500">
                      {brands.find((b) => b.id === row.brandId)?.owner}
                    </td>
                    <td className="mono px-5 py-2.5 text-right text-ink-700">{row.skuCount}</td>
                    <td className="mono px-5 py-2.5 text-right font-semibold text-ink-900">
                      {row.share}%
                    </td>
                    <td className="mono px-5 py-2.5 text-right">
                      {comparable ? <Delta value={comp.shareDelta} /> : <span className="text-ink-400">—</span>}
                    </td>
                    <td className="mono px-5 py-2.5 text-right text-ink-700">{row.availability}%</td>
                    <td className="mono px-5 py-2.5 text-right">
                      {comparable ? (
                        <Delta value={comp.availabilityDelta} />
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="mono px-5 py-2.5 text-right">
                      {row.gaps === 0 ? (
                        <span className="text-ink-400">—</span>
                      ) : (
                        <span className="font-semibold text-ink-900">{row.gaps}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
