"use client";

/* REQUEST A FOLLOW-UP AUDIT — the moment the client asks Vemi to go
   back and look again.

   The modal states the scope it inherited from the page, offers three
   ways to choose the outlets, and says out loud how the recommended
   set was ranked. A selection nobody can inspect is the kind of black
   box the rest of this portal avoids, and this one decides where a
   field team spends a day.

   Whatever the page was filtered to is what the request carries: narrow
   to Pepsi 500ml in Baghdad and the request is Pepsi 500ml in Baghdad. */

import { useMemo, useState } from "react";
import Drawer from "./ui/Drawer";
import Badge from "./ui/Badge";
import { Toasts, useToasts } from "./ui";
import { useFollowUps } from "./useFollowUps";
import {
  KPI_LABEL, RECOMMENDATION_RULE, recommendedPos, scopeOf,
  type Issue, type IssueKpi,
} from "@/lib/market/issues";
import { cycleLabel, futureCycles } from "@/lib/market/followUp";
import { clientBrand, governorateName, monthLabel, posOf } from "@/lib/market";
import type { MarketView } from "@/lib/market/filters";

type Mode = "recommended" | "all" | "manual";

export default function RequestFollowUp({
  kpi,
  issues,
  view,
}: {
  kpi: IssueKpi;
  issues: Issue[];
  view: MarketView;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("recommended");
  const [manual, setManual] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const cycles = useMemo(() => futureCycles(view.month), [view.month]);
  const [cycle, setCycle] = useState(cycles[0] ?? "");
  const { toasts, push, dismiss } = useToasts();
  const queue = useFollowUps();

  const scope = useMemo(() => scopeOf(issues), [issues]);
  const recommended = useMemo(() => recommendedPos(issues, view), [issues, view]);
  const affected = useMemo(
    () => [...new Set(issues.map((i) => i.posId))],
    [issues]
  );

  /* Issue count per outlet, for the manual list. */
  const perPos = useMemo(() => {
    const counts = new Map<string, number>();
    for (const issue of issues) counts.set(issue.posId, (counts.get(issue.posId) ?? 0) + 1);
    return counts;
  }, [issues]);

  const selected = useMemo(() => {
    if (mode === "recommended") return recommended;
    if (mode === "all") return affected;
    return [...manual];
  }, [mode, recommended, affected, manual]);

  const selectedIssues = useMemo(() => {
    const set = new Set(selected);
    return issues.filter((i) => set.has(i.posId));
  }, [issues, selected]);

  const existing = (queue.requests ?? []).find(
    (r) => r.kpi === kpi && r.originMonth === view.month && r.cycle === cycle && !r.cancelled
  );

  const listed = useMemo(() => {
    const q = query.trim().toLowerCase();
    return affected
      .map((posId) => ({ posId, outlet: posOf(posId), issues: perPos.get(posId) ?? 0 }))
      .filter((row) => row.outlet)
      .filter((row) =>
        q === "" ||
        `${row.outlet!.name} ${governorateName(row.outlet!.governorateId)}`
          .toLowerCase()
          .includes(q)
      )
      .sort((a, b) => b.issues - a.issues)
      .slice(0, 200);
  }, [affected, perPos, query]);

  const confirm = () => {
    if (selected.length === 0 || !cycle) return;
    queue.create({
      kpi,
      originMonth: view.month,
      cycle,
      posIds: selected,
      issueIds: selectedIssues.map((i) => i.id),
    });
    push(
      `${selected.length} POS added to the ${cycleLabel(cycle)} follow-up audit queue.`
    );
    setOpen(false);
    setMode("recommended");
    setManual(new Set());
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={issues.length === 0}
        className="inline-flex items-center gap-1.5 rounded-[9px] bg-violet px-3 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-ink disabled:cursor-not-allowed disabled:opacity-45"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2.8 8a5.2 5.2 0 1 0 1.7-3.9M4 2.5V5h2.5" />
        </svg>
        Request follow-up audit
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        width={640}
        title="Request a follow-up audit"
        subtitle={`${KPI_LABEL[kpi]} · ${clientBrand.name} · raised from the ${monthLabel(view.month)} audit`}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11.5px] text-ink-500">
              {selected.length.toLocaleString()} POS ·{" "}
              {selectedIssues.length.toLocaleString()} issues ·{" "}
              {cycle ? cycleLabel(cycle) : "no cycle"}
            </span>
            <button
              type="button"
              onClick={confirm}
              disabled={selected.length === 0 || !cycle}
              className="rounded-[9px] bg-violet px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-ink disabled:cursor-not-allowed disabled:opacity-45"
            >
              Confirm follow-up audit
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          {/* what the page found */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-[10px] border border-line bg-canvas px-3 py-2.5">
            {[
              { k: "KPI", v: KPI_LABEL[kpi] },
              { k: "Brand", v: clientBrand.name },
              { k: "Audit period", v: monthLabel(view.month) },
              {
                k: "Issue scope",
                v: `${scope.affectedPos.toLocaleString()} affected POS · ${scope.issues.toLocaleString()} issues`,
              },
            ].map((row) => (
              <div key={row.k}>
                <dt className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">
                  {row.k}
                </dt>
                <dd className="mt-0.5 text-[12.5px] text-ink-900">{row.v}</dd>
              </div>
            ))}
          </dl>

          {existing && (
            <p className="rounded-[10px] border border-violet-100 bg-violet-050 px-3 py-2.5 text-[12px] leading-snug text-violet-ink">
              {/* Reworded to sidestep the article: "A availability
                  request" is what a template gets you when the noun
                  varies. */}
              There is already a {cycleLabel(cycle)} request for{" "}
              {KPI_LABEL[kpi].toLowerCase()}, covering{" "}
              {existing.posIds.length.toLocaleString()} outlets. Confirming again raises a second
              one rather than replacing it.
            </p>
          )}

          {/* which outlets */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Which outlets
            </h3>
            <div className="mt-2 flex flex-col gap-1.5">
              {[
                {
                  id: "recommended" as const,
                  label: `Recommended · ${recommended.length} POS`,
                  hint: RECOMMENDATION_RULE,
                },
                {
                  id: "all" as const,
                  label: `All affected · ${affected.length} POS`,
                  hint: "Every outlet carrying at least one issue in the current filter.",
                },
                {
                  id: "manual" as const,
                  label: `Select manually${manual.size ? ` · ${manual.size} POS` : ""}`,
                  hint: "Pick the outlets yourself from the list below.",
                },
              ].map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer gap-2.5 rounded-[10px] border px-3 py-2.5 transition-colors ${
                    mode === option.id
                      ? "border-violet bg-violet-050"
                      : "border-line hover:border-ink-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === option.id}
                    onChange={() => setMode(option.id)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[color:var(--color-violet)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold text-ink-900">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-ink-500">
                      {option.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          {mode === "manual" && (
            <section>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the affected outlets…"
                className="w-full rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12.5px] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-violet"
              />
              <ul className="mt-2 max-h-[280px] overflow-y-auto rounded-[10px] border border-line">
                {listed.map((row) => (
                  <li key={row.posId} className="border-b border-line last:border-0">
                    <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={manual.has(row.posId)}
                        onChange={(e) => {
                          setManual((held) => {
                            const next = new Set(held);
                            if (e.target.checked) next.add(row.posId);
                            else next.delete(row.posId);
                            return next;
                          });
                        }}
                        className="h-3.5 w-3.5 shrink-0 accent-[color:var(--color-violet)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] text-ink-900">
                          {row.outlet!.name}
                        </span>
                        <span className="mono block truncate text-[11px] text-ink-400">
                          {row.outlet!.district}, {governorateName(row.outlet!.governorateId)}
                        </span>
                      </span>
                      <Badge
                        band={row.issues > 2 ? "critical" : "attention"}
                        label={`${row.issues} ${row.issues === 1 ? "issue" : "issues"}`}
                        size="sm"
                      />
                    </label>
                  </li>
                ))}
              </ul>
              {affected.length > listed.length && (
                <p className="mt-1.5 text-[11px] text-ink-400">
                  Showing {listed.length} of {affected.length.toLocaleString()} affected outlets —
                  search to narrow the list.
                </p>
              )}
            </section>
          )}

          {/* when */}
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Follow-up cycle
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {cycles.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCycle(id)}
                  className={`rounded-[9px] border px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                    cycle === id
                      ? "border-violet bg-violet-050 text-violet-ink"
                      : "border-line-strong bg-white text-ink-700 hover:border-ink-400"
                  }`}
                >
                  {cycleLabel(id)}
                </button>
              ))}
              {cycles.length === 0 && (
                <p className="text-[12px] text-ink-500">
                  No cycle after {monthLabel(view.month)} is open for requests.
                </p>
              )}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-ink-400">
              The outlets join that cycle&apos;s route. Results appear as the field team works
              through them, compared against these same outlets rather than against the market.
            </p>
          </section>
        </div>
      </Drawer>

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
