import { cx } from "./cx";

export type Confidence = "measured" | "estimated" | "stale";

const LABEL: Record<Confidence, string> = { measured: "Measured", estimated: "Estimated", stale: "Stale" };
const MEANING: Record<Confidence, string> = {
  measured: "Counted in the field",
  estimated: "Modelled from field counts and a stated assumption",
  stale: "Older than the reporting window",
};

/** How a number was obtained. Fill style and word carry the meaning, never hue. */
export function ConfidenceBadge({
  level, children, size = "md", className,
}: { level: Confidence; children?: string; size?: "md" | "sm"; className?: string }) {
  return (
    <span className={cx("vm-badge", `vm-badge--${level}`, size === "sm" && "vm-badge--sm", className)} title={MEANING[level]}>
      <span className="vm-badge__dot" aria-hidden="true" />
      {children ?? LABEL[level]}
    </span>
  );
}
