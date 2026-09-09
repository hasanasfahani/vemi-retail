"use client";

/* The follow-up queue's state.

   Seeded from the payload so the page opens with work already in
   flight, then owned by whoever is using it. One localStorage key, and
   the page says the changes live in this browser only. */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearRequests, createRequest, loadRequests, saveRequests, seededRequests,
  type FollowUpRequest,
} from "@/lib/market/followUp";
import type { IssueKpi } from "@/lib/market/issues";

export function useFollowUps() {
  const [requests, setRequests] = useState<FollowUpRequest[] | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const held = loadRequests();
      if (!live) return;
      /* The seeds are the starting position, not a merge: once the
         client has a board, it is theirs. */
      const next = held ?? seededRequests();
      setRequests(next);
      if (!held) saveRequests(next);
    })();
    return () => {
      live = false;
    };
  }, []);

  const write = useCallback((next: FollowUpRequest[]) => {
    setRequests(next);
    saveRequests(next);
  }, []);

  const create = useCallback(
    (input: {
      kpi: IssueKpi;
      originMonth: string;
      cycle: string;
      posIds: string[];
      issueIds: string[];
    }) => {
      const request = createRequest(input);
      setRequests((held) => {
        const next = [request, ...(held ?? seededRequests())];
        saveRequests(next);
        return next;
      });
      return request;
    },
    []
  );

  const cancel = useCallback((id: string, reason: string) => {
    setRequests((held) => {
      const next = (held ?? []).map((r) =>
        r.id === id
          ? { ...r, cancelled: { at: new Date().toISOString().slice(0, 10), reason } }
          : r
      );
      saveRequests(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    clearRequests();
    const seeded = seededRequests();
    setRequests(seeded);
    saveRequests(seeded);
  }, []);

  return useMemo(
    () => ({ requests, loading: requests === null, create, cancel, reset, write }),
    [requests, create, cancel, reset, write]
  );
}
