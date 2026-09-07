/* Server-only read path for the Monitors table — the same shape as
   actionsServer, for the same reason: one fetch implementation shared
   by the API route and anything server-rendered. */

import { hasLabel, toMonitor, type MonitorRecord } from "./monitorsShared";

const AIRTABLE_API = "https://api.airtable.com/v0";

export type ListMonitorsResult =
  | { ok: true; monitors: MonitorRecord[] }
  | { ok: false; error: "not_configured" | "upstream" | "unreachable" };

export function monitorsEnv() {
  return {
    token: process.env.AIRTABLE_TOKEN,
    baseId: process.env.AIRTABLE_BASE_ID,
    table: process.env.AIRTABLE_MONITORS_TABLE ?? "Monitors",
  };
}

export async function listMonitors(): Promise<ListMonitorsResult> {
  const { token, baseId, table } = monitorsEnv();
  if (!token || !baseId) {
    console.error("[monitors] AIRTABLE_TOKEN / AIRTABLE_BASE_ID missing");
    return { ok: false, error: "not_configured" };
  }
  try {
    const res = await fetch(
      `${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}?pageSize=100`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) {
      const detail = await res.text();
      console.error("[monitors] Airtable rejected list", {
        status: res.status,
        detail: detail.slice(0, 500),
      });
      return { ok: false, error: "upstream" };
    }
    const data = await res.json();
    const monitors = (data.records ?? []).filter(hasLabel).map(toMonitor);
    return { ok: true, monitors };
  } catch (err) {
    console.error("[monitors] Airtable unreachable on list", err);
    return { ok: false, error: "unreachable" };
  }
}
