"use client";

/* The analyst half of a page, behind one door.

   Shelf shipped eleven sections, two modes, six chart forms, a
   2,000-cell heatmap, a quadrant scatter and two tables. Every one was
   built for a real question. Nobody reached section nine.

   The rule this enforces is editorial, not mechanical: a page shows
   the few things its reader orients on, and everything that rewards
   study rather than scanning goes behind a disclosure. It is NOT a
   deletion — that distinction matters, because the depth is the
   product's credibility with the analyst who checks it, and hiding it
   silently would cost exactly the reader it was built for.

   So the label names what is inside. "Go deeper" alone reads as
   filler; "Go deeper — 3 analyst views: SKU quadrant, outlet × SKU
   heatmap, outlet table" tells a reader whether it is worth the click
   and tells everyone else that the depth exists.

   Open state persists per page, because a reader who wants the detail
   usually wants it every time, and re-opening it on every visit is the
   kind of small friction that trains people to stop looking. */

import { useEffect, useState, type ReactNode } from "react";

export default function GoDeeper({
  id,
  items,
  children,
}: {
  /* Storage key — one per page, so Shelf and Pricing remember
     separately. */
  id: string;
  /* What is inside, named. Rendered into the button label. */
  items: string[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const key = `vemi.deeper.${id}`;

  /* Read on the client only, and off the effect body — the same shape
     `useVisitData` uses for a cache hit. Setting state synchronously
     inside an effect cascades a render; deferring it by a tick does
     not, and the disclosure is closed on the server pass either way,
     so there is no hydration mismatch to manage. */
  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(key) === "1";
    } catch {
      /* private mode — the disclosure still works, it just forgets. */
    }
    if (!stored) return;
    const id = window.setTimeout(() => setOpen(true), 0);
    return () => window.clearTimeout(id);
  }, [key]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(key, next ? "1" : "0");
    } catch {
      /* nothing to do — state is still correct for this session. */
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-start gap-2.5 rounded-[14px] border border-line bg-white px-5 py-3.5 text-left transition-colors hover:bg-canvas"
      >
        <svg
          viewBox="0 0 16 16"
          className="mt-[3px] h-3.5 w-3.5 shrink-0 text-ink-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform .15s",
          }}
          aria-hidden
        >
          <path d="M6 3.5 10.5 8 6 12.5" />
        </svg>
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold text-ink-900">
            {open ? "Hide the analyst views" : "Go deeper"}
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-500">
            {items.length} view{items.length === 1 ? "" : "s"}:{" "}
            {items.join(" · ")}
          </span>
        </span>
      </button>

      {open && <div className="flex flex-col gap-4 pt-4">{children}</div>}
    </div>
  );
}
