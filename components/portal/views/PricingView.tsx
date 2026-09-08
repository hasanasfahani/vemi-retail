"use client";

import { useMemo } from "react";
import PageHeader from "@/components/portal/PageHeader";
import FilterBar, { useFilters } from "@/components/portal/FilterBar";
import StatTile from "@/components/portal/charts/StatTile";
import PriceBand from "@/components/portal/charts/PriceBand";
import RankedBar from "@/components/portal/charts/RankedBar";
import ChartStory from "@/components/portal/ChartStory";
import GoDeeper from "@/components/portal/GoDeeper";
import Histogram from "@/components/portal/charts/Histogram";
import { outletComplianceWatchTarget, kpiWatchTarget } from "@/lib/watchTargets";
import { useViewInsights } from "@/components/portal/useViewInsights";
import { OutletButton } from "@/components/portal/OutletDrawer";
import { scope } from "@/lib/portal";
import { applyFilters } from "@/lib/portalFilters";
import {
  clientBrand,
  brandName,
  skuName,
  skuOf,
  posOf,
  latest,
} from "@/lib/portalData";

const iqd = (n: number) => `${n.toLocaleString()} IQD`;

/* The compliance figure for one outlet, computed the same way the
   monitor will recompute it later — within RRP ±5%. */
function complianceAtOutlet(
  rows: { posId: string; variance: number }[],
  posId: string
) {
  const mine = rows.filter((r) => r.posId === posId);
  if (!mine.length) return 0;
  const within = mine.filter((r) => Math.abs(r.variance) <= 5).length;
  return Math.round((within / mine.length) * 1000) / 10;
}
const round1 = (n: number) => Math.round(n * 10) / 10;

export default function PricingView() {
  const [filters, setFilters] = useFilters();
  const view = useMemo(
    () => applyFilters(filters, latest),
    [filters]
  );

  const insights = useViewInsights(view);


  /* Concentration: which SKUs actually drive the compliance figure.
     Deliberately NOT a Pareto with a cumulative line — that needs a
     second y-axis, and a dual-axis chart invents a relationship
     between two scales the reader cannot verify. One axis (count of
     breaching readings), sorted, with the head of the distribution
     emphasised and the cumulative share stated in words instead. */
  const concentration = useMemo(() => {
    const bySku = new Map<string, number>();
    const byOutlet = new Map<string, number>();
    for (const o of view.priceRows) {
      if (!o.outlier) continue;
      bySku.set(o.skuId, (bySku.get(o.skuId) ?? 0) + 1);
      byOutlet.set(o.posId, (byOutlet.get(o.posId) ?? 0) + 1);
    }

    /* The "head" is the shortest run covering 80% of all breaches. */
    const head = (counts: Map<string, number>) => {
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      const total = sorted.reduce((s, [, n]) => s + n, 0);
      let running = 0;
      let n = 0;
      for (const [, v] of sorted) {
        if (total && running / total >= 0.8) break;
        running += v;
        n += 1;
      }
      return {
        sorted,
        total,
        headCount: n,
        headShare: total ? Math.round((running / total) * 100) : 0,
      };
    };

    const outlets = head(byOutlet);
    const skus = head(bySku);

    /* Which axis the problem actually concentrates on is a question
       about the data, not a design preference — so it is measured
       rather than assumed. On this panel breaches are FLAT across SKUs
       (13 of 20 carry 80%: nearly every pack) but sharply concentrated
       across outlets (6 of 100 audited carry 83%). That makes this a
       retailer-compliance problem, not a product-pricing one, and the
       chart is drawn on the axis where the concentration is real. */
    const skuIsFlat = skus.sorted.length
      ? skus.headCount / skus.sorted.length > 0.4
      : true;

    return {
      total: outlets.total,
      outletCount: outlets.sorted.length,
      headCount: outlets.headCount,
      headShare: outlets.headShare,
      skuHeadCount: skus.headCount,
      skuCount: skus.sorted.length,
      skuIsFlat,
      rows: outlets.sorted.map(([posId, n], i) => ({
        id: posId,
        label: posOf(posId)?.code ?? posId,
        meta: posOf(posId)?.area,
        value: n,
        emphasis: i < outlets.headCount,
      })),
    };
  }, [view.priceRows]);

  /* Bands rebuilt from the filtered observations, so filtering to a
     channel really does show that channel's spread. */
  const bands = useMemo(() => {
    const grouped = new Map<string, number[]>();
    for (const o of view.priceRows) {
      grouped.set(o.skuId, [...(grouped.get(o.skuId) ?? []), o.price]);
    }
    return [...grouped.entries()]
      .map(([skuId, prices]) => {
        const sku = skuOf(skuId)!;
        return {
          id: skuId,
          label: sku.name,
          meta: brandName(sku.brandId),
          min: Math.min(...prices),
          max: Math.max(...prices),
          avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
          rrp: sku.rrp,
          emphasis: sku.brandId === clientBrand.id,
          compliance: round1(
            (prices.filter((p) => Math.abs(p - sku.rrp) / sku.rrp <= 0.05).length /
              prices.length) *
              100
          ),
          observations: prices.length,
        };
      })
      .sort((a, b) => a.compliance - b.compliance);
  }, [view]);

  const outliers = useMemo(
    () =>
      view.priceRows
        .filter((o) => o.outlier)
        .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)),
    [view]
  );

  const categoryCompliance = bands.length
    ? round1(bands.reduce((s, b) => s + b.compliance, 0) / bands.length)
    : 0;

  const clientBands = bands.filter(
    (b) => skuOf(b.id)?.brandId === clientBrand.id
  );
  const clientCompliance = clientBands.length
    ? round1(clientBands.reduce((s, b) => s + b.compliance, 0) / clientBands.length)
    : 0;
  const avgOver = clientBands.length
    ? round1(
        clientBands.reduce((s, b) => s + ((b.avg - b.rrp) / b.rrp) * 100, 0) /
          clientBands.length
      )
    : 0;

  const outletsFlagged = new Set(outliers.map((o) => o.posId));

  /* The SHAPE of the pricing, not per-SKU ranges. The band chart shows
     each SKU's spread; only a distribution can say which SIDE of RRP
     the market sits on — and if nothing is ever priced below list,
     that is a trade-terms conversation rather than eleven separate
     retailer ones. */
  const variance = useMemo(() => {
    const bands = [
      { id: "under-10", label: "−10% or less", test: (v: number) => v < -10 },
      { id: "under-5", label: "−10 to −5%", test: (v: number) => v >= -10 && v < -5 },
      { id: "within", label: "Within ±5%", test: (v: number) => Math.abs(v) <= 5 },
      { id: "over-5", label: "+5 to +10%", test: (v: number) => v > 5 && v <= 10 },
      { id: "over-10", label: "Over +10%", test: (v: number) => v > 10 },
    ];
    const rows = view.priceRows.filter(
      (o) => skuOf(o.skuId)?.brandId === clientBrand.id
    );
    const bins = bands.map((b) => ({
      id: b.id,
      label: b.label,
      count: rows.filter((o) => b.test(o.variance)).length,
      flagged: b.id === "over-10" || b.id === "under-10",
    }));
    const above = rows.filter((o) => o.variance > 0).length;
    const below = rows.filter((o) => o.variance < 0).length;
    const floor = rows.length ? Math.min(...rows.map((o) => o.variance)) : 0;
    return { bins, total: rows.length, above, below, floor };
  }, [view.priceRows]);

  const outletWatchTargets = useMemo(
    () =>
      Object.fromEntries(
        concentration.rows.map((r) => [
          r.id,
          outletComplianceWatchTarget({
            posId: r.id,
            code: r.label,
            value: complianceAtOutlet(view.priceRows, r.id),
            visit: view.visit,
          }),
        ])
      ),
    [concentration.rows, view.priceRows, view.visit]
  );

  return (
    <div>
      <PageHeader
        title="Price Intelligence"
        lead="Shelf pricing and compliance by SKU"
        posCount={view.posCount}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        resultLabel={`${view.priceRows.length.toLocaleString()} shelf prices recorded across ${view.posCount} outlets`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={`${clientBrand.name} compliance`}
          value={`${clientCompliance}%`}
          footnote="Within RRP ±5%"
          watch={kpiWatchTarget({
            metric: "compliance",
            value: clientCompliance,
            visit: view.visit,
            filters,
            suggestedTarget: { value: 100, why: "Every line within RRP ±5%." },
          })}
        />
        <StatTile
          label="Category compliance"
          value={`${categoryCompliance}%`}
          footnote="All brands in selection"
        />
        <StatTile
          label="Average vs RRP"
          value={`${avgOver > 0 ? "+" : ""}${avgOver}%`}
          footnote={`${clientBrand.name} shelf price against list`}
        />
        {/* Category-wide, and now says so. The tile beside it and the
            histogram below are client-only, and R5 became client-only
            too in Phase 16 — leaving this one unlabelled put two
            different populations under one heading with nothing to
            tell them apart. The measure is deliberately unchanged: a
            retailer ignoring list price across every brand is exactly
            the signal this page exists to surface. */}
        <StatTile
          label="Outlets breaching"
          value={`${outletsFlagged.size}`}
          goodDirection="down"
          footnote={`${outliers.length} readings over 10% off RRP, all brands`}
        />
      </div>

      <div className="mt-4">
        {variance.total ? (
          <ChartStory
            title="Which side of list price the market sits on"
            subtitle={`${variance.total} ${clientBrand.name} shelf prices · ${scope.dataAsOf}`}
            howToRead="Each column is a band of distance from RRP and its height is how many readings fall in it. The grey columns are the compliant middle; red marks readings more than 10% out."
            findings={insights.forRules("r5-price-cluster")}
            clean="Pricing sits within RRP across this selection."
            allClear="No breaches in this selection"
            soWhat={varianceSoWhat(variance)}
            actionLabel="Create pricing action"
            visit={view.visit}
            table={{
              columns: ["Distance from RRP", "Readings"],
              rows: variance.bins.map((b) => [b.label, b.count]),
            }}
          >
            <Histogram
              bins={variance.bins}
              unitNoun="readings"
              bandLabel="Compliant — within RRP ±5%"
              bandIds={["within"]}
            />
          </ChartStory>
        ) : null}
      </div>

      <div className="mt-4">
        {concentration.rows.length ? (
          <ChartStory
            title="What drives the compliance number"
            subtitle={`${concentration.headCount} of the ${view.posCount} outlets audited carry ${concentration.headShare}% of every breach in the category`}
            howToRead="Each bar is one outlet and its length is how many of its shelf prices were more than 10% off RRP. Violet marks the few that carry most of the problem."
            findings={insights.forRules("r5-price-cluster")}
            soWhat={
              concentration.skuIsFlat
                ? `Across SKUs breaches are almost flat — ${concentration.skuHeadCount} of ${concentration.skuCount} packs make up the same 80% — so this is a retailer compliance problem, not a product pricing one. Each violet bar is one conversation.`
                : "A handful of outlets carry most of the breaches — each one is a single retailer conversation."
            }
            clean="Pricing is holding across this selection."
            allClear="No outlet clustering breaches here"
            actionLabel="Create pricing action"
            table={{
              columns: ["Outlet", "District", "Breaching readings"],
              rows: concentration.rows.map((r) => [r.label, r.meta ?? "\u2014", r.value]),
            }}
          >
            <RankedBar
              rows={concentration.rows}
              unit=""
              labelWidth={168}
              topN={6}
              watchTargets={outletWatchTargets}
            />
          </ChartStory>
        ) : (
          <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
            <h2 className="t-h3">What drives the compliance number</h2>
            <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-400">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              No reading in this selection is more than 10% away from its RRP.
            </p>
          </section>
        )}
      </div>

      <GoDeeper
        id="pricing"
        items={["Observed price range by SKU", "Outlier readings", "Compliance by SKU"]}
      >
        <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <h2 className="t-h3">Observed price range by SKU</h2>
          <p className="mt-1 mb-5 text-sm text-ink-500">
            Every shelf price recorded on {scope.dataAsOf}, against recommended
            retail. A wide band means the same pack sells at very different prices
            across the city.
          </p>
          {bands.length ? <PriceBand rows={bands} /> : <Empty />}
        </section>
  
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 overflow-hidden rounded-[18px] border border-line bg-white">
            <div className="border-b border-line p-5 sm:p-6">
              <h2 className="t-h3">Outliers</h2>
              <p className="mt-1 text-sm text-ink-500">
                Readings more than 10% away from RRP, worst first. Open an outlet
                to see everything it is mispricing.
              </p>
            </div>
            <div className="max-h-[460px] overflow-y-auto">
              {outliers.length ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-line text-[12px] uppercase tracking-wide text-ink-400">
                      <th className="px-5 py-2.5 text-left font-semibold">SKU</th>
                      <th className="px-5 py-2.5 text-left font-semibold">Outlet</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Shelf</th>
                      <th className="px-5 py-2.5 text-right font-semibold">vs RRP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outliers.map((o) => {
                      const outlet = posOf(o.posId)!;
                      return (
                        <tr key={`${o.posId}-${o.skuId}`} className="border-b border-line last:border-0">
                          <td className="px-5 py-2.5 text-ink-700">{skuName(o.skuId)}</td>
                          <td className="px-5 py-2.5">
                            <OutletButton posId={o.posId} className="!text-[13px]" />
                            <span className="block text-[12px] text-ink-400">
                              {outlet.area} · {outlet.channel}
                            </span>
                          </td>
                          <td className="mono px-5 py-2.5 text-right text-ink-900">
                            {iqd(o.price)}
                          </td>
                          <td className="mono px-5 py-2.5 text-right">
                            <span
                              className="font-semibold"
                              style={{
                                color: o.variance > 0 ? "var(--color-serious)" : "var(--color-good)",
                              }}
                            >
                              {o.variance > 0 ? "+" : "−"}
                              {Math.abs(o.variance)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="p-8 text-center text-sm text-ink-400">
                  No outliers in this selection.
                </p>
              )}
            </div>
          </section>
  
          <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
            <h2 className="t-h3">Compliance by SKU</h2>
            <p className="mt-1 mb-4 text-sm text-ink-500">
              Share of outlets pricing within ±5% of RRP.
            </p>
            <div className="space-y-2.5">
              {bands.slice(0, 12).map((b) => (
                <div key={b.id}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate text-[13px] ${
                        b.emphasis ? "font-semibold text-ink-900" : "text-ink-700"
                      }`}
                    >
                      {b.label}
                    </span>
                    <span className="mono shrink-0 text-[13px] font-semibold text-ink-900">
                      {b.compliance}%
                    </span>
                  </div>
                  <div className="mt-1 h-[6px] rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${b.compliance}%`,
                        background: b.emphasis
                          ? "var(--color-violet)"
                          : "var(--color-chart-context)",
                      }}
                    />
                  </div>
                </div>
              ))}
              {!bands.length && <Empty />}
            </div>
          </section>
      </div>
      </GoDeeper>
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

/* One-directional pricing is a different problem from scattered
   non-compliance, so the sentence says which this is — measured from
   the actual asymmetry rather than asserted.

   Care is needed with "nothing is below list": readings can sit
   fractionally under RRP and still fall inside the compliant band, so
   the claim has to come from counting variances, not from reading the
   bins. Getting that wrong overstates a real finding into a false
   one. */
function varianceSoWhat(v: {
  total: number;
  above: number;
  below: number;
  floor: number;
}) {
  const pct = v.total ? Math.round((v.above / v.total) * 100) : 0;
  const belowShare = v.total ? Math.round((v.below / v.total) * 100) : 0;
  if (pct >= 60 && belowShare <= 5) {
    return `${pct}% of readings sit above list and nothing falls more than ${Math.abs(
      Math.round(v.floor)
    )}% below it. That asymmetry is a systematic markup, not scattered non-compliance — it is a trade-terms conversation before it is eleven retailer ones.`;
  }
  return `${pct}% of readings sit above RRP. Worth checking whether the pressure is coming from a few retailers or the whole trade.`;
}
