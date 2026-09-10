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
import BlockMenu from "@/components/market/BlockMenu";
import { useReports } from "@/components/market/useReports";
import { Card, EmptyState } from "@/components/market/ui";
import ReportTitle from "@/components/market/ReportTitle";
import { useTargets } from "@/components/market/useTargets";
import {
  addBlock, duplicateBlock, moveBlock, removeBlock, renameReport, setBlockScope, setBlockTitle,
  type CustomReport,
} from "@/lib/market/reports";
import { BLOCKS, type BlockDef } from "@/lib/market/reportBlocks";
import { pushToast } from "@/lib/market/toastBus";
import { csvName, downloadCsv } from "@/lib/market/csv";
import { encodeReport } from "@/lib/market/reports";
import { scopeForBlock } from "@/lib/market/reportBlocks";
import { applyFilters } from "@/lib/market/filters";
import { resolveScope } from "@/lib/market/reports";
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

/* Drag starts from a handle, not from the card. A whole draggable card
   swallows text selection and fights every control inside it, so the
   element only becomes draggable while the handle is held. */
function DragHandle({
  label,
  onGrab,
  onRelease,
}: {
  label: string;
  onGrab: () => void;
  onRelease: () => void;
}) {
  return (
    <span
      draggable
      onDragStart={(e) => {
        /* Firefox refuses to start a drag without payload. */
        e.dataTransfer.setData("text/plain", label);
        e.dataTransfer.effectAllowed = "move";
        onGrab();
      }}
      onDragEnd={onRelease}
      title={`Drag to move ${label}`}
      aria-hidden
      className="flex h-6 w-5 cursor-grab items-center justify-center rounded-[7px] text-ink-300 transition-colors hover:bg-canvas hover:text-ink-700 active:cursor-grabbing"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
        <circle cx="6" cy="4" r="1.2" /><circle cx="10" cy="4" r="1.2" />
        <circle cx="6" cy="8" r="1.2" /><circle cx="10" cy="8" r="1.2" />
        <circle cx="6" cy="12" r="1.2" /><circle cx="10" cy="12" r="1.2" />
      </svg>
    </span>
  );
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
  /* Which block is being carried, and which position it is currently
     over. Both are indices into the report's own order, so a drop is
     just `moveBlock`. */
  const [carrying, setCarrying] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

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

  /* The share link IS the sharing mechanism: reports live in this
     browser until there is a server, so a colleague on another machine
     sees an empty list however many exist here. The link carries the
     whole definition and builds them their own copy. */
  const share = () => {
    const url = `${window.location.origin}/portal/reports/custom?r=${encodeReport(report!)}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => pushToast("Link copied — it carries the whole report"))
      .catch(() => pushToast("Could not reach the clipboard; copy the address bar instead", "info"));
  };

  const counts = useMemo(() => {
    const held: Record<string, number> = {};
    for (const block of report?.blocks ?? []) held[block.blockId] = (held[block.blockId] ?? 0) + 1;
    return held;
  }, [report]);

  /* What this reader reaches for, taken from their own reports rather
     than from a separate "recently used" list that would eventually
     disagree with them. */
  const familiar = useMemo(() => {
    const used = new Map<string, number>();
    for (const r of reports) {
      for (const block of r.blocks) used.set(block.blockId, (used.get(block.blockId) ?? 0) + 1);
    }
    return [...used].sort((a, b) => b[1] - a[1]).map(([blockId]) => blockId);
  }, [reports]);

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
        <div className="flex shrink-0 items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="rounded-[9px] bg-violet px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-ink"
          >
            Add block
          </button>
          <button
            type="button"
            onClick={share}
            title="Copy a link that rebuilds this report for someone else"
            className="rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
          >
            Copy link
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-[9px] border border-line-strong bg-white px-2.5 py-1.5 text-[12px] font-semibold text-ink-700 transition-colors hover:border-ink-400"
          >
            Print
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
        /* HTML5 drag rather than a motion library's reorder: those
           measure along ONE axis, and this is a two-column grid where a
           block can move sideways as well as down. Dropping on a
           position is `moveBlock`, which the keyboard path in each
           block's menu already calls — one operation, two ways in. */
        <div className="grid gap-4 lg:grid-cols-2">
          {report.blocks.map((block, index) => {
            const def = BLOCKS.find((b) => b.id === block.blockId);
            /* Captured outside the closure: TypeScript cannot narrow a
               property access through a callback. */
            const toCsv = def?.csv;
            const isCarrying = carrying === index;
            const isTarget = over === index && carrying !== null && carrying !== index;
            return (
              <div
                key={block.id}
                onDragOver={(e) => {
                  if (carrying === null) return;
                  e.preventDefault();
                  setOver(index);
                }}
                onDrop={(e) => {
                  if (carrying === null) return;
                  e.preventDefault();
                  edit(moveBlock(report, report.blocks[carrying].id, index));
                  setCarrying(null);
                  setOver(null);
                }}
                className={`${def?.width === "half" ? "min-w-0" : "min-w-0 lg:col-span-2"} rounded-[15px] transition-all ${
                  isCarrying ? "opacity-40" : ""
                } ${isTarget ? "ring-2 ring-violet ring-offset-2" : ""}`}
              >
                <ReportBlockCard
                  block={block}
                  headerFilters={view.filters}
                  data={data}
                  targets={targets}
                  action={
                    def ? (
                      <>
                        <DragHandle
                          label={block.title ?? def.label}
                          onGrab={() => setCarrying(index)}
                          onRelease={() => {
                            setCarrying(null);
                            setOver(null);
                          }}
                        />
                        <BlockMenu
                          block={block}
                          def={def}
                          index={index}
                          total={report.blocks.length}
                          onScope={(scope) => edit(setBlockScope(report, block.id, scope))}
                          onTitle={(title) => edit(setBlockTitle(report, block.id, title))}
                          onMove={(to) => edit(moveBlock(report, block.id, to))}
                          onDuplicate={() => edit(duplicateBlock(report, block.id))}
                          onDownload={
                            toCsv
                              ? () => {
                                  /* Built over the SAME view the panel
                                     drew, so the file and the picture
                                     cannot disagree. */
                                  const scoped = applyFilters(
                                    scopeForBlock(def, resolveScope(view.filters, block.scope)),
                                    data
                                  );
                                  downloadCsv(
                                    csvName("vemi", report.name, def.label, scoped.month),
                                    toCsv({ view: scoped, targets })
                                  );
                                }
                              : undefined
                          }
                          onRemove={() => edit(removeBlock(report, block.id))}
                        />
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => edit(removeBlock(report, block.id))}
                        className="rounded-[7px] px-1.5 py-[2px] text-[11px] font-semibold text-ink-400 transition-colors hover:bg-canvas hover:text-ink-900"
                      >
                        Remove
                      </button>
                    )
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
        familiar={familiar}
      />
    </div>
  );
}
