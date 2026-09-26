import type { ReactNode } from "react";
import { cx } from "./cx";
import { ConfidenceBadge, type Confidence } from "./ConfidenceBadge";

export type Direction = "up" | "down" | "flat";
const ARROW: Record<Direction, string> = { up: "▲", down: "▼", flat: "–" };

export interface KpiDelta {
  /** Preformatted change, e.g. "1.2 pts". */
  change: string;
  /** The comparison, named: "vs Aug 2026" (plan D5). */
  window: string;
  direction: Direction;
}

/**
 * One headline metric: mono label, value, delta with its window, then
 * the basis line ("As of 26 Sep · 742 outlets"). The arrow shows
 * direction only, never good or bad.
 */
export function KpiCard({
  label, value, unit, delta, asOf, base, confidence, size = "hero", top, children, className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: KpiDelta;
  asOf?: string;
  base?: string;
  confidence?: Confidence;
  /** `hero`: 56px, the first KPI row of a page. `compact`: 36px, secondary grids. */
  size?: "hero" | "compact";
  /** Right side of the label row: info or watch controls. */
  top?: ReactNode;
  /** Between value and footer: a gauge, a band chip. */
  children?: ReactNode;
  className?: string;
}) {
  const foot = [asOf, base].filter(Boolean).join(" · ");
  return (
    <section className={cx("vm-kpi", size === "compact" && "vm-kpi--compact", className)} aria-label={label}>
      <div className="vm-kpi__top">
        <span className="vm-label">{label}</span>
        {(confidence || top) && (
          <span className="flex items-center gap-2">
            {confidence && <ConfidenceBadge level={confidence} size="sm" />}
            {top}
          </span>
        )}
      </div>
      <div className="vm-kpi__value">
        {value}
        {unit && <span className="vm-kpi__unit">{unit}</span>}
      </div>
      {children}
      {delta && (
        <div className={cx("vm-kpi__delta", `vm-kpi__delta--${delta.direction}`)}>
          <span aria-hidden="true">{ARROW[delta.direction]}</span>
          <span>
            {delta.direction === "flat" ? "flat" : delta.change} {delta.window}
          </span>
        </div>
      )}
      {foot && <div className="vm-kpi__foot">{foot}</div>}
    </section>
  );
}
