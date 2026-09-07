/* Server-only read path for the Actions table — shared by the
   /api/actions route (client fetches) and the Digest page (a Server
   Component that needs the same list without a round trip through its
   own API). One fetch implementation, one set of failure states. */

import { hasTitle, toAction, type ActionRecord } from "./actionsShared";

const AIRTABLE_API = "https://api.airtable.com/v0";

export type ListActionsResult =
  | { ok: true; actions: ActionRecord[] }
  | { ok: false; error: "not_configured" | "upstream" | "unreachable" };

export function actionsEnv() {
  return {
    token: process.env.AIRTABLE_TOKEN,
    baseId: process.env.AIRTABLE_BASE_ID,
    table: process.env.AIRTABLE_ACTIONS_TABLE ?? "Actions",
  };
}

export async function listActions(): Promise<ListActionsResult> {
  const { token, baseId, table } = actionsEnv();
  if (!token || !baseId) {
    console.error("[actions] AIRTABLE_TOKEN / AIRTABLE_BASE_ID missing");
    return { ok: false, error: "not_configured" };
  }

  try {
    const res = await fetch(
      `${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}?pageSize=100`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) {
      const detail = await res.text();
      console.error("[actions] Airtable rejected list", {
        status: res.status,
        detail: detail.slice(0, 500),
      });
      return { ok: false, error: "upstream" };
    }
    const data = await res.json();
    const actions = (data.records ?? []).filter(hasTitle).map(toAction);
    return { ok: true, actions };
  } catch (err) {
    console.error("[actions] Airtable unreachable on list", err);
    return { ok: false, error: "unreachable" };
  }
}
