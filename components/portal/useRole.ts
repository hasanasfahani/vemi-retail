"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  claimAdmin,
  readRole,
  serverRole,
  subscribeRole,
  type PortalRole,
} from "@/lib/portalRole";

/* Current role, re-rendering when it changes (including from another tab). */
export function useRole(): PortalRole {
  return useSyncExternalStore(subscribeRole, readRole, serverRole);
}

/* Redeems /portal?key=… once, then strips the parameter so the key is
   not left in the address bar during a screen share or copied into
   someone's history with a bookmark.

   Reads window.location rather than useSearchParams on purpose. This
   runs in the portal *layout*, and a layout that calls useSearchParams
   has to sit inside a Suspense boundary that then owns hydration for
   everything under it — which is exactly what broke the banner's
   interactivity the first time. A one-shot read in an effect has none
   of those consequences, and history.replaceState avoids a re-render. */
export function useClaimAdminFromUrl(): void {
  /* A ref, not state: this runs once and the unlock itself propagates
     through the role store, so there is nothing for this hook to
     re-render about — and setState in an effect body trips the
     cascading-render rule. */
  const claimed = useRef(false);

  useEffect(() => {
    if (claimed.current) return;
    claimed.current = true;

    const url = new URL(window.location.href);
    const key = url.searchParams.get("key");
    if (!key) return;

    let cancelled = false;
    void claimAdmin(key).finally(() => {
      if (cancelled) return;
      url.searchParams.delete("key");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    });

    return () => {
      cancelled = true;
    };
  }, []);
}
