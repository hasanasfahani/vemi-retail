/* Inline stroke icons for /v2 — self-contained so v2 can be promoted or
   deleted without touching the v1 icon set. 24x24, currentColor. */

const paths: Record<string, React.ReactNode> = {
  /* --- retail audit capabilities --- */
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
  trend: (
    <>
      <path d="m3 16.5 5.5-5.5 3.5 3.5L21 5.5" />
      <path d="M15.5 5.5H21V11" />
    </>
  ),
};

export default function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name] ?? paths.bars}
    </svg>
  );
}
