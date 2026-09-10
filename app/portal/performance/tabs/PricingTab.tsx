"use client";

import { useMemo } from "react";

/* PRICING — is the brand sold at the price it is supposed to be.

   Compliance is ±5% of RRP, and the direction matters: a line 12%
   under list is a margin problem, one 12% over is a volume problem,
   and an average that mixes them says neither. */

import { countDetail } from "@/lib/market/bandDetail";
import { Card, DataTable, StatCard, type Column, type Facet } from "@/components/market/ui";
import WatchEye from "@/components/market/WatchEye";
import KpiGapBar from "@/components/market/KpiGapBar";
import DownloadGaps from "@/components/market/DownloadGaps";
import RequestFollowUp from "@/components/market/RequestFollowUp";
import { RankedBars, brandColor } from "@/components/market/charts";
import Badge from "@/components/market/ui/Badge";
import { pricing } from "@/lib/market/performance";
import { brandOf, governorateName, contract } from "@/lib/market";
import { useTargets } from "@/components/market/useTargets";
import { issuesFor, scopeOf } from "@/lib/market/issues";
import type { MarketView } from "@/lib/market/filters";

const iqd = (n: number) => `${n.toLocaleString()} ${contract.currency}`;

export default function PricingTab({ view }: { view: MarketView }) {
  const targets = useTargets();
  const p = pricing(view);

  /* The gaps this tab is about, under whatever filter is active —
     the same records the export writes and a follow-up request will
     carry, so the header, the file and the request cannot disagree. */
  const issues = useMemo(() => issuesFor(view, "price"), [view]);
  const scope = useMemo(() => scopeOf(issues), [issues]);
  /* How the market is actually spread on this measure — the thing
     the headline average is worst at telling you. */
  const spread = useMemo(
    () => view.scores.map((s) => s.price).filter((v): v is number => v !== null),
    [view]
  );
  const overs = p.distribution.filter((d) => d.id.startsWith("over")).reduce((s, d) => s + d.value, 0);
  const unders = p.distribution.filter((d) => d.id.startsWith("under")).reduce((s, d) => s + d.value, 0);

  type Outlier = (typeof p.outliers)[number];
  const columns: Column<Outlier>[] = [
    {
      id: "outlet",
      header: "Outlet",
      render: (r) => (
        <span className="font-medium text-ink-900">{r.outlet?.name ?? r.posId}</span>
      ),
      sortValue: (r) => r.outlet?.name ?? r.posId,
      csv: (r) => r.outlet?.name ?? r.posId,
    },
    {
      id: "governorate",
      header: "Governorate",
      render: (r) => (r.outlet ? governorateName(r.outlet.governorateId) : "—"),
      sortValue: (r) => (r.outlet ? governorateName(r.outlet.governorateId) : ""),
    },
    { id: "sku", header: "SKU", render: (r) => r.sku?.name ?? r.skuId, sortValue: (r) => r.sku?.name ?? r.skuId },
    { id: "rrp", header: "RRP", align: "right", render: (r) => iqd(r.rrp), sortValue: (r) => r.rrp },
    { id: "price", header: "Observed", align: "right", render: (r) => iqd(r.price), sortValue: (r) => r.price },
    {
      id: "variance",
      header: "Variance",
      align: "right",
      sortValue: (r) => Math.abs(r.variance),
      csv: (r) => r.variance,
      render: (r) => (
        <Badge
          band={Math.abs(r.variance) > 10 ? "critical" : "attention"}
          label={`${r.variance > 0 ? "+" : ""}${r.variance}%`}
          size="sm"
        />
      ),
    },
  ];

  /* Twelve rows of the worst variances, and the first question anyone
     asks is "which of these are mine to fix?" — a city, or a line. */
  const outlierFacets: Facet<Outlier>[] = [
    { id: "governorate", label: "Governorate", value: (r) => (r.outlet ? governorateName(r.outlet.governorateId) : "—") },
    { id: "sku", label: "SKU", value: (r) => r.sku?.name ?? r.skuId },
  ];

  return (
    <div className="flex flex-col gap-4">
      <KpiGapBar
        label="Price compliance"
        value={p.compliance}
        target={targets.price}
        spread={spread}
        affectedPos={scope.affectedPos}
        issues={scope.issues}
        issueNoun="readings off list"
        actions={
          <>
            <DownloadGaps kpi="price" issues={issues} view={view} full={view} />
            <RequestFollowUp kpi="price" issues={issues} view={view} />
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Readings taken"
          value={p.readings}
          explain="One reading is one client SKU's shelf price at one outlet, recorded on the visit. Lines the outlet does not carry produce no reading, so this is smaller than the listings checked on the Availability tab."
          footnote="Client price observations this month"
        />
        <StatCard
          label="Above list"
          value={overs}
          band={overs > unders ? "attention" : "average"}
          detail={countDetail({
            count: overs,
            total: p.readings,
            of: "price readings",
            against: { label: "Below list", count: unders },
            footnote:
              "Over-pricing costs volume: the shopper sees a higher shelf price than the brand set and buys something else.",
          })}
          explain="Readings more than 5% over the recommended price. The 5% band is the tolerance the audit treats as compliant; anything inside it is not counted here."
          footnote="Readings more than 5% over RRP — a volume risk"
        />
        <StatCard
          label="Below list"
          value={unders}
          band="average"
          detail={countDetail({
            count: unders,
            total: p.readings,
            of: "price readings",
            against: { label: "Above list", count: overs },
            footnote:
              "Under-pricing costs margin rather than volume, which is why it bands more gently than the other side.",
          })}
          explain="Readings more than 5% under the recommended price — the same 5% tolerance, in the other direction."
          footnote="Readings more than 5% under RRP — a margin risk"
        />
        <StatCard
          label="Worst variance"
          value={p.outliers[0] ? `${p.outliers[0].variance > 0 ? "+" : ""}${p.outliers[0].variance}%` : "—"}
          band="critical"
          detail={
            p.outliers[0]
              ? {
                  lead: `${p.outliers[0].variance > 0 ? "+" : ""}${p.outliers[0].variance}% away from list — the single widest reading in the current scope.`,
                  rows: [
                    { label: "Outlet", value: p.outliers[0].outlet?.name ?? "—" },
                    { label: "Reading", value: `${p.outliers[0].variance > 0 ? "+" : ""}${p.outliers[0].variance}%`, here: true },
                    { label: "Compliant band", value: "within ±5%" },
                    { label: "Readings outside it", value: (overs + unders).toLocaleString() },
                  ],
                  footnote:
                    "One outlet, not a pattern. It is shown because the widest single breach is usually the one somebody can fix on the next visit.",
                }
              : null
          }
          explain="The single largest distance from the recommended price anywhere in the current scope. A worst case, not an average — the tab's compliance rate is the average."
          footnote={p.outliers[0]?.outlet?.name}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Average price by SKU"
          lead="Observed shelf price against the recommended price."
          footnote="Bars show the observed average; the tick is the list price, so distance from the tick is the story."
        >
          <RankedBars
            rows={p.bySku.map((sku) => ({
              id: sku.id,
              label: sku.name,
              value: sku.average,
              color: brandColor(sku.brandId),
              meta: `${brandOf(sku.brandId)?.name} · list ${iqd(sku.rrp)} · ${sku.readings} readings · range ${sku.spread.min}–${sku.spread.max}`,
            }))}
            unit={` ${contract.currency}`}
            max={Math.max(...p.bySku.map((s) => Math.max(s.average, s.rrp))) * 1.05}
          />
        </Card>

        <div className="flex flex-col gap-4">
          <Card
            title="How far from list"
            lead="Client readings, banded by distance from RRP."
            footnote="A tight peak on list is discipline; a long tail on either side is a conversation with the retailer."
          >
            <RankedBars
              rows={p.distribution.map((band) => ({
                id: band.id,
                label: band.label,
                value: band.value,
                color: band.id === "at-list" ? "var(--color-good)" : "var(--color-serious)",
              }))}
            />
          </Card>

          <Card title="Compliance by governorate" lead="Share of client readings within 5% of list.">
            <RankedBars
              rows={p.byGovernorate.map((row) => ({
                id: row.id,
                label: row.label,
                value: row.compliance,
                watch: (
                  <WatchEye
                    kpi="price"
                    scope={{ governorateId: row.id }}
                    value={row.compliance}
                    target={targets.price}
                    month={view.month}
                    size="sm"
                  />
                ),
                meta: `average ${iqd(row.average)} · ${row.readings.toLocaleString()} readings`,
              }))}
              max={100}
              par={targets.price}
              unit="%"
            />
          </Card>
        </div>
      </div>

      <Card
        title="Price outliers"
        lead="The readings furthest from list, worst first. Filter by city or SKU to find the ones that are yours to fix."
        padded={false}
      >
        <DataTable
          rows={p.outliers}
          columns={columns}
          facets={outlierFacets}
          rowKey={(r) => `${r.posId}-${r.skuId}`}
          defaultSort={{ id: "variance", dir: "desc" }}
          exportName="price-outliers"
          pageSize={12}
          dense
        />
      </Card>
    </div>
  );
}
