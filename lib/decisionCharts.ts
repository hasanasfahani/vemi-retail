/* ============================================================
   Which chart proves which decision.

   Shared by both executive surfaces — Command Center and Digest — so
   the same decision is never argued with one chart on one page and a
   different one on the other. Returns plain data, no JSX, so it can
   run in a Server Component and hand the result to the client chart
   components.

   Selection is driven by the decision's own shape, never by a wish for
   variety: a two-point comparison gets the dumbbell, a countable set
   gets the meter, distance-from-your-own-average gets the diverging
   bar, and "which of these is worst" gets ranked bars. Every branch
   also writes its reading guide and its so-what, because ChartFrame
   will not compile without them.
   ============================================================ */

import { scope } from "./portal";
import { applyFilters } from "./portalFilters";
import { formatImpact } from "./economics";
import type { Insight } from "./insights";
import type { Decision } from "./decisions";
import { brandName, clientBrand, competitors, posOf, skuOf } from "./portalData";
import type { DumbbellRow } from "@/components/portal/charts/Dumbbell";
import type { DivergingRow } from "@/components/portal/charts/DivergingBar";
import type { MeterRow } from "@/components/portal/charts/SegmentedMeter";
import type { BarRow } from "@/components/portal/charts/RankedBar";

export type DecisionChart =
  | { kind: "diverging"; rows: DivergingRow[]; baselineLabel: string; unit?: string }
  | { kind: "dumbbell"; rows: DumbbellRow[]; aLabel: string; bLabel: string; unit?: string }
  | { kind: "meter"; rows: MeterRow[]; unitLabel: string; benchmarkLabel: string }
  | { kind: "ranked"; rows: BarRow[]; unit?: string };

export type ChartSpec = {
  chart: DecisionChart;
  chartTitle: string;
  chartSubtitle?: string;
  howToRead: string;
  soWhat: string;
  table?: { columns: string[]; rows: (string | number)[][] };
};

export function chartFor(decision: Decision, posCount: number): ChartSpec {
  const districts = decision.findings.filter(
    (f) => f.rule === "r2-district-deficit"
  );

  if (decision.id === "cover" && districts.length) {
    const rows = districts
      .map((f) => ({
        id: f.id,
        label: f.entities.area ?? f.scope.label,
        delta: -Math.abs(deficitOf(f)),
        severity: f.severity === "critical" ? ("critical" as const) : ("warning" as const),
        meta: `${f.scope.outlets} outlets`,
      }))
      .sort((a, b) => a.delta - b.delta);

    return {
      chart: {
        kind: "diverging",
        rows,
        baselineLabel: `your citywide ${clientBrand.name} share`,
        unit: "pt",
      },
      chartTitle: "Shelf share by district, against your city average",
      chartSubtitle: `${clientBrand.name} · ${scope.dataAsOf} · ${posCount} outlets`,
      howToRead:
        "Each row is a district. The centre line is your citywide shelf share; bars to the left fall short of it, and colour marks how far past the reporting threshold each one sits.",
      soWhat: `These districts are adjacent, so one planned run covers all ${decision.outlets} outlets rather than ${districts.length} separate visits.`,
      table: {
        columns: ["District", "Behind city by", "Outlets"],
        rows: rows.map((r) => [r.label, `${r.delta}pt`, r.meta ?? ""]),
      },
    };
  }

  if (decision.id === "defend") {
    const rows = competitors
      .map((c) => ({
        id: c.brandId,
        label: brandName(c.brandId),
        a: Math.round((c.share - c.shareDelta) * 10) / 10,
        b: c.share,
        emphasis: c.isClient,
      }))
      .sort((a, b) => b.b - a.b);

    return {
      chart: {
        kind: "dumbbell",
        rows,
        aLabel: scope.previousVisit,
        bLabel: scope.dataAsOf,
        unit: "%",
      },
      chartTitle: "Shelf share, previous visit to this visit",
      chartSubtitle: `All ${competitors.length} brands · ${scope.previousVisit} → ${scope.dataAsOf}`,
      howToRead:
        "Each row is a brand. The hollow dot is the previous visit, the solid dot is this one, and the line between them is the move. Violet is you; grey is everyone else.",
      soWhat: `${
        rows.find((r) => r.emphasis)?.label ?? clientBrand.name
      } is the only brand giving up ground at this scale — decide now whether to defend the space or concede it.`,
      table: {
        columns: ["Brand", scope.previousVisit, scope.dataAsOf, "Move"],
        rows: rows.map((r) => [
          r.label,
          `${r.a}%`,
          `${r.b}%`,
          `${r.b - r.a >= 0 ? "+" : ""}${Math.round((r.b - r.a) * 10) / 10}pt`,
        ]),
      },
    };
  }

  /* A countable set — how much of the range a store carries — is shown
     as slots, not a bar. Four SKUs are four things a reader can count,
     and a 25% bar would hide that. */
  const metered = decision.findings.filter((f) => f.meter);
  if (metered.length && decision.id === "list") {
    const rows: MeterRow[] = metered.slice(0, 8).map((f) => ({
      id: f.id,
      label: f.entities.posId ? posOf(f.entities.posId)?.code ?? f.scope.label : f.scope.label,
      filled: f.meter!.filled,
      total: f.meter!.total,
      benchmark: f.meter!.benchmark,
      meta: f.entities.posId ? posOf(f.entities.posId)?.area : undefined,
    }));
    const worst = rows[0];
    return {
      chart: {
        kind: "meter",
        rows,
        unitLabel: metered[0].meter!.unitLabel,
        benchmarkLabel: "typical for this format",
      },
      chartTitle: `How much of your range each store carries`,
      chartSubtitle: `${rows.length} of ${metered.length} outlets · out of ${
        metered[0].meter!.total
      } ${clientBrand.name} SKUs`,
      howToRead:
        "Each row is a store and each block is one of your SKUs — filled means they carry it. The vertical tick is what stores of that format normally carry, so the gap between the filled blocks and the tick is what is missing.",
      soWhat: `${worst.label} carries ${worst.filled} of ${worst.total}; getting the range listed here costs a conversation, not stock.`,
      table: {
        columns: ["Outlet", "District", "Carried", "Typical"],
        rows: rows.map((r) => [
          r.label,
          r.meta ?? "—",
          `${r.filled}/${r.total}`,
          r.benchmark ?? "—",
        ]),
      },
    };
  }

  /* A finding that is natively a two-point comparison says so, and
     gets the house form rather than being flattened into one bar. */
  const paired = decision.findings.find((f) => f.pair);
  if (paired?.pair) {
    return {
      chart: {
        kind: "dumbbell",
        rows: paired.pair.rows,
        aLabel: paired.pair.aLabel,
        bLabel: paired.pair.bLabel,
        unit: paired.pair.unit,
      },
      chartTitle: paired.headline,
      chartSubtitle: `${clientBrand.name} · ${scope.dataAsOf}`,
      howToRead: `The hollow dot is your share of ${paired.pair.aLabel.toLowerCase()}, the solid dot your share of ${paired.pair.bLabel.toLowerCase()}. The line between them is the gap you are trying to close.`,
      soWhat: paired.detail,
      table: {
        columns: paired.evidence.table.columns,
        rows: paired.evidence.table.rows,
      },
    };
  }

  /* Default: rank the outlets this decision touches by what is at
     stake, worst first. Honest for "which of these is worst", which is
     what replenish and list reduce to.

     Findings are de-duplicated by outlet first: R9 and R10 can both
     fire on the same store, and listing it twice would make one
     problem look like two on the very chart built to stop that. */
  const byOutlet = new Map<string, (typeof decision.findings)[number]>();
  for (const f of decision.findings) {
    const key = f.entities.posId ?? f.id;
    const held = byOutlet.get(key);
    if (!held || f.impact.value > held.impact.value) byOutlet.set(key, f);
  }
  const rows = [...byOutlet.values()]
    .sort((a, b) => b.impact.value - a.impact.value)
    .slice(0, 8)
    .map((f) => ({
      id: f.id,
      label: f.entities.posId ? posOf(f.entities.posId)?.code ?? f.scope.label : f.scope.label,
      value: Math.round(f.impact.value),
      emphasis: f.severity === "critical",
      meta: f.entities.posId ? posOf(f.entities.posId)?.area : undefined,
    }));

  return {
    chart: { kind: "ranked", rows, unit: "" },
    chartTitle: "Where this is costing you most",
    chartSubtitle: `Top ${rows.length} of ${byOutlet.size} outlet${
      byOutlet.size === 1 ? "" : "s"
    } · facing-days at stake`,
    howToRead:
      "Each bar is one store, and its length is the shelf space lost multiplied by the days it has been lost for. Violet marks the ones already past critical.",
    soWhat: `Working the top ${Math.min(3, rows.length)} recovers most of the ${formatImpact(
      decision.impact.value
    )} at stake here.`,
    table: {
      columns: ["Outlet", "District", "Facing-days"],
      rows: rows.map((r) => [r.label, r.meta ?? "—", r.value]),
    },
  };
}

/* R2's headline carries the deficit; pulling it back out beats
   recomputing it and risking a different number than the card shows. */
export function deficitOf(insight: Insight): number {
  const match = insight.headline.match(/([\d.]+)pt/);
  return match ? Number(match[1]) : 0;
}

/* Every district's client share against the citywide figure — the same
   arithmetic R2 does, run over all of them rather than only the ones
   that cross its threshold, because the chart needs the full spread
   while the rule only reports exceptions. */
export function districtShares(view: ReturnType<typeof applyFilters>) {
  const stocked = view.cells.filter((c) => c.state === "in-stock");
  let cityTotal = 0;
  let cityClient = 0;
  const byArea = new Map<
    string,
    { total: number; client: number; outlets: Set<string> }
  >();

  for (const cell of stocked) {
    const outlet = posOf(cell.posId);
    if (!outlet) continue;
    const isClient = skuOf(cell.skuId)?.brandId === clientBrand.id;
    cityTotal += cell.facings;
    if (isClient) cityClient += cell.facings;

    const entry =
      byArea.get(outlet.area) ??
      { total: 0, client: 0, outlets: new Set<string>() };
    entry.total += cell.facings;
    if (isClient) entry.client += cell.facings;
    entry.outlets.add(cell.posId);
    byArea.set(outlet.area, entry);
  }

  if (!cityTotal) return [];
  const cityShare = (cityClient / cityTotal) * 100;

  return [...byArea.entries()]
    .filter(([, e]) => e.total > 0)
    .map(([area, e]) => ({
      area,
      outlets: e.outlets.size,
      delta: Math.round(((e.client / e.total) * 100 - cityShare) * 10) / 10,
    }))
    .sort((a, b) => a.delta - b.delta);
}

