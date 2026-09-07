import { NextResponse } from "next/server";
import {
  ACTIONS_FIELD,
  ACTION_STATUSES,
  parseItems,
  progressOf,
  serialiseItems,
  toAction,
} from "@/lib/actionsShared";

const AIRTABLE_API = "https://api.airtable.com/v0";

type PatchBody = {
  status?: string;
  owner?: string;
  notes?: string;
  dueDate?: string;
  /* Toggle one line item. Deliberately not "here is the whole new
     list": the client sends which item changed and what to, and the
     server reads the current record before writing it back. Sending a
     whole array from the browser would let a stale tab silently undo
     someone else's ticks — the queue is shared, so last-write-wins on
     a full array is a data-loss bug waiting for two people to open the
     same action. */
  toggleItem?: { id: string; done: boolean };
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const fields: Record<string, string> = {};
  if (typeof body.status === "string") {
    if (!ACTION_STATUSES.includes(body.status as (typeof ACTION_STATUSES)[number])) {
      return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 422 });
    }
    fields[ACTIONS_FIELD.status] = body.status;
  }
  if (typeof body.owner === "string") fields[ACTIONS_FIELD.owner] = body.owner.trim().slice(0, 120);
  if (typeof body.notes === "string") fields[ACTIONS_FIELD.notes] = body.notes.slice(0, 2000);
  if (typeof body.dueDate === "string") fields[ACTIONS_FIELD.dueDate] = body.dueDate.slice(0, 10);

  const toggle = body.toggleItem;
  if (toggle && typeof toggle.id !== "string") {
    return NextResponse.json({ ok: false, error: "invalid_item" }, { status: 422 });
  }

  if (!toggle && !Object.keys(fields).length) {
    return NextResponse.json({ ok: false, error: "nothing_to_update" }, { status: 422 });
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_ACTIONS_TABLE ?? "Actions";
  if (!token || !baseId) {
    console.error("[actions] AIRTABLE_TOKEN / AIRTABLE_BASE_ID missing");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  try {
    /* Read-modify-write for item toggles, so a tick only ever changes
       the one box it was aimed at. */
    if (toggle) {
      const current = await fetch(
        `${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
      );
      if (!current.ok) {
        const detail = await current.text();
        console.error("[actions] Airtable rejected read-before-toggle", {
          status: current.status,
          detail: detail.slice(0, 500),
        });
        return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
      }
      const record = await current.json();
      const items = parseItems(record?.fields?.[ACTIONS_FIELD.items]).map((i) =>
        i.id === toggle.id ? { ...i, done: toggle.done } : i
      );
      fields[ACTIONS_FIELD.items] = serialiseItems(items);
      fields[ACTIONS_FIELD.progress] = progressOf(items);
    }

    const res = await fetch(
      `${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ typecast: true, fields }),
      }
    );
    if (!res.ok) {
      const detail = await res.text();
      console.error("[actions] Airtable rejected update", {
        status: res.status,
        detail: detail.slice(0, 500),
      });
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
    /* The single-record PATCH endpoint returns the record directly —
       {id, createdTime, fields} — not the {records:[...]} wrapper the
       batch create endpoint uses. */
    const record = await res.json();
    return NextResponse.json({ ok: true, action: toAction(record) });
  } catch (err) {
    console.error("[actions] Airtable unreachable on update", err);
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 503 });
  }
}
