"use client";

import { useMemo } from "react";

/* ASSORTMENT — is the right range listed, format by format.

   Compliance is measured against what each CHANNEL is expected to
   carry, not against the full six-SKU range: a corner grocery was
   never asked to stock 2.25L bottles, and judging it against the
   hypermarket standard would manufacture a failure the field team
   cannot fix. */

import { rateBandDetail } from "@/lib/market/bandDetail";
import WatchEye from "@/components/market/WatchEye";
import StatusChip from "@/components/market/ui/StatusChip";
import { rateBand } from "@/components/market/ui/health";
import { Card, StatCard } from "@/components/market/ui";
import KpiGapBar from "@/components/market/KpiGapBar";
import DownloadGaps from "@/components/market/DownloadGaps";
import RequestFollowUp from "@/components/market/RequestFollowUp";
import { DotPlot, Heatmap, RankedBars } from "@/components/market/charts";
import { assortment } from "@/lib/market/performance";
import { governorates, governorateName, clientBrand, requiredSkus, skus } from "@/lib/market";
import { useTargets } from "@/components/market/useTargets";
import { issuesFor, scopeOf } from "@/lib/market/issues";
import type { MarketView } from "@/lib/market/filters";

export default function AssortmentTab({ view }: { view: MarketView }) {
  const targets = useTargets();
  const a = assortment(view);

  /* The gaps this tab is about, under whatever filter is active —
     the same records the export writes and a follow-up request will
     carry, so the header, the file and the request cannot disagree. */
  const issues = useMemo(() => issuesFor(view, "assortment"), [view]);
  const scope = useMemo(() => scopeOf(issues), [issues]);
  /* How the market is actually spread on this measure — the thing
     the headline average is worst at telling you. */
  const spread = useMemo(
    () => view.scores.map((s) => s.assortment).filter((v): v is number => v !== null),
    [view]
  );
  const clientSkus = skus.filter((s) => s.brandId === clientBrand.id);
  const worstSku = a.penetration[a.penetration.length - 1];

  return (
    <div className="flex flex-col gap-4">
      <KpiGapBar
        label="Assortment compliance"
        value={a.compliance}
        target={targets.assortment}
        spread={spread}
        affectedPos={scope.affectedPos}
        issues={scope.issues}
        issueNoun="missing listings"
        actions={
          <>
            <DownloadGaps kpi="assortment" issues={issues} view={view} full={view} />
            <RequestFollowUp kpi="assortment" issues={issues} view={view} />
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="SKUs in range"
          value={clientSkus.length}
          explain="Client lines the audit tracks. Every penetration figure on this tab divides by the outlets audited, never by this — a line is measured across doors, not against its siblings."
          footnote="Client lines monitored under the audit"
        />
        <StatCard
          label="Outlets audited"
          value={view.posCount}
          explain="Outlets the field team reached this cycle. Penetration is the share of THESE that list a line — an outlet nobody visited is not an outlet that refused the range."
          watch={
            <WatchEye
              kpi="assortment"
              scope={{}}
              value={view.kpi.assortment}
              target={targets.assortment}
              month={view.month}
              size="sm"
            />
          }
          footnote={`${view.coveragePct}% of the outlets in scope`}
        />
        {/* Penetration has no stated target — the audit does not say
            what share of doors a SKU ought to reach — so these two
            state the range and let the reader judge it. Inventing a
            band here would be asserting a standard nobody set. */}
        <StatCard
          label="Widest SKU"
          value={a.penetration[0]?.value ?? 0}
          unit="%"
          explain="The client line carried by the largest share of audited outlets. There is no band on this tile: the audit states no target for how many doors a single line should reach, and inventing one would assert a standard nobody set."
          watch={
            a.penetration[0] ? (
              <WatchEye
                kpi="assortment"
                scope={{ skuId: a.penetration[0].id }}
                value={a.penetration[0].value}
                target={targets.assortment}
                month={view.month}
                size="sm"
              />
            ) : undefined
          }
          footnote={a.penetration[0]?.label}
        />
        <StatCard
          label="Narrowest SKU"
          value={worstSku?.value ?? 0}
          unit="%"
          explain="The client line carried by the smallest share of audited outlets — the widest distribution headroom in the range, and the one a rep can sell against on the next visit."
          watch={
            worstSku ? (
              <WatchEye
                kpi="assortment"
                scope={{ skuId: worstSku.id }}
                value={worstSku.value}
                target={targets.assortment}
                month={view.month}
                size="sm"
              />
            ) : undefined
          }
          footnote={worstSku?.label}
        />
      </div>

      <Card
        title="Range by SKU and governorate"
        lead="Share of audited outlets in each governorate that list the SKU."
        footnote="Penetration, not stock: this says whether the door carries the line at all. Whether it was on shelf that day is the Availability tab's question."
      >
        {/* One eye per line, above the grid — a heatmap cell is a
            SKU-and-place pair, and the watchlist slices one dimension
            at a time, so the row is the honest unit to pin. */}
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {clientSkus.map((sku) => {
            const row = a.penetration.find((r) => r.id === sku.id);
            return (
              <span key={sku.id} className="inline-flex items-center gap-0.5 text-[11px] text-ink-500">
                {sku.name}
                <WatchEye
                  kpi="assortment"
                  scope={{ skuId: sku.id }}
                  value={row?.value ?? 0}
                  target={targets.assortment}
                  month={view.month}
                  size="sm"
                />
              </span>
            );
          })}
        </div>
        <Heatmap
          rows={clientSkus.map((s) => ({ id: s.id, label: s.name }))}
          columns={governorates.map((c) => ({ id: c.id, label: c.name }))}
          value={(skuId, governorateId) => a.penetrationAt(skuId, governorateId)}
          unit="%"
          min={0}
          max={100}
          cellLabel={(skuId, governorateId, v) =>
            `${skus.find((s) => s.id === skuId)?.name} listed in ${v}% of audited ${governorateName(governorateId)} outlets`
          }
          legend="Scaled 0–100%, so a pale cell is a genuine distribution gap rather than a relative one."
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="SKU penetration" lead="Audited outlets listing each client line.">
          <DotPlot
            rows={a.penetration.map((row) => ({
              id: row.id,
              label: row.label,
              value: row.value,
              watch: (
                <WatchEye
                  kpi="assortment"
                  scope={{ skuId: row.id }}
                  value={row.value}
                  target={targets.assortment}
                  month={view.month}
                  size="sm"
                />
              ),
            }))}
            min={0}
            max={100}
            unit="%"
          />
        </Card>

        <Card
          title="Compliance by channel"
          lead="Against the range each format is expected to carry."
          footnote={`Expected range: ${Object.entries(requiredSkus)
            .map(([channel, n]) => `${channel.replace("-", " ")} ${n}`)
            .join(" · ")}`}
        >
          <RankedBars
            rows={a.byChannel.map((row) => ({
              id: row.id,
              label: row.label,
              value: row.value,
              meta: `${row.listed} listed on average · ${row.required} expected in this format · ${row.outlets.toLocaleString()} outlets`,
              trailing: (
                <StatusChip
                  band={rateBand(row.value, targets.assortment)}
                  size="sm"
                  title={`${row.label}: range carried`}
                  detail={{
                    ...rateBandDetail(row.value, targets.assortment),
                    footnote: `Measured against what THIS format is expected to carry — ${row.required} client lines — not against the widest format in the market. A kiosk holding its whole expected range is complying, whatever a hypermarket carries.`,
                  }}
                />
              ),
              watch: (
                <WatchEye
                  kpi="assortment"
                  scope={{ channel: row.id }}
                  value={row.value}
                  target={targets.assortment}
                  month={view.month}
                  size="sm"
                />
              ),
            }))}
            max={100}
            par={targets.assortment}
            unit="%"
          />
        </Card>
      </div>
    </div>
  );
}
