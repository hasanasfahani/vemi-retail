"use client";

/* KEEP AN EYE ON THIS.

   One control, one size, one shape, wherever it appears — a KPI tile,
   a brand card, a governorate row, a bar in a chart, a row in a table.
   It replaced a labelled button for a reason worth stating: on the
   dashboard's health cards the button sat at a different height on
   every card, because each card's body is a different height, and a row
   of controls that will not line up is a row of controls the eye keeps
   re-finding. An icon of fixed size, pinned to the top-right of
   whatever it belongs to, lines up by construction.

   Outline means not watching, filled means watching, and the shape is
   identical either way so nothing shifts when it changes. It is never
   colour alone: the title and the screen-reader label both say which
   state it is in.

   ONE CLICK, NO DIALOG. A watch commits nobody to anything — no
   fieldwork, no cost, no cycle — so asking someone to fill in a form
   first would be charging them for something that is free. The target
   defaults to a figure already on the page and the Watchlist is where
   it can be changed. */

import { useWatchlist } from "./useWatchlist";
import { pushToast } from "@/lib/market/toastBus";
import {
  WATCH_KPI_LABEL, scopeLabel, watchId,
  type Watch, type WatchScope,
} from "@/lib/market/watchlist";

export default function WatchEye({
  kpi,
  scope,
  value,
  target,
  month,
  size = "md",
  className = "",
}: {
  kpi: Watch["kpi"];
  scope: WatchScope;
  /* The reading right now — stored as the baseline, so the Watchlist
     can say what has happened since. */
  value: number;
  target: number;
  month: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const { add, remove, has, ready } = useWatchlist();
  const watching = has(kpi, scope);
  const what = `${WATCH_KPI_LABEL[kpi]} · ${scopeLabel(scope)}`;
  const box = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const glyph = size === "sm" ? "h-[13px] w-[13px]" : "h-[15px] w-[15px]";

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={(e) => {
        /* Several of these sit inside a card that is itself a link. */
        e.preventDefault();
        e.stopPropagation();
        if (watching) {
          remove(watchId(kpi, scope));
          pushToast(`Stopped watching ${what}`, "info");
        } else {
          add({ kpi, scope, target, baseline: value, baselineMonth: month });
          pushToast(`Watching ${what}`);
        }
      }}
      aria-pressed={watching}
      title={watching ? `Stop watching ${what}` : `Watch ${what}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-[7px] transition-colors disabled:opacity-30 ${box} ${
        watching
          ? "text-violet-ink hover:bg-violet-050"
          : "text-ink-300 hover:bg-canvas hover:text-ink-700"
      } ${className}`}
    >
      <span className="sr-only">
        {watching ? `Stop watching ${what}` : `Watch ${what}`}
      </span>
      {/* Same outline in both states; only the pupil fills, so nothing
          moves or resizes when it is switched. */}
      <svg
        viewBox="0 0 24 24"
        className={glyph}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3.2" fill={watching ? "currentColor" : "none"} />
      </svg>
    </button>
  );
}
