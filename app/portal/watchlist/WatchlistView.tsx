"use client";

/* PAGE · Watchlist — the figures somebody asked to keep an eye on.

   This is not the follow-up queue and the difference matters. A
   follow-up sends people back into the field: it costs money, it has a
   cycle, and its result is a matched-cohort comparison with its own
   detection floor. A watch costs nothing. It is a bookmark on a number,
   and its only job is to answer "what has happened since I pinned
   this?"

   So the page is deliberately quiet. Each row states the figure now,
   the figure when it was pinned, the target, and the distance still to
   go — and says plainly when the current filter has narrowed the market
   away from what the watch asks about, rather than showing a number
   that answers a different question. */

import { useMemo } from "react";
import Link from "next/link";
import PageShell from "@/components/market/PageShell";
import { useWatchlist } from "@/components/market/useWatchlist";
import { Card, StatCard, EmptyState, Badge, Delta } from "@/components/market/ui";
import type { Band } from "@/components/market/ui/health";
import {
  WATCH_KPI_LABEL, WATCH_KPI_UNIT, WATCH_STATE_LABEL, scopeLabel, scopeMatches,
  watchState, watchValue,
  type WatchState,
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

export default function WatchlistView() {
  return <PageShell>{(view) => <Watchlist view={view} />}</PageShell>;
}

function Watchlist({ view }: { view: MarketView }) {
  const { watches, ready, remove } = useWatchlist();

  const rows = useMemo(() => {
    return watches
      .map((watch) => {
        const unit = WATCH_KPI_UNIT[watch.kpi];
        const inScope = scopeMatches(watch.scope, view);
        const current = inScope ? watchValue(watch, view) : null;
        return {
          watch,
          current,
          state: watchState(watch, current, inScope),
          unit,
          gap: current === null ? null : Math.round((watch.target - current) * 10) / 10,
          moved: current === null ? null : Math.round((current - watch.baseline) * 10) / 10,
        };
      })
      .sort((a, b) => (b.gap ?? -Infinity) - (a.gap ?? -Infinity));
  }, [watches, view]);

  const reached = rows.filter((r) => r.state === "reached").length;
  const slipping = rows.filter((r) => r.state === "slipping").length;

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
          lead="Anywhere a KPI is shown — the dashboard tiles, the Performance tabs, a governorate card — there is a Watch control. Pin a figure and it lands here with the reading it had on the day, so this page can tell you what has changed since."
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
          footnote={`Down more than ${1.81}pt since they were pinned`}
        />
      </div>

      <section className="flex flex-col gap-3">
        {rows.map(({ watch, current, state, gap, moved, unit }) => (
          <Card key={watch.id} className="px-0">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
              <div className="min-w-[200px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-[14.5px] font-bold tracking-tight text-ink-900">
                    {WATCH_KPI_LABEL[watch.kpi]}
                  </h3>
                  <Badge band={STATE_BAND[state]} label={WATCH_STATE_LABEL[state]} size="sm" />
                </div>
                <p className="mt-0.5 text-[12.5px] text-ink-500">{scopeLabel(watch.scope)}</p>
              </div>

              {state === "out-of-scope" ? (
                <p className="max-w-[42ch] text-[12px] leading-snug text-ink-400">
                  The filters above have narrowed the market away from what this watch asks about,
                  so there is no figure to show. Clear them to see it.
                </p>
              ) : (
                <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                  <Figure label="Now" value={`${current}${unit}`} strong />
                  <Figure
                    label={`Pinned · ${monthLabel(watch.baselineMonth)}`}
                    value={`${watch.baseline}${unit}`}
                  />
                  <Figure label="Target" value={`${watch.target}${unit}`} />
                  <div>
                    <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                      Since
                    </span>
                    <span className="mt-0.5 block">
                      <Delta value={moved ?? 0} unit={unit ? "pt" : ""} floor={1.81} />
                    </span>
                  </div>
                  {gap !== null && gap > 0 && (
                    <Figure label="Still to go" value={`${gap}${unit || " districts"}`} />
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => remove(watch.id)}
                className="shrink-0 self-center rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-500 transition-colors hover:border-ink-400 hover:text-ink-900"
              >
                Stop watching
              </button>
            </div>
          </Card>
        ))}
      </section>

      <p className="text-[11.5px] leading-snug text-ink-400">
        A watch is a bookmark on a figure, not a request for fieldwork — nothing here sends anyone
        back to an outlet. To do that, raise a follow-up audit from a Performance tab. The list
        lives in this browser only.
      </p>
    </div>
  );
}

function Figure({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <span className="block text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </span>
      <span
        className={`mono mt-0.5 block tracking-tight ${
          strong ? "text-[19px] font-semibold text-ink-900" : "text-[14px] text-ink-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
