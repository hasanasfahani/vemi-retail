"use client";

/* THE WORKING BEHIND ONE FINDING.

   Five things, in the order somebody who has decided to look actually
   wants them: what was found, the sentence the rule states about it,
   the arithmetic, where inside the market it sits, and which doors to
   walk into.

   Nothing here is composed for the drawer. The sentence, the formula
   and the evidence table are all fields the rule filled in when it
   fired; the breakdown is the findings subsumption folded away; the
   outlet list is the finding's own `affected` array joined to the
   filtered view. If a number appears twice on this screen it is the
   same number, read twice from the same place. */

import { useMemo } from "react";
import Drawer from "./ui/Drawer";
import DataTable, { type Column } from "./ui/DataTable";
import Badge from "./ui/Badge";
import type { Band } from "./ui/health";
import { OUTCOME_LABEL, type DecisionInsight } from "@/lib/market/insightModel";
import { governorateName, channelName, monthLabel } from "@/lib/market/index";
import type { MarketView } from "@/lib/market/filters";

const PRIORITY_BAND: Record<DecisionInsight["priorityBand"], Band> = {
  high: "critical",
  medium: "attention",
  low: "average",
};

/* Only findings that claim a change carry a basis. Labelling a
   point-in-time finding "market sample" would imply a comparison it
   never made. */
const BASIS: Record<DecisionInsight["comparisonBasis"], string | null> = {
  "point-in-time": null,
  "market-sample": "Market sample — the panel rotates, so these are not the same outlets in both periods",
  "like-for-like": "Like-for-like — the same outlets measured at both ends",
};

const QUALITY_NOTE: Record<DecisionInsight["quality"], string> = {
  high: "Counted over enough outlets to hold",
  medium: "Enough to report, with room to move",
  limited: "Few enough outlets that this could move on the next visit",
};

type OutletRow = {
  id: string;
  name: string;
  code: string;
  governorate: string;
  district: string;
  channel: string;
  retailer: string;
};

export default function InsightDrawer({
  insight,
  view,
  childrenFindings,
  onClose,
  onOpenPos,
}: {
  insight: DecisionInsight | null;
  view: MarketView;
  /* The narrower findings this one absorbed. NOT called `children`:
     Drawer takes real JSX children, and one component holding two
     different meanings of the word is a bug waiting for a refactor. */
  childrenFindings: DecisionInsight[];
  onClose: () => void;
  onOpenPos: (posId: string) => void;
}) {
  const outlets = useMemo<OutletRow[]>(() => {
    if (!insight) return [];
    const byId = new Map(view.outlets.map((o) => [o.id, o]));
    return insight.affected
      .map((id) => byId.get(id))
      .filter((o): o is NonNullable<typeof o> => Boolean(o))
      .map((o) => ({
        id: o.id,
        name: o.name,
        code: o.code,
        governorate: governorateName(o.governorateId),
        district: o.district,
        channel: channelName(o.channel),
        retailer: o.retailer,
      }));
  }, [insight, view]);

  if (!insight) return null;

  const columns: Column<OutletRow>[] = [
    {
      id: "name",
      header: "Outlet",
      render: (r) => (
        <span className="block min-w-0">
          <span className="block truncate font-semibold text-ink-900">{r.name}</span>
          <span className="mono block text-[10.5px] text-ink-400">{r.code}</span>
        </span>
      ),
      sortValue: (r) => r.name,
      csv: (r) => r.name,
    },
    { id: "governorate", header: "Governorate", render: (r) => r.governorate, sortValue: (r) => r.governorate },
    { id: "district", header: "District", render: (r) => r.district, sortValue: (r) => r.district },
    { id: "channel", header: "Channel", render: (r) => r.channel, sortValue: (r) => r.channel },
    { id: "retailer", header: "Retailer", render: (r) => r.retailer, sortValue: (r) => r.retailer },
  ];

  const basis = BASIS[insight.comparisonBasis];

  return (
    <Drawer
      open
      onClose={onClose}
      width={720}
      title={insight.headline}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge band={PRIORITY_BAND[insight.priorityBand]} label={OUTCOME_LABEL[insight.outcome]} size="sm" />
          <span className="mono text-[11px] text-ink-400">
            {insight.scope.label} · {monthLabel(view.month)}
          </span>
        </span>
      }
    >
      <div className="flex flex-col gap-5">
        {/* ---------- what was found ---------- */}
        <section>
          <p className="mono text-[24px] font-semibold leading-none tracking-tight text-ink-900">
            {insight.impact.label}
          </p>
          <p className="mt-2.5 max-w-[68ch] text-[12.5px] leading-relaxed text-ink-700">
            {insight.detail}
          </p>
          {basis && (
            <p className="mt-2 rounded-[10px] border border-line bg-canvas px-3 py-2 text-[11.5px] leading-snug text-ink-500">
              {basis}
            </p>
          )}
        </section>

        {/* ---------- the arithmetic ---------- */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            How this was calculated
          </h3>
          <p className="mono mt-1.5 max-w-[76ch] text-[11.5px] leading-relaxed text-ink-500">
            {insight.evidence.formula}
          </p>
          <div className="mt-2.5 overflow-x-auto rounded-[10px] border border-line">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-line bg-canvas">
                  {insight.evidence.table.columns.map((col) => (
                    <th key={col} scope="col" className="px-3 py-1.5 text-left font-semibold text-ink-400">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {insight.evidence.table.rows.map((row, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-1.5 text-ink-700">
                        {typeof cell === "number" ? cell.toLocaleString() : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11.5px] text-ink-400">
            {insight.confidence === "measured"
              ? "Counted from field rows."
              : "Projected from a measured gap."}{" "}
            {QUALITY_NOTE[insight.quality]}.
          </p>
        </section>

        {/* ---------- what this finding absorbed ----------

            Only shown when there is something behind it. A market
            finding with 123 outlet-level findings folded in owes the
            reader a way to see them; one that stands alone does not
            need an empty heading explaining that it stands alone. */}
        {childrenFindings.length > 0 && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              The {childrenFindings.length} findings behind it
            </h3>
            <p className="mt-1 max-w-[68ch] text-[11.5px] leading-snug text-ink-500">
              Each of these was found separately and says the same thing about one outlet. They
              are here rather than on the page so a single market fact is stated once.
            </p>
            <ul className="mt-2 max-h-[220px] divide-y divide-line overflow-y-auto rounded-[10px] border border-line">
              {childrenFindings.map((child) => (
                <li key={child.id} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                  <span className="min-w-0 truncate text-[12px] text-ink-700">{child.headline}</span>
                  <span className="mono shrink-0 text-[11px] text-ink-400">{child.impact.label}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- the doors ---------- */}
        {outlets.length > 0 && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Outlets this touches
            </h3>
            <div className="mt-2">
              <DataTable
                rows={outlets}
                columns={columns}
                rowKey={(r) => r.id}
                dense
                pageSize={10}
                searchable
                searchPlaceholder="Find an outlet…"
                searchText={(r) => `${r.name} ${r.code} ${r.governorate} ${r.district} ${r.retailer}`}
                facets={[
                  { id: "governorate", label: "Governorate", value: (r) => r.governorate },
                  { id: "channel", label: "Channel", value: (r) => r.channel },
                ]}
                onRowClick={(r) => onOpenPos(r.id)}
                exportName={`vemi-${insight.id}-outlets`}
                empty={{ title: "No outlet in the current filter" }}
              />
            </div>
          </section>
        )}
      </div>
    </Drawer>
  );
}
