"use client";

/* PAGE 5 · FOLLOW-UP AUDIT CENTER.

   One question, answered three levels deep:

     which gaps did we ask Vemi to check again, where are they,
     and did they improve?

   This replaced a Kanban with owners, due dates and drag-and-drop.
   That board could say an action was closed; it could not say whether
   closing it changed anything on a shelf, and "closed" is a claim by
   the person who did the work rather than an observation of the
   market. Vemi's value is the observation.

   EVERY NUMBER HERE IS RECOMPUTED from the rows the current filter
   selects — at request, governorate and outlet level. Nothing is
   cached on a request, so narrowing to one SKU moves the baseline, the
   follow-up and the change together rather than leaving a filtered row
   list under an unfiltered headline. */

import { useMemo, useState } from "react";
import PageShell from "@/components/market/PageShell";
import PosDrawer from "@/components/market/PosDrawer";
import FollowUpResult from "@/components/market/FollowUpResult";
import { Card, EmptyState, InfoTip, StatCard, Toasts, useToasts } from "@/components/market/ui";
import Badge from "@/components/market/ui/Badge";
import { useFollowUps } from "@/components/market/useFollowUps";
import { useFollowUpMonths } from "@/components/market/useFollowUpMonths";
import { useTargets } from "@/components/market/useTargets";
import { buildRows, isPreliminary, summarise, type FollowUpRow } from "@/lib/market/followUpView";
import {
  CANCEL_REASONS, REQUEST_STATUS, RESULT_LABEL, canCancel, cycleLabel,
  type RequestStatus, type RevisitResult,
} from "@/lib/market/followUp";
import { KPI_LABEL, type IssueKpi } from "@/lib/market/issues";
import { clientBrand, contract, monthLabel, months } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";

const KPIS: IssueKpi[] = ["availability", "shelfShare", "assortment", "price", "posm"];
const RESULTS: RevisitResult[] = ["pending", "improved", "no-change", "worsened", "mixed"];

export default function ActionsView() {
  return <PageShell>{(view) => <FollowUpCenter view={view} />}</PageShell>;
}

function FollowUpCenter({ view }: { view: MarketView }) {
  const queue = useFollowUps();
  const targets = useTargets();
  const { toasts, push, dismiss } = useToasts();

  const [kpiFilter, setKpiFilter] = useState<IssueKpi | "">("");
  const [cycleFilter, setCycleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");
  const [resultFilter, setResultFilter] = useState<RevisitResult | "">("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openGov, setOpenGov] = useState<Set<string>>(new Set());
  /* Which outlet is open, and the request it was opened from — the
     drawer needs the request to know which KPI's issues to show and
     which two cycles to compare. */
  const [openPos, setOpenPos] = useState<{ posId: string; requestId: string } | null>(null);

  const requests = useMemo(() => queue.requests ?? [], [queue.requests]);
  const monthIds = useMemo(
    () => requests.flatMap((r) => [r.originMonth, r.cycle]),
    [requests]
  );
  const { months: loaded, ready } = useFollowUpMonths(monthIds, view.filters);

  /* A cycle is complete when it is not the one still being worked. */
  const completeCycles = useMemo(
    () => new Set(months.filter((m) => m.id < contract.currentMonth || m.id === "2026-10").map((m) => m.id)),
    []
  );

  const rows = useMemo(
    () => (ready ? buildRows(requests, loaded, completeCycles) : []),
    [requests, loaded, ready, completeCycles]
  );

  const shown = useMemo(
    () =>
      rows.filter(
        (row) =>
          (kpiFilter === "" || row.kpi === kpiFilter) &&
          (cycleFilter === "" || row.request.cycle === cycleFilter) &&
          (statusFilter === "" || row.status === statusFilter) &&
          (resultFilter === "" || row.result === resultFilter)
      ),
    [rows, kpiFilter, cycleFilter, statusFilter, resultFilter]
  );

  /* The row the open outlet belongs to, so the drawer can be told
     which case it is looking at. */
  const openRow = openPos
    ? rows.find((r) => r.request.id === openPos.requestId) ?? null
    : null;

  const stats = summarise(shown);
  const cycles = [...new Set(rows.map((r) => r.request.cycle))].sort();

  if (queue.loading || !ready) {
    return <div className="h-64 animate-pulse rounded-[14px] border border-line bg-white" />;
  }

  const toggle = (set: Set<string>, id: string, apply: (next: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-[12px] border border-line bg-white px-3.5 py-2.5 text-[12.5px] leading-snug text-ink-500">
        Gaps you asked Vemi to check again, and what the next audit found. Requests raised here
        and from the Performance tabs live in this browser only.{" "}
        <button type="button" onClick={queue.reset} className="font-semibold text-violet-ink hover:underline">
          Reset the queue
        </button>
        .
      </p>

      {/* ---------- summary ---------- */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Active requests" value={stats.active} footnote="Raised and not yet complete" />
        <StatCard label="POS requested" value={stats.posRequested} footnote="Outlets across live requests" />
        <StatCard label="POS scheduled" value={stats.posScheduled} footnote="On a cycle that has started" />
        <StatCard label="POS revisited" value={stats.posRevisited} footnote="Reached again, and comparable" />
        <StatCard label="Completed" value={stats.completed} footnote="Requests whose cycle is finished" />
      </div>

      {/* ---------- local filters ---------- */}
      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">
          <Select label="KPI" value={kpiFilter} onChange={(v) => setKpiFilter(v as IssueKpi | "")}
            options={KPIS.map((k) => ({ value: k, label: KPI_LABEL[k] }))} />
          <Select label="Cycle" value={cycleFilter} onChange={setCycleFilter}
            options={cycles.map((c) => ({ value: c, label: cycleLabel(c) }))} />
          <Select label="Status" value={statusFilter} onChange={(v) => setStatusFilter(v as RequestStatus | "")}
            options={REQUEST_STATUS.map((s) => ({ value: s.id, label: s.label }))} />
          <Select label="Result" value={resultFilter} onChange={(v) => setResultFilter(v as RevisitResult | "")}
            options={RESULTS.map((r) => ({ value: r, label: RESULT_LABEL[r] }))} />
          <span className="ml-auto flex items-center gap-2">
            <span className="mono text-[11.5px] text-ink-400">
              {shown.length} of {rows.length} requests
            </span>
            <InfoTip label="How these figures are measured">
              Every figure recalculates from the outlets the current filter selects — request,
              governorate and outlet alike. A result compares the SAME outlets on both sides: if
              37 of 41 requested outlets have been revisited, the baseline is recomputed over
              those 37 rather than carried over from all 41.
              <br />
              <br />
              The significance floor is bootstrapped from each cohort&apos;s own outlets, so a
              smaller group needs a larger move before anything is claimed. That is why a request
              can read Improved while every governorate inside it reads no material change — the
              pooled cohort has more evidence than any part of it.
            </InfoTip>
          </span>
        </div>

        {shown.length === 0 ? (
          <EmptyState
            title="No follow-up matches these filters"
            lead="Clear a filter, or raise a request from a Performance tab."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-line">
                  {["", "KPI / case", "Scope", "Baseline", "Target", "Follow-up", "Status", "Revisit result", ""].map((h, i) => (
                    <th key={i} scope="col" className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => (
                  <RequestRows
                    key={row.request.id}
                    row={row}
                    target={targets[row.kpi]}
                    expanded={expanded.has(row.request.id)}
                    onToggle={() => toggle(expanded, row.request.id, setExpanded)}
                    openGov={openGov}
                    onToggleGov={(id) => toggle(openGov, id, setOpenGov)}
                    onOpenPos={(posId) => setOpenPos({ posId, requestId: row.request.id })}
                    onCancel={(reason) => {
                      queue.cancel(row.request.id, reason);
                      push(`Request cancelled — ${reason.toLowerCase()}.`, "info");
                    }}
                    onShare={() => {
                      const subject = `Vemi follow-up: ${KPI_LABEL[row.kpi]} — ${clientBrand.name}`;
                      const body = [
                        `${KPI_LABEL[row.kpi]} follow-up audit`,
                        `Raised from the ${monthLabel(row.request.originMonth)} audit, checked in ${cycleLabel(row.request.cycle)}.`,
                        `${row.scope.affectedPos} affected POS · ${row.scope.issues} issues`,
                        row.cohort.baseline !== null
                          ? `Baseline ${row.cohort.baseline}% against a ${targets[row.kpi]}% target`
                          : `Baseline pending`,
                        `Governorates: ${row.governorates.map((g) => `${g.name} (${g.scope.affectedPos})`).join(", ")}`,
                      ].join("\n");
                      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      push("Opening your mail client — nothing is sent from the portal.", "info");
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PosDrawer
        posId={openPos?.posId ?? null}
        view={openRow ? (loaded.get(openRow.request.originMonth)?.view ?? view) : view}
        onClose={() => setOpenPos(null)}
        followUp={
          openRow
            ? {
                kpi: openRow.kpi,
                originMonth: openRow.request.originMonth,
                cycle: openRow.request.cycle,
                origin: loaded.get(openRow.request.originMonth)!,
                cyclePair: loaded.get(openRow.request.cycle) ?? null,
              }
            : undefined
        }
      />
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

/* One request, and everything under it. */
function RequestRows({
  row, target, expanded, onToggle, openGov, onToggleGov, onOpenPos, onCancel, onShare,
}: {
  row: FollowUpRow;
  target: number;
  expanded: boolean;
  onToggle: () => void;
  openGov: Set<string>;
  onToggleGov: (id: string) => void;
  onOpenPos: (posId: string) => void;
  onCancel: (reason: string) => void;
  onShare: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const status = REQUEST_STATUS.find((s) => s.id === row.status)!;

  return (
    <>
      <tr className="border-b border-line bg-white">
        <td className="px-3 py-2.5 align-top">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse" : "Expand"}
            className="rounded p-1 text-ink-400 transition-colors hover:bg-canvas hover:text-ink-700"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden
              style={{ transform: expanded ? "rotate(90deg)" : "none" }}>
              <path d="M6 3.5 10.5 8 6 12.5" />
            </svg>
          </button>
        </td>
        <td className="px-3 py-2.5 align-top">
          <p className="font-medium text-ink-900">
            {KPI_LABEL[row.kpi]} — {clientBrand.name} gaps
          </p>
          <p className="mono text-[11px] text-ink-400">
            raised {monthLabel(row.request.originMonth)}
            {row.request.cancelled ? ` · cancelled: ${row.request.cancelled.reason.toLowerCase()}` : ""}
          </p>
        </td>
        <td className="px-3 py-2.5 align-top">
          <p className="mono text-ink-900">{row.scope.affectedPos.toLocaleString()} POS</p>
          <p className="mono text-[11px] text-ink-400">{row.scope.issues.toLocaleString()} issues</p>
        </td>
        <td className="px-3 py-2.5 align-top">
          <span className="mono text-ink-700">
            {row.cohort.baseline === null ? "—" : `${row.cohort.baseline}%`}
          </span>
        </td>
        <td className="px-3 py-2.5 align-top">
          <span className="mono text-ink-400">{target}%</span>
        </td>
        <td className="px-3 py-2.5 align-top">
          <span className="text-ink-700">{cycleLabel(row.request.cycle)}</span>
        </td>
        <td className="px-3 py-2.5 align-top">
          <Badge
            band={
              row.status === "completed" ? "strong"
                : row.status === "cancelled" ? "average"
                : row.status === "in-progress" ? "attention" : "average"
            }
            label={status.label}
            size="sm"
          />
        </td>
        <td className="px-3 py-2.5 align-top">
          <FollowUpResult cohort={row.cohort} result={row.result} preliminary={isPreliminary(row)} />
        </td>
        <td className="px-3 py-2.5 align-top">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onShare}
              className="rounded-[7px] border border-line-strong px-1.5 py-1 text-[11px] font-semibold text-ink-600 transition-colors hover:border-ink-400">
              Share
            </button>
            {canCancel(row.status, row.cohort.matched.length) && (
              <button type="button" onClick={() => setAsking((v) => !v)}
                className="rounded-[7px] border border-line-strong px-1.5 py-1 text-[11px] font-semibold text-ink-600 transition-colors hover:border-ink-400">
                Cancel
              </button>
            )}
          </div>
          {asking && (
            <div className="mt-1.5 flex flex-col gap-1">
              {CANCEL_REASONS.map((reason) => (
                <button key={reason} type="button"
                  onClick={() => { onCancel(reason); setAsking(false); }}
                  className="rounded-[7px] border border-line px-1.5 py-1 text-left text-[11px] text-ink-700 transition-colors hover:border-ink-400">
                  {reason}
                </button>
              ))}
            </div>
          )}
        </td>
      </tr>

      {expanded &&
        row.governorates.map((gov) => (
          <GovernorateRows
            key={gov.governorateId}
            gov={gov}
            requestId={row.request.id}
            target={target}
            preliminary={isPreliminary(row)}
            open={openGov.has(`${row.request.id}|${gov.governorateId}`)}
            onToggle={() => onToggleGov(`${row.request.id}|${gov.governorateId}`)}
            onOpenPos={onOpenPos}
          />
        ))}
    </>
  );
}

function GovernorateRows({
  gov, requestId, target, preliminary, open, onToggle, onOpenPos,
}: {
  gov: FollowUpRow["governorates"][number];
  requestId: string;
  target: number;
  preliminary: boolean;
  open: boolean;
  onToggle: () => void;
  onOpenPos: (posId: string) => void;
}) {
  return (
    <>
      <tr className="border-b border-line bg-canvas/60">
        <td className="px-3 py-2 align-top" />
        <td className="px-3 py-2 align-top" colSpan={2}>
          <button type="button" onClick={onToggle} aria-expanded={open}
            className="flex items-center gap-1.5 text-left">
            <svg viewBox="0 0 16 16" className="h-3 w-3 text-ink-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden
              style={{ transform: open ? "rotate(90deg)" : "none" }}>
              <path d="M6 3.5 10.5 8 6 12.5" />
            </svg>
            <span className="font-medium text-ink-900">{gov.name}</span>
            {gov.capital !== gov.name && (
              <span className="text-[11px] text-ink-400">{gov.capital}</span>
            )}
            <span className="mono text-[11px] text-ink-400">
              {gov.scope.affectedPos} POS · {gov.scope.issues} issues
            </span>
          </button>
        </td>
        <td className="px-3 py-2 align-top">
          <span className="mono text-ink-700">
            {gov.cohort.baseline === null ? "—" : `${gov.cohort.baseline}%`}
          </span>
        </td>
        <td className="px-3 py-2 align-top"><span className="mono text-ink-400">{target}%</span></td>
        <td className="px-3 py-2 align-top" />
        <td className="px-3 py-2 align-top" />
        <td className="px-3 py-2 align-top" colSpan={2}>
          <FollowUpResult cohort={gov.cohort} result={gov.cohort.result} preliminary={preliminary} compact />
        </td>
      </tr>

      {open &&
        gov.pos.map((pos) => (
          <tr key={`${requestId}|${pos.posId}`} className="border-b border-line">
            <td className="px-3 py-1.5" />
            <td className="px-3 py-1.5" colSpan={2}>
              <button type="button" onClick={() => onOpenPos(pos.posId)}
                className="min-w-0 text-left hover:underline">
                <span className="block truncate text-ink-900">{pos.name}</span>
                <span className="mono block truncate text-[11px] text-ink-400">
                  {pos.district} · {pos.retailer} · {pos.issues} {pos.issues === 1 ? "issue" : "issues"}
                </span>
              </button>
            </td>
            <td className="px-3 py-1.5">
              <span className="mono text-ink-700">{pos.before === null ? "—" : `${pos.before}%`}</span>
            </td>
            <td className="px-3 py-1.5"><span className="mono text-ink-400">{target}%</span></td>
            <td className="px-3 py-1.5" colSpan={2}>
              {pos.revisited ? (
                <span className="mono text-[11.5px] text-ink-700">
                  {pos.after}%
                </span>
              ) : (
                <span className="text-[11px] text-ink-400">not yet revisited</span>
              )}
            </td>
            <td className="px-3 py-1.5" colSpan={2}>
              {pos.delta === null ? (
                <span className="text-[11px] text-ink-400">—</span>
              ) : (
                <span
                  className="mono text-[11.5px] font-semibold"
                  style={{ color: pos.delta >= 0 ? "var(--color-good)" : "var(--color-critical)" }}
                >
                  {pos.delta > 0 ? "+" : ""}
                  {pos.delta}pt
                </span>
              )}
            </td>
          </tr>
        ))}
    </>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded-[8px] border bg-white px-2 py-1 text-[12px] outline-none transition-colors ${
          value ? "border-violet-100 bg-violet-050 font-semibold text-violet-ink" : "border-line-strong text-ink-700 hover:border-ink-400"
        }`}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
