"use client";

/* The watchlist's state, read from the shared store in watchlist.ts.

   `useSyncExternalStore` rather than local state so that every Watch
   control on the page — the dashboard tiles, the Performance tiles, the
   Watchlist page itself — reflects the same list the instant any one of
   them changes it. */

import { useCallback, useSyncExternalStore } from "react";
import {
  getWatches, saveWatches, subscribeWatches, watchId, watchesReady,
  type Watch, type WatchScope,
} from "@/lib/market/watchlist";

/* The server has no storage, so its snapshot is the empty list — and
   the client's FIRST render must agree with it or hydration mismatches.
   The stored list lands a tick later.

   The array is a module-level CONSTANT, not a fresh literal per call.
   `useSyncExternalStore` compares snapshots by identity, so returning a
   new `[]` each time means every render sees a changed store and
   re-renders — React catches it and says so: "The result of
   getServerSnapshot should be cached to avoid an infinite loop." */
const NONE: Watch[] = [];
const serverWatches = () => NONE;
const serverReady = () => false;

export function useWatchlist() {
  const watches = useSyncExternalStore(subscribeWatches, getWatches, serverWatches);
  const ready = useSyncExternalStore(subscribeWatches, watchesReady, serverReady);

  const add = useCallback((watch: Omit<Watch, "id" | "createdAt">) => {
    const id = watchId(watch.kpi, watch.scope);
    const next: Watch = { ...watch, id, createdAt: new Date().toISOString() };
    /* The same question twice is one watch clicked twice. The newer pin
       wins, because the reader has just restated what they want. */
    saveWatches([...getWatches().filter((w) => w.id !== id), next]);
  }, []);

  const remove = useCallback((id: string) => {
    saveWatches(getWatches().filter((w) => w.id !== id));
  }, []);

  const setTarget = useCallback((id: string, target: number) => {
    saveWatches(getWatches().map((w) => (w.id === id ? { ...w, target } : w)));
  }, []);

  const has = useCallback(
    (kpi: Watch["kpi"], scope: WatchScope) =>
      watches.some((w) => w.id === watchId(kpi, scope)),
    [watches]
  );

  return { watches, ready, add, remove, setTarget, has };
}
