"use client";

/* PAGE 6 · POS Explorer — the evidence behind every claim.

   Table or map over the same filtered set, with the page-local filters
   the brief asks for layered on top of the global ones: score band,
   availability, POSM, whether the door has an open issue, whether it is
   already queued for a revisit.

   These filters are page-local on purpose. The global filters describe
   the scope a reader is asking about and travel between pages; "show
   me only outlets scoring under 55" is a way of working through THIS
   list, and carrying it to the dashboard would silently narrow figures
   nobody thought they had filtered. */

import { useCallback, useMemo, useState } from "react";
import PageShell from "@/components/market/PageShell";
import { useTargets } from "@/components/market/useTargets";
import PosDrawer from "@/components/market/PosDrawer";
import MarketMap, { type MapPoint } from "@/components/market/map/MarketMap";
import MapLegend from "@/components/market/map/legend";
import { Card, DataTable, StatCard, Tabs, type Column } from "@/components/market/ui";
import Badge from "@/components/market/ui/Badge";
import { scoreBand, type Band } from "@/components/market/ui/health";
import { useFollowUps } from "@/components/market/useFollowUps";
import { posRows, type PosRow } from "@/lib/market/pos";
import { issuesFor, type IssueKpi } from "@/lib/market/issues";
import { futureCycles } from "@/lib/market/followUp";
import { channelName, governorateName } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";

const SCORE_BANDS = [
  { id: "all", label: "Any score", test: () => true },
  { id: "strong", label: "Strong (85+)", test: (r: PosRow) => r.score >= 85 },
  { id: "average", label: "Average (70–84)", test: (r: PosRow) => r.score >= 70 && r.score < 85 },
  { id: "attention", label: "Needs attention (55–69)", test: (r: PosRow) => r.score >= 55 && r.score < 70 },
  { id: "critical", label: "Critical (under 55)", test: (r: PosRow) => r.score < 55 },
];

export default function PosView() {
  return (
    <PageShell search searchPlaceholder="Search outlets…">
      {(view, query) => <Explorer view={view} query={query} />}
    </PageShell>
  );
}

function Explorer({ view, query }: { view: MarketView; query: string }) {
  const targets = useTargets();
  const [mode, setMode] = useState("table");
  const [band, setBand] = useState("all");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [openPos, setOpenPos] = useState<string | null>(null);

  const rows = useMemo(() => posRows(view), [view]);
  const queue = useFollowUps();

  /* Flagging one outlet raises a one-outlet follow-up audit on the KPI
     it is weakest against — the same queue the Performance tabs write
     to, so an outlet cannot be queued on one page and absent from the
     other. Revisit Management used to keep its own list; two lists that
     could disagree is worse than either. */
  const flagged = useMemo(() => {
    const out = new Set<string>();
    for (const request of queue.requests ?? []) {
      if (request.cancelled) continue;
      for (const posId of request.posIds) out.add(posId);
    }
    return out;
  }, [queue.requests]);

  const shown = useMemo(() => {
    const test = SCORE_BANDS.find((b) => b.id === band)?.test ?? (() => true);
    const q = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        test(row) &&
        (!onlyIssues || row.issues.length > 0) &&
        (!onlyFlagged || flagged.has(row.pos.id)) &&
        (q === "" ||
          `${row.pos.name} ${row.pos.code} ${row.pos.district} ${governorateName(row.pos.governorateId)}`
            .toLowerCase()
            .includes(q))
    );
  }, [rows, band, onlyIssues, onlyFlagged, query, flagged]);

  const points = useMemo<MapPoint[]>(
    () =>
      shown.map((row) => ({
        id: row.pos.id,
        name: row.pos.name,
        lat: row.pos.lat,
        lng: row.pos.lng,
        value: row.score,
        band: scoreBand(row.score),
        meta: `${row.pos.district}, ${governorateName(row.pos.governorateId)} · ${row.issues.length} issue${row.issues.length === 1 ? "" : "s"}`,
      })),
    [shown]
  );

  const bandCounts = useMemo(() => {
    const counts: Record<Band, number> = { strong: 0, average: 0, attention: 0, critical: 0 };
    for (const point of points) counts[point.band] += 1;
    return counts;
  }, [points]);

  const flag = useCallback(
    (posId: string) => {
      const row = rows.find((r) => r.pos.id === posId);
      if (!row) return;
      /* Weakest measured component decides which follow-up it joins. */
      const weakest = ([
        ["availability", row.availability],
        ["shelfShare", row.shelfShare],
        ["assortment", row.assortment],
        ["price", row.price],
        ["posm", row.posm],
      ] as const)
        .filter((pair): pair is readonly [IssueKpi, number] => pair[1] !== null)
        .sort((a, b) => a[1] - b[1])[0];
      const kpi: IssueKpi = weakest ? weakest[0] : "availability";
      const cycle = futureCycles(view.month)[0];
      if (!cycle) return;
      queue.create({
        kpi,
        originMonth: view.month,
        cycle,
        posIds: [posId],
        issueIds: issuesFor(view, kpi).filter((i) => i.posId === posId).map((i) => i.id),
      });
    },
    [rows, queue, view]
  );

  const unflag = useCallback(
    (posId: string) => {
      const next = (queue.requests ?? []).filter(
        (r) => !(r.posIds.length === 1 && r.posIds[0] === posId)
      );
      queue.write(next);
    },
    [queue]
  );

  const columns: Column<PosRow>[] = [
    {
      id: "name",
      header: "Outlet",
      sortValue: (r) => r.pos.name,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.pos.name}</p>
          <p className="mono truncate text-[11px] text-ink-400">
            {r.pos.code} · {r.pos.district}
          </p>
        </div>
      ),
      csv: (r) => r.pos.name,
    },
    { id: "governorate", header: "Governorate", sortValue: (r) => governorateName(r.pos.governorateId), render: (r) => governorateName(r.pos.governorateId) },
    { id: "channel", header: "Channel", sortValue: (r) => r.pos.channel, render: (r) => channelName(r.pos.channel) },
    { id: "visit", header: "Visit", sortValue: (r) => r.auditedAt, render: (r) => <span className="mono">{r.auditedAt.slice(5)}</span> },
    {
      id: "score",
      header: "Score",
      align: "right",
      sortValue: (r) => r.score,
      render: (r) => <Badge band={scoreBand(r.score)} label={String(r.score)} size="sm" />,
    },
    {
      id: "availability",
      header: "Avail.",
      align: "right",
      /* Nulls sort last rather than as zero: "nothing listed here" is
         not the worst availability in the market, it is a different
         fact. */
      sortValue: (r) => r.availability ?? 999,
      csv: (r) => r.availability ?? "",
      render: (r) => <Rate value={r.availability} target={targets.availability} />,
    },
    {
      id: "share",
      header: "Shelf",
      align: "right",
      sortValue: (r) => r.shelfShare ?? 999,
      csv: (r) => r.shelfShare ?? "",
      render: (r) => <Rate value={r.shelfShare} />,
    },
    {
      id: "posm",
      header: "POSM",
      align: "right",
      sortValue: (r) => r.posm ?? 999,
      csv: (r) => r.posm ?? "",
      render: (r) => <Rate value={r.posm} target={targets.posm} />,
    },
    {
      id: "issues",
      header: "Issues",
      sortValue: (r) => -r.issues.length,
      csv: (r) => r.issues.map((i) => i.label).join("; "),
      render: (r) =>
        r.issues.length === 0 ? (
          <span className="text-[11.5px] text-ink-400">None</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.issues.slice(0, 2).map((issue) => (
              <Badge
                key={issue.kind}
                band={issue.severity === "critical" ? "critical" : "attention"}
                label={issue.label}
                size="sm"
              />
            ))}
            {r.issues.length > 2 && (
              <span className="mono text-[11px] text-ink-400">+{r.issues.length - 2}</span>
            )}
          </div>
        ),
    },
    {
      id: "revisit",
      header: "Revisit",
      sortValue: (r) => (flagged.has(r.pos.id) ? 0 : 1),
      csv: (r) => (flagged.has(r.pos.id) ? "queued" : ""),
      render: (r) =>
        flagged.has(r.pos.id) ? (
          <Badge band="average" label="Queued" size="sm" />
        ) : (
          <span className="text-[11.5px] text-ink-400">—</span>
        ),
    },
  ];

  const withIssues = rows.filter((r) => r.issues.length > 0).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Outlets audited" value={rows.length} footnote={`${view.coveragePct}% of the outlets in scope`} />
        <StatCard
          label="With an open issue"
          value={withIssues}
          band={withIssues > rows.length / 2 ? "attention" : "average"}
          footnote="At least one threshold breached on the visit"
        />
        <StatCard
          label="Queued for revisit"
          value={flagged.size}
          footnote="Flagged here or scheduled from the Action Center"
        />
        <StatCard label="In this view" value={shown.length} footnote="After the filters below" />
      </div>

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-2.5">
          <Tabs
            tabs={[
              { id: "table", label: "Table", count: shown.length },
              { id: "map", label: "Map" },
            ]}
            active={mode}
            onChange={setMode}
          />
          <label className="ml-auto flex items-center gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Score
            </span>
            <select
              value={band}
              onChange={(e) => setBand(e.target.value)}
              className="rounded-[8px] border border-line-strong bg-white px-2 py-1 text-[12px] text-ink-700 outline-none transition-colors hover:border-ink-400"
            >
              {SCORE_BANDS.map((b) => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-ink-700">
            <input
              type="checkbox"
              checked={onlyIssues}
              onChange={(e) => setOnlyIssues(e.target.checked)}
              className="h-3.5 w-3.5 accent-[color:var(--color-violet)]"
            />
            Has an issue
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-ink-700">
            <input
              type="checkbox"
              checked={onlyFlagged}
              onChange={(e) => setOnlyFlagged(e.target.checked)}
              className="h-3.5 w-3.5 accent-[color:var(--color-violet)]"
            />
            Queued for revisit
          </label>
        </div>

        {mode === "table" ? (
          <DataTable
            rows={shown}
            columns={columns}
            rowKey={(r) => r.pos.id}
            defaultSort={{ id: "score", dir: "asc" }}
            exportName="audited-outlets"
            pageSize={20}
            onRowClick={(r) => setOpenPos(r.pos.id)}
            empty={{
              title: "No outlet matches these filters",
              lead: "Widen the score band, or clear the issue and revisit filters above.",
            }}
          />
        ) : (
          <div className="p-3">
            <div className="mb-2.5">
              <MapLegend counts={bandCounts} />
            </div>
            <MarketMap points={points} onSelect={setOpenPos} height={520} bandOf={scoreBand} />
            <p className="mt-2 text-[11px] leading-snug text-ink-400">
              Outlets are placed within their district rather than surveyed to the street. A
              cluster shows how its outlets typically score, with a red ring where any of them is
              critical.
            </p>
          </div>
        )}
      </Card>

      <PosDrawer
        posId={openPos}
        view={view}
        rows={rows}
        onClose={() => setOpenPos(null)}
        flagged={openPos ? flagged.has(openPos) : false}
        onFlag={flag}
        onUnflag={unflag}
      />
    </div>
  );
}

/* A rate, or an honest dash where there was nothing to measure. */
function Rate({ value, target }: { value: number | null; target?: number }) {
  if (value === null) {
    return (
      <span className="mono text-ink-400" title="Nothing to measure at this outlet">
        —
      </span>
    );
  }
  const short = target !== undefined && value < target;
  return (
    <span className={`mono ${short ? "text-[color:var(--color-serious)]" : ""}`}>{value}%</span>
  );
}
