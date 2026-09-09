"use client";

/* The board's state.

   Seeded from last month's findings, then owned by whoever is using
   it: every change writes through to localStorage under one key, so a
   reload keeps the work and a reset puts it back. Nothing is shared
   between browsers, and the page says so — this is a demo board, not
   a backend.

   The seed is async because the previous month's rows are fetched on
   demand rather than shipped with the page. Until it lands the hook
   reports `loading`, and the page shows a skeleton rather than an
   empty board that would read as "no work to do". */

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadMonth } from "@/lib/market";
import {
  clearBoard, loadBoard, saveBoard, seedActions,
  type Action, type Owner, type Priority, type StageId,
} from "@/lib/market/actions";

/* The month whose audit raised the queue. One cycle back, so this
   month's fieldwork is what verifies it. */
const RAISED_IN = "2026-08";

export function useActions() {
  const [actions, setActions] = useState<Action[] | null>(null);

  /* Read and seed inside one async pass rather than setting state
     synchronously in the effect body. Two reasons: React's own advice
     about cascading renders, and hydration — localStorage does not
     exist on the server, so the first client render must match the
     server's empty board and the stored one arrives a tick later. */
  useEffect(() => {
    let live = true;
    (async () => {
      const held = loadBoard();
      if (held) {
        if (live) setActions(held);
        return;
      }
      const previous = await loadMonth(RAISED_IN);
      if (!live) return;
      const seeded = seedActions(previous);
      setActions(seeded);
      saveBoard(seeded);
    })();
    return () => {
      live = false;
    };
  }, []);

  const update = useCallback((id: string, patch: Partial<Action>) => {
    setActions((held) => {
      if (!held) return held;
      const next = held.map((a) => (a.id === id ? { ...a, ...patch } : a));
      saveBoard(next);
      return next;
    });
  }, []);

  const move = useCallback(
    (id: string, stage: StageId) => update(id, { stage }),
    [update]
  );

  const assign = useCallback(
    (id: string, owner: Owner) => update(id, { owner }),
    [update]
  );

  const prioritise = useCallback(
    (id: string, priority: Priority) => update(id, { priority }),
    [update]
  );

  const note = useCallback(
    (id: string, text: string) => {
      setActions((held) => {
        if (!held) return held;
        const next = held.map((a) =>
          a.id === id
            ? { ...a, notes: [...a.notes, { at: new Date().toISOString().slice(0, 10), text }] }
            : a
        );
        saveBoard(next);
        return next;
      });
    },
    []
  );

  const reset = useCallback(() => {
    clearBoard();
    setActions(null);
    loadMonth(RAISED_IN).then((previous) => {
      const seeded = seedActions(previous);
      setActions(seeded);
      saveBoard(seeded);
    });
  }, []);

  return useMemo(
    () => ({ actions, loading: actions === null, move, assign, prioritise, note, reset, raisedIn: RAISED_IN }),
    [actions, move, assign, prioritise, note, reset]
  );
}
