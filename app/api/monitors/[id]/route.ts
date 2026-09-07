import { NextResponse } from "next/server";
import {
  MONITORS_FIELD,
  parseReadings,
  serialiseReadings,
  toMonitor,
  type Reading,
} from "@/lib/monitorsShared";
import { monitorsEnv } from "@/lib/monitorsServer";

const AIRTABLE_API = "https://api.airtable.com/v0";

type PatchBody = {
  status?: string;
  target?: number | null;
  targetDate?: string;
  /* Append a reading for a visit. Read-modify-write on the server so
     two people opening the Watchlist at once cannot write the same
     visit twice or clobber each other's series. */
  reading?: { visit: string; value: number };
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

  const fields: Record<string, string | number> = {};
  if (body.status === "Watching" || body.status === "Closed") {
    fields[MONITORS_FIELD.status] = body.status;
  }
  if (typeof body.target === "number" && Number.isFinite(body.target)) {
    fields[MONITORS_FIELD.target] = body.target;
  }
  if (typeof body.targetDate === "string") {
    fields[MONITORS_FIELD.targetDate] = body.targetDate.slice(0, 10);
  }

  const reading = body.reading;
  if (
    reading &&
    (typeof reading.visit !== "string" ||
      typeof reading.value !== "number" ||
      !Number.isFinite(reading.value))
  ) {
    return NextResponse.json({ ok: false, error: "invalid_reading" }, { status: 422 });
  }

  if (!reading && !Object.keys(fields).length) {
    return NextResponse.json({ ok: false, error: "nothing_to_update" }, { status: 422 });
  }

  const { token, baseId, table } = monitorsEnv();
  if (!token || !baseId) {
    console.error("[monitors] AIRTABLE_TOKEN / AIRTABLE_BASE_ID missing");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const url = `${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`;

  try {
    if (reading) {
      const current = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!current.ok) {
        const detail = await current.text();
        console.error("[monitors] Airtable rejected read-before-append", {
          status: current.status,
          detail: detail.slice(0, 500),
        });
        return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
      }
      const record = await current.json();
      const existing = parseReadings(record?.fields?.[MONITORS_FIELD.readings]);

      /* Idempotent: a visit already recorded is left exactly as it
         was. Opening the Watchlist twice must not double the series,
         and a later open must not overwrite the value captured when
         that visit was actually current. */
      if (existing.some((r) => r.visit === reading.visit)) {
        return NextResponse.json({ ok: true, monitor: toMonitor(record), appended: false });
      }

      const next: Reading[] = [
        ...existing,
        {
          visit: reading.visit,
          value: reading.value,
          at: new Date().toISOString().slice(0, 10),
        },
      ].sort((a, b) => a.visit.localeCompare(b.visit));
      fields[MONITORS_FIELD.readings] = serialiseReadings(next);
    }

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ typecast: true, fields }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error("[monitors] Airtable rejected update", {
        status: res.status,
        detail: detail.slice(0, 500),
      });
      return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
    }
    const record = await res.json();
    return NextResponse.json({ ok: true, monitor: toMonitor(record), appended: !!reading });
  } catch (err) {
    console.error("[monitors] Airtable unreachable on update", err);
    return NextResponse.json({ ok: false, error: "unreachable" }, { status: 503 });
  }
}
