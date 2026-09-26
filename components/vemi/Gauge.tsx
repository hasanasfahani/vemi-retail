import { cx } from "./cx";

/** A value against a target: violet fill, 2px Ink target tick. The number
    and the gap are always written beside it; the gauge is the glance. */
export function Gauge({
  value, max = 100, target, label, className, fill,
}: {
  value: number;
  max?: number;
  target?: number;
  /** Accessible summary, e.g. "87.6% against a 95% target". */
  label?: string;
  className?: string;
  /** Overrides the violet fill (e.g. a portfolio shade). */
  fill?: string;
}) {
  const pct = (v: number) => (max <= 0 ? 0 : Math.max(0, Math.min(100, (v / max) * 100)));
  return (
    <div
      className={cx("vm-gauge", className)}
      role="img"
      aria-label={label ?? (target !== undefined ? `${value} against a target of ${target}` : `${value} of ${max}`)}
    >
      <div className="vm-gauge__fill" style={{ width: `${pct(value)}%`, ...(fill ? { background: fill } : null) }} />
      {target !== undefined && <span className="vm-gauge__target" style={{ insetInlineStart: `${pct(target)}%` }} />}
    </div>
  );
}
