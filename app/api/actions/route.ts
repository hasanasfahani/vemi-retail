/* ============================================================
   Actions — the Priorities queue's one backend dependency.

   Unlike lead capture, this deliberately does NOT fail open. Losing a
   prospect over a CRM hiccup is unacceptable; losing an internal
   ops team's task silently — telling them "saved" when it wasn't —
   is worse than a visible error. Every failure here is reported to
   the caller, not swallowed.
   ============================================================ */

import { NextResponse } from "next/server";
import {
  ACTIONS_FIELD,
  progressOf,
  serialiseItems,
  toAction,
  type ActionItem,
} from "@/lib/actionsShared";
import { actionsEnv, listActions } from "@/lib/actionsServer";

const AIRTABLE_API = "https://api.airtable.com/v0";

const LIST_ERROR_STATUS = {
  not_configured: 503,
  upstream: 502,
  unreachable: 503,
} as const;

export async function GET() {
  const result = await listActions();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: LIST_ERROR_STATUS[result.error] }
    );
  }
  return NextResponse.json({ ok: true, actions: result.actions });
}

type CreateBody = {
  title?: string;
  owner?: string;
  insightId?: string;
  rule?: string;
  where?: string;
  notes?: string;
  dueDate?: string;
  items?: ActionItem[];
};

export async function POST(request: Request) {
  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const title = (body.title ?? "").trim().slice(0, 300);
  const owner = (body.owner ?? "").trim().slice(0, 120);
  if (!title || !owner) {
    return NextResponse.json(
      { ok: false, error: "invalid", message: "Title and owner are required." },
      { status: 422 }
    );
  }

  const fields: Record<string, string> = {
    [ACTIONS_FIELD.title]: title,
    [ACTIONS_FIELD.owner]: owner,
    [ACTIONS_FIELD.status]: "Open",
  };
  if (body.insightId) fields[ACTIONS_FIELD.insightId] = String(body.insightId).slice(0, 200);
  if (body.rule) fields[ACTIONS_FIELD.rule] = String(body.rule).slice(0, 80);
  if (body.where) fields[ACTIONS_FIELD.where] = String(body.where).slice(0, 200);
  if (body.notes) fields[ACTIONS_FIELD.notes] = String(body.notes).slice(0, 2000);
  if (body.dueDate) fields[ACTIONS_FIELD.dueDate] = String(body.dueDate).slice(0, 10);

  /* Line items and their human-readable progress are written together
     and never separately — a card showing "3/6" beside a checklist of
     four would be worse than showing neither. */
  if (Array.isArray(body.items) && body.items.length) {
    const items: ActionItem[] = body.items
      .filter((i) => i && typeof i.label === "string")
      .slice(0, 60)
      .map((i, index) => ({
        id: typeof i.id === "string" ? i.id : `item-${index}`,
        label: String(i.label).slice(0, 160),
        where: i.where ? String(i.where).slice(0, 120) : undefined,
        done: i.done === true,
      }));
    if (items.length) {
      fields[ACTIONS_FIELD.items] = serialiseItems(items);
      fields[ACTIONS_FIELD.progress] = progressOf(items);
    }
  }

  const { token, baseId, table } = actionsEnv();
  if (!token || !baseId) {
    console.error("[actions] AIRTABLE_TOKEN / AIRTABLE_BASE_ID missing");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  try {
    const res = await fetch(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ typecast: true, records: [{ fields }] }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("[actions] Airtable rejected create", {
        status: res.status,
        detail: detail.slice(0, 500),
      });
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, action: toAction(data.records[0]) });
  } catch (err) {
    console.error("[actions] Airtable unreachable on create", err);
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 503 });
  }
}
