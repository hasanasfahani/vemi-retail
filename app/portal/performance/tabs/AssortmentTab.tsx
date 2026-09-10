"use client";

import { useMemo } from "react";

/* ASSORTMENT — is the right range listed, format by format.

   Compliance is measured against what each CHANNEL is expected to
   carry, not against the full six-SKU range: a corner grocery was
   never asked to stock 2.25L bottles, and judging it against the
   hypermarket standard would manufacture a failure the field team
   cannot fix. */

import { Card, StatCard } from "@/components/market/ui";
import KpiGapBar from "@/components/market/KpiGapBar";
import DownloadGaps from "@/components/market/DownloadGaps";
import RequestFollowUp from "@/components/market/RequestFollowUp";
import { Heatmap, RankedBars, brandColor } from "@/components/market/charts";
import Badge from "@/components/market/ui/Badge";
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
        <StatCard label="SKUs in range" value={clientSkus.length} footnote="Client lines monitored under the audit" />
        <StatCard label="Outlets audited" value={view.posCount} footnote={`${view.coveragePct}% of the outlets in scope`} />
        {/* Penetration has no stated target — the audit does not say
            what share of doors a SKU ought to reach — so these two
            state the range and let the reader judge it. Inventing a
            band here would be asserting a standard nobody set. */}
        <StatCard label="Widest SKU" value={a.penetration[0]?.value ?? 0} unit="%" footnote={a.penetration[0]?.label} />
        <StatCard label="Narrowest SKU" value={worstSku?.value ?? 0} unit="%" footnote={worstSku?.label} />
      </div>

      <Card
        title="Range by SKU and governorate"
        lead="Share of audited outlets in each governorate that list the SKU."
        footnote="Penetration, not stock: this says whether the door carries the line at all. Whether it was on shelf that day is the Availability tab's question."
      >
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
          <RankedBars
            rows={a.penetration.map((row) => ({
              id: row.id,
              label: row.label,
              value: row.value,
              color: brandColor(clientBrand.id),
              meta: `${row.outlets.toLocaleString()} listing · ${row.missing.toLocaleString()} not carrying it`,
            }))}
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
                <Badge
                  band={row.value >= targets.assortment ? "strong" : row.value >= targets.assortment - 9 ? "average" : "attention"}
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
