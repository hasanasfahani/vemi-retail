import { cx } from "@/components/vemi/cx";

/* The client's mark in its own portal (docs/PORTAL-NEUTRAL-PLAN.md, N5):
   a neutral monogram from the client's name. Deliberately not the
   client's logo — uploading real trademarks is a later feature — and
   deliberately not violet, because this is the client's identity, not
   Vemi's. */
export function monogram(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export default function ClientMark({
  name,
  size = 32,
  className,
}: {
  name: string;
  size?: 28 | 32 | 40;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-md border border-line bg-primary-tint font-semibold text-text",
        size === 40 ? "h-10 w-10 text-sm" : size === 32 ? "h-8 w-8 text-xs" : "h-7 w-7 text-xs",
        className
      )}
    >
      {monogram(name)}
    </span>
  );
}
