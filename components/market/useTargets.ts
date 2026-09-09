"use client";

/* Live KPI targets for React.

   `useSyncExternalStore` rather than context, because the same store
   is read by pure modules that are not components — the report, the
   outlet rows, the story templates — and threading a context through
   those would mean passing targets into every function.

   The server snapshot is always the defaults, so the first client
   render matches the server's HTML and hydration is clean; stored
   values arrive on the next tick. */

import { useSyncExternalStore } from "react";
import {
  getDefaultTargets, getTargets, subscribeTargets, type Targets,
} from "@/lib/market/settings";

export function useTargets(): Targets {
  return useSyncExternalStore(subscribeTargets, getTargets, getDefaultTargets);
}
