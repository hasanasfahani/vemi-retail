/* ============================================================
   Actions — the Priorities queue's one backend dependency.

   Unlike lead capture, this deliberately does NOT fail open. Losing a
   prospect over a CRM hiccup is unacceptable; losing an internal
   ops team's task silently — telling them "saved" when it wasn't —
   is worse than a visible error. Every failure here is reported to
   the caller, not swallowed.
   ============================================================ */

import { NextResponse } from "next/server";
import { ACTIONS_FIELD, hasTitle, toAction } from "@/lib/actionsShared";

const AIRTABLE_API = "https://api.airtable.com/v0";

function env() {
  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_ACTIONS_TABLE ?? "Actions";
  return { token, baseId, table };
}

export async function GET() {
  const { token, baseId, table } = env();
  if (!token || !baseId) {
    console.error("[actions] AIRTABLE_TOKEN / AIRTABLE_BASE_ID missing");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
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
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
    const data = await res.json();
    const actions = (data.records ?? []).filter(hasTitle).map(toAction);
    return NextResponse.json({ ok: true, actions });
  } catch (err) {
    console.error("[actions] Airtable unreachable on list", err);
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 503 });
  }
}

type CreateBody = {
  title?: string;
  owner?: string;
  insightId?: string;
  rule?: string;
  where?: string;
  notes?: string;
  dueDate?: string;
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

  const { token, baseId, table } = env();
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
