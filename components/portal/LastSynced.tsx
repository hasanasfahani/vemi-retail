"use client";

/* "Synced 3 min ago" — the workspace's own connection, ticking.

   Deliberately distinct from the "Data as of" badge beside it: that
   one names the field visit the figures come from, this one says when
   this session last pulled them. Conflating the two would overstate
   how fresh the audit is. */

import { useEffect, useState } from "react";

function phrase(seconds: number) {
  if (seconds < 45) return "Synced just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Synced ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `Synced ${hours} hr ago`;
}

export default function LastSynced() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // setState from the interval callback, not the effect body
    const id = window.setInterval(() => setSeconds((s) => s + 30), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="hidden items-center gap-1.5 text-[13px] text-ink-500 md:inline-flex">
      <span
        className="dot dot-live"
        style={{ background: "var(--color-good)" }}
        aria-hidden
      />
      {phrase(seconds)}
    </span>
  );
}
