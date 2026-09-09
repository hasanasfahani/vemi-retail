"use client";

/* PAGE 5 · Action Center — where a finding becomes work.

   Three sections: what the queue looks like, the priority list as a
   table, and the workflow board.

   The board is seeded from LAST month's findings and verified against
   this month's audit, because that is the only arrangement in which
   verification can mean anything: an action raised against today's
   fieldwork cannot have been checked yet, since nobody has been back.

   "Verified" is therefore not a column somebody drags a card into. It
   is granted by the engine — the finding that raised the action no
   longer fires at the outlets the audit reached — and refused when the
   panel has not returned. The board can be worked freely; it just
   cannot award itself credit. */

import { useMemo, useState } from "react";
import PageShell from "@/components/market/PageShell";
import ActionCard from "@/components/market/ActionCard";
import { useActions } from "@/components/market/useActions";
import { Card, DataTable, StatCard, type Column } from "@/components/market/ui";
import Badge from "@/components/market/ui/Badge";
import {
  OUTCOME_LABEL, OWNERS, STAGES, governorateLabel, ownerName, summarise,
  todayISO, verify, type Action, type Owner, type Priority, type StageId,
  type Verification,
} from "@/lib/market/actions";
import { RULE_IDS, generateInsights } from "@/lib/market/insights";
import { formatIqd } from "@/lib/market/economics";
import { monthLabel } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";
import type { Band } from "@/components/market/ui/health";

const PRIORITY_BAND: Record<Priority, Band> = {
  high: "critical",
  medium: "attention",
  low: "average",
};

const OUTCOME_BAND: Record<Verification["outcome"], Band> = {
  held: "strong",
  slipped: "critical",
  awaiting: "average",
  untracked: "average",
};

export default function ActionsView() {
  return <PageShell>{(view) => <Actions view={view} />}</PageShell>;
}

function Actions({ view }: { view: MarketView }) {
  const board = useActions();
  const [dragOver, setDragOver] = useState<StageId | null>(null);

  const report = useMemo(() => generateInsights(view), [view]);

  /* Verification runs against the CURRENT month for every action on
     the board, so the answer moves when the audit does. */
  const verified = useMemo(() => {
    const map = new Map<string, Verification>();
    for (const action of board.actions ?? []) {
      map.set(action.id, verify(action, report, view, RULE_IDS));
    }
    return map;
  }, [board.actions, report, view]);

  if (board.loading || !board.actions) {
    return (
      <div className="grid gap-3 lg:grid-cols-6">
        {STAGES.map((stage) => (
          <div key={stage.id} className="h-64 animate-pulse rounded-[14px] border border-line bg-white" />
        ))}
      </div>
    );
  }

  const actions = board.actions;
  const stats = summarise(actions);
  const held = [...verified.values()].filter((v) => v.outcome === "held").length;

  const columns: Column<Action>[] = [
    {
      id: "priority",
      header: "Priority",
      width: "88px",
      sortValue: (a) => ({ high: 0, medium: 1, low: 2 })[a.priority],
      csv: (a) => a.priority,
      render: (a) => <Badge band={PRIORITY_BAND[a.priority]} label={a.priority} size="sm" />,
    },
    {
      id: "issue",
      header: "Issue",
      sortValue: (a) => a.issue,
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{a.issue}</p>
          <p className="truncate text-[11.5px] text-ink-400">{a.recommendation}</p>
        </div>
      ),
    },
    {
      id: "pos",
      header: "Outlets",
      align: "right",
      sortValue: (a) => a.posAffected,
      render: (a) => a.posAffected.toLocaleString(),
    },
    { id: "governorate", header: "Governorate", sortValue: (a) => governorateLabel(a.governorateId), render: (a) => governorateLabel(a.governorateId) },
    { id: "kpi", header: "KPI", sortValue: (a) => a.kpi, render: (a) => a.kpi },
    {
      id: "money",
      header: "At risk",
      align: "right",
      sortValue: (a) => a.money ?? -1,
      csv: (a) => a.money ?? "",
      render: (a) => (a.money === null ? <span className="text-ink-400">—</span> : `${formatIqd(a.money)} IQD`),
    },
    {
      id: "owner",
      header: "Owner",
      sortValue: (a) => ownerName(a.owner),
      render: (a) => (
        <select
          value={a.owner}
          onChange={(e) => board.assign(a.id, e.target.value as Owner)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Owner for ${a.issue}`}
          className="max-w-[150px] rounded-[7px] border border-line-strong bg-white px-1.5 py-1 text-[11.5px] text-ink-700 outline-none transition-colors hover:border-ink-400"
        >
          {OWNERS.map((owner) => (
            <option key={owner} value={owner}>
              {ownerName(owner)} · {owner}
            </option>
          ))}
        </select>
      ),
    },
    {
      id: "due",
      header: "Due",
      sortValue: (a) => a.dueDate,
      render: (a) => {
        const overdue = a.stage !== "resolved" && a.stage !== "verified" && a.dueDate < todayISO();
        return (
          <span className={`mono ${overdue ? "font-semibold text-[color:var(--color-critical)]" : ""}`}>
            {a.dueDate.slice(5)}
          </span>
        );
      },
    },
    {
      id: "stage",
      header: "Status",
      sortValue: (a) => STAGES.findIndex((s) => s.id === a.stage),
      csv: (a) => a.stage,
      render: (a) => (
        <select
          value={a.stage}
          onChange={(e) => board.move(a.id, e.target.value as StageId)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Status for ${a.issue}`}
          className="rounded-[7px] border border-line-strong bg-white px-1.5 py-1 text-[11.5px] text-ink-700 outline-none transition-colors hover:border-ink-400"
        >
          {STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>{stage.label}</option>
          ))}
        </select>
      ),
    },
    {
      id: "verification",
      header: "At re-audit",
      sortValue: (a) => verified.get(a.id)?.outcome ?? "",
      csv: (a) => OUTCOME_LABEL[verified.get(a.id)?.outcome ?? "awaiting"],
      render: (a) => {
        const v = verified.get(a.id);
        if (!v) return null;
        return <Badge band={OUTCOME_BAND[v.outcome]} label={OUTCOME_LABEL[v.outcome]} size="sm" />;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[12.5px] leading-snug text-ink-500">
        This queue was raised from the{" "}
        <strong className="font-semibold text-ink-900">{monthLabel(board.raisedIn)}</strong> audit and
        is being checked against {monthLabel(view.month)} fieldwork. Changes are kept in this
        browser only.{" "}
        <button
          type="button"
          onClick={board.reset}
          className="font-semibold text-violet-ink hover:underline"
        >
          Reset the board
        </button>
        .
      </p>

      {/* ---------- A · summary ---------- */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Critical" value={stats.critical} band={stats.critical ? "critical" : "strong"} footnote="High priority and not yet closed" />
        <StatCard label="Open" value={stats.open} footnote="Raised, not yet verified or resolved" />
        <StatCard label="In progress" value={stats.inProgress} footnote="Assigned or with a revisit scheduled" />
        <StatCard
          label="Held at re-audit"
          value={held}
          band={held ? "strong" : "average"}
          footnote="The finding no longer fires where the panel returned"
        />
        <StatCard label="Overdue" value={stats.overdue} band={stats.overdue ? "attention" : "strong"} footnote={`Past ${todayISO().slice(5)} and still open`} />
      </div>

      {/* ---------- B · priority actions ---------- */}
      <Card
        title="Priority actions"
        lead="Every action raised, worst first. Owner and status are editable here and on the board."
        padded={false}
        footnote="The re-audit column is granted by the engine, not by the status control beside it — moving a card to Verified does not change what the shelf said."
      >
        <DataTable
          rows={actions}
          columns={columns}
          rowKey={(a) => a.id}
          searchable
          searchText={(a) => `${a.issue} ${a.recommendation} ${governorateLabel(a.governorateId)} ${ownerName(a.owner)} ${a.owner} ${a.kpi}`}
          searchPlaceholder="Search actions…"
          defaultSort={{ id: "priority", dir: "asc" }}
          exportName="action-queue"
          pageSize={12}
        />
      </Card>

      {/* ---------- C · workflow ---------- */}
      <section>
        <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            Workflow
          </h2>
          <span className="mono text-[11.5px] text-ink-400">
            Drag a card, or move it with the arrows
          </span>
        </div>

        <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((stage) => {
            const inStage = actions.filter((a) => a.stage === stage.id);
            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(stage.id);
                }}
                onDragLeave={() => setDragOver((held) => (held === stage.id ? null : held))}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) board.move(id, stage.id);
                  setDragOver(null);
                }}
                className={`flex min-h-[220px] min-w-0 flex-col rounded-[14px] border p-2.5 transition-colors ${
                  dragOver === stage.id
                    ? "border-violet bg-violet-050"
                    : "border-line bg-canvas"
                }`}
              >
                <header className="mb-2 px-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[11.5px] font-semibold text-ink-900">{stage.label}</h3>
                    <span className="mono text-[11px] text-ink-400">{inStage.length}</span>
                  </div>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-ink-400">{stage.hint}</p>
                </header>

                <div className="flex flex-col gap-2">
                  {inStage.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      verification={verified.get(action.id)!}
                      onMove={(next) => board.move(action.id, next)}
                      compact
                    />
                  ))}
                  {inStage.length === 0 && (
                    <p className="px-1 py-4 text-center text-[11px] text-ink-400">Nothing here</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
