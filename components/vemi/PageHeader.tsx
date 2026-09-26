import type { ReactNode } from "react";
import { cx } from "./cx";

/** Eyebrow = scope (mono), title = the decision, description = one sentence. */
export function PageHeader({
  eyebrow, title, description, actions, className,
}: { eyebrow?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cx("vm-pagehead", className)}>
      <div className="vm-pagehead__text">
        {eyebrow && <div className="vm-label">{eyebrow}</div>}
        <h1 className="vm-pagehead__title">{title}</h1>
        {description && <p className="vm-pagehead__desc">{description}</p>}
      </div>
      {actions && <div className="vm-pagehead__actions">{actions}</div>}
    </header>
  );
}
