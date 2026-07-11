/* Minimal inline stroke icons for feature cards — no external icon lib. */

const paths: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
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
  photo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 18 5-4 4 3 3-2 4 3" />
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
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v9h14v-9" />
      <line x1="12" y1="8" x2="12" y2="21" />
      <path d="M12 8S10 3 7.5 4.5 9.5 8 12 8Zm0 0s2-5 4.5-3.5S14.5 8 12 8Z" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17.5" r="0.6" fill="currentColor" />
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
      {paths[name] ?? paths.grid}
    </svg>
  );
}
