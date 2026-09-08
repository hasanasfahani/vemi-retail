/* ============================================================
   Snoozes — parking a finding, on the record.

   WRITES fail loud, like every other queue in the product: telling
   someone a finding is parked when it isn't means it reappears next
   cycle and they stop trusting the control.

   READS fail open — see snoozeServer for why. A snooze store that
   cannot be reached must hide nothing, not everything.
   ============================================================ */

import { NextResponse } from "next/server";
import { SNOOZES_FIELD, toSnooze, type SnoozeUntil } from "@/lib/snoozeShared";
import { listSnoozes, snoozesEnv } from "@/lib/snoozeServer";

const AIRTABLE_API = "https://api.airtable.com/v0";

export async function GET() {
  return NextResponse.json({ ok: true, snoozes: await listSnoozes() });
}

type CreateBody = {
  insightId?: string;
  rule?: string;
  headline?: string;
  reason?: string;
  owner?: string;
  until?: SnoozeUntil;
  visit?: string;
  baselineImpact?: number;
  baselineSeverity?: string;
};

export async function POST(request: Request) {
  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const insightId = (body.insightId ?? "").trim().slice(0, 200);
  const owner = (body.owner ?? "").trim().slice(0, 120);
  /* A reason is required, not optional. The whole value of this
     record is that a future reader can tell "considered and declined"
     from "never opened", and a snooze with no reason is
     indistinguishable from the second. */
  const reason = (body.reason ?? "").trim().slice(0, 1000);
  if (!insightId || !owner || !reason) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid",
        message: "A finding, an owner and a reason are all required.",
      },
      { status: 422 }
    );
  }

  const { token, baseId, table } = snoozesEnv();
  if (!token || !baseId) {
    console.error("[snoozes] AIRTABLE_TOKEN / AIRTABLE_BASE_ID missing");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  /* "next-visit" parks the finding for the cycle in view; "worsens"
     stores no visit at all, leaving the escalation checks as the only
     way back. */
  const untilVisit = body.until === "worsens" ? "" : (body.visit ?? "").trim();

  const fields: Record<string, unknown> = {
    [SNOOZES_FIELD.insightId]: insightId,
    [SNOOZES_FIELD.rule]: (body.rule ?? "").slice(0, 120),
    [SNOOZES_FIELD.headline]: (body.headline ?? "").slice(0, 400),
    [SNOOZES_FIELD.reason]: reason,
    [SNOOZES_FIELD.owner]: owner,
    [SNOOZES_FIELD.snoozedAt]: new Date().toISOString().slice(0, 10),
    [SNOOZES_FIELD.untilVisit]: untilVisit,
    [SNOOZES_FIELD.baselineImpact]: Number(body.baselineImpact ?? 0),
    [SNOOZES_FIELD.baselineSeverity]: body.baselineSeverity ?? "watch",
  };

  try {
    const res = await fetch(`${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }] }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("[snoozes] Airtable rejected create", {
        status: res.status,
        detail: detail.slice(0, 500),
      });
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, snooze: toSnooze(data.records[0]) });
  } catch (err) {
    console.error("[snoozes] Airtable unreachable on create", err);
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 503 });
  }
}

/* Waking a finding by hand, before its condition fires. */
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const { token, baseId, table } = snoozesEnv();
  if (!token || !baseId) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  try {
    const res = await fetch(
      `${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      console.error("[snoozes] Airtable rejected delete", { status: res.status });
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[snoozes] Airtable unreachable on delete", err);
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 503 });
  }
}
