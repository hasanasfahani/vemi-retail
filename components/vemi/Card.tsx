import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

/** The base surface: white, 1px Line, radius 16, no shadow. One idea per card. */
export function Card({
  title, lead, actions, footnote, flush = false, className, children, ...rest
}: Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title?: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  /** Provenance line in mono: "As of 26 Sep · 742 outlets". */
  footnote?: ReactNode;
  /** Tables and maps draw their own edges: no body padding. */
  flush?: boolean;
}) {
  const head = title || lead || actions;
  return (
    <section className={cx("vm-card", flush && "vm-card--flush", className)} {...rest}>
      {head && (
        <header className="vm-card__head">
          <div className="vm-card__titles">
            {title && <h2 className="vm-card__title">{title}</h2>}
            {lead && <p className="vm-card__lead">{lead}</p>}
          </div>
          {actions && <div className="vm-card__actions">{actions}</div>}
        </header>
      )}
      {children}
      {footnote && <p className="vm-card__foot">{footnote}</p>}
    </section>
  );
}
