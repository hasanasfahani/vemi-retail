import { NextResponse } from "next/server";
import { ACTIONS_FIELD, ACTION_STATUSES, toAction } from "@/lib/actionsShared";

const AIRTABLE_API = "https://api.airtable.com/v0";

type PatchBody = {
  status?: string;
  owner?: string;
  notes?: string;
  dueDate?: string;
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

  if (!Object.keys(fields).length) {
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
