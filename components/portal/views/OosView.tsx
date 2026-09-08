"use client";

/* Out-of-stock, built to be acted on rather than read.

   Every row answers four questions a sales director actually asks:
   what is missing, how long has it been missing, what is it costing me
   (facings × days), and who took the space. Rows group into a visit
   list by outlet, because the unit of action is a store visit, not a
   line item. */

import { useMemo, useState } from "react";
import PageHeader from "@/components/portal/PageHeader";
import FilterBar, {
  useFilters,
  useVisitData,
} from "@/components/portal/FilterBar";
import StatTile from "@/components/portal/charts/StatTile";
import RankedBar from "@/components/portal/charts/RankedBar";
import ChartStory from "@/components/portal/ChartStory";
import Histogram from "@/components/portal/charts/Histogram";
import MatrixChart from "@/components/portal/charts/MatrixChart";
import { brandShareWatchTarget, kpiWatchTarget } from "@/lib/watchTargets";
import { useViewInsights } from "@/components/portal/useViewInsights";
import DistrictMap, {
  type DistrictDatum,
} from "@/components/portal/charts/DistrictMap";
import { OutletButton } from "@/components/portal/OutletDrawer";
import { scope } from "@/lib/portal";
import { applyFilters } from "@/lib/portalFilters";
import {
  brandName,
  clientBrand,
  posOf,
  skuName,
  skuOf,
} from "@/lib/portalData";

type Grouping = "gap" | "outlet";
type Urgency = "all" | "mine" | "persistent";

const PACK_LABEL: Record<string, string> = {
  "can-330": "330ml can",
  "pet-500": "500ml PET",
  "pet-1000": "1L PET",
  "pet-1500": "1.5L PET",
  "pet-2250": "2.25L PET",
  "glass-300": "300ml glass",
};

export default function OosView() {
  const [filters, setFilters] = useFilters();
  const [grouping, setGrouping] = useState<Grouping>("gap");
  const [urgency, setUrgency] = useState<Urgency>("all");

  const { data: visitData, loading } = useVisitData(filters.visit);
  const view = useMemo(
    () => applyFilters(filters, visitData),
    [filters, visitData]
  );
  const insights = useViewInsights(view);


  /* One derivation, so the compiler can see the whole chain and the
     three views can never describe different slices. */
  const {
    rows,
    districts,
    mine,
    takers,
    byOutlet,
    lostFacingDays,
    myLostFacingDays,
    persistent,
  } =
    useMemo(() => {
      let list = view.oosRows;
      if (urgency === "mine")
        list = list.filter((r) => skuOf(r.skuId)?.brandId === clientBrand.id);
      if (urgency === "persistent") list = list.filter((r) => r.persistent);

      const sorted = [...list].sort((a, b) => b.lostFacingDays - a.lostFacingDays);
      const ours = sorted.filter(
        (r) => skuOf(r.skuId)?.brandId === clientBrand.id
      );

      /* Who is standing in your space, across every gap in scope. */
      const tally = new Map<string, number>();
      for (const row of ours) {
        for (const rival of row.rivalsInStock) {
          tally.set(
            rival.brandId,
            (tally.get(rival.brandId) ?? 0) + rival.facings
          );
        }
      }

      /* The visit list: outlets ranked by what they are costing. */
      const grouped = new Map<string, typeof sorted>();
      for (const row of sorted) {
        grouped.set(row.posId, [...(grouped.get(row.posId) ?? []), row]);
      }

      /* District rollup. Colour carries lost facing-days — the measure
         this page ranks everything else by — while circle size stays
         outlets audited, same as the Availability map. It follows the
         urgency toggle too, so "Pepsi only" recolours the city. */
      const areaGaps = new Map<
        string,
        { gaps: number; lost: number; mine: number; worst: number }
      >();
      for (const row of sorted) {
        const area = posOf(row.posId)!.area;
        const e = areaGaps.get(area) ?? { gaps: 0, lost: 0, mine: 0, worst: 0 };
        e.gaps += 1;
        e.lost += row.lostFacingDays;
        if (skuOf(row.skuId)?.brandId === clientBrand.id) e.mine += 1;
        e.worst = Math.max(e.worst, row.daysOut);
        areaGaps.set(area, e);
      }
      const areaOutlets = new Map<string, Set<string>>();
      for (const cell of view.cells) {
        const area = posOf(cell.posId)!.area;
        const set = areaOutlets.get(area) ?? new Set<string>();
        set.add(cell.posId);
        areaOutlets.set(area, set);
      }
      const districts: DistrictDatum[] = [...areaOutlets.entries()].map(
        ([name, outlets]) => {
          const e = areaGaps.get(name) ?? { gaps: 0, lost: 0, mine: 0, worst: 0 };
          return {
            name,
            outlets: outlets.size,
            value: e.lost,
            rows: [
              { label: "Open gaps", value: `${e.gaps}` },
              {
                label: "Lost facing-days",
                value: e.lost.toLocaleString(),
                tone: "critical" as const,
              },
              { label: `${clientBrand.name} gaps`, value: `${e.mine}` },
              { label: "Longest open", value: e.worst ? `${e.worst}d` : "—" },
            ],
          };
        }
      );

      return {
        rows: sorted,
        districts,
        mine: ours,
        persistent: sorted.filter((r) => r.persistent),
        lostFacingDays: sorted.reduce((s, r) => s + r.lostFacingDays, 0),
        myLostFacingDays: ours.reduce((s, r) => s + r.lostFacingDays, 0),
        takers: [...tally.entries()]
          .map(([brandId, facings]) => ({
            id: brandId,
            label: brandName(brandId),
            value: facings,
          }))
          .sort((a, b) => b.value - a.value),
        byOutlet: [...grouped.entries()]
          .map(([posId, gaps]) => ({
            posId,
            gaps,
            lostFacingDays: gaps.reduce((s, g) => s + g.lostFacingDays, 0),
            mine: gaps.filter(
              (g) => skuOf(g.skuId)?.brandId === clientBrand.id
            ).length,
            worst: Math.max(...gaps.map((g) => g.daysOut)),
          }))
          .sort((a, b) => b.lostFacingDays - a.lostFacingDays),
      };
    }, [view, urgency]);

  /* How OLD the gaps are. lostFacingDays already multiplies space by
     time, but the shape of that time has never been shown — and the
     difference between a shelf that emptied last week and one that
     has been empty for a month is the difference between a delivery
     problem and a neglected account. */
  const ageing = useMemo(() => {
    const bands = [
      { id: "1-7", label: "1–7 days", max: 7 },
      { id: "8-14", label: "8–14", max: 14 },
      { id: "15-28", label: "15–28", max: 28 },
      { id: "29+", label: "29+", max: Infinity },
    ];
    const counts = new Map(bands.map((b) => [b.id, 0]));
    for (const row of mine) {
      const band = bands.find((b) => row.daysOut <= b.max)!;
      counts.set(band.id, (counts.get(band.id) ?? 0) + 1);
    }
    return bands.map((b) => ({
      id: b.id,
      label: b.label,
      count: counts.get(b.id) ?? 0,
      /* Past a full audit cycle a gap is no longer a stockout — it is
         a listing nobody is replenishing. */
      flagged: b.id === "15-28" || b.id === "29+",
    }));
  }, [mine]);

  /* Which rival pack stands in which of your gaps. rivalsInStock has
     always held this; it has only ever been summed to a single winner,
     which hides that the answer differs by pack. */
  const substitution = useMemo(() => {
    const packs = new Map<string, string>();
    const rivals = new Map<string, string>();
    const cellMap = new Map<string, number>();
    for (const row of mine) {
      const myPack = skuOf(row.skuId)?.pack;
      if (!myPack) continue;
      packs.set(myPack, PACK_LABEL[myPack] ?? myPack);
      for (const r of row.rivalsInStock) {
        rivals.set(r.brandId, brandName(r.brandId));
        const key = `${myPack}|${r.brandId}`;
        /* Facing-DAYS, not facings.

           Raw facings answers "how much space right now"; the rest of
           this product counts space multiplied by the time it was
           held, and two charts on one page using different units is
           how they end up contradicting each other. Measured in
           facings this matrix named 7UP; measured the way R4 measures,
           it names Fanta. Same data, and only one of them agreed with
           the engine. */
        cellMap.set(key, (cellMap.get(key) ?? 0) + r.facings * row.daysOut);
      }
    }
    const rivalTotals = new Map<string, number>();
    for (const [key, v] of cellMap) {
      const brand = key.split("|")[1];
      rivalTotals.set(brand, (rivalTotals.get(brand) ?? 0) + v);
    }
    return {
      rows: [...packs.entries()].map(([id, label]) => ({ id, label })),
      cols: [...rivals.entries()]
        .map(([id, label]) => ({ id, label }))
        .sort((a, b) => (rivalTotals.get(b.id) ?? 0) - (rivalTotals.get(a.id) ?? 0)),
      cells: [...cellMap.entries()].map(([key, value]) => {
        const [row, col] = key.split("|");
        return { row, col, value };
      }),
      top: [...cellMap.entries()].sort((a, b) => b[1] - a[1])[0],
    };
  }, [mine]);

  const takerWatchTargets = useMemo(
    () =>
      Object.fromEntries(
        takers.map((r) => [
          r.id,
          brandShareWatchTarget({
            brandId: r.id,
            brandLabel: r.label,
            value: r.value,
            visit: view.visit,
          }),
        ])
      ),
    [takers, view.visit]
  );

  return (
    <div
      className="transition-opacity duration-200"
      style={{ opacity: loading ? 0.55 : 1 }}
      aria-busy={loading}
    >
      <PageHeader
        title="Out-of-Stock Alerts"
        lead="Where you are missing from the shelf, and what it is costing"
        posCount={view.posCount}
      />

      <FilterBar
        filters={filters}
        onChange={setFilters}
        resultLabel={`${rows.length} open gaps across ${byOutlet.length} outlets`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={`${clientBrand.name} gaps`}
          value={`${mine.length}`}
          goodDirection="down"
          footnote={`of ${rows.length} across the category`}
          watch={kpiWatchTarget({
            metric: "gaps",
            value: mine.length,
            visit: view.visit,
            filters,
            suggestedTarget: { value: 0, why: "No gaps — the shelf as it should be." },
          })}
        />
        <StatTile
          label="Lost facing-days"
          value={`${myLostFacingDays.toLocaleString()}`}
          goodDirection="down"
          footnote={`${lostFacingDays.toLocaleString()} category-wide`}
        />
        <StatTile
          label="Unresolved gaps"
          value={`${persistent.length}`}
          goodDirection="down"
          footnote={`Still empty since ${scope.previousVisit}`}
        />
        <StatTile
          label="Outlets to visit"
          value={`${byOutlet.filter((o) => o.mine > 0).length}`}
          goodDirection="down"
          footnote={`of ${view.posCount} in selection`}
        />
      </div>

      {/* view switches — grouping and urgency, above everything they scope */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Toggle
          label="Group by"
          value={grouping}
          onChange={(v) => setGrouping(v as Grouping)}
          options={[
            { value: "gap", label: "Individual gap" },
            { value: "outlet", label: "Outlet visit list" },
          ]}
        />
        <Toggle
          label="Show"
          value={urgency}
          onChange={(v) => setUrgency(v as Urgency)}
          options={[
            { value: "all", label: "All gaps" },
            { value: "mine", label: `${clientBrand.name} only` },
            { value: "persistent", label: "Unresolved" },
          ]}
        />
      </div>

      <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <h2 className="t-h3">Erbil by district</h2>
        <p className="mt-1 mb-5 text-sm text-ink-500">
          Where the cost concentrates across the city. Darker is more lost
          facing-days; circle size is outlets audited. Click a district to
          filter this page to it.
        </p>
        {districts.length ? (
          <DistrictMap
            data={districts}
            selected={filters.areas}
            onSelect={(name) =>
              setFilters({
                ...filters,
                areas: filters.areas.includes(name)
                  ? filters.areas.filter((a) => a !== name)
                  : [...filters.areas, name],
              })
            }
            legendLabel="Lost facing-days"
            formatValue={(v) => v.toLocaleString()}
          />
        ) : (
          <p className="py-8 text-center text-sm text-ink-400">
            Nothing matches the current filters.
          </p>
        )}
      </section>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 overflow-hidden rounded-[18px] border border-line bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-line p-5 sm:p-6">
            <div>
              <h2 className="t-h3">
                {grouping === "gap" ? "Open gaps" : "Visit list"}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {grouping === "gap"
                  ? "Ranked by lost facing-days — shelf space multiplied by time off shelf."
                  : "Outlets ranked by what their gaps are costing you."}
              </p>
            </div>
            <span className="chip !py-1 shrink-0">
              <span className="dot dot-live" style={{ background: "var(--color-critical)" }} />
              {rows.length} open
            </span>
          </div>

          <div className="max-h-[620px] overflow-auto">
            {grouping === "gap" ? (
              <GapTable rows={rows} />
            ) : (
              <VisitList outlets={byOutlet} />
            )}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          {mine.length ? (
            <ChartStory
              title="How long these have been empty"
              subtitle={`${mine.length} ${clientBrand.name} gaps by age`}
              howToRead="Each column is an age band and its height is how many of your gaps fall in it. Red marks gaps older than a fortnight — past that a shelf is not waiting on a delivery."
              findings={insights.forRules("r1-persistent-gap", "r9-dark-outlet")}
              clean="Nothing has been empty long enough to escalate."
              allClear="No gap older than a cycle"
              soWhat={ageingSoWhat(ageing)}
              actionLabel="Create replenishment action"
              visit={view.visit}
              table={{
                columns: ["Age", "Gaps"],
                rows: ageing.map((b) => [b.label, b.count]),
              }}
            >
              <Histogram
                bins={ageing}
                unitNoun="gaps"
                bandLabel="Within one audit cycle"
                bandIds={["1-7", "8-14"]}
              />
            </ChartStory>
          ) : null}

          {substitution.cells.length ? (
            <ChartStory
              title="Which rival takes which pack"
              subtitle="Rival facings standing in your gaps, by your pack format"
              howToRead="Rows are your pack formats; columns are the rival brands holding that space when you are empty. Darker means more facing-days taken — space multiplied by how long you were out. A brand can lead the category overall and still not be the one taking a given pack."
              findings={insights.forRules("r4-rival-substitution")}
              clean="No rival is consistently taking a particular format."
              allClear="No pattern by pack"
              soWhat={substitutionSoWhat(substitution)}
              actionLabel="Create defence action"
              visit={view.visit}
              table={{
                columns: ["Your pack", "Rival", "Facing-days taken"],
                rows: substitution.cells
                  .slice()
                  .sort((a, b) => b.value - a.value)
                  .map((c) => [
                    substitution.rows.find((r) => r.id === c.row)?.label ?? c.row,
                    substitution.cols.find((x) => x.id === c.col)?.label ?? c.col,
                    c.value,
                  ]),
              }}
            >
              <MatrixChart
                rows={substitution.rows}
                cols={substitution.cols}
                cells={substitution.cells}
                unitNoun="facing-days"
                rowNoun="pack formats"
                colNoun="rival brands"
              />
            </ChartStory>
          ) : null}

          {takers.length ? (
            <ChartStory
              title="Who took the space"
              subtitle={`Rival facings in the same pack size where ${clientBrand.name} is absent`}
              howToRead="Each bar is a rival brand and its length is the shelf space it holds in the very outlets where you are out of stock — the substitution a shopper actually makes."
              findings={insights.forRules("r4-rival-substitution")}
              clean="No single rival is dominating the space your gaps leave open."
              allClear="No dominant substitute here"
              actionLabel="Create defence action"
            >
              <RankedBar
                rows={takers}
                unit=""
                labelWidth={104}
                watchTargets={takerWatchTargets}
              />
            </ChartStory>
          ) : (
            <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
              <h2 className="t-h3">Who took the space</h2>
              <p className="py-4 text-sm text-ink-400">
                No competitor packs in the affected outlets.
              </p>
            </section>
          )}

          <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
            <h2 className="t-h3">Unresolved since {scope.previousVisit}</h2>
            <p className="mt-1 mb-4 text-sm text-ink-500">
              Empty at both visits — a distribution problem, not a demand spike.
            </p>
            {persistent.length ? (
              <ul className="space-y-3">
                {persistent.slice(0, 10).map((row) => (
                  <li key={`${row.posId}-${row.skuId}`} className="text-[13px]">
                    <span className="font-semibold text-ink-900">
                      {skuName(row.skuId)}
                    </span>
                    <span className="block text-ink-500">
                      <OutletButton posId={row.posId} className="!text-[13px] !font-medium" />{" "}
                      ·{" "}
                      <span className="mono font-semibold" style={{ color: "var(--color-critical)" }}>
                        {row.daysOut} days
                      </span>
                    </span>
                  </li>
                ))}
                {persistent.length > 10 && (
                  <li className="text-[12px] text-ink-400">
                    +{persistent.length - 10} more
                  </li>
                )}
              </ul>
            ) : (
              <p className="py-4 text-sm text-ink-400">
                Nothing unresolved in this selection.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function GapTable({ rows }: { rows: ReturnType<typeof applyFilters>["oosRows"] }) {
  if (!rows.length)
    return <p className="p-8 text-center text-sm text-ink-400">No gaps in this selection.</p>;

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10 bg-white">
        <tr className="border-b border-line text-[12px] uppercase tracking-wide text-ink-400">
          <th className="px-5 py-2.5 text-left font-semibold">SKU / outlet</th>
          <th className="px-5 py-2.5 text-left font-semibold">Space taken by</th>
          <th className="px-5 py-2.5 text-right font-semibold">Days</th>
          <th className="px-5 py-2.5 text-right font-semibold">Lost facing-days</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const sku = skuOf(row.skuId)!;
          const isClient = sku.brandId === clientBrand.id;
          const outlet = posOf(row.posId)!;
          return (
            <tr
              key={`${row.posId}-${row.skuId}`}
              className="border-b border-line last:border-0"
              style={isClient ? { background: "var(--color-violet-050)" } : undefined}
            >
              <td className="px-5 py-2.5">
                <span className={isClient ? "font-semibold text-ink-900" : "text-ink-700"}>
                  {skuName(row.skuId)}
                </span>
                <span className="mt-0.5 block text-[12px] text-ink-400">
                  <OutletButton posId={row.posId} className="!text-[12px] !font-medium" />
                  {" · "}
                  {outlet.area} · {outlet.channel}
                </span>
              </td>
              <td className="px-5 py-2.5">
                {row.rivalsInStock.length ? (
                  <span className="flex flex-wrap gap-1">
                    {row.rivalsInStock.slice(0, 2).map((rival) => (
                      <span
                        key={rival.skuId}
                        className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] text-ink-700"
                      >
                        {brandName(rival.brandId)}
                        <span className="mono ml-1 text-ink-400">{rival.facings}f</span>
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-[12px] text-ink-400">Shelf empty</span>
                )}
              </td>
              <td className="px-5 py-2.5 text-right align-middle">
                <span
                  className="mono font-semibold"
                  style={{ color: row.persistent ? "var(--color-critical)" : "var(--color-ink-900)" }}
                >
                  {row.daysOut}d
                </span>
                {row.persistent && (
                  <span className="pill pill-critical ml-2">Unresolved</span>
                )}
              </td>
              <td className="mono px-5 py-2.5 text-right">
                <span className="font-semibold text-ink-900">{row.lostFacingDays}</span>
                <span className="block text-[11px] text-ink-400">
                  normally {row.normalFacings} facings
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function VisitList({
  outlets,
}: {
  outlets: {
    posId: string;
    gaps: ReturnType<typeof applyFilters>["oosRows"];
    lostFacingDays: number;
    mine: number;
    worst: number;
  }[];
}) {
  if (!outlets.length)
    return <p className="p-8 text-center text-sm text-ink-400">No gaps in this selection.</p>;

  return (
    <ul>
      {outlets.map((entry, i) => {
        const outlet = posOf(entry.posId)!;
        return (
          <li key={entry.posId} className="border-b border-line px-5 py-3 last:border-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="mono text-[11px] text-ink-400">#{i + 1}</span>
                  <OutletButton posId={entry.posId} />
                  {entry.mine > 0 && (
                    <span className="pill pill-critical">{entry.mine} yours</span>
                  )}
                </span>
                <span className="mt-0.5 block text-[12px] text-ink-400">
                  {outlet.area} · {outlet.channel} · {entry.gaps.length} gap
                  {entry.gaps.length === 1 ? "" : "s"} · longest {entry.worst}d
                </span>
                <span className="mt-1.5 block text-[12px] text-ink-700">
                  {entry.gaps
                    .slice(0, 3)
                    .map((g) => skuName(g.skuId))
                    .join(", ")}
                  {entry.gaps.length > 3 && ` +${entry.gaps.length - 3} more`}
                </span>
              </div>
              <div className="mono shrink-0 text-right">
                <span className="block font-semibold text-ink-900">
                  {entry.lostFacingDays.toLocaleString()}
                </span>
                <span className="text-[11px] text-ink-400">facing-days</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Toggle({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </span>
      <div className="flex gap-1 rounded-lg bg-canvas p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
              value === option.value
                ? "bg-white text-ink-900 shadow-[var(--shadow-card)]"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ageingSoWhat(bins: { id: string; count: number }[]) {
  const old = bins
    .filter((b) => b.id === "15-28" || b.id === "29+")
    .reduce((s, b) => s + b.count, 0);
  const total = bins.reduce((s, b) => s + b.count, 0);
  if (!old) return "Every gap is inside one audit cycle — this is replenishment, not neglect.";
  return `${old} of ${total} gaps have been open longer than a fortnight. Those are not waiting on a delivery; they need an account conversation.`;
}

function substitutionSoWhat(sub: {
  top?: [string, number];
  rows: { id: string; label: string }[];
  cols: { id: string; label: string }[];
}) {
  if (!sub.top) return "No rival is taking a meaningful share of your gaps.";
  const [key, facings] = sub.top;
  const [pack, brand] = key.split("|");
  const packLabel = sub.rows.find((r) => r.id === pack)?.label ?? pack;
  const brandLabel = sub.cols.find((c) => c.id === brand)?.label ?? brand;
  return `${brandLabel} takes the most space in your ${packLabel} gaps — ${Math.round(
    facings
  ).toLocaleString()} facing-days. Defend that format first, whoever leads the category overall.`;
}
