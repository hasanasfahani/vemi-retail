"use client";

/* The control at the end of a Story Block.

   It used to write on click — owner taken silently from the session,
   no due date at all, and every finding flattened into a Notes blob.
   Now it opens the Action Sheet, where those become choices and the
   findings become line items someone can tick off later.

   One decision still makes one action. The findings underneath it are
   its checklist, not N separate tasks: splitting them would rebuild
   the very list the decisions rollup exists to collapse. */

import { useEffect, useState, useSyncExternalStore } from "react";
import ActionSheet, { type SheetDraft } from "@/components/portal/ActionSheet";
import { readAccessSnapshot } from "@/lib/demoAccess";
import type { ActionRecord } from "@/lib/actionsShared";

const noopSubscribe = () => () => {};

type Props = {
  draft: SheetDraft;
  label?: string;
};

export default function DecisionAction({ draft, label = "Create action" }: Props) {
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const [existing, setExisting] = useState<ActionRecord[]>([]);
  const session = useSyncExternalStore(noopSubscribe, readAccessSnapshot, () => null);

  /* Owners already in the base become the suggestion list, so the
     roster maintains itself instead of being configured somewhere. The
     same fetch powers the duplicate check. Loaded when the sheet
     opens, not on mount — this control sits on every chart, and
     fetching for all of them on page load would be noise. */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/actions", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok && data?.ok) setExisting(data.actions ?? []);
      } catch {
        /* Suggestions and the duplicate hint are both nice-to-have —
           the sheet works without them. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const ownerSuggestions = [
    ...new Set(existing.map((a) => a.owner).filter(Boolean)),
  ].sort();

  /* Warn, never block: a second run at the same finding is sometimes
     legitimate, and the reader is better placed to judge than a rule. */
  const clash = existing.find(
    (a) =>
      a.status !== "Done" &&
      ((draft.insightId && a.insightId === draft.insightId) ||
        a.title === draft.title)
  );
  const duplicateWarning = clash
    ? `“${clash.title}” is already open${clash.owner ? `, owned by ${clash.owner}` : ""}. You can still add this.`
    : null;

  const submit = async (payload: Parameters<
    NonNullable<React.ComponentProps<typeof ActionSheet>["onSubmit"]>
  >[0]) => {
    const res = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) throw new Error("failed");
    setAdded(true);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`shrink-0 rounded-[8px] px-3.5 py-2 text-[13px] font-semibold transition-colors ${
          added
            ? "bg-canvas text-ink-500"
            : "bg-violet text-white hover:bg-violet-ink"
        }`}
      >
        {added ? "Added to Priorities ✓" : label}
      </button>

      {open && (
        <ActionSheet
          draft={draft}
          defaultOwner={session?.fullName ?? ""}
          ownerSuggestions={ownerSuggestions}
          duplicateWarning={duplicateWarning}
          onClose={() => setOpen(false)}
          onSubmit={submit}
        />
      )}
    </>
  );
}
