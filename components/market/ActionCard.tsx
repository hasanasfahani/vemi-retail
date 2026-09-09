"use client";

/* One action on the board.

   Draggable, and also movable from the keyboard — a board that can
   only be operated with a mouse is a board some people cannot use at
   all, and the arrows cost four lines.

   The verification line is the point of the card. Everything above it
   is what somebody intends to do; that line is what the shelf says
   happened. */

import { useState } from "react";
import Link from "next/link";
import Badge from "./ui/Badge";
import {
  OUTCOME_LABEL, STAGES, governorateLabel, ownerName, todayISO,
  type Action, type Verification,
} from "@/lib/market/actions";
import { formatIqd } from "@/lib/market/economics";
import type { Band } from "./ui/health";

const PRIORITY_BAND: Record<Action["priority"], Band> = {
  high: "critical",
  medium: "attention",
  low: "average",
};

const OUTCOME_BAND: Record<Verification["outcome"], Band> = {
  held: "strong",
  slipped: "critical",
  awaiting: "average",
  untracked: "average",
};

export default function ActionCard({
  action,
  verification,
  onMove,
  compact,
}: {
  action: Action;
  verification: Verification;
  onMove: (stage: Action["stage"]) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const index = STAGES.findIndex((s) => s.id === action.stage);
  const overdue =
    action.stage !== "resolved" && action.stage !== "verified" && action.dueDate < todayISO();

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", action.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="flex min-w-0 cursor-grab flex-col rounded-[12px] border border-line bg-white p-3 shadow-[var(--shadow-card)] active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <Badge band={PRIORITY_BAND[action.priority]} label={action.priority} size="sm" />
        <span className="mono shrink-0 text-[10.5px] text-ink-400">{action.kpi}</span>
      </div>

      <h3 className="mt-1.5 font-display text-[12.5px] font-bold leading-snug tracking-tight text-ink-900">
        {action.issue}
      </h3>

      {!compact && (
        <p className="mt-1 text-[11.5px] leading-snug text-ink-500">{action.recommendation}</p>
      )}

      <dl className="mono mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-ink-400">
        <dd>{action.posAffected.toLocaleString()} outlets</dd>
        <dd>· {governorateLabel(action.governorateId)}</dd>
        {action.money !== null && <dd>· {formatIqd(action.money)} IQD</dd>}
        <dd className={overdue ? "font-semibold text-[color:var(--color-critical)]" : ""}>
          · due {action.dueDate.slice(5)}
          {overdue ? " (overdue)" : ""}
        </dd>
      </dl>

      <p className="mt-2 truncate text-[11px] text-ink-500">
        {ownerName(action.owner)}
        <span className="text-ink-400"> · {action.owner}</span>
      </p>

      {/* The line the whole feature exists for. */}
      <div className="mt-2 border-t border-line pt-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-1.5 text-left"
        >
          <Badge band={OUTCOME_BAND[verification.outcome]} label={OUTCOME_LABEL[verification.outcome]} size="sm" />
          <span className="ml-auto text-[10.5px] text-ink-400">{open ? "less" : "why"}</span>
        </button>
        {open && (
          <p className="mt-1.5 text-[11px] leading-snug text-ink-500">{verification.note}</p>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => index > 0 && onMove(STAGES[index - 1].id)}
          disabled={index <= 0}
          aria-label={`Move ${action.issue} back a stage`}
          className="rounded-[7px] border border-line-strong px-1.5 py-0.5 text-[11px] text-ink-500 transition-colors hover:border-ink-400 disabled:opacity-35"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => index < STAGES.length - 1 && onMove(STAGES[index + 1].id)}
          disabled={index >= STAGES.length - 1}
          aria-label={`Move ${action.issue} forward a stage`}
          className="rounded-[7px] border border-line-strong px-1.5 py-0.5 text-[11px] text-ink-500 transition-colors hover:border-ink-400 disabled:opacity-35"
        >
          →
        </button>
        <Link
          href={
            action.governorateId
              ? `/portal/pos?governorate=${action.governorateId}`
              : "/portal/pos"
          }
          className="ml-auto text-[11px] font-semibold text-violet-ink hover:underline"
        >
          Outlets
        </Link>
      </div>
    </article>
  );
}
