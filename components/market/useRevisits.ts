"use client";

/* The revisit queue's state.

   Seeded from the action board, so the two pages cannot disagree about
   what is queued, and persisted in the same way — one localStorage key,
   this browser only.

   `flag` is the POS drawer's call to action. It refuses duplicates
   rather than stacking a second request for the same door, because a
   queue that lists an outlet twice is a queue somebody will double-run. */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearRevisits, loadRevisits, nextCycle, saveRevisits, seedRevisits,
  type Revisit, type RevisitStage,
} from "@/lib/market/revisits";
import type { Action } from "@/lib/market/actions";
import type { Candidate } from "@/lib/market/revisits";

export function useRevisits(
  actions: Action[] | null,
  currentMonth: string,
  /* Outlets bad enough that somebody would ask for a special trip.
     The caller derives them, because it already has the rows. */
  candidates: Candidate[] = []
) {
  const [revisits, setRevisits] = useState<Revisit[] | null>(null);

  useEffect(() => {
    if (!actions) return;
    let live = true;
    (async () => {
      const held = loadRevisits();
      if (!live) return;
      if (held) {
        setRevisits(held);
        return;
      }
      const seeded = seedRevisits(actions, currentMonth, candidates);
      setRevisits(seeded);
      saveRevisits(seeded);
    })();
    return () => {
      live = false;
    };
    /* Candidates are derived from the same view the caller already
       renders; re-seeding whenever that array identity changes would
       fight the stored queue. The seed only runs when there is nothing
       stored, so the dependency is deliberately narrow. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, currentMonth]);

  const write = useCallback((next: Revisit[]) => {
    setRevisits(next);
    saveRevisits(next);
  }, []);

  const flag = useCallback(
    (posId: string, reason: string, requestedBy = "You") => {
      setRevisits((held) => {
        const list = held ?? [];
        if (list.some((r) => r.posId === posId)) return list;
        const next: Revisit[] = [
          {
            posId,
            reason,
            priority: "medium",
            requestedBy,
            flaggedAt: new Date().toISOString().slice(0, 10),
            plannedMonth: nextCycle(currentMonth),
            stage: "flagged",
            actionId: null,
          },
          ...list,
        ];
        saveRevisits(next);
        return next;
      });
    },
    [currentMonth]
  );

  const unflag = useCallback(
    (posId: string) => {
      setRevisits((held) => {
        const next = (held ?? []).filter((r) => r.posId !== posId);
        saveRevisits(next);
        return next;
      });
    },
    []
  );

  const move = useCallback((posId: string, stage: RevisitStage) => {
    setRevisits((held) => {
      const next = (held ?? []).map((r) => (r.posId === posId ? { ...r, stage } : r));
      saveRevisits(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    clearRevisits();
    if (actions) {
      const seeded = seedRevisits(actions, currentMonth, candidates);
      setRevisits(seeded);
      saveRevisits(seeded);
    } else {
      setRevisits(null);
    }
  }, [actions, currentMonth, candidates]);

  const flagged = useMemo(
    () => new Set((revisits ?? []).map((r) => r.posId)),
    [revisits]
  );

  return useMemo(
    () => ({ revisits, flagged, loading: revisits === null, flag, unflag, move, reset, write }),
    [revisits, flagged, flag, unflag, move, reset, write]
  );
}
