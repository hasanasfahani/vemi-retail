import Link from "next/link";
import PageHeader from "@/components/portal/PageHeader";
import CoverageMap from "@/components/portal/CoverageMap";
import ShelfPhotos from "@/components/portal/ShelfPhotos";
import StatTile from "@/components/portal/charts/StatTile";
import InsightCard from "@/components/portal/InsightCard";
import DecisionBlock, { type DecisionChart } from "@/components/portal/DecisionBlock";
import ChartFrame from "@/components/portal/ChartFrame";
import DecisionAction from "@/components/portal/DecisionAction";
import DivergingBar from "@/components/portal/charts/DivergingBar";
import { scope } from "@/lib/portal";
import { EMPTY_FILTERS, applyFilters } from "@/lib/portalFilters";
import { generateInsights, type Insight } from "@/lib/insights";
import { buildDecisions, type Decision } from "@/lib/decisions";
import { formatImpact } from "@/lib/economics";
import {
  headline,
  clientBrand,
  competitors,
  brandName,
  posOf,
  skuOf,
  latest,
} from "@/lib/portalData";

export const metadata = {
  title: "Command Center",
};

/* The Decision Layer's surface, rebuilt in Phase 13 around decisions
   rather than findings.

   The page used to rank findings against each other, and its top five
   came back as five separate stockouts — five boxes describing one
   move. Now the engine's output is rolled up by the move it implies,
   each decision leads with the chart that proves it, and the findings
   sit underneath the decision they belong to.

   The test this page is built against: an executive who reads only
   this page can name the three decisions they need to make this week. */
export default function CommandCenterPage() {
  const view = applyFilters(EMPTY_FILTERS, latest);
  const report = generateInsights(view);
  const { decisions, reprice } = buildDecisions(report);
  const { momentum, pricing } = report;

  const top = decisions.slice(0, 3);
  const rank = competitors.findIndex((c) => c.isClient) + 1;

  /* The structural finding and the district rows that prove it. */
  const concentration = report.presence.find(
    (i) => i.rule === "r12-geographic-concentration"
  );
  /* The chart shows every flagged district, but the sentence above it
     names only the ones that cluster — so each row says which it is,
     rather than leaving the reader to reconcile six bars against four
     names. */
  const clustered = new Set(
    concentration?.evidence.table.rows.map((r) => String(r[0])) ?? []
  );
  /* EVERY district, not only the flagged ones. A diverging chart whose
     rows are all on one side is just a bar chart with wasted space —
     and showing only what crossed a threshold would repeat exactly the
     failure this phase exists to fix, where a list shows its top few
     and the shape of the market stays invisible. The districts running
     ahead are what make "the weak ones are all in one place" legible. */
  const flaggedSeverity = new Map(
    report.presence
      .filter((i) => i.rule === "r2-district-deficit")
      .map((f) => [f.entities.area ?? "", f.severity])
  );
  const districtRows = districtShares(view).map((d) => ({
    id: d.area,
    label: d.area,
    delta: d.delta,
    severity:
      flaggedSeverity.get(d.area) === "critical"
        ? ("critical" as const)
        : flaggedSeverity.has(d.area)
          ? ("warning" as const)
          : null,
    meta: clustered.has(d.area)
      ? `${d.outlets} outlets · in the cluster`
      : `${d.outlets} outlets`,
  }));

  return (
    <>
      <PageHeader title="Command Center" lead="The decisions this cycle" />

      {/* verdict — the 5-second read, now naming the move rather than
          the worst individual store */}
      <section className="mb-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        {top.length ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className="dot"
                style={{
                  background:
                    top[0].severity === "critical"
                      ? "var(--color-critical)"
                      : "var(--color-warn)",
                }}
              />
              <span className="t-eyebrow">
                Your first move this cycle · {scope.dataAsOf}
              </span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              {top[0].headline}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              <span className="mono font-semibold text-ink-900">
                {formatImpact(top[0].impact.value)}
              </span>
              {" at stake — "}
              {decisions.length > 1
                ? `${decisions.length - 1} more decision${
                    decisions.length > 2 ? "s" : ""
                  } below.`
                : "the only decision flagged this cycle."}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              <span className="t-eyebrow">This cycle · {scope.dataAsOf}</span>
            </div>
            <p className="mt-2 t-h3 !text-[19px] leading-snug">
              Nothing crossed a threshold this cycle.
            </p>
            <p className="mt-1 text-sm text-ink-500">
              No district, channel, SKU or outlet is currently outside its
              expected range. We looked — that is the result.
            </p>
          </>
        )}

        {momentum?.conceding && momentum.rivalBrandId && (
          <p className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[13px] text-ink-700">
            <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" fill="none" stroke="var(--color-critical)" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M2.5 3.5 6 8l1.7-2.2L9.5 8" />
            </svg>
            Momentum: {clientBrand.name} lost {Math.abs(momentum.clientDelta)}pt of
            share this cycle while{" "}
            <strong className="text-ink-900">
              {brandName(momentum.rivalBrandId)}
            </strong>{" "}
            gained {momentum.rivalDelta}pt.
          </p>
        )}
      </section>

      {/* KPI row — unchanged, still the fastest orientation on the page */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="On-shelf availability"
          value={`${headline.availability}%`}
          delta={headline.availabilityDelta}
          goodDirection="up"
        />
        <StatTile
          label="Shelf share"
          value={`${headline.shelfShare}%`}
          delta={headline.shelfShareDelta}
          goodDirection="up"
          footnote={`Rank ${rank} of ${competitors.length} in category`}
        />
        <StatTile
          label="Price compliance"
          value={`${headline.priceCompliance}%`}
          footnote={`Across ${clientBrand.name} SKUs at RRP ±5%`}
        />
        <StatTile
          label="Active out-of-stocks"
          value={`${headline.activeOos}`}
          goodDirection="down"
          footnote={`${headline.oosDays} lost shelf-days this cycle`}
        />
      </div>

      {/* Market shape — R12, given its own slot rather than a place in
          the decision ranking.

          It is a different kind of statement: not "this is your biggest
          recoverable loss" but "this is the shape your losses are in".
          On raw impact it would rank last of five this cycle (1,600
          facing-days, the smallest group), which would bury the most
          structurally useful thing the engine finds. Ranking it against
          to-do items was the category error — a map is not a task. */}
      {concentration && (
        <section className="mt-4">
          <ChartFrame
            title={concentration.headline}
            subtitle={`${clientBrand.name} shelf share by district · ${scope.dataAsOf}`}
            howToRead="Each row is a district. The centre line is your citywide shelf share; bars to the left fall short of it, and colour marks how far past the reporting threshold each one sits."
            soWhat={concentration.detail}
            table={{
              columns: concentration.evidence.table.columns,
              rows: concentration.evidence.table.rows,
            }}
            action={
              <DecisionAction
                title={`Route a rep through ${concentration.scope.label}`}
                rule={concentration.rule}
                where={concentration.scope.label}
                notes={concentration.detail}
                label="Plan the route"
              />
            }
          >
            <DivergingBar
              rows={districtRows}
              baselineLabel={`your citywide ${clientBrand.name} share`}
              unit="pt"
            />
          </ChartFrame>
        </section>
      )}

      {/* the decisions */}
      <div className="mt-4 flex flex-col gap-4">
        {top.map((decision, i) => {
          const spec = chartFor(decision, view.posCount);
          return (
            <DecisionBlock
              key={decision.id + i}
              decision={decision}
              rank={i + 1}
              {...spec}
            />
          );
        })}
      </div>

      {top.length === 0 && (
        <p className="mt-4 rounded-[18px] border border-line bg-white p-8 text-center text-sm text-ink-400">
          No decision cleared the reporting threshold this cycle.
        </p>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* pricing keeps its own currency and its own block */}
        <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="t-h3">{reprice ? reprice.headline : "Pricing watch"}</h2>
            <span className="text-[12px] text-ink-400">
              Breaching readings, not facing-days
            </span>
          </div>
          <p className="mb-1 text-sm text-ink-500">
            {reprice
              ? reprice.detail
              : "Outlets clustering price breaches — a different problem with a different fix, so it ranks in its own currency."}
          </p>
          {pricing.length ? (
            <ul>
              {pricing.slice(0, 3).map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : (
            <p className="flex items-center justify-center gap-1.5 py-6 text-center text-sm text-ink-400">
              <span className="dot" style={{ background: "var(--color-good)" }} />
              No outlet is clustering price breaches this cycle.
            </p>
          )}
        </section>

        {/* photography — the trust lever */}
        <section className="rounded-[18px] border border-line bg-white p-5 sm:p-6">
          <div className="mb-4">
            <h2 className="t-h3">From the shelf</h2>
            <p className="mt-1 text-sm text-ink-500">
              Geo-stamped in store on {scope.dataAsOf}. Every figure above
              traces back to frames like these.
            </p>
          </div>
          <ShelfPhotos />

          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[13px]">
            <Row label="Outlets audited" value={`${scope.posCount}`} />
            <Row label="SKUs tracked" value={`${scope.skuCount}`} />
            <Row
              label="Category gaps found"
              value={`${headline.totalOos}`}
              tone="critical"
            />
          </dl>
        </section>
      </div>

      {/* coverage */}
      <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="t-h3">Coverage</h2>
          <p className="mt-1 text-sm text-ink-500">
            Live in {scope.city}. Select any governorate to see what it adds.
          </p>
        </div>
        <CoverageMap />
      </section>

      <p className="mt-4 text-[12px] text-ink-400">
        Every decision above is rolled up from findings generated by a stated
        formula over this cycle&apos;s audit data — no forecasting, no machine
        learning.{" "}
        <Link href="/dashboard/shelf" className="font-semibold text-violet-ink hover:underline">
          Open Shelf
        </Link>{" "}
        for the full detail behind any of it.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------
   Chart selection.

   Driven by the decision's own shape, not by a wish for variety: a
   two-point comparison gets the dumbbell, distance-from-my-own-average
   gets the diverging bar, and "which of these is worst" gets ranked
   bars. Every branch also writes its own reading guide and so-what,
   because ChartFrame will not compile without them.
------------------------------------------------------------------ */
function chartFor(
  decision: Decision,
  posCount: number
): {
  chart: DecisionChart;
  chartTitle: string;
  chartSubtitle?: string;
  howToRead: string;
  soWhat: string;
  table?: { columns: string[]; rows: (string | number)[][] };
} {
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
function deficitOf(insight: Insight): number {
  const match = insight.headline.match(/([\d.]+)pt/);
  return match ? Number(match[1]) : 0;
}

/* Every district's client share against the citywide figure — the same
   arithmetic R2 does, run over all of them rather than only the ones
   that cross its threshold, because the chart needs the full spread
   while the rule only reports exceptions. */
function districtShares(view: ReturnType<typeof applyFilters>) {
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

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "critical";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-ink-500">{label}</dt>
      <dd
        className="mono font-semibold"
        style={{
          color: tone === "critical" ? "var(--color-critical)" : "var(--color-ink-900)",
        }}
      >
        {value}
      </dd>
    </div>
  );
}
