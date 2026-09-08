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
import MatrixChart from "@/components/portal/charts/MatrixChart";
import { brandShareWatchTarget, kpiWatchTarget } from "@/lib/watchTargets";
import { useViewInsights } from "@/components/portal/useViewInsights";
import DistrictHeat from "@/components/portal/DistrictHeat";
import { OutletButton } from "@/components/portal/OutletDrawer";
import { applyFilters } from "@/lib/portalFilters";
import {
  brandName,
  clientBrand,
  posOf,
  skuName,
  skuOf,
  REVISIT_INTERVAL_DAYS,
} from "@/lib/portalData";

type Grouping = "gap" | "outlet";
type Urgency = "all" | "mine";

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
    mine,
    takers,
    byOutlet,
    facingDaysAtRisk,
    myFacingDaysAtRisk,
  } =
    useMemo(() => {
      let list = view.oosRows;
      if (urgency === "mine")
        list = list.filter((r) => skuOf(r.skuId)?.brandId === clientBrand.id);
  
      const sorted = [...list].sort((a, b) => b.facingDaysAtRisk - a.facingDaysAtRisk);
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

      /* The district rollup used to be computed here, and again on
         Shelf, and again on Field Ops — three derivations of the same
         geography, each colouring by whatever its host page happened
         to be about. DistrictHeat owns all of it now. */

      return {
        rows: sorted,
        mine: ours,
        facingDaysAtRisk: sorted.reduce((s, r) => s + r.facingDaysAtRisk, 0),
        myFacingDaysAtRisk: ours.reduce((s, r) => s + r.facingDaysAtRisk, 0),
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
            facingDaysAtRisk: gaps.reduce((s, g) => s + g.facingDaysAtRisk, 0),
            mine: gaps.filter(
              (g) => skuOf(g.skuId)?.brandId === clientBrand.id
            ).length,
          }))
          .sort((a, b) => b.facingDaysAtRisk - a.facingDaysAtRisk),
      };
    }, [view, urgency]);

  /* THE AGEING HISTOGRAM WAS REMOVED HERE.

     It binned gaps by `daysOut` into 1-7 / 8-14 / 15-28 / 29+ and
     flagged anything past a fortnight as "not waiting on a delivery,
     it needs an account conversation". Good chart, honest intent,
     impossible data: knowing how long a shelf has been empty requires
     having seen that outlet before, and a rotating panel does not
     revisit. Every band was reading a field the generator invented.

     Nothing replaces it, because nothing can from a single observation.
     What the page can still say — and now does, per row — is WHEN the
     outlet was audited, which is the honest version of the same
     question: not "how long has this been wrong" but "how fresh is
     this reading". */

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
        cellMap.set(key, (cellMap.get(key) ?? 0) + r.facings * REVISIT_INTERVAL_DAYS);
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
          label="Facing-days at risk"
          value={`${myFacingDaysAtRisk.toLocaleString()}`}
          goodDirection="down"
          footnote={`${facingDaysAtRisk.toLocaleString()} category-wide`}
        />
        {/* Was "Unresolved gaps — still empty since the previous window".
            A rotating panel never confirms a gap twice, so the tile
            was counting an invented flag. Replaced with the figure
            this collection model actually owes the reader: how much of
            the selection we reached at all. An unvisited outlet is not
            a clean one. */}
        <StatTile
          label="Outlets audited"
          value={`${view.posCount}`}
          footnote={`of ${view.inScopeCount} in selection · ${view.coveragePct}% covered`}
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
          ]}
        />
      </div>

      <DistrictHeat
        view={view}
        selectedAreas={filters.areas}
        defaultMeasure="at-risk"
        onSelectArea={(name) =>
          setFilters({
            ...filters,
            areas: filters.areas.includes(name)
              ? filters.areas.filter((a) => a !== name)
              : [...filters.areas, name],
          })
        }
      />

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 overflow-hidden rounded-[18px] border border-line bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-line p-5 sm:p-6">
            <div>
              <h2 className="t-h3">
                {grouping === "gap" ? "Open gaps" : "Visit list"}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {grouping === "gap"
                  ? "Ranked by facing-days at risk — shelf space multiplied by the days until we are next in that store."
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
              <GapTable rows={rows} auditedAt={view.auditedAt} />
            ) : (
              <VisitList outlets={byOutlet} />
            )}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          {/* the gap-age histogram lived here — see the note above */}
          {false ? null : null}

          {substitution.cells.length ? (
            <ChartStory
              title="Which rival takes which pack"
              subtitle="Rival facings standing in your gaps, by your pack format"
              howToRead="Rows are your pack formats; columns are the rival brands holding that space when you are empty. Darker means more facing-days taken — space multiplied by the days until the next audit. A brand can lead the category overall and still not be the one taking a given pack."
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

          {/* THE "UNRESOLVED SINCE" PANEL WAS REMOVED HERE.

              It listed gaps "empty at both visits — a distribution
              problem, not a demand spike". That claim needs the same
              outlet observed twice, which a rotating schedule does not
              deliver, so the panel was ranking a fabricated field. The
              distinction it drew is real and worth having; it just
              needs a fixed core panel to earn it back. */}
        </div>
      </div>
    </div>
  );
}

function GapTable({
  rows,
  auditedAt,
}: {
  rows: ReturnType<typeof applyFilters>["oosRows"];
  auditedAt: Map<string, string>;
}) {
  if (!rows.length)
    return <p className="p-8 text-center text-sm text-ink-400">No gaps in this selection.</p>;

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-10 bg-white">
        <tr className="border-b border-line text-[12px] uppercase tracking-wide text-ink-400">
          <th className="px-5 py-2.5 text-left font-semibold">SKU / outlet</th>
          <th className="px-5 py-2.5 text-left font-semibold">Space taken by</th>
          <th className="px-5 py-2.5 text-right font-semibold">Audited</th>
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
              {/* Was "days out" plus an Unresolved pill. Both read a
                  previous observation of this outlet, which a rotating
                  panel never has. Replaced with the one date that IS
                  recorded: when we were in the store. */}
              <td className="mono px-5 py-2.5 text-right align-middle text-[12px] text-ink-500">
                {auditedAt.get(row.posId) ?? "—"}
              </td>
              <td className="mono px-5 py-2.5 text-right">
                <span className="font-semibold text-ink-900">{row.facingDaysAtRisk}</span>
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
    facingDaysAtRisk: number;
    mine: number;
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
                  {entry.gaps.length === 1 ? "" : "s"}
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
                  {entry.facingDaysAtRisk.toLocaleString()}
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
