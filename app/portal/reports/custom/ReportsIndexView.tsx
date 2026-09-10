"use client";

/* PAGE · the reports somebody built.

   Also where a share link lands. `?r=<encoded>` carries a whole report
   definition, and opening one builds a NEW report with fresh ids rather
   than joining a shared object — two people editing one id would be two
   people disagreeing about one document with no server to arbitrate. */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PageShell from "@/components/market/PageShell";
import { useReports } from "@/components/market/useReports";
import { Card, EmptyState } from "@/components/market/ui";
import { decodeReport, upsertReport } from "@/lib/market/reports";
import { pushToast } from "@/lib/market/toastBus";
import { monthLabel } from "@/lib/market";

export default function ReportsIndexView() {
  return <PageShell>{() => <Index />}</PageShell>;
}

function Index() {
  const router = useRouter();
  const params = useSearchParams();
  const { recent, ready, create } = useReports();
  const shared = params.get("r");
  /* A link must be adopted once. React mounts effects twice in
     development, and without this the same link lands twice. */
  const adopted = useRef<string | null>(null);

  useEffect(() => {
    if (!shared || !ready || adopted.current === shared) return;
    adopted.current = shared;
    const report = decodeReport(shared);
    if (!report) {
      pushToast("That report link could not be read", "info");
      router.replace("/portal/reports/custom");
      return;
    }
    upsertReport(report);
    pushToast(`Added ${report.name} to your reports`);
    router.replace(`/portal/reports/custom/${report.id}`);
  }, [shared, ready, router]);

  const start = () => {
    const report = create();
    router.push(`/portal/reports/custom/${report.id}?new=1`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-[19px] font-bold tracking-tight text-ink-900">
            Reports you built
          </h1>
          <p className="mt-0.5 text-[12.5px] text-ink-500">
            Your own pages, built from the blocks the portal already computes.
          </p>
        </div>
        <button
          type="button"
          onClick={start}
          className="shrink-0 rounded-[9px] bg-violet px-3 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-violet-ink"
        >
          New report
        </button>
      </div>

      {!ready ? (
        <Card>
          <EmptyState title="Reading your reports…" />
        </Card>
      ) : recent.length === 0 ? (
        <Card>
          <EmptyState
            title="No reports yet"
            lead="A report is a page you assemble: pick the blocks that answer your question, give any of them a scope of its own, and the figures recompute from the same audit rows every other page reads."
          />
          <button
            type="button"
            onClick={start}
            className="mt-3 rounded-[9px] bg-violet px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-violet-ink"
          >
            Build one
          </button>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {recent.map((report) => (
            <li key={report.id}>
              <Link
                href={`/portal/reports/custom/${report.id}`}
                className="flex h-full flex-col rounded-[14px] border border-line bg-white p-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-violet"
              >
                <span className="truncate font-display text-[14.5px] font-bold tracking-tight text-ink-900">
                  {report.name}
                </span>
                <span className="mono mt-1 text-[11.5px] text-ink-400">
                  {report.blocks.length === 1 ? "1 block" : `${report.blocks.length} blocks`}
                  {" · "}
                  edited {monthLabel(report.updatedAt.slice(0, 7))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11.5px] leading-snug text-ink-400">
        Reports live in this browser until there is a server to keep them, so a colleague on another
        machine will not see this list. Share one with its link instead — it carries the whole
        definition and builds them their own copy.
      </p>
    </div>
  );
}
