/* ============================================================
   PORTAL ROLE — a two-state gate, deliberately simple.

   "visitor" sees the demo with the advanced pages blurred;
   "admin" sees everything. The role is granted by visiting
   /portal?key=<PORTAL_ADMIN_KEY>, which is checked server-side by
   /api/portal-access so the key never ships in the client bundle.

   This is a presentation gate, not access control. The blurred pages
   still render and their data still reaches the browser — fine for a
   demo built on illustrative data, and not to be relied on if real
   client data ever lands in those pages.

   Stored in localStorage rather than sessionStorage so the team does
   not have to re-open the link in every tab.
   ============================================================ */

export type PortalRole = "admin" | "visitor";

const KEY = "vemi.portal.role";

/* useSyncExternalStore needs a stable subscribe + a snapshot that only
   changes identity when the stored value does — same shape as
   readAccessSnapshot in demoAccess.ts. */
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeRole(fn: () => void): () => void {
  listeners.add(fn);
  /* Another tab unlocking should unlock this one too. */
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function readRole(): PortalRole {
  try {
    return localStorage.getItem(KEY) === "admin" ? "admin" : "visitor";
  } catch {
    /* private mode / storage blocked — treat as a visitor. */
    return "visitor";
  }
}

/* Server snapshot: the server has no localStorage, and rendering as a
   visitor first means a blurred page never flashes unblurred. */
export function serverRole(): PortalRole {
  return "visitor";
}

export function grantAdmin(): void {
  try {
    localStorage.setItem(KEY, "admin");
  } catch {
    /* nothing to do — the session just stays a visitor */
  }
  emit();
}

export function revokeAdmin(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
}

/* Exchanges the URL key for the role. Returns true when granted. */
export async function claimAdmin(key: string): Promise<boolean> {
  try {
    const res = await fetch("/api/portal-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const body = (await res.json()) as { ok?: boolean };
    if (body.ok) {
      grantAdmin();
      return true;
    }
  } catch {
    /* network failure — stay a visitor */
  }
  return false;
}
