"use client";

/* PAGE · one custom report.

   The header IS the report's scope. Nothing is pinned to the document,
   so a report opened in November describes November — which is the
   point of it being a report rather than a screenshot. A block that
   wants a different slice overrides it and says so on its own face.

   THE LAYOUT IS AUTOMATIC. Blocks declare their own natural width in
   the catalogue and the grid packs them; the reader places nothing and
   so cannot leave the page in a shape that breaks a chart. */

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import PageShell from "@/components/market/PageShell";
import ReportBlockCard from "@/components/market/ReportBlockCard";
import BlockPicker from "@/components/market/BlockPicker";
import { useReports } from "@/components/market/useReports";
import { Card, EmptyState } from "@/components/market/ui";
import ReportTitle from "@/components/market/ReportTitle";
import { useTargets } from "@/components/market/useTargets";
import { addBlock, removeBlock, renameReport, type CustomReport } from "@/lib/market/reports";
import { BLOCKS, type BlockDef } from "@/lib/market/reportBlocks";
import { pushToast } from "@/lib/market/toastBus";
import type { MarketView } from "@/lib/market/filters";
import type { MonthData } from "@/lib/market/types";

/* The four a report most often opens with. A wholly empty page offering
   one button teaches nothing about what a report can contain. */
const STARTERS = [
  "headline-kpis",
  "availability-by-governorate",
  "shelf-battle-governorate",
  "competition-scoreboard",
];

export default function ReportView() {
  return <PageShell>{(view, _q, data) => <Report view={view} data={data} />}</PageShell>;
}

function Report({ view, data }: { view: MarketView; data: MonthData }) {
  const params = useParams<{ id: string }>();
  const id = String(params?.id ?? "");
  /* Arriving straight from New report: the name opens selected, because
     the first thing anyone does with a new report is name it. */
  const fresh = useSearchParams().get("new") === "1";
  const { reports, ready, save, remove } = useReports();
  const targets = useTargets();
  const [picking, setPicking] = useState(false);

  const report = useMemo(() => reports.find((r) => r.id === id) ?? null, [reports, id]);

  const edit = useCallback(
    (next: CustomReport) => save(next),
    [save]
  );

  const add = useCallback(
    (block: BlockDef) => {
      if (!report) return;
      edit(addBlock(report, block.id));
      pushToast(`Added ${block.label}`);
    },
    [report, edit]
  );

  const counts = useMemo(() => {
    const held: Record<string, number> = {};
    for (const block of report?.blocks ?? []) held[block.blockId] = (held[block.blockId] ?? 0) + 1;
    return held;
  }, [report]);

  if (!ready) {
    return (
      <Card>
        <EmptyState title="Opening the report…" />
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <EmptyState
          title="No report with that address"
          lead="It may have been deleted, or made in another browser — reports live in the browser that made them until there is a server to keep them."
        />
        <Link
          href="/portal/reports/custom"
          className="mt-3 inline-block rounded-[9px] bg-violet px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-ink"
        >
          All reports
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <ReportTitle
          name={report.name}
          autoEdit={fresh}
          onRename={(name) => edit(renameReport(report, name))}
        />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="rounded-[9px] bg-violet px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-ink"
          >
            Add block
          </button>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm(`Delete “${report.name}”? This cannot be undone.`)) return;
              remove(report.id);
              pushToast(`Deleted ${report.name}`, "info");
              window.location.href = "/portal/reports/custom";
            }}
            className="rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-500 transition-colors hover:border-ink-400 hover:text-ink-900"
          >
            Delete report
          </button>
        </div>
      </div>

      {report.blocks.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="flex h-28 w-full max-w-[420px] flex-col items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed border-line-strong text-ink-500 transition-colors hover:border-violet hover:text-violet-ink"
            >
              <span className="text-[26px] leading-none">+</span>
              <span className="text-[13px] font-semibold">Add your first block</span>
            </button>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[11.5px] text-ink-400">or start with one of these</span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {STARTERS.map((blockId) => {
                  const block = BLOCKS.find((b) => b.id === blockId);
                  if (!block) return null;
                  return (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => add(block)}
                      className="rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:border-violet hover:text-violet-ink"
                    >
                      {block.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {report.blocks.map((block) => {
            const def = BLOCKS.find((b) => b.id === block.blockId);
            return (
              <div
                key={block.id}
                className={def?.width === "half" ? "min-w-0" : "min-w-0 lg:col-span-2"}
              >
                <ReportBlockCard
                  block={block}
                  headerFilters={view.filters}
                  data={data}
                  targets={targets}
                  action={
                    <button
                      type="button"
                      onClick={() => edit(removeBlock(report, block.id))}
                      className="rounded-[7px] px-1.5 py-[2px] text-[11px] font-semibold text-ink-400 transition-colors hover:bg-canvas hover:text-ink-900"
                    >
                      Remove
                    </button>
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <BlockPicker
        open={picking}
        onClose={() => setPicking(false)}
        onAdd={add}
        counts={counts}
      />
    </div>
  );
}
