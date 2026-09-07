/* ============================================================
   Monitors — the Watchlist's backend.

   Fails loud, exactly like the actions queue: telling someone their
   monitor saved when it didn't is worse than a visible error, because
   the whole point of the page is that the record can be trusted.
   ============================================================ */

import { NextResponse } from "next/server";
import {
  MONITORS_FIELD,
  MONITOR_METRICS,
  serialiseReadings,
  toMonitor,
  type MonitorMetric,
  type Reading,
} from "@/lib/monitorsShared";
import { listMonitors, monitorsEnv } from "@/lib/monitorsServer";

const AIRTABLE_API = "https://api.airtable.com/v0";

const ERROR_STATUS = {
  not_configured: 503,
  upstream: 502,
  unreachable: 503,
} as const;

export async function GET() {
  const result = await listMonitors();
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: ERROR_STATUS[result.error] }
    );
  }
  return NextResponse.json({ ok: true, monitors: result.monitors });
}

type CreateBody = {
  label?: string;
  metric?: string;
  segmentType?: string;
  segment?: string;
  filters?: Record<string, string[]>;
  baseline?: number;
  target?: number | null;
  targetDate?: string;
  owner?: string;
  visit?: string;
};

export async function POST(request: Request) {
  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const label = (body.label ?? "").trim().slice(0, 200);
  const owner = (body.owner ?? "").trim().slice(0, 120);
  const metric = body.metric as MonitorMetric;
  if (!label || !owner || !MONITOR_METRICS.includes(metric)) {
    return NextResponse.json(
      { ok: false, error: "invalid", message: "Label, owner and a known metric are required." },
      { status: 422 }
    );
  }
  if (typeof body.baseline !== "number" || !Number.isFinite(body.baseline)) {
    return NextResponse.json(
      { ok: false, error: "invalid", message: "A baseline value is required." },
      { status: 422 }
    );
  }

  /* The baseline IS the first reading. Storing it in both places would
     be two sources for one fact; instead the series starts with it, so
     a monitor is never in a state where its line disagrees with its
     own starting number. */
  const firstReading: Reading[] = [
    {
      visit: body.visit ?? "",
      value: body.baseline,
      at: new Date().toISOString().slice(0, 10),
    },
  ];

  const fields: Record<string, string | number> = {
    [MONITORS_FIELD.label]: label,
    [MONITORS_FIELD.metric]: metric,
    [MONITORS_FIELD.segmentType]: String(body.segmentType ?? "panel").slice(0, 40),
    [MONITORS_FIELD.segment]: String(body.segment ?? "").slice(0, 120),
    [MONITORS_FIELD.filters]: JSON.stringify(body.filters ?? {}),
    [MONITORS_FIELD.baseline]: body.baseline,
    [MONITORS_FIELD.readings]: serialiseReadings(firstReading),
    [MONITORS_FIELD.owner]: owner,
    [MONITORS_FIELD.status]: "Watching",
  };
  if (typeof body.target === "number" && Number.isFinite(body.target)) {
    fields[MONITORS_FIELD.target] = body.target;
  }
  if (body.targetDate) {
    fields[MONITORS_FIELD.targetDate] = String(body.targetDate).slice(0, 10);
  }

  const { token, baseId, table } = monitorsEnv();
  if (!token || !baseId) {
    console.error("[monitors] AIRTABLE_TOKEN / AIRTABLE_BASE_ID missing");
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
      console.error("[monitors] Airtable rejected create", {
        status: res.status,
        detail: detail.slice(0, 500),
      });
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ ok: true, monitor: toMonitor(data.records[0]) });
  } catch (err) {
    console.error("[monitors] Airtable unreachable on create", err);
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 503 });
  }
}
