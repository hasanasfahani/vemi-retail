"use client";

import { useMemo } from "react";

/* SHELF & VISIBILITY — how much of the fixture the brand holds, and
   at what height.

   Share and position are different arguments: holding par overall
   while losing eye level is a real, specific problem that an aggregate
   share figure hides completely. */

import { Card, StatCard } from "@/components/market/ui";
import KpiGapBar from "@/components/market/KpiGapBar";
import DownloadGaps from "@/components/market/DownloadGaps";
import ShelfCard from "@/components/market/ShelfCard";
import {
  ChartLegend, RankedBars, ShareDonut, StackedBars, brandColor, orderedBrands,
} from "@/components/market/charts";
import { shelf } from "@/lib/market/performance";
import { clientBrand } from "@/lib/market";
import { useTargets } from "@/components/market/useTargets";
import { issuesFor, scopeOf } from "@/lib/market/issues";
import type { MarketView } from "@/lib/market/filters";

export default function ShelfTab({ view }: { view: MarketView }) {
  const s = shelf(view);

  /* The gaps this tab is about, under whatever filter is active —
     the same records the export writes and a follow-up request will
     carry, so the header, the file and the request cannot disagree. */
  const issues = useMemo(() => issuesFor(view, "shelfShare"), [view]);
  const scope = useMemo(() => scopeOf(issues), [issues]);
  const targets = useTargets();
  const par = targets.shelfShare;
  const ordered = orderedBrands();
  const stack = ordered.map((b) => ({ key: b.id, name: b.name, color: brandColor(b.id) }));

  const eye = s.positions.find((p) => p.id === "eye");

  const cardFor = (row: { posId: string; share: number }, caption: string) => {
    const outlet = view.outlets.find((p) => p.id === row.posId);
    if (!outlet) return null;
    return (
      <ShelfCard
        key={row.posId}
        outlet={outlet}
        cells={view.cells.filter((c) => c.posId === row.posId)}
        score={view.scores.find((sc) => sc.posId === row.posId)?.score}
        auditedAt={view.auditedAt.get(row.posId)}
        caption={`${caption} · ${row.share}% of this shelf`}
      />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <KpiGapBar
        label="Share of shelf"
        value={s.clientShare}
        target={par}
        affectedPos={scope.affectedPos}
        issues={scope.issues}
        issueNoun="outlets below par"
        actions={<DownloadGaps kpi="shelfShare" issues={issues} view={view} full={view} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {s.byBrand.slice(0, 4).map((brand) => (
          <StatCard
            key={brand.id}
            label={brand.name}
            value={brand.share}
            unit="%"
            band={brand.id === clientBrand.id ? (brand.share >= par ? "strong" : "attention") : undefined}
            footnote={`${brand.perOutlet} facings per stocking outlet · ${brand.outlets.toLocaleString()} outlets`}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card
          title="Shelf battle by governorate"
          lead="Share of measured facings, 100% stacked."
          action={<ChartLegend items={ordered.map((b) => ({ id: b.id, name: b.name, color: brandColor(b.id) }))} />}
        >
          <StackedBars data={s.byGovernorate} series={stack} max={100} height={250} />
        </Card>

        <Card title="Shelf split this month" lead="Every audited facing, by brand.">
          <ShareDonut
            slices={s.byBrand.map((b) => ({ id: b.id, name: b.name, value: b.facings }))}
            centerValue={`${s.clientShare}%`}
            centerLabel={clientBrand.name}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Shelf battle by channel" lead="The same fixture question, by retail format.">
          <StackedBars data={s.byChannel} series={stack} max={100} height={230} />
        </Card>

        <Card
          title="Position on the shelf"
          lead={`${clientBrand.name}'s share of facings at each height.`}
          footnote="Eye level is the space worth negotiating for. Holding par overall while losing it is a different problem from losing share outright."
        >
          <RankedBars
            rows={s.positions.map((p) => ({
              id: p.id,
              label: p.label,
              value: p.clientShare,
              color: brandColor(clientBrand.id),
              meta: `${p.total.toLocaleString()} facings measured at this height`,
              trailing:
                eye && p.id !== "eye" ? (
                  <span className="mono shrink-0 text-[11px] text-ink-400">
                    {p.clientShare > eye.clientShare ? "+" : ""}
                    {Math.round((p.clientShare - eye.clientShare) * 10) / 10}pt vs eye
                  </span>
                ) : undefined,
            }))}
            max={100}
            par={par}
            unit="%"
          />
        </Card>
      </div>

      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Best executing shelves
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.best.map((row) => cardFor(row, "Best in class"))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Weakest executing shelves
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.worst.map((row) => cardFor(row, "Needs attention"))}
        </div>
      </section>
    </div>
  );
}
