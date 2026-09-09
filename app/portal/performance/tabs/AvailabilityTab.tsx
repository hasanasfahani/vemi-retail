"use client";

/* AVAILABILITY — is the product on the shelf where it is listed.

   Listings are the denominator throughout, never outlets: an outlet
   that never carried Pepsi 2.25L has not "run out" of it, and counting
   it as a failure would make the range look like a supply problem. */

import { Card, StatCard } from "@/components/market/ui";
import Headline from "@/components/market/Headline";
import { ChartLegend, Heatmap, RankedBars, ShareDonut, StackedBars, brandColor, MEASURE } from "@/components/market/charts";
import { scoreBand } from "@/components/market/ui/health";
import { availability, movement } from "@/lib/market/performance";
import { cities, cityName } from "@/lib/market";
import { useTargets } from "@/components/market/useTargets";
import type { MarketView } from "@/lib/market/filters";

export default function AvailabilityTab({ view }: { view: MarketView }) {
  const targets = useTargets();
  const a = availability(view);
  const move = movement(view, "availability");

  const worstCity = a.byCity[a.byCity.length - 1];

  return (
    <div className="flex flex-col gap-4">
      <Headline
        label="On-shelf availability"
        value={a.rate}
        target={targets.availability}
        delta={move.delta}
        deltaFloor={move.floor}
        problem={
          a.worstSku ? (
            <>
              <strong className="font-semibold text-ink-900">{a.worstSku.label}</strong> at{" "}
              {a.worstSku.value}% — {a.worstSku.shareOfGaps}% of every detected gap
            </>
          ) : null
        }
        location={
          worstCity ? (
            <>
              Weakest in <strong className="font-semibold text-ink-900">{worstCity.label}</strong> at{" "}
              {worstCity.value}%, across {worstCity.outlets.toLocaleString()} audited outlets
            </>
          ) : null
        }
        action={
          a.worstSku
            ? { href: `/portal/pos?sku=${a.worstSku.id}`, label: "View affected outlets" }
            : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Listings checked" value={a.listings} footnote="Client SKU × outlet pairs audited this month" />
        <StatCard label="Gaps found" value={a.gaps} band={a.gaps > 0 ? "attention" : "strong"} footnote="Listed lines standing empty on the visit" />
        <StatCard label="Outlets audited" value={view.posCount} footnote={`${view.coveragePct}% of the outlets in scope`} />
        <StatCard label="Execution score" value={view.kpi.score} target={targets.score} band={scoreBand(view.kpi.score)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Availability by city" lead="Client listings on shelf, per city.">
          <RankedBars
            rows={a.byCity.map((row) => ({
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
        lead="Out-of-stock counts by SKU and city."
        footnote="Cells count listed lines found empty. A dash means no audited outlet in that city listed the SKU."
      >
        <Heatmap
          tone="bad"
          rows={a.bySku.map((row) => ({ id: row.id, label: row.label }))}
          columns={cities.map((c) => ({ id: c.id, label: c.name }))}
          value={(skuId, cityId) => a.gapAt(skuId, cityId)}
          cellLabel={(skuId, cityId, v) =>
            `${a.bySku.find((s) => s.id === skuId)?.label} · ${cityName(cityId)}: ${v} out of stock`
          }
        />
      </Card>
    </div>
  );
}
