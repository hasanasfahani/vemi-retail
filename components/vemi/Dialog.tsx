"use client";

import { useId, useRef, type ReactNode } from "react";
import { cx } from "./cx";
import Icon from "./Icon";
import { useOverlay } from "./useOverlay";

/**
 * Centered modal. Surface, radius 16, overlay shadow, Ink scrim, title
 * 22/600, actions bottom-end. Pass `title` for the standard header, or
 * `labelledBy` when the body draws its own heading.
 */
export function Dialog({
  open, onClose, title, description, footer, labelledBy, width = 560, className, children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  labelledBy?: string;
  /** Max width in px; null leaves it to a className such as max-w-4xl. */
  width?: number | null;
  className?: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const autoId = useId();
  useOverlay(open, onClose, panel);
  if (!open) return null;
  const titleId = labelledBy ?? `${autoId}-title`;

  return (
    <div className="vm-dialog-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="vm-scrim" aria-hidden="true" onMouseDown={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx("vm-dialog", className)}
        style={width ? { maxWidth: width } : undefined}
      >
        {title ? (
          <div className="vm-dialog__head">
            <div className="min-w-0">
              <h2 id={titleId} className="vm-dialog__title">{title}</h2>
              {description && <p className="vm-dialog__desc">{description}</p>}
            </div>
            <button type="button" className="vm-iconbtn -me-2 -mt-2" aria-label="Close" onClick={onClose}>
              <Icon name="close" />
            </button>
          </div>
        ) : (
          <button type="button" className="vm-iconbtn absolute end-2 top-2 z-10" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        )}
        {title ? <div className="vm-dialog__body">{children}</div> : children}
        {footer && <div className="vm-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}
