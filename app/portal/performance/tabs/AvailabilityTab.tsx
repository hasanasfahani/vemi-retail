"use client";

import { useMemo } from "react";

/* AVAILABILITY — is the product on the shelf where it is listed.

   Listings are the denominator throughout, never outlets: an outlet
   that never carried Pepsi 2.25L has not "run out" of it, and counting
   it as a failure would make the range look like a supply problem. */

import { Card, StatCard } from "@/components/market/ui";
import KpiGapBar from "@/components/market/KpiGapBar";
import DownloadGaps from "@/components/market/DownloadGaps";
import RequestFollowUp from "@/components/market/RequestFollowUp";
import { ChartLegend, Heatmap, RankedBars, ShareDonut, StackedBars, brandColor, MEASURE } from "@/components/market/charts";
import { scoreBand } from "@/components/market/ui/health";
import { availability } from "@/lib/market/performance";
import { governorates, governorateName } from "@/lib/market";
import { useTargets } from "@/components/market/useTargets";
import { issuesFor, scopeOf } from "@/lib/market/issues";
import type { MarketView } from "@/lib/market/filters";

export default function AvailabilityTab({ view }: { view: MarketView }) {
  const targets = useTargets();
  const a = availability(view);

  /* The gaps this tab is about, under whatever filter is active —
     the same records the export writes and a follow-up request will
     carry, so the header, the file and the request cannot disagree. */
  const issues = useMemo(() => issuesFor(view, "availability"), [view]);
  const scope = useMemo(() => scopeOf(issues), [issues]);
  /* How the market is actually spread on this measure — the thing
     the headline average is worst at telling you. */
  const spread = useMemo(
    () => view.scores.map((s) => s.availability).filter((v): v is number => v !== null),
    [view]
  );


  return (
    <div className="flex flex-col gap-4">
      <KpiGapBar
        label="Availability"
        value={a.rate}
        target={targets.availability}
        spread={spread}
        affectedPos={scope.affectedPos}
        issues={scope.issues}
        issueNoun="SKU availability gaps"
        actions={
          <>
            <DownloadGaps kpi="availability" issues={issues} view={view} full={view} />
            <RequestFollowUp kpi="availability" issues={issues} view={view} />
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Listings checked" value={a.listings} footnote="Client SKU × outlet pairs audited this month" />
        <StatCard label="Gaps found" value={a.gaps} band={a.gaps > 0 ? "attention" : "strong"} footnote="Listed lines standing empty on the visit" />
        <StatCard label="Outlets audited" value={view.posCount} footnote={`${view.coveragePct}% of the outlets in scope`} />
        <StatCard label="Execution score" value={view.kpi.score} target={targets.score} band={scoreBand(view.kpi.score)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Availability by governorate" lead="Client listings on shelf, per governorate.">
          <RankedBars
            rows={a.byGovernorate.map((row) => ({
              id: row.id,
              label: row.label,
              value: row.value,
              meta: `${row.listings.toLocaleString()} listings across ${row.outlets.toLocaleString()} outlets`,
            }))}
            max={100}
            par={targets.availability}
            unit="%"
          />
        </Card>

        <Card
          title="Availability by channel"
          lead="The client against every other brand in the same format."
          action={
            <ChartLegend
              items={[
                { id: "client", name: "Pepsi", color: MEASURE },
                { id: "category", name: "Rest of category", color: "var(--color-comp-1)" },
              ]}
            />
          }
          footnote="A rate is only good or bad relative to what everyone else in that format achieves."
        >
          <StackedBars
            data={a.byChannel.map((row) => ({
              label: row.label,
              client: row.client,
              category: row.category,
            }))}
            series={[
              { key: "client", name: "Pepsi", color: MEASURE },
              { key: "category", name: "Rest of category", color: "var(--color-comp-1)" },
            ]}
            mode="grouped"
            max={100}
            height={230}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card
          title="Availability by SKU"
          lead="Worst first — the line to fix, not the range to admire."
          footnote="Measured only where the SKU is listed, so a SKU nobody stocks cannot look like one everybody has run out of."
        >
          <RankedBars
            rows={a.bySku.map((row) => ({
              id: row.id,
              label: row.label,
              value: row.value,
              color: brandColor("pepsi"),
              meta: `${row.out} gaps across ${row.listed.toLocaleString()} listings`,
            }))}
            max={100}
            par={targets.availability}
            unit="%"
          />
        </Card>

        <Card title="Why the shelf was empty" lead="Reason recorded by the auditor who found the gap.">
          <ShareDonut
            palette="category"
            slices={a.byReason.map((row) => ({ id: row.id, name: row.name, value: row.value }))}
            centerValue={a.gaps.toLocaleString()}
            centerLabel="gaps"
          />
        </Card>
      </div>

      <Card
        title="Where each SKU is failing"
        lead="Out-of-stock counts by SKU and governorate."
        footnote="Cells count listed lines found empty. A dash means no audited outlet in that governorate listed the SKU."
      >
        <Heatmap
          tone="bad"
          rows={a.bySku.map((row) => ({ id: row.id, label: row.label }))}
          columns={governorates.map((c) => ({ id: c.id, label: c.name }))}
          value={(skuId, governorateId) => a.gapAt(skuId, governorateId)}
          cellLabel={(skuId, governorateId, v) =>
            `${a.bySku.find((s) => s.id === skuId)?.label} · ${governorateName(governorateId)}: ${v} out of stock`
          }
        />
      </Card>
    </div>
  );
}
