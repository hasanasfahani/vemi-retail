"use client";

/* POSM — is the brand supported at the point of sale.

   The weakest KPI in this market, and the cheapest to fix: the product
   is already on the shelf, the relationship already exists, and a rep
   with a boot full of material closes the gap in one visit. */

import { Card, StatCard } from "@/components/market/ui";
import Headline from "@/components/market/Headline";
import ShelfCard from "@/components/market/ShelfCard";
import { RankedBars } from "@/components/market/charts";
import Badge from "@/components/market/ui/Badge";
import { posm, movement } from "@/lib/market/performance";
import { posmTypes } from "@/lib/market";
import { rateBand } from "@/components/market/ui/health";
import { useTargets } from "@/components/market/useTargets";
import type { MarketView } from "@/lib/market/filters";

export default function PosmTab({ view }: { view: MarketView }) {
  const targets = useTargets();
  const p = posm(view);
  const move = movement(view, "posm");
  const worstType = p.byType[p.byType.length - 1];
  const worstCity = p.byGovernorate[0];

  const cardFor = (row: { posId: string; value: number }, caption: string) => {
    const outlet = view.outlets.find((o) => o.id === row.posId);
    if (!outlet) return null;
    return (
      <ShelfCard
        key={row.posId}
        outlet={outlet}
        cells={view.cells.filter((c) => c.posId === row.posId)}
        score={view.scores.find((s) => s.posId === row.posId)?.score}
        auditedAt={view.auditedAt.get(row.posId)}
        caption={`${caption} · ${row.value}% of material in place`}
      />
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Headline
        label="POSM compliance"
        value={p.compliance}
        target={targets.posm}
        delta={move.delta}
        deltaFloor={move.floor}
        problem={
          worstType ? (
            <>
              <strong className="font-semibold text-ink-900">{worstType.label}</strong> present in
              only {worstType.value}% of the outlets where they were checked
            </>
          ) : null
        }
        location={
          worstCity ? (
            <>
              Weakest in <strong className="font-semibold text-ink-900">{worstCity.label}</strong> at{" "}
              {worstCity.value}%, {worstCity.missing.toLocaleString()} items missing
            </>
          ) : null
        }
        action={{ href: "/portal/actions", label: "Plan a deployment" }}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Items checked" value={p.checked} footnote="Material types checked across audited outlets" />
        <StatCard
          label="Stocked, unsupported"
          value={p.bare.length}
          band="critical"
          footnote="Outlets carrying the brand with no material at all — the cheapest gap in the file to close"
        />
        {/* Banded against the POSM target, not against each other. The
            best material in a failing category is still failing, and a
            tile calling it "strong" beside a badge calling it "needs
            attention" is the page arguing with itself. */}
        <StatCard
          label="Best material"
          value={p.byType[0]?.value ?? 0}
          unit="%"
          band={rateBand(p.byType[0]?.value ?? 0, targets.posm)}
          footnote={p.byType[0]?.label}
        />
        <StatCard
          label="Weakest material"
          value={worstType?.value ?? 0}
          unit="%"
          band={rateBand(worstType?.value ?? 0, targets.posm)}
          footnote={worstType?.label}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Presence by material"
          lead="Where each type was checked, how often it was there."
          footnote={`Coolers, stands and displays are only checked in the formats that can take them — ${posmTypes
            .filter((t) => t.channels)
            .map((t) => t.name.toLowerCase())
            .join(", ")} are not expected in every door.`}
        >
          <RankedBars
            rows={p.byType.map((row) => ({
              id: row.id,
              label: row.label,
              value: row.value,
              meta: `${row.present.toLocaleString()} present of ${row.checked.toLocaleString()} checked`,
              trailing: <Badge band={rateBand(row.value, targets.posm)} size="sm" />,
            }))}
            max={100}
            par={targets.posm}
            unit="%"
          />
        </Card>

        <div className="flex flex-col gap-4">
          <Card title="Weakest governorates" lead="Worst first — where a deployment run would pay.">
            <RankedBars
              rows={p.byGovernorate.map((row) => ({
                id: row.id,
                label: row.label,
                value: row.value,
                meta: `${row.missing.toLocaleString()} items missing of ${row.checked.toLocaleString()} checked`,
              }))}
              max={100}
              par={targets.posm}
              unit="%"
            />
          </Card>

          <Card title="By channel" lead="Which formats carry the material and which do not.">
            <RankedBars
              rows={p.byChannel.map((row) => ({
                id: row.id,
                label: row.label,
                value: row.value,
                meta: `${row.checked.toLocaleString()} items checked`,
              }))}
              max={100}
              par={targets.posm}
              unit="%"
            />
          </Card>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Best supported outlets
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {p.best.map((row) => cardFor(row, "Fully supported"))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Least supported outlets
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {p.worst.map((row) => cardFor(row, "No material"))}
        </div>
      </section>
    </div>
  );
}
