"use client";

/* PIN THIS FIGURE.

   Deliberately one click and no dialog. A watch commits nobody to
   anything — no fieldwork, no cost, no cycle — so asking someone to
   fill in a form before they can keep an eye on a number would be
   charging them for something that is free. The target defaults to the
   figure already on the page; the Watchlist is where it can be changed.

   The button states what it will do and then states what it did, in
   the same place, because a control that changes nothing visible has
   not obviously worked. */

import { useWatchlist } from "./useWatchlist";
import { scopeLabel, watchId, type Watch, type WatchScope } from "@/lib/market/watchlist";

export default function WatchButton({
  kpi,
  scope,
  value,
  target,
  month,
  size = "md",
}: {
  kpi: Watch["kpi"];
  scope: WatchScope;
  /* The reading right now — stored as the baseline, so the Watchlist
     can say what has happened since. */
  value: number;
  target: number;
  month: string;
  size?: "sm" | "md";
}) {
  const { add, remove, has, ready } = useWatchlist();
  const watching = has(kpi, scope);

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (watching) remove(watchId(kpi, scope));
        else add({ kpi, scope, target, baseline: value, baselineMonth: month });
      }}
      aria-pressed={watching}
      title={
        watching
          ? `Stop watching ${scopeLabel(scope)}`
          : `Watch this figure for ${scopeLabel(scope)}`
      }
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-[8px] border font-semibold transition-colors disabled:opacity-40 ${
        size === "sm" ? "px-1.5 py-[3px] text-[10.5px]" : "px-2 py-1 text-[11.5px]"
      } ${
        watching
          ? "border-violet-100 bg-violet-050 text-violet-ink"
          : "border-line-strong bg-white text-ink-500 hover:border-ink-400 hover:text-ink-900"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {watching ? "Watching" : "Watch"}
    </button>
  );
}
