"use client";

/* The report list, read from the shared store.

   `useSyncExternalStore` rather than local state so the rail, the index
   page and an open report all reflect the same list the instant any one
   of them changes it — renaming a report in its header has to move in
   the sidebar without a reload. */

import { useCallback, useSyncExternalStore } from "react";
import {
  byRecency, createReport, deleteReport, findReport, getReports, reportsReady,
  saveReports, subscribeReports, upsertReport,
  type CustomReport,
} from "@/lib/market/reports";

/* The server has no storage, so its snapshot is the empty list and the
   client's first render must agree with it. A module-level constant,
   not a fresh literal: useSyncExternalStore compares by identity, and a
   new array each call means every render sees a changed store. */
const NONE: CustomReport[] = [];
const serverReports = () => NONE;
const serverReady = () => false;

export function useReports() {
  const reports = useSyncExternalStore(subscribeReports, getReports, serverReports);
  const ready = useSyncExternalStore(subscribeReports, reportsReady, serverReady);

  const create = useCallback((name?: string) => {
    const report = createReport(name);
    upsertReport(report);
    return report;
  }, []);

  const save = useCallback((report: CustomReport) => upsertReport(report), []);
  const remove = useCallback((id: string) => deleteReport(id), []);
  const find = useCallback((id: string) => findReport(id), []);
  const reorder = useCallback((next: CustomReport[]) => saveReports(next), []);

  return { reports, recent: byRecency(reports), ready, create, save, remove, find, reorder };
}
