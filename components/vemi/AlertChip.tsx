import type { ReactNode } from "react";
import { cx } from "./cx";
import Icon from "./Icon";

/** The ONE alert element per view: what happened and where
    ("Critical · 29 outlets in Basra"). Never for form errors or decoration.
    Pass the `band` the alert is about: inside the client portal it then
    takes that band's status colour and glyph (docs/PORTAL-NEUTRAL-PLAN.md);
    on the Vemi surface it stays Signal amber. */
export function AlertChip({
  children, band, className,
}: { children: ReactNode; band?: "critical" | "attention"; className?: string }) {
  return (
    <span className={cx("vm-alert", band && `vm-alert--${band}`, className)} role="status">
      <Icon name={band === "critical" ? "alert-octagon" : "alert-triangle"} size={16} />
      {children}
    </span>
  );
}
