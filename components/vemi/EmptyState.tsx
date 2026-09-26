import type { ReactNode } from "react";
import { cx } from "./cx";

/** What is missing, why or when it arrives, and one way forward. No illustration. */
export function EmptyState({
  title, lead, action, align = "center", className,
}: { title: ReactNode; lead?: ReactNode; action?: ReactNode; align?: "start" | "center"; className?: string }) {
  return (
    <div className={cx("vm-empty", align === "center" && "vm-empty--center", className)}>
      <p className="vm-empty__title">{title}</p>
      {lead && <p className="vm-empty__lead">{lead}</p>}
      {action && <div className="vm-empty__action">{action}</div>}
    </div>
  );
}
