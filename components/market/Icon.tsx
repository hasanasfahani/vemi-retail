"use client";

/* One stroke-based icon set, drawn inline rather than pulled from a
   package: eleven glyphs is not worth a dependency, and hand-drawn
   ones stay on the same 1.6px stroke as the rest of the interface. */

import type { IconName } from "@/lib/market/nav";

const PATHS: Record<IconName, string> = {
  dashboard: "M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z",
  performance: "M3 20h18M6 16v-5M11 16V7M16 16v-8M21 16v-3",
  competition: "M4 20V9M10 20V4M16 20v-7M22 20v-4",
  insights: "M12 3a6 6 0 0 0-3 11.2V17h6v-2.8A6 6 0 0 0 12 3zM10 20h4",
  actions: "M4 6h16M4 12h9M4 18h9M16 16l2 2 4-4",
  pos: "M4 9h16v11H4zM4 9l2-5h12l2 5M10 20v-6h4v6",
  report: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7",
  trends: "M3 17l5-6 4 3 5-7 4 4M3 21h18",
  setup: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.7 7.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 16.5 5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
  customers: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1M17 8h5M19.5 5.5v5",
  watchlist: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M17 2.1a4 4 0 0 1 0 7.8",
};

export default function Icon({
  name,
  className = "h-[18px] w-[18px]",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
