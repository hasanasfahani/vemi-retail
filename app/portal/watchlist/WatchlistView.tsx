"use client";

/* PAGE · Watchlist — the figures somebody asked to keep an eye on.

   This is not the follow-up queue and the difference matters. A
   follow-up sends people back into the field: it costs money, it has a
   cycle, and its result is a matched-cohort comparison with its own
   detection floor. A watch costs nothing. It is a bookmark on a number,
   and its only job is to answer "what has happened since I pinned
   this?"

   ONE TABLE, NOT A STACK OF CARDS. The first version gave each watch
   its own panel, and it read as a stack of unrelated objects: the
   figures never lined up, so comparing two watches meant reading two
   layouts, and the page could not be sorted, searched or exported.
   These rows are all the same shape — a measure, a scope, four
   numbers and a state — which is the definition of a table. It uses
   the same one every other list in the portal uses, so it sorts,
   filters and exports without inventing anything. */

import { useMemo } from "react";
import Link from "next/link";
import PageShell from "@/components/market/PageShell";
import { useWatchlist } from "@/components/market/useWatchlist";
import { Card, StatCard, EmptyState, Badge, Delta, DataTable, type Column } from "@/components/market/ui";
import type { Band } from "@/components/market/ui/health";
import {
  WATCH_FLOOR_PT, WATCH_KPI_LABEL, WATCH_KPI_UNIT, WATCH_STATE_LABEL,
  scopeLabel, scopeMatches, watchState, watchValue,
  type Watch, type WatchState,
} from "@/lib/market/watchlist";
import { monthLabel } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";

const STATE_BAND: Record<WatchState, Band> = {
  reached: "strong",
  improving: "average",
  flat: "attention",
  slipping: "critical",
  "out-of-scope": "average",
};

type Row = {
  watch: Watch;
  measure: string;
  scope: string;
  unit: string;
  current: number | null;
  state: WatchState;
  gap: number | null;
  moved: number | null;
};

export default function WatchlistView() {
  return <PageShell>{(view) => <Watchlist view={view} />}</PageShell>;
}

function Watchlist({ view }: { view: MarketView }) {
  const { watches, ready, remove } = useWatchlist();

  const rows = useMemo<Row[]>(
    () =>
      watches.map((watch) => {
        const inScope = scopeMatches(watch.scope, view);
        const current = inScope ? watchValue(watch, view) : null;
        return {
          watch,
          measure: WATCH_KPI_LABEL[watch.kpi],
          scope: scopeLabel(watch.scope),
          unit: WATCH_KPI_UNIT[watch.kpi],
          current,
          state: watchState(watch, current, inScope),
          gap: current === null ? null : Math.round((watch.target - current) * 10) / 10,
          moved: current === null ? null : Math.round((current - watch.baseline) * 10) / 10,
        };
      }),
    [watches, view]
  );

  const reached = rows.filter((r) => r.state === "reached").length;
  const slipping = rows.filter((r) => r.state === "slipping").length;

  const columns: Column<Row>[] = [
    {
      id: "measure",
      header: "Watching",
      render: (r) => (
        <span className="block min-w-0">
          <span className="block truncate font-semibold text-ink-900">{r.measure}</span>
          <span className="block truncate text-[11px] text-ink-400">{r.scope}</span>
        </span>
      ),
      sortValue: (r) => `${r.measure} ${r.scope}`,
      csv: (r) => `${r.measure} · ${r.scope}`,
    },
    {
      id: "now",
      header: "Now",
      align: "right",
      render: (r) =>
        r.current === null ? (
          <span className="text-ink-400">—</span>
        ) : (
          <span className="mono font-semibold text-ink-900">
            {r.current}
            {r.unit}
          </span>
        ),
      sortValue: (r) => r.current ?? -1,
      csv: (r) => r.current ?? "",
    },
    {
      id: "pinned",
      header: "When pinned",
      align: "right",
      render: (r) => (
        <span className="block">
          <span className="mono block text-ink-700">
            {r.watch.baseline}
            {r.unit}
          </span>
          <span className="block text-[11px] text-ink-400">
            {monthLabel(r.watch.baselineMonth)}
          </span>
        </span>
      ),
      sortValue: (r) => r.watch.baseline,
      csv: (r) => r.watch.baseline,
    },
    {
      id: "since",
      header: "Since",
      align: "right",
      render: (r) =>
        r.moved === null ? (
          <span className="text-ink-400">—</span>
        ) : (
          /* The market's own bootstrapped floor is 1.81pt. Movement
             inside it is reported as flat rather than dressed up. */
          <Delta value={r.moved} unit={r.unit ? "pt" : ""} floor={WATCH_FLOOR_PT} />
        ),
      sortValue: (r) => r.moved ?? 0,
      csv: (r) => r.moved ?? "",
    },
    {
      id: "target",
      header: "Target",
      align: "right",
      render: (r) => (
        <span className="mono text-ink-700">
          {r.watch.target}
          {r.unit}
        </span>
      ),
      sortValue: (r) => r.watch.target,
      csv: (r) => r.watch.target,
    },
    {
      id: "togo",
      header: "Still to go",
      align: "right",
      render: (r) =>
        r.gap === null || r.gap <= 0 ? (
          <span className="text-ink-400">—</span>
        ) : (
          <span className="mono text-ink-700">
            {r.gap}
            {r.unit || " to go"}
          </span>
        ),
      sortValue: (r) => r.gap ?? -1,
      csv: (r) => (r.gap !== null && r.gap > 0 ? r.gap : ""),
    },
    {
      id: "state",
      header: "State",
      render: (r) => <Badge band={STATE_BAND[r.state]} label={WATCH_STATE_LABEL[r.state]} size="sm" />,
      sortValue: (r) => WATCH_STATE_LABEL[r.state],
      csv: (r) => WATCH_STATE_LABEL[r.state],
    },
    {
      id: "action",
      header: "Action",
      align: "right",
      render: (r) => (
        <button
          type="button"
          onClick={() => remove(r.watch.id)}
          className="rounded-[8px] border border-line-strong bg-white px-2 py-1 text-[11.5px] font-semibold text-ink-500 transition-colors hover:border-ink-400 hover:text-ink-900"
        >
          Stop watching
        </button>
      ),
    },
  ];

  if (!ready) {
    return (
      <Card>
        <EmptyState title="Reading your watchlist…" />
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Nothing on the watchlist yet"
          lead="Anywhere a figure is shown — a KPI tile, a brand card, a row in a chart — there is an eye. Click it and the figure lands here with the reading it had on the day, so this page can tell you what has changed since."
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/portal"
            className="rounded-[9px] bg-violet px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-ink"
          >
            Open the dashboard
          </Link>
          <Link
            href="/portal/performance"
            className="rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
          >
            Open Performance
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Watching" value={rows.length} footnote="Figures pinned in this browser" />
        <StatCard
          label="At target"
          value={reached}
          band={reached > 0 ? "strong" : undefined}
          footnote="Already where you asked them to be"
        />
        <StatCard
          label="Moving away"
          value={slipping}
          band={slipping > 0 ? "critical" : undefined}
          footnote={`Down more than ${WATCH_FLOOR_PT}pt since they were pinned`}
        />
      </div>

      <Card
        padded={false}
        footnote="A watch is a bookmark on a figure, not a request for fieldwork — nothing here sends anyone back to an outlet. To do that, raise a follow-up audit from a Performance tab. Where a row reads Outside the current filter, the filters above have narrowed the market away from what that watch asks about, so there is no figure to show. The list lives in this browser only."
      >
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.watch.id}
          searchable
          searchPlaceholder="Find a watch…"
          searchText={(r) => `${r.measure} ${r.scope}`}
          facets={[
            { id: "state", label: "State", value: (r) => WATCH_STATE_LABEL[r.state] },
            { id: "measure", label: "Measure", value: (r) => r.measure },
          ]}
          defaultSort={{ id: "togo", dir: "desc" }}
          exportName={`vemi-watchlist-${view.month}`}
          empty={{ title: "No watch matches this filter" }}
        />
      </Card>
    </div>
  );
}
