/* ============================================================
   Lead capture — the one server-side piece of the portal.

   Receives the access request, screens it, and appends a row to the
   Airtable `Leads` table. An Airtable automation on that table sends
   the notification email, so there is no mail provider here.

   Design rule: a visitor is never blocked by our storage. If Airtable
   is down or misconfigured we log loudly on the server and still
   answer 200, because the workspace they were promised does not
   depend on our CRM row.
   ============================================================ */

import { NextResponse } from "next/server";
import { validateAll, type AccessRequest } from "@/lib/demoAccess";

const AIRTABLE_API = "https://api.airtable.com/v0";

/* ---------- rate limit ---------------------------------------
   Per-instance and in-memory: a serverless function may be recycled
   or run in parallel, so this thins out casual repeat submits rather
   than guaranteeing a global ceiling. Good enough for a lead form. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 500) {
    // Keep the map from growing without bound on a long-lived instance.
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}

type Payload = Partial<AccessRequest> & {
  source?: string;
  referrer?: string;
  company_role?: string; // honeypot — real people never fill this
  /* /v2 quotation extras. Folded into `Source` rather than given their
     own Airtable columns, so capture needs no schema change in the base. */
  requestType?: string;
  industry?: string;
  question?: string;
  posPerMonth?: number;
  categories?: number;
  cities?: number;
};

function boundedInteger(value: unknown, min: number, max: number): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

/* Builds the Source cell: the caller's own source plus whatever the v2
   form collected, as one readable line. */
function composeSource(body: Payload): string {
  const posPerMonth = boundedInteger(body.posPerMonth, 100, 5000);
  const categories = boundedInteger(body.categories, 1, 4);
  const cities = boundedInteger(body.cities, 1, 18);
  const parts = [
    body.source,
    body.requestType && `Request: ${body.requestType}`,
    body.industry && `Industry: ${body.industry}`,
    body.question && `Asks: ${body.question.replace(/\s+/g, " ").trim()}`,
    posPerMonth && `POS/month: ${posPerMonth}`,
    categories && `Categories: ${categories}`,
    cities && `Cities: ${cities}`,
  ].filter(Boolean);
  return parts.join(" · ").slice(0, 2000);
}

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: answer like a success so bots don't learn anything.
  if (body.company_role) {
    return NextResponse.json({ ok: true, stored: false });
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const lead: AccessRequest = {
    fullName: (body.fullName ?? "").slice(0, 120),
    email: (body.email ?? "").slice(0, 200),
    dialCode: (body.dialCode ?? "").slice(0, 8),
    phone: (body.phone ?? "").slice(0, 32),
    company: (body.company ?? "").slice(0, 160),
  };

  // The browser already validated; re-run the same rules here so the
  // endpoint can't be used to seed the sheet with junk.
  const errors = validateAll(lead);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, error: "invalid", errors }, { status: 422 });
  }

  const token = process.env.AIRTABLE_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;
  // Table ID rather than name, so renaming the table in Airtable can't
  // break capture. Falls back to the known ID if the var is unset.
  const table = process.env.AIRTABLE_TABLE ?? "tblWbEZI7HAurk88z";

  if (!token || !baseId) {
    console.error(
      "[access-request] AIRTABLE_TOKEN / AIRTABLE_BASE_ID missing — lead not stored",
      { email: lead.email, company: lead.company }
    );
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    const res = await fetch(
      `${AIRTABLE_API}/${baseId}/${encodeURIComponent(table)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          typecast: true,
          records: [
            {
              fields: {
                Name: lead.fullName,
                Email: lead.email,
                Phone: `${lead.dialCode} ${lead.phone}`,
                Company: lead.company,
                Submitted: new Date().toISOString(),
                Source: composeSource(body),
                Referrer: (body.referrer ?? "direct").slice(0, 300),
              },
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error("[access-request] Airtable rejected the row", {
        status: res.status,
        detail: detail.slice(0, 500),
        email: lead.email,
        company: lead.company,
      });
      return NextResponse.json({ ok: true, stored: false });
    }
  } catch (err) {
    console.error("[access-request] Airtable unreachable — lead not stored", {
      err,
      email: lead.email,
      company: lead.company,
    });
    return NextResponse.json({ ok: true, stored: false });
  }

  return NextResponse.json({ ok: true, stored: true });
}
