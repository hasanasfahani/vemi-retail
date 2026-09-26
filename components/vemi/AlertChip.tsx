import type { ReactNode } from "react";
import { cx } from "./cx";
import Icon from "./Icon";

/** The ONE Signal element per view: what happened and where
    ("Critical · 29 outlets in Basra"). Never for form errors or decoration. */
export function AlertChip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("vm-alert", className)} role="status">
      <Icon name="alert-triangle" size={16} />
      {children}
    </span>
  );
}
