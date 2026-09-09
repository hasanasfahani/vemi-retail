"use client";

/* PAGE 7 · Revisit Management.

   Vemi audits a rotating panel, so "go back to that door" is the
   difference between a survey and a service. This page is that
   request, its pipeline, and the proof it was worth making.

   Before/after is deliberately restricted to outlets in the queue that
   the audit actually returned to. Everything else in the queue is
   honestly "awaiting its revisit" — showing a comparison for a door
   nobody went back to would be inventing the very thing this page
   exists to demonstrate. */

import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/market/PageShell";
import PosDrawer from "@/components/market/PosDrawer";
import ShelfScene from "@/components/market/ShelfScene";
import { Card, DataTable, EmptyState, StatCard, type Column } from "@/components/market/ui";
import Badge from "@/components/market/ui/Badge";
import Delta from "@/components/market/ui/Delta";
import Bar from "@/components/market/ui/Bar";
import { useActions } from "@/components/market/useActions";
import { useRevisits } from "@/components/market/useRevisits";
import { posRows } from "@/lib/market/pos";
import {
  REVISIT_STAGES, comparisons, type Comparison, type Revisit, type RevisitStage,
} from "@/lib/market/revisits";
import { applyFilters, EMPTY_FILTERS, type MarketView } from "@/lib/market/filters";
import { cityName, loadMonth, monthLabel, posOf } from "@/lib/market";
import type { MonthData } from "@/lib/market/types";
import type { Band } from "@/components/market/ui/health";

const PRIORITY_BAND: Record<Revisit["priority"], Band> = {
  high: "critical",
  medium: "attention",
  low: "average",
};

/* One cycle back — the audit a revisit is measured against. */
const PRIOR = "2026-08";

export default function RevisitsView() {
  return <PageShell>{(view) => <Revisits view={view} />}</PageShell>;
}

function Revisits({ view }: { view: MarketView }) {
  const board = useActions();
  const rows = useMemo(() => posRows(view), [view]);

  /* Outlets bad enough that somebody would ask for a special trip:
     worst execution first, and only where the audit actually found
     something. These seed the queue alongside the scheduled actions. */
  const candidates = useMemo(
    () =>
      [...rows]
        .filter((row) => row.issues.length > 0)
        .sort((a, b) => a.score - b.score)
        .slice(0, 30)
        .map((row) => ({
          posId: row.pos.id,
          reason: row.issues[0].detail,
          priority: (row.issues[0].severity === "critical" ? "high" : "medium") as "high" | "medium",
        })),
    [rows]
  );

  const queue = useRevisits(board.actions, view.month, candidates);
  const [prior, setPrior] = useState<MonthData | null>(null);
  const [openPos, setOpenPos] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    loadMonth(PRIOR).then((data) => {
      if (live) setPrior(data);
    });
    return () => {
      live = false;
    };
  }, []);

  const priorView = useMemo(
    () => (prior ? applyFilters({ ...EMPTY_FILTERS, month: PRIOR }, prior) : null),
    [prior]
  );

  const pairs = useMemo<Comparison[]>(
    () =>
      queue.revisits && priorView ? comparisons(queue.revisits, priorView, view) : [],
    [queue.revisits, priorView, view]
  );

  if (queue.loading || !queue.revisits) {
    return <div className="h-64 animate-pulse rounded-[14px] border border-line bg-white" />;
  }

  const revisits = queue.revisits;
  const at = (stage: RevisitStage) => revisits.filter((r) => r.stage === stage).length;
  const improved = pairs.filter((p) => p.improved);

  const columns: Column<Revisit>[] = [
    {
      id: "pos",
      header: "Outlet",
      sortValue: (r) => posOf(r.posId)?.name ?? r.posId,
      csv: (r) => posOf(r.posId)?.name ?? r.posId,
      render: (r) => {
        const outlet = posOf(r.posId);
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{outlet?.name ?? r.posId}</p>
            <p className="mono truncate text-[11px] text-ink-400">
              {outlet ? `${outlet.district}, ${cityName(outlet.cityId)}` : ""}
            </p>
          </div>
        );
      },
    },
    {
      id: "reason",
      header: "Reason",
      sortValue: (r) => r.reason,
      render: (r) => <span className="line-clamp-2 text-ink-700">{r.reason}</span>,
    },
    {
      id: "priority",
      header: "Priority",
      sortValue: (r) => ({ high: 0, medium: 1, low: 2 })[r.priority],
      csv: (r) => r.priority,
      render: (r) => <Badge band={PRIORITY_BAND[r.priority]} label={r.priority} size="sm" />,
    },
    { id: "by", header: "Requested by", sortValue: (r) => r.requestedBy, render: (r) => r.requestedBy },
    { id: "at", header: "Flagged", sortValue: (r) => r.flaggedAt, render: (r) => <span className="mono">{r.flaggedAt.slice(5)}</span> },
    {
      id: "planned",
      header: "Planned cycle",
      sortValue: (r) => r.plannedMonth,
      render: (r) => monthLabel(r.plannedMonth),
    },
    {
      id: "stage",
      header: "Status",
      sortValue: (r) => REVISIT_STAGES.findIndex((s) => s.id === r.stage),
      csv: (r) => r.stage,
      render: (r) => (
        <select
          value={r.stage}
          onChange={(e) => queue.move(r.posId, e.target.value as RevisitStage)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Status for ${posOf(r.posId)?.name ?? r.posId}`}
          className="rounded-[7px] border border-line-strong bg-white px-1.5 py-1 text-[11.5px] text-ink-700 outline-none transition-colors hover:border-ink-400"
        >
          {REVISIT_STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>{stage.label}</option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[12.5px] leading-snug text-ink-500">
        Outlets scheduled from the Action Center start here automatically; anything flagged from an
        outlet&apos;s own panel joins the same queue. Changes are kept in this browser only.{" "}
        <button
          type="button"
          onClick={queue.reset}
          className="font-semibold text-violet-ink hover:underline"
        >
          Reset the queue
        </button>
        .
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="In the queue" value={revisits.length} footnote="Outlets requested for a future route" />
        <StatCard label="On a route" value={at("route") + at("visited")} footnote="Accepted and scheduled with a field auditor" />
        <StatCard
          label="Revisited"
          value={pairs.length}
          footnote={`Queued outlets the ${monthLabel(view.month)} audit reached again`}
        />
        <StatCard
          label="Improved"
          value={improved.length}
          band={improved.length ? "strong" : "average"}
          footnote="Execution score higher than at the previous visit"
        />
      </div>

      {/* ---------- A · the queue ---------- */}
      <Card
        title="Revisit queue"
        lead="Every outlet requested for another visit, and where each request has got to."
        padded={false}
      >
        <DataTable
          rows={revisits}
          columns={columns}
          rowKey={(r) => r.posId}
          searchable
          searchText={(r) => `${posOf(r.posId)?.name ?? ""} ${r.reason} ${r.requestedBy}`}
          searchPlaceholder="Search the queue…"
          defaultSort={{ id: "priority", dir: "asc" }}
          exportName="revisit-queue"
          pageSize={10}
          onRowClick={(r) => setOpenPos(r.posId)}
          empty={{
            title: "Nothing queued",
            lead: "Flag an outlet from its panel in the POS Explorer, or schedule an action for revisit in the Action Center.",
          }}
        />
      </Card>

      {/* ---------- B · pipeline ---------- */}
      <section>
        <h2 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          Pipeline
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {REVISIT_STAGES.map((stage, index) => {
            const count = at(stage.id);
            const share = revisits.length ? (count / revisits.length) * 100 : 0;
            return (
              <div
                key={stage.id}
                className="flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="mono text-[11px] text-ink-400">{index + 1}</span>
                  <span className="font-display text-[22px] font-bold leading-none tracking-tight text-ink-900">
                    {count}
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] font-semibold text-ink-900">{stage.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-ink-400">{stage.hint}</p>
                <div className="mt-2.5">
                  <Bar value={share} max={100} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- C · before and after ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Before and after
          </h2>
          <span className="mono text-[11.5px] text-ink-400">
            {monthLabel(PRIOR)} against {monthLabel(view.month)}
          </span>
        </div>

        <p className="mb-3 max-w-[92ch] rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[11.5px] leading-relaxed text-ink-500">
          These are two audits of the same door, side by side. They show what changed between
          visits — not that the revisit request caused it. One outlet, no control group: a shelf
          can recover because a delivery finally arrived, and it would look identical here.
        </p>

        {pairs.length === 0 ? (
          <Card>
            <EmptyState
              title="No queued outlet has been revisited yet"
              lead={`A comparison needs the same door audited twice. None of the ${revisits.length} outlets in the queue was reached again in ${monthLabel(view.month)} — the panel has not been back.`}
            />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {pairs.slice(0, 6).map((pair) => (
              <ComparisonCard
                key={pair.posId}
                pair={pair}
                beforeCells={
                  priorView?.cells.filter((c) => c.posId === pair.posId) ?? []
                }
                afterCells={rows.find((r) => r.pos.id === pair.posId)?.cells ?? []}
                onOpen={() => setOpenPos(pair.posId)}
              />
            ))}
          </div>
        )}
      </section>

      <PosDrawer
        posId={openPos}
        view={view}
        rows={rows}
        onClose={() => setOpenPos(null)}
        flagged={openPos ? queue.flagged.has(openPos) : false}
        onFlag={queue.flag}
        onUnflag={queue.unflag}
      />
    </div>
  );
}

/* One outlet, twice — with the shelf drawn from each visit's own rows,
   so the two pictures differ exactly as much as the two audits did. */
function ComparisonCard({
  pair, beforeCells, afterCells, onOpen,
}: {
  pair: Comparison;
  beforeCells: Parameters<typeof ShelfScene>[0]["cells"];
  afterCells: Parameters<typeof ShelfScene>[0]["cells"];
  onOpen: () => void;
}) {
  const measures = [
    { key: "score" as const, label: "Execution", unit: "" },
    { key: "availability" as const, label: "Availability", unit: "%" },
    { key: "shelfShare" as const, label: "Shelf share", unit: "%" },
    { key: "posm" as const, label: "POSM", unit: "%" },
  ];

  return (
    <article className="overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--shadow-card)]">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h3 className="font-display text-[14.5px] font-bold tracking-tight text-ink-900">
            {pair.name}
          </h3>
          <p className="text-[12px] text-ink-500">{pair.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            band={pair.improved ? "strong" : pair.delta.score === 0 ? "average" : "critical"}
            label={
              pair.improved
                ? `+${pair.delta.score} execution`
                : pair.delta.score === 0
                  ? "No change"
                  : `${pair.delta.score} execution`
            }
          />
          <button
            type="button"
            onClick={onOpen}
            className="text-[12px] font-semibold text-violet-ink hover:underline"
          >
            Open outlet
          </button>
        </div>
      </header>

      <div className="grid gap-0 md:grid-cols-2">
        {[
          { side: pair.before, cells: beforeCells, label: "Before" },
          { side: pair.after, cells: afterCells, label: "After" },
        ].map((panel, index) => (
          <div
            key={panel.label}
            className={`min-w-0 p-4 ${index === 0 ? "border-b border-line md:border-b-0 md:border-r" : ""}`}
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                {panel.label} · {panel.side.month}
              </span>
              <span className="mono text-[11px] text-ink-400">
                {panel.side.auditedAt.slice(5)} · {panel.side.collector}
              </span>
            </div>
            <ShelfScene cells={panel.cells} height={150} />
            <p className="mono mt-1.5 text-[11px] text-ink-400">
              {panel.side.gaps} line{panel.side.gaps === 1 ? "" : "s"} out of stock
            </p>
          </div>
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-x-5 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-4">
        {measures.map((measure) => (
          <div key={measure.key}>
            <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
              {measure.label}
            </dt>
            <dd className="mono mt-0.5 flex items-baseline gap-1.5 text-[13px] text-ink-900">
              <span className="text-ink-400">
                {pair.before[measure.key]}
                {measure.unit}
              </span>
              <span aria-hidden className="text-ink-400">→</span>
              <span className="font-semibold">
                {pair.after[measure.key]}
                {measure.unit}
              </span>
            </dd>
            <dd className="mt-0.5">
              <Delta value={pair.delta[measure.key]} unit={measure.unit || "pt"} />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
