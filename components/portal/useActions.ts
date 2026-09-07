"use client";

/* Client access to the Actions API. No optimistic state — after any
   write, refetch the real list. An ops queue that's briefly a beat
   slower is fine; one that silently shows a stale or wrong status
   after a failed write is not. */

import { useCallback, useEffect, useState } from "react";
import type { ActionRecord, ActionStatus } from "@/lib/actionsShared";

type CreateInput = {
  title: string;
  owner: string;
  insightId?: string;
  rule?: string;
  where?: string;
  notes?: string;
  dueDate?: string;
};

type UpdateInput = Partial<{
  status: ActionStatus;
  owner: string;
  notes: string;
  dueDate: string;
  /* Which one box changed, and to what. The server reads the record
     and flips just that item, so two people working the same action
     cannot overwrite each other's ticks. */
  toggleItem: { id: string; done: boolean };
}>;

async function parseOrThrow(res: Response) {
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.message ?? data?.error ?? `request failed (${res.status})`);
  }
  return data;
}

export function useActions() {
  const [actions, setActions] = useState<ActionRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/actions", { cache: "no-store" });
      const data = await parseOrThrow(res);
      setActions(data.actions as ActionRecord[]);
    } catch {
      setError("Could not reach the actions queue. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    /* Deferred a tick so the initial fetch's setState doesn't run
       synchronously inside the effect body — same shape refresh()
       is called with on every later manual call. */
    const id = setTimeout(refresh, 0);
    return () => clearTimeout(id);
  }, [refresh]);

  const create = useCallback(
    async (input: CreateInput) => {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await parseOrThrow(res);
      await refresh();
      return data.action as ActionRecord;
    },
    [refresh]
  );

  const update = useCallback(
    async (id: string, patch: UpdateInput) => {
      const res = await fetch(`/api/actions/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await parseOrThrow(res);
      await refresh();
    },
    [refresh]
  );

  return { actions, loading, error, refresh, create, update };
}

/* Nav-badge use only: how many open/in-progress actions are past
   their due date. Deliberately silent on failure — this is a nice-to-
   have indicator in the rail, not the Priorities page itself, so a
   fetch hiccup here just means no badge, never an error banner in
   navigation chrome. */
export function useOverdueActionsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        const res = await fetch("/api/actions", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || !res.ok || !data?.ok) return;
        const today = new Date().toISOString().slice(0, 10);
        const overdue = (data.actions as ActionRecord[]).filter(
          (a) => a.status !== "Done" && a.dueDate && a.dueDate < today
        );
        setCount(overdue.length);
      } catch {
        /* silent — no badge is the correct fallback */
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  return count;
}
