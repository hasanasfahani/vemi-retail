"use client";

/* The control at the end of a Story Block. Creates one Priorities item
   for the whole decision — carrying the rule, the scope and the impact
   the chart already knows — rather than making someone retype it.

   One decision, one action. The findings underneath it are named in
   the notes so the person who picks it up knows which stores to hit,
   but they do not become N separate tasks: that would rebuild the
   very list this phase exists to collapse. */

import { useState, useSyncExternalStore } from "react";
import { readAccessSnapshot } from "@/lib/demoAccess";

const noopSubscribe = () => () => {};

type Props = {
  title: string;
  rule: string;
  where: string;
  notes: string;
  label?: string;
};

export default function DecisionAction({
  title,
  rule,
  where,
  notes,
  label = "Create action",
}: Props) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const session = useSyncExternalStore(noopSubscribe, readAccessSnapshot, () => null);

  const submit = async () => {
    if (state === "saving" || state === "done") return;
    setState("saving");
    try {
      const res = await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          owner: session?.fullName ?? "",
          rule,
          where,
          notes,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error("failed");
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <button
      type="button"
      onClick={submit}
      disabled={state === "saving" || state === "done"}
      className={`shrink-0 rounded-[8px] px-3.5 py-2 text-[13px] font-semibold transition-colors ${
        state === "done"
          ? "bg-canvas text-ink-500"
          : "bg-violet text-white hover:bg-violet-ink"
      }`}
    >
      {state === "done"
        ? "Added to Priorities ✓"
        : state === "saving"
          ? "Adding…"
          : state === "error"
            ? "Couldn't add — retry"
            : label}
    </button>
  );
}
