"use client";

/* PAGE · the reports somebody built.

   Also where a share link lands. `?r=<encoded>` carries a whole report
   definition, and opening one builds a NEW report with fresh ids rather
   than joining a shared object — two people editing one id would be two
   people disagreeing about one document with no server to arbitrate. */

import { PageHeader } from "@/components/vemi/PageHeader";
import { contract } from "@/lib/market";
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
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={`${contract.country} · ${contract.category} · Custom reports`}
        title={
          ready && recent.length > 0
            ? `You have built ${recent.length} ${recent.length === 1 ? "report" : "reports"}.`
            : "Build a report around the question you need answered."
        }
        description="Your own pages, built from the blocks the portal already computes."
        actions={
          <button type="button" onClick={start} className="vm-btn vm-btn--primary shrink-0">
            New report
          </button>
        }
      />

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
          <div className="flex justify-center pb-6">
            <button type="button" onClick={start} className="vm-btn vm-btn--secondary">
              Build one
            </button>
          </div>
        </Card>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {recent.map((report) => (
            <li key={report.id}>
              <Link
                href={`/portal/reports/custom/${report.id}`}
                className="flex h-full flex-col rounded-lg border border-line bg-surface p-6 transition-colors hover:border-primary"
              >
                <span className="truncate text-lg font-semibold text-text">{report.name}</span>
                <span className="mt-1 font-mono text-xs text-text-muted">
                  {report.blocks.length === 1 ? "1 block" : `${report.blocks.length} blocks`}
                  {" · "}
                  edited {monthLabel(report.updatedAt.slice(0, 7))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="max-w-[72ch] text-sm text-text-muted">
        Reports live in this browser until there is a server to keep them, so a colleague on another
        machine will not see this list. Share one with its link instead — it carries the whole
        definition and builds them their own copy.
      </p>
    </div>
  );
}
