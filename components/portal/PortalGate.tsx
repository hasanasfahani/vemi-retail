"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { readAccessSnapshot } from "@/lib/demoAccess";
import { claimAdmin, readRole, serverRole, subscribeRole } from "@/lib/portalRole";

/* Who is allowed to see the portal.

   Someone who types the URL without ever giving their details is sent
   to the request form, so the dashboard stays the thing you get *after*
   telling us who you are. Two exceptions pass straight through: a
   visitor who already completed the form (their session is stored), and
   an admin arriving on the key link.

   Soft gate, not authentication — the same caveat as the blur. The page
   still ships to the browser and the session flag can be set by hand.
   It exists to stop a shared URL bypassing lead capture, not to protect
   anything, and the data behind it is illustrative either way. */

const noopSubscribe = () => () => {};

export default function PortalGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSyncExternalStore(noopSubscribe, readAccessSnapshot, () => null);
  const role = useSyncExternalStore(subscribeRole, readRole, serverRole);

  useEffect(() => {
    /* Read storage directly rather than trusting the values above: on
       the hydration pass the stores still hold the server snapshot, and
       acting on that would bounce a visitor who is signed in. */
    const bounce = () => {
      if (readAccessSnapshot() === null && readRole() !== "admin") {
        router.replace("/?access=1");
      }
    };

    const url = new URL(window.location.href);
    const key = url.searchParams.get("key");

    /* An admin landing on the key link has neither a session nor the
       role yet, so the decision has to wait for the exchange — otherwise
       the gate would bounce them before the key is redeemed. */
    if (key) {
      void claimAdmin(key).finally(() => {
        url.searchParams.delete("key");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        bounce();
      });
      return;
    }

    bounce();
  }, [router]);

  const allowed = session !== null || role === "admin";

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="text-sm text-ink-400">Loading workspace…</span>
      </div>
    );
  }

  return <>{children}</>;
}
