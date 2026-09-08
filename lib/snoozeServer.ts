/* Server-only read path for the Snoozes table — same shape as
   actionsServer and monitorsServer, one fetch implementation shared by
   the API route and anything server-rendered.

   ONE DELIBERATE DIFFERENCE from its siblings: this one fails OPEN.

   Priorities and the Watchlist are fail-loud, because an action queue
   that silently loses a task is worse than one that says it is broken.
   The rule inverts here, because this table's job is to HIDE findings.
   If it is unreachable, or has not been created yet, the safe
   degradation is that nothing is hidden — the reader sees every
   finding, exactly as they did before this feature existed. A snooze
   store that fails closed would blank the Command Center. */

import { hasInsightId, toSnooze, type SnoozeRecord } from "./snoozeShared";

const AIRTABLE_API = "https://api.airtable.com/v0";

export function snoozesEnv() {
  return {
    token: process.env.AIRTABLE_TOKEN,
    baseId: process.env.AIRTABLE_BASE_ID,
    table: process.env.AIRTABLE_SNOOZES_TABLE ?? "Snoozes",
  };
}

/* Whether the feature can be offered at all. The control is hidden
   rather than shown-and-broken when the table has not been set up. */
export function snoozesConfigured(): boolean {
  const { token, baseId } = snoozesEnv();
  return Boolean(token && baseId);
}

export async function listSnoozes(): Promise<SnoozeRecord[]> {
  const { token, baseId, table } = snoozesEnv();
  if (!token || !baseId) return [];
  try {
    const res = await fetch(
      `${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}?pageSize=100`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) {
      /* A 404 here is the ordinary "table not created yet" case, so it
         is logged at a lower volume than a real upstream failure — but
         both return the same empty list, and both mean every finding
         stays visible. */
      console.error("[snoozes] Airtable rejected list", {
        status: res.status,
        detail: (await res.text()).slice(0, 300),
      });
      return [];
    }
    const data = await res.json();
    return (data.records ?? []).filter(hasInsightId).map(toSnooze);
  } catch (err) {
    console.error("[snoozes] Airtable unreachable on list", err);
    return [];
  }
}
