/* Computing a monitor's number.

   One implementation, used both when a monitor is pinned and when the
   Watchlist records a later reading. If pinning used the chart's own
   figure and the Watchlist recomputed it a different way, a monitor
   would open showing a baseline that never matched the line beneath
   it — and the reader would be right not to trust either.

   Everything here derives from the same `applyFilters` view the charts
   read, so a monitor is the chart's number by construction. */

import { applyFilters, EMPTY_FILTERS, type Filters } from "./portalFilters";
import { clientBrand, posOf, skuOf, type VisitData } from "./portalData";
import type { MonitorMetric, SegmentType } from "./monitorsShared";

export type MonitorScope = {
  metric: MonitorMetric;
  segmentType: SegmentType;
  segment: string;
  filters?: Partial<Filters>;
};

/* The filter slice a monitor watches. The segment is folded into the
   filters, so "shelf share in Bakhtiari" is literally the shelf-share
   number of the Bakhtiari-filtered view. */
export function filtersForScope(scope: MonitorScope, visit: string): Filters {
  const base: Filters = {
    ...EMPTY_FILTERS,
    ...scope.filters,
    visit,
  };
  switch (scope.segmentType) {
    case "area":
      return { ...base, areas: [scope.segment] };
    case "channel":
      return { ...base, channels: [scope.segment] };
    default:
      return base;
  }
}

export function computeMetric(
  scope: MonitorScope,
  data: VisitData
): number | null {
  const filters = filtersForScope(scope, data.visit);
  const view = applyFilters(filters, data);

  /* SKU- and outlet-scoped monitors narrow inside the view rather than
     through the filter bar, which has no SKU or outlet dimension. */
  const cells =
    scope.segmentType === "sku"
      ? view.cells.filter((c) => c.skuId === scope.segment)
      : scope.segmentType === "outlet"
        ? view.cells.filter((c) => c.posId === scope.segment)
        : view.cells;

  if (!cells.length) return null;

  /* Which brand the monitor is about. Every metric defaults to the
     client, but a brand-scoped monitor watches a rival — and getting
     this wrong would be the worst kind of bug on this page: a card
     labelled "Coca-Cola shelf share" quietly recording Pepsi's. */
  const subjectBrand =
    scope.segmentType === "brand" ? scope.segment : clientBrand.id;
  const isSubject = (skuId: string) => skuOf(skuId)?.brandId === subjectBrand;

  switch (scope.metric) {
    case "shelf-share": {
      const stocked = cells.filter((c) => c.state === "in-stock");
      const total = stocked.reduce((s, c) => s + c.facings, 0);
      if (!total) return null;
      const mine = stocked
        .filter((c) => isSubject(c.skuId))
        .reduce((s, c) => s + c.facings, 0);
      return round1((mine / total) * 100);
    }
    case "availability": {
      const listed = cells.filter(
        (c) => c.state !== "not-listed" && isSubject(c.skuId)
      );
      if (!listed.length) return null;
      const onShelf = listed.filter((c) => c.state === "in-stock").length;
      return round1((onShelf / listed.length) * 100);
    }
    case "distribution": {
      const outlets = new Set(cells.map((c) => c.posId)).size;
      if (!outlets) return null;
      const listedPairs = cells.filter(
        (c) => c.state !== "not-listed" && isSubject(c.skuId)
      );
      const clientSkus = new Set(
        cells.filter((c) => isSubject(c.skuId)).map((c) => c.skuId)
      ).size;
      if (!clientSkus) return null;
      return round1((listedPairs.length / (outlets * clientSkus)) * 100);
    }
    case "compliance": {
      const rows = view.priceRows.filter(
        (o) =>
          isSubject(o.skuId) &&
          (scope.segmentType !== "sku" || o.skuId === scope.segment) &&
          (scope.segmentType !== "outlet" || o.posId === scope.segment)
      );
      if (!rows.length) return null;
      const within = rows.filter(
        (o) => Math.abs(o.variance) <= 5
      ).length;
      return round1((within / rows.length) * 100);
    }
    case "gaps": {
      return cells.filter(
        (c) => c.state === "out-of-stock" && isSubject(c.skuId)
      ).length;
    }
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/* A human label for the thing being watched, built once at pin time so
   the Watchlist never has to re-derive names from ids. */
export function labelForScope(
  scope: MonitorScope,
  metricLabel: string,
  brandName: string
): string {
  const who =
    scope.segmentType === "panel"
      ? "citywide"
      : scope.segmentType === "sku"
        ? skuOf(scope.segment)?.name ?? scope.segment
        : scope.segmentType === "outlet"
          ? posOf(scope.segment)?.code ?? scope.segment
          : scope.segment;
  return `${brandName} ${metricLabel.toLowerCase()} · ${who}`;
}
