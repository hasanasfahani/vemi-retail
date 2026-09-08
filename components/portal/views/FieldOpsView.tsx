"use client";

/* FIELD OPS — the rep's day, promoted out of the gap page.

   The outlet visit-list has lived inside Out-of-Stock Alerts since
   Phase 6, one toggle away from a table of individual gaps. That was
   always the wrong home: routing a rep is a different JOB from
   diagnosing a shelf, done by a different person, on a different
   rhythm. A field manager opens this on a Sunday to decide where one
   van goes on Monday; they are not weighing whether the category has
   a listing problem.

   So the page is built around one artefact — a route — and everything
   on it either sizes that route, orders it, or tells the rep what to
   check when they walk in. The ranking comes from the same
   `lostFacingDays` the rest of the product uses, so a stop's worth
   here is the same number Command Center argued from; the ORDER comes
   from geography, because value-ranked and drivable are not the same
   list. Both steps live in lib/fieldOps.ts, named separately.

   The visit history band answers the question the gap page cannot:
   did the last run work. */

import { useMemo, useState } from "react";
import PageHeader from "@/components/portal/PageHeader";
import FilterBar, { useFilters, useVisitData } from "@/components/portal/FilterBar";
import StatTile from "@/components/portal/charts/StatTile";
import ChartStory from "@/components/portal/ChartStory";
import Dumbbell from "@/components/portal/charts/Dumbbell";
import DistrictMap, {
  type DistrictDatum,
} from "@/components/portal/charts/DistrictMap";
import DecisionAction from "@/components/portal/DecisionAction";
import ImpactBasis from "@/components/portal/ImpactBasis";
import { OutletButton } from "@/components/portal/OutletDrawer";
import { useViewInsights } from "@/components/portal/useViewInsights";
import {
  buildStops,
  orderRoute,
  pickStops,
  type PickStrategy,
  type Stop,
} from "@/lib/fieldOps";
import { applyFilters } from "@/lib/portalFilters";
import { formatImpact } from "@/lib/economics";
import { nextVisitDate } from "@/lib/cadence";
import { scope } from "@/lib/portal";
import {
  clientBrand,
  posOf,
  skuName,
  skuOf,
  visits,
  type VisitData,
} from "@/lib/portalData";

/* A rep's day, in stops. Not a setting anyone configured — the
   default is what one person can genuinely work between opening and
   close in Erbil traffic, and the control exists because a half-day
   and a full week are both real asks. */
const DAY_PRESETS = [6, 8, 12, 20];

export default function FieldOpsView() {
  const [filters, setFilters] = useFilters();
  const [dayLength, setDayLength] = useState(8);
  const [strategy, setStrategy] = useState<PickStrategy>("value");
  /* Null means "the route the ranking suggests". The moment someone
     ticks a box we switch to their list and stop re-picking under
     them — a selection that silently rewrites itself when a filter
     moves is not a plan. */
  const [picked, setPicked] = useState<Set<string> | null>(null);

  const { data: visitData, loading } = useVisitData(filters.visit);

  /* The visit before the one in view, for the did-it-work band. */
  const previousId = useMemo(() => {
    const order = [...visits].map((v) => v.id).sort();
    const i = order.indexOf(filters.visit);
    return i > 0 ? order[i - 1] : null;
  }, [filters.visit]);
  const { data: previousData } = useVisitData(previousId ?? filters.visit);
  const hasHistory = previousId !== null && previousData.visit === previousId;

  const view = useMemo(
    () => applyFilters(filters, visitData),
    [filters, visitData]
  );
  const insights = useViewInsights(view);

  const stops = useMemo(() => buildStops(view), [view]);

  const suggested = useMemo(
    () => new Set(pickStops(stops, dayLength, strategy).map((s) => s.posId)),
    [stops, dayLength, strategy]
  );
  const selected = picked ?? suggested;

  /* What the other strategy would have cost, computed rather than
     asserted — the toggle claims a trade-off, so the page had better
     be able to show it. */
  const alternative = useMemo(
    () =>
      orderRoute(
        pickStops(stops, dayLength, strategy === "value" ? "tight" : "value")
      ),
    [stops, dayLength, strategy]
  );

  const route = useMemo(
    () => orderRoute(stops.filter((s) => selected.has(s.posId))),
    [stops, selected]
  );

  const toggle = (posId: string) => {
    const next = new Set(selected);
    if (next.has(posId)) next.delete(posId);
    else next.add(posId);
    setPicked(next);
  };

  /* Where the day's work sits. Colour is facing-days ON THE ROUTE, not
     citywide, so the map answers "is my route one loop or three" — the
     question this page exists for — rather than repeating the gap
     page's heat map. */
  const districts: DistrictDatum[] = useMemo(() => {
    const areas = new Map<string, { stops: number; lost: number; gaps: number }>();
    for (const stop of stops) {
      const e = areas.get(stop.area) ?? { stops: 0, lost: 0, gaps: 0 };
      if (selected.has(stop.posId)) {
        e.stops += 1;
        e.lost += stop.lostFacingDays;
        e.gaps += stop.mine;
      }
      areas.set(stop.area, e);
    }
    return [...areas.entries()].map(([name, e]) => ({
      name,
      outlets: Math.max(e.stops, 1),
      value: e.lost,
      rows: [
        { label: "Stops on the route", value: `${e.stops}` },
        { label: "Gaps to close", value: `${e.gaps}` },
        {
          label: "Facing-days at stake",
          value: e.lost.toLocaleString(),
          tone: e.lost > 0 ? ("critical" as const) : undefined,
        },
      ],
    }));
  }, [stops, selected]);

  /* Did the last run work? Outlet-level availability, previous visit
     against this one, for the stops on today's route — the only
     population where a rep actually did something. */
  const history = useMemo(() => {
    if (!hasHistory) return [];
    const before = applyFilters(
      { ...filters, visit: previousData.visit },
      previousData as VisitData
    );
    const then = new Map(
      before.byPos.map((p) => [p.posId, p.clientAvailability])
    );
    return route.stops
      .filter((s) => then.has(s.posId))
      .map((s) => ({
        id: s.posId,
        label: s.code,
        a: then.get(s.posId)!,
        b: s.clientAvailability,
        emphasis: s.clientAvailability < then.get(s.posId)!,
      }))
      .sort((x, y) => x.b - y.b);
  }, [hasHistory, filters, previousData, route.stops]);

  const worsened = history.filter((h) => h.b < h.a).length;
  const improved = history.filter((h) => h.b > h.a).length;

  const routeDraft = {
    title: `Work ${route.stops.length} outlet${
      route.stops.length === 1 ? "" : "s"
    } across ${route.legs.length} district${route.legs.length === 1 ? "" : "s"}`,
    rule: "field-ops-route",
    where: route.legs.map((l) => l.area).join(" → ") || "Erbil",
    notes: `${route.gaps} ${clientBrand.name} gaps worth ${formatImpact(
      route.lostFacingDays
    )}, ordered by district so the run is one loop. Roughly ${route.km}km between district centres, out and back.`,
    items: route.stops.map((stop, i) => ({
      id: stop.posId,
      label: stop.code,
      where: `stop ${i + 1} · ${stop.area} · ${stop.mine} gap${
        stop.mine === 1 ? "" : "s"
      }`,
      done: false,
    })),
    itemNoun: "stops, in travel order",
    context: `${formatImpact(route.lostFacingDays)} recoverable · due ${nextVisitDate()}`,
  };

  return (
    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <PageHeader
        title="Field Ops"
        lead="One van, one day — where it goes and what it checks"
        posCount={view.posCount}
      />

      <FilterBar
        filters={filters}
        onChange={(next) => {
          setPicked(null);
          setFilters(next);
        }}
        resultLabel={`${stops.length} outlet${
          stops.length === 1 ? "" : "s"
        } need a ${clientBrand.name} visit`}
      />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Stops on the route"
          value={`${route.stops.length}`}
          footnote={`of ${stops.length} outlets needing a visit`}
        />
        <StatTile
          label="Gaps to close"
          value={`${route.gaps}`}
          goodDirection="down"
          footnote={`${clientBrand.name} lines missing at these stops`}
        />
        <StatTile
          label="Recoverable"
          value={formatImpact(route.lostFacingDays)}
          footnote="if every gap on the route is filled"
        />
        <StatTile
          label="Route span"
          value={`${route.km}km`}
          goodDirection="down"
          footnote={`${route.legs.length} district${
            route.legs.length === 1 ? "" : "s"
          }, out and back`}
        />
      </div>

      <ImpactBasis className="mt-3" />

      {/* size the day */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Size the day
          </span>
          <div className="flex gap-1 rounded-lg bg-canvas p-1">
            {DAY_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setDayLength(n);
                  setPicked(null);
                }}
                aria-pressed={picked === null && dayLength === n}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  picked === null && dayLength === n
                    ? "bg-white text-ink-900 shadow-[var(--shadow-card)]"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {n} stops
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Build it for
          </span>
          <div className="flex gap-1 rounded-lg bg-canvas p-1">
            {(
              [
                { value: "value", label: "Highest value" },
                { value: "tight", label: "Tightest route" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setStrategy(option.value);
                  setPicked(null);
                }}
                aria-pressed={picked === null && strategy === option.value}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  picked === null && strategy === option.value
                    ? "bg-white text-ink-900 shadow-[var(--shadow-card)]"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {picked !== null && (
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="text-[12.5px] font-medium text-violet-ink hover:underline"
          >
            Reset to the suggested route
          </button>
        )}
      </div>

      {/* The trade-off, stated in both currencies. A toggle that claims
          one option is tighter should show what the tightness costs. */}
      {picked === null && route.stops.length > 0 && alternative.stops.length > 0 && (
        <p className="mt-2.5 text-[12.5px] leading-snug text-ink-500">
          {strategy === "value" ? (
            <>
              Working the highest-value stops covers {route.legs.length}{" "}
              district{route.legs.length === 1 ? "" : "s"} in {route.km}km.{" "}
              <strong className="text-ink-700">Tightest route</strong> would
              cover {alternative.legs.length} in {alternative.km}km —{" "}
              {tradeOff(route.lostFacingDays, alternative.lostFacingDays)}
            </>
          ) : (
            <>
              This route stays inside {route.legs.length} district
              {route.legs.length === 1 ? "" : "s"} and {route.km}km.{" "}
              <strong className="text-ink-700">Highest value</strong> would
              reach {alternative.legs.length} in {alternative.km}km —{" "}
              {tradeOff(route.lostFacingDays, alternative.lostFacingDays)}
            </>
          )}
        </p>
      )}

      {/* the route, as geography */}
      <section className="mt-4 rounded-[18px] border border-line bg-white p-5 sm:p-6">
        <h2 className="t-h3">The run</h2>
        <p className="mt-1 mb-5 text-sm text-ink-500">
          Districts on today&rsquo;s route, shaded by what their stops are
          costing. A route that lights up one quadrant is one loop; one that
          lights up opposite corners is a day spent driving. Click a district
          to filter the page to it.
        </p>
        {districts.length ? (
          <DistrictMap
            data={districts}
            selected={filters.areas}
            onSelect={(name) => {
              setPicked(null);
              setFilters({
                ...filters,
                areas: filters.areas.includes(name)
                  ? filters.areas.filter((a) => a !== name)
                  : [...filters.areas, name],
              });
            }}
            legendLabel="Facing-days on the route"
            formatValue={(v) => v.toLocaleString()}
          />
        ) : (
          <p className="py-8 text-center text-sm text-ink-400">
            No {clientBrand.name} gaps in this selection — nothing to route.
          </p>
        )}

        {route.legs.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-2 border-t border-line pt-4 text-[13px]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Order
            </span>
            {route.legs.map((leg, i) => (
              <span key={leg.area} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-ink-400">→</span>}
                <span className="rounded-md bg-canvas px-2 py-1">
                  <span className="font-semibold text-ink-900">{leg.area}</span>
                  <span className="mono ml-1.5 text-[11px] text-ink-400">
                    {leg.stops} stop{leg.stops === 1 ? "" : "s"}
                    {leg.km > 0 && ` · ${leg.km}km`}
                  </span>
                </span>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* the call sheet + the pick list */}
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 overflow-hidden rounded-[18px] border border-line bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5 sm:p-6">
            <div className="min-w-0">
              <h2 className="t-h3">Call sheet</h2>
              <p className="mt-1 text-sm text-ink-500">
                In travel order, with what to check on arrival. Print this or
                send it to Priorities as one job with a stop per line.
              </p>
            </div>
            {route.stops.length > 0 && (
              <DecisionAction draft={routeDraft} label="Send route to Priorities" />
            )}
          </div>

          <div className="max-h-[640px] overflow-auto">
            {route.stops.length ? (
              <ol>
                {route.stops.map((stop, i) => (
                  <CallSheetStop key={stop.posId} stop={stop} index={i} />
                ))}
              </ol>
            ) : (
              <p className="p-8 text-center text-sm text-ink-400">
                No stops selected. Pick a day size above, or tick outlets from
                the list.
              </p>
            )}
          </div>
        </section>

        <div className="flex min-w-0 flex-col gap-4">
          <section className="min-w-0 overflow-hidden rounded-[18px] border border-line bg-white">
            <div className="border-b border-line px-5 py-4">
              <h2 className="t-h3 !text-[15px]">Outlets needing a visit</h2>
              <p className="mt-1 text-[13px] text-ink-500">
                Ranked by what their gaps are costing. Tick to add or drop a
                stop.
              </p>
            </div>
            <div className="max-h-[420px] overflow-auto">
              {stops.length ? (
                stops.map((stop) => (
                  <PickRow
                    key={stop.posId}
                    stop={stop}
                    on={selected.has(stop.posId)}
                    onToggle={() => toggle(stop.posId)}
                  />
                ))
              ) : (
                <p className="p-6 text-center text-sm text-ink-400">
                  Nothing to visit in this selection.
                </p>
              )}
            </div>
          </section>

          {hasHistory && history.length > 0 && (
            <ChartStory
              title="Did the last run work?"
              subtitle={`${clientBrand.name} availability at today's stops`}
              howToRead={`Each row is an outlet on the route. The hollow mark is where it stood at the ${
                visits.find((v) => v.id === previousId)?.label ?? "previous visit"
              }; the solid mark is today. A solid mark to the LEFT of the hollow one means the store went backwards since someone was last there.`}
              soWhat={historySoWhat(improved, worsened, history.length)}
              findings={insights.forRules("r1-persistent-gap", "r9-dark-outlet")}
              clean={historySoWhat(improved, worsened, history.length)}
              allClear="Every stop on this route improved or held since the last visit."
              actionLabel="Create replenishment action"
              visit={view.visit}
              table={{
                columns: ["Outlet", "Previous", "Now"],
                rows: history.map((h) => [h.label, `${h.a}%`, `${h.b}%`]),
              }}
            >
              <Dumbbell
                rows={history}
                aLabel={
                  visits.find((v) => v.id === previousId)?.label ?? "Previous visit"
                }
                bLabel="This visit"
                max={100}
                labelWidth={78}
              />
            </ChartStory>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- pieces ---------- */

function PickRow({
  stop,
  on,
  onToggle,
}: {
  stop: Stop;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 border-b border-line px-5 py-3 last:border-0 transition-colors ${
        on ? "bg-violet-050" : "hover:bg-canvas"
      }`}
    >
      <input
        type="checkbox"
        checked={on}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-violet)]"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[13px] font-semibold text-ink-900">
            {stop.code}
          </span>
          {stop.persistent > 0 && (
            <span className="pill pill-critical">
              {stop.persistent} unresolved
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[12px] text-ink-400">
          {stop.area} · {stop.channel} · {stop.mine} gap
          {stop.mine === 1 ? "" : "s"} · longest {stop.worst}d
        </span>
      </span>
      <span className="mono shrink-0 text-right text-[12px]">
        <span className="block font-semibold text-ink-900">
          {stop.lostFacingDays.toLocaleString()}
        </span>
        <span className="text-[10.5px] text-ink-400">facing-days</span>
      </span>
    </label>
  );
}

function CallSheetStop({ stop, index }: { stop: Stop; index: number }) {
  const outlet = posOf(stop.posId)!;
  const mine = stop.gaps.filter(
    (g) => skuOf(g.skuId)?.brandId === clientBrand.id
  );

  return (
    <li className="border-b border-line px-5 py-4 last:border-0 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mono mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: "var(--color-violet)" }}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <OutletButton posId={stop.posId} />
            <span className="mt-0.5 block text-[12px] text-ink-400">
              {outlet.area} · {outlet.channel}
              {outlet.name ? ` · ${outlet.name}` : ""}
            </span>
          </div>
        </div>
        <span className="mono shrink-0 text-right text-[12px]">
          <span className="block font-semibold text-ink-900">
            {stop.lostFacingDays.toLocaleString()}
          </span>
          <span className="text-[10.5px] text-ink-400">facing-days</span>
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-canvas px-3 py-2.5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Check on arrival
        </div>
        <ul className="mt-1.5 flex flex-col gap-1">
          {mine.map((gap) => (
            <li
              key={`${gap.posId}-${gap.skuId}`}
              className="flex flex-wrap items-baseline justify-between gap-x-3 text-[12.5px]"
            >
              <span className="text-ink-900">
                {skuName(gap.skuId)}
                {gap.persistent && (
                  <span
                    className="ml-1.5 text-[11px] font-semibold"
                    style={{ color: "var(--color-critical)" }}
                  >
                    still empty since {scope.previousVisit}
                  </span>
                )}
              </span>
              <span className="mono shrink-0 text-[11.5px] text-ink-500">
                {gap.daysOut}d out · normally {gap.normalFacings} facing
                {gap.normalFacings === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/* The difference between the two routes, in the currency the reader
   is already thinking in. Both call sites end a sentence about the
   OTHER route, so the comparison is phrased from its side: "less"
   means switching to it gives something up. */
function tradeOff(current: number, other: number) {
  const delta = Math.round(current - other);
  if (delta === 0) return "the same recoverable loss either way.";
  return delta > 0
    ? `${formatImpact(Math.abs(delta))} less recoverable.`
    : `${formatImpact(Math.abs(delta))} more recoverable.`;
}

function historySoWhat(improved: number, worsened: number, total: number) {
  if (!total) return "No comparable reading at the previous visit for these stops.";
  if (worsened === 0)
    return `All ${total} stops on this route held or improved since the last visit — the previous run stuck.`;
  if (improved === 0)
    return `Every one of these ${total} stops is worse than at the last visit. That is a route problem, not ${total === 1 ? "an" : ""} isolated ${total === 1 ? "store" : "stores"} — check whether the last run actually happened.`;
  return `${worsened} of ${total} stops went backwards since the last visit while ${improved} improved. Work the ones that slipped first: they were visited and did not hold.`;
}
