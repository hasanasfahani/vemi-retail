"use client";

/* SHELF & VISIBILITY — how much of the fixture the brand holds, and
   at what height.

   Share and position are different arguments: holding par overall
   while losing eye level is a real, specific problem that an aggregate
   share figure hides completely. */

import { Card, StatCard } from "@/components/market/ui";
import Headline from "@/components/market/Headline";
import ShelfCard from "@/components/market/ShelfCard";
import {
  ChartLegend, RankedBars, ShareDonut, StackedBars, brandColor, orderedBrands,
} from "@/components/market/charts";
import { movement, shelf } from "@/lib/market/performance";
import { clientBrand, sharePar } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";

export default function ShelfTab({ view }: { view: MarketView }) {
  const s = shelf(view);
  const move = movement(view, "shelfShare");
  const par = Math.round(sharePar * 100);
  const ordered = orderedBrands();
  const stack = ordered.map((b) => ({ key: b.id, name: b.name, color: brandColor(b.id) }));
  const leader = s.byBrand[0];
  const rival = s.byBrand.find((b) => b.id !== clientBrand.id);

  const eye = s.positions.find((p) => p.id === "eye");
  const clientShareIn = (row: (typeof s.byCity)[number]) => Number(row[clientBrand.id] ?? 0);
  const weakestCity = [...s.byCity].sort((a, b) => clientShareIn(a) - clientShareIn(b))[0];

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
      <Headline
        label="Share of shelf"
        value={s.clientShare}
        target={par}
        delta={move.delta}
        deltaFloor={move.floor}
        problem={
          leader && rival && leader.id !== clientBrand.id ? (
            <>
              <strong className="font-semibold text-ink-900">{leader.name}</strong> leads the fixture
              at {leader.share}% against {clientBrand.name} at {s.clientShare}%
            </>
          ) : (
            <>{clientBrand.name} leads the fixture at {s.clientShare}%</>
          )
        }
        location={
          weakestCity ? (
            <>
              Weakest in{" "}
              <strong className="font-semibold text-ink-900">{weakestCity.label}</strong> at{" "}
              {clientShareIn(weakestCity)}% of measured facings
            </>
          ) : null
        }
        action={{ href: "/portal/competition", label: "Open competition" }}
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
          title="Shelf battle by city"
          lead="Share of measured facings, 100% stacked."
          action={<ChartLegend items={ordered.map((b) => ({ id: b.id, name: b.name, color: brandColor(b.id) }))} />}
        >
          <StackedBars data={s.byCity} series={stack} max={100} height={250} />
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
