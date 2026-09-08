"use client";

/* ONE district map, one meaning per colour.

   The portal used to render this component on three pages, and colour
   carried something different on each: out-of-shelf rate on Shelf,
   facing-days on the gap page, rival share when Shelf switched mode.
   Circle area was the only channel that stayed constant. A familiar
   shape that means something new every time you meet it is harder to
   read than three different shapes would have been — it invites the
   reader to transfer an interpretation that does not hold.

   So the measure is now an explicit, visible CHOICE rather than a
   silent property of whichever page you happen to be on. Every measure
   below is computed here from the same filtered view, is oriented the
   same way (more colour is always more of the problem), and names
   itself in the legend. Switching pages no longer changes what red
   means; switching the selector does, and says so.

   Field Ops keeps its own route map. That one is a route diagram — it
   answers "is my day one loop or three", not "where is the market
   weak" — and merging the two would repeat this mistake in reverse. */

import { useMemo, useState } from "react";
import DistrictMap, { type DistrictDatum } from "@/components/portal/charts/DistrictMap";
import { clientBrand, posOf, skuOf } from "@/lib/portalData";
import type { FilteredView } from "@/lib/portalFilters";

export type DistrictMeasure =
  | "out-of-shelf"
  | "at-risk"
  | "your-share"
  | "rival-share";

type Spec = {
  id: DistrictMeasure;
  label: string;
  legend: string;
  /* What the hover and legend format looks like. */
  suffix: string;
  decimals: number;
  /* One line under the map saying what a dark district means HERE. */
  reading: string;
};

export const MEASURES: Spec[] = [
  {
    id: "out-of-shelf",
    label: "Out-of-shelf rate",
    legend: "Out-of-shelf rate",
    suffix: "%",
    decimals: 1,
    reading:
      "Darker districts have a larger share of their listed shelf standing empty. This is a replenishment map.",
  },
  {
    id: "at-risk",
    label: "Facing-days at risk",
    legend: "Facing-days at risk",
    suffix: "",
    decimals: 0,
    reading:
      "Darker districts are losing more shelf space × time until the next audit. This is a cost map — it weights big gaps in big stores.",
  },
  {
    id: "your-share",
    label: `${clientBrand.name} shelf share`,
    legend: `${clientBrand.name} share shortfall`,
    suffix: "pt",
    decimals: 1,
    reading: `Darker districts are further BELOW your citywide ${clientBrand.name} share. Districts running ahead of it are pale — the colour tracks the shortfall, so more colour is still more problem.`,
  },
  {
    id: "rival-share",
    label: "Rival shelf share",
    legend: "Best rival's share",
    suffix: "%",
    decimals: 1,
    reading:
      "Darker districts are where your strongest single rival holds the most shelf. This is a territory map.",
  },
];

function build(view: FilteredView, measure: DistrictMeasure): DistrictDatum[] {
  const areas = new Map<
    string,
    {
      outlets: Set<string>;
      listed: number;
      empty: number;
      atRisk: number;
      gaps: number;
      mine: number;
      facings: number;
      total: number;
      byBrand: Map<string, number>;
    }
  >();

  const blank = () => ({
    outlets: new Set<string>(),
    listed: 0,
    empty: 0,
    atRisk: 0,
    gaps: 0,
    mine: 0,
    facings: 0,
    total: 0,
    byBrand: new Map<string, number>(),
  });

  for (const cell of view.cells) {
    const area = posOf(cell.posId)?.area;
    if (!area) continue;
    const e = areas.get(area) ?? blank();
    e.outlets.add(cell.posId);
    const brandId = skuOf(cell.skuId)?.brandId;
    if (cell.state !== "not-listed") e.listed += 1;
    if (cell.state === "out-of-stock") e.empty += 1;
    if (cell.state === "in-stock") {
      e.total += cell.facings;
      if (brandId === clientBrand.id) e.facings += cell.facings;
      if (brandId) e.byBrand.set(brandId, (e.byBrand.get(brandId) ?? 0) + cell.facings);
    }
    areas.set(area, e);
  }

  for (const row of view.oosRows) {
    const area = posOf(row.posId)?.area;
    if (!area) continue;
    const e = areas.get(area) ?? blank();
    e.gaps += 1;
    e.atRisk += row.facingDaysAtRisk;
    if (skuOf(row.skuId)?.brandId === clientBrand.id) e.mine += 1;
    areas.set(area, e);
  }

  /* The benchmark for "your share" is the panel's own average across
     the SAME filtered view, so the map never measures a district
     against a number computed from a different population. */
  const panelFacings = [...areas.values()].reduce((s, e) => s + e.facings, 0);
  const panelTotal = [...areas.values()].reduce((s, e) => s + e.total, 0);
  const panelShare = panelTotal ? (panelFacings / panelTotal) * 100 : 0;

  const r1 = (n: number) => Math.round(n * 10) / 10;

  return [...areas.entries()].map(([name, e]) => {
    const outOfShelf = e.listed ? (e.empty / e.listed) * 100 : 0;
    const share = e.total ? (e.facings / e.total) * 100 : 0;
    const shortfall = Math.max(0, panelShare - share);
    const rival = [...e.byBrand.entries()]
      .filter(([b]) => b !== clientBrand.id)
      .sort((a, b) => b[1] - a[1])[0];
    const rivalShare = rival && e.total ? (rival[1] / e.total) * 100 : 0;

    const value =
      measure === "out-of-shelf"
        ? r1(outOfShelf)
        : measure === "at-risk"
          ? Math.round(e.atRisk)
          : measure === "your-share"
            ? r1(shortfall)
            : r1(rivalShare);

    return {
      name,
      outlets: e.outlets.size,
      value,
      /* Every measure is on the hover panel regardless of which one is
         painting, so switching the selector re-colours the map without
         changing what a reader can find out about a district. */
      rows: [
        { label: "Out-of-shelf rate", value: `${r1(outOfShelf)}%` },
        {
          label: "Facing-days at risk",
          value: Math.round(e.atRisk).toLocaleString(),
          tone: e.atRisk > 0 ? ("critical" as const) : undefined,
        },
        { label: `${clientBrand.name} share`, value: `${r1(share)}%` },
        { label: `${clientBrand.name} gaps`, value: `${e.mine}` },
      ],
    };
  });
}

export default function DistrictHeat({
  view,
  selectedAreas,
  onSelectArea,
  defaultMeasure = "out-of-shelf",
}: {
  view: FilteredView;
  selectedAreas: string[];
  onSelectArea: (area: string) => void;
  defaultMeasure?: DistrictMeasure;
}) {
  const [measure, setMeasure] = useState<DistrictMeasure>(defaultMeasure);
  const spec = MEASURES.find((m) => m.id === measure)!;
  const data = useMemo(() => build(view, measure), [view, measure]);

  return (
    <section className="min-w-0 rounded-[18px] border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="t-h3">Erbil by district</h2>
          <p className="mt-1 text-sm text-ink-500">
            Circle size is outlets audited — always. Colour is whichever
            measure you pick. Click a district to filter the page to it.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1 rounded-lg bg-canvas p-1">
          {MEASURES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={measure === m.id}
              onClick={() => setMeasure(m.id)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                measure === m.id
                  ? "bg-white text-ink-900 shadow-[var(--shadow-card)]"
                  : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {data.length ? (
          <DistrictMap
            data={data}
            selected={selectedAreas}
            onSelect={onSelectArea}
            legendLabel={spec.legend}
            formatValue={(v) =>
              `${spec.decimals ? v.toFixed(spec.decimals) : Math.round(v).toLocaleString()}${spec.suffix}`
            }
          />
        ) : (
          <p className="py-8 text-center text-sm text-ink-400">
            Nothing matches the current filters.
          </p>
        )}
      </div>

      <p className="mt-4 border-t border-line pt-3 text-[12.5px] leading-snug text-ink-500">
        <span className="font-semibold text-ink-700">How to read this. </span>
        {spec.reading}
      </p>
    </section>
  );
}
