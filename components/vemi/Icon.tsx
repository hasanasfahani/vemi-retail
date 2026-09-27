/* The one icon set. Stroke-based, 24-unit grid, currentColor, round
   caps; drawn at 16 / 20 / 24px with a 1.75 stroke (brand kit:
   "line icons, 1.5-2px stroke").

   Merged from the portal rail's glyphs and the marketing site's, plus
   the interface glyphs the components need, so there is one API and
   one stroke weight everywhere. Hand-drawn rather than a package: a
   few dozen glyphs is not worth a dependency (lucide is the named
   fallback in the kit, deferred to phase 2 of the plan). */

import type { ReactNode } from "react";

const GLYPHS = {
  /* --- portal navigation --- */
  dashboard: <path d="M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z" />,
  performance: <path d="M3 20h18M6 16v-5M11 16V7M16 16v-8M21 16v-3" />,
  competition: <path d="M4 20V9M10 20V4M16 20v-7M22 20v-4" />,
  insights: <path d="M12 3a6 6 0 0 0-3 11.2V17h6v-2.8A6 6 0 0 0 12 3zM10 20h4" />,
  actions: <path d="M4 6h16M4 12h9M4 18h9M16 16l2 2 4-4" />,
  pos: <path d="M4 9h16v11H4zM4 9l2-5h12l2 5M10 20v-6h4v6" />,
  report: <path d="M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7" />,
  trends: <path d="M3 17l5-6 4 3 5-7 4 4M3 21h18" />,
  setup: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.7 7.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.1A1.6 1.6 0 0 0 16.5 5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />,
  "custom-report": <path d="M4 4h16v16H4zM4 9h16M9 9v11" />,
  plus: <path d="M12 5v14M5 12h14" />,
  customers: <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1M17 8h5M19.5 5.5v5" />,
  watchlist: <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  users: <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M17 2.1a4 4 0 0 1 0 7.8" />,

  /* --- interface --- */
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  "chevron-up": <path d="m6 15 6-6 6 6" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.01" />
    </>
  ),
  "alert-triangle": (
    <>
      <path d="M12 3.5 21 19.5H3z" />
      <path d="M12 10v4M12 17.2v.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  bell: <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />,

  /* --- capabilities and evidence (marketing site) --- */
  alert: (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17.3" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  bars: (
    <>
      <line x1="5" y1="21" x2="5" y2="11" />
      <line x1="12" y1="21" x2="12" y2="4" />
      <line x1="19" y1="21" x2="19" y2="14" />
    </>
  ),
  tag: (
    <>
      <path d="M20.5 13.5 13 21a2 2 0 0 1-2.8 0L3 13.8V4h9.8l7.7 7.7a2 2 0 0 1 0 2.8Z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  planogram: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <rect x="5.5" y="6" width="3.5" height="4" rx="0.5" />
      <rect x="10.5" y="6" width="3.5" height="4" rx="0.5" />
      <rect x="5.5" y="14" width="3.5" height="4" rx="0.5" />
      <rect x="15.5" y="14" width="3.5" height="4" rx="0.5" />
    </>
  ),
  photo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 18 5-4 4 3 3-2 4 3" />
    </>
  ),
  assortment: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 17.5 9 5 9-5" />
    </>
  ),
  swap: (
    <>
      <path d="M7 4 3 8l4 4" />
      <path d="M3 8h13" />
      <path d="m17 20 4-4-4-4" />
      <path d="M21 16H8" />
    </>
  ),

  /* --- how it works --- */
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  mobile: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <line x1="10.5" y1="18.5" x2="13.5" y2="18.5" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.8 4.5 6v6.2c0 4.3 3.1 7.6 7.5 9 4.4-1.4 7.5-4.7 7.5-9V6L12 2.8Z" />
      <path d="m8.8 12 2.3 2.3 4.2-4.4" />
    </>
  ),
  bolt: <path d="M13.5 2 4 13.5h6.5L10 22l9.5-11.5H13L13.5 2Z" />,

  /* --- trust --- */
  pin: (
    <>
      <path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10.2" r="2.6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.8V12l3.4 2" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3.2 13.7 9l5.8 1.7-5.8 1.7L12 18.2l-1.7-5.8L4.5 10.7 10.3 9 12 3.2Z" />
      <path d="M18.8 17.2 19.5 19l1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.8 2.8L16 9.6" />
    </>
  ),
  /* status glyphs: one distinct shape per band, so the band still
     reads where red and green merge (check · minus · triangle · octagon) */
  "minus-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
    </>
  ),
  "alert-octagon": (
    <>
      <path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z" />
      <path d="M12 8v4.5M12 16v.01" />
    </>
  ),
  circle: <circle cx="12" cy="12" r="6" />,
  workflow: (
    <>
      <rect x="3" y="3.5" width="6" height="5" rx="1.2" />
      <rect x="15" y="3.5" width="6" height="5" rx="1.2" />
      <rect x="9" y="15.5" width="6" height="5" rx="1.2" />
      <path d="M6 8.5v3.5h12V8.5M12 12v3.5" />
    </>
  ),
  link: (
    <>
      <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.6 1.6" />
      <path d="M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.6-1.6" />
    </>
  ),

  /* --- expansion pillars --- */
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 20c0-3.3 2.8-5.6 6.2-5.6s6.2 2.3 6.2 5.6" />
      <path d="M16.2 5.2a3.2 3.2 0 0 1 0 6.1" />
      <path d="M17.5 14.9c2.2.6 3.7 2.4 3.7 5.1" />
    </>
  ),
  "trend-down": (
    <>
      <path d="m3 7.5 5.5 5.5 3.5-3.5L21 18.5" />
      <path d="M15.5 18.5H21V13" />
    </>
  ),
  trend: (
    <>
      <path d="m3 16.5 5.5-5.5 3.5 3.5L21 5.5" />
      <path d="M15.5 5.5H21V11" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof GLYPHS;

export const ICON_NAMES = Object.keys(GLYPHS) as IconName[];

const SIZE = { 16: "h-4 w-4", 20: "h-5 w-5", 24: "h-6 w-6" } as const;

export default function Icon({
  name,
  size = 20,
  className,
  label,
}: {
  name: IconName;
  size?: keyof typeof SIZE;
  /* Extra classes (color, margin). If it sets its own h-/w-/size-
     box, that replaces the size classes; otherwise `size` still applies. */
  className?: string;
  /* An accessible name for an icon that stands alone. Omit for
     decorative icons beside a text label (the default). */
  label?: string;
}) {
  const ownBox = className ? /(^|\s)(!?)(h|w|size)-/.test(className) : false;
  const box = ownBox ? className : `${SIZE[size]} ${className ?? ""}`;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${box}`}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {GLYPHS[name]}
    </svg>
  );
}
