import type { ReactNode } from "react";
import { cx } from "./cx";
import Icon from "./Icon";

/**
 * A module outside the client's plan. Stated plainly on Paper, never
 * greyed out with opacity or blurred: "Not in your plan", what it does,
 * and one text action.
 */
export function LockedRegion({
  title, lead, action, label = "Not in your plan", className,
}: { title: ReactNode; lead?: ReactNode; action?: ReactNode; label?: string; className?: string }) {
  return (
    <section className={cx("vm-locked", className)}>
      <span className="vm-label inline-flex items-center gap-2">
        <Icon name="lock" size={16} />
        {label}
      </span>
      <h2 className="vm-locked__title">{title}</h2>
      {lead && <p className="vm-locked__lead">{lead}</p>}
      {action}
    </section>
  );
}
