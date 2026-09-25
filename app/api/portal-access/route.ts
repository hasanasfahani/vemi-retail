/* ============================================================
   Admin unlock for the demo portal.

   Exchanges a shared key for the admin role. The key lives in
   PORTAL_ADMIN_KEY and is compared here, on the server, so it never
   appears in the client bundle — the browser only ever learns yes/no.

   Rotating the env var revokes every link that was handed out.

   This gates a presentation blur over illustrative data, not access to
   anything sensitive, so a single shared key is proportionate.
   ============================================================ */

import { NextResponse } from "next/server";

/* Length-independent comparison. The key is low-value, but a timing
   check costs one function and removes the question entirely. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  let key = "";
  try {
    const body = (await request.json()) as { key?: unknown };
    key = typeof body.key === "string" ? body.key : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const expected = process.env.PORTAL_ADMIN_KEY;

  /* With no key configured the portal has no admin — refuse rather
     than fall open, so a missing env var can never unlock production. */
  if (!expected) {
    console.warn("[portal-access] PORTAL_ADMIN_KEY is not set — admin unlock disabled");
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: key.length > 0 && safeEqual(key, expected) });
}
