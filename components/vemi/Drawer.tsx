"use client";

import { useId, useRef, type ReactNode } from "react";
import Icon from "./Icon";
import { useOverlay } from "./useOverlay";

/**
 * Right-hand slide-over: detail without losing your place. Paper header
 * band (an optional mono eyebrow such as an outlet code, then the h3
 * name), scrolling body, optional footer.
 */
export function Drawer({
  open, onClose, title, eyebrow, subtitle, badge, footer, width = 480, children,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
  width?: number;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  useOverlay(open, onClose, panel);
  if (!open) return null;

  return (
    <>
      <div className="vm-scrim" aria-hidden="true" onMouseDown={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className="vm-drawer"
        style={{ width: `min(${width}px, 100vw)` }}
      >
        <header className="vm-drawer__head">
          <div className="min-w-0">
            {eyebrow && <div className="vm-label mb-1">{eyebrow}</div>}
            <h2 id={id} className="vm-drawer__title">{title}</h2>
            {subtitle && <p className="vm-drawer__sub">{subtitle}</p>}
            {badge && <div className="mt-2">{badge}</div>}
          </div>
          <button type="button" className="vm-iconbtn" aria-label="Close panel" onClick={onClose}>
            <Icon name="close" />
          </button>
        </header>
        <div className="vm-drawer__body">{children}</div>
        {footer && <footer className="vm-drawer__foot">{footer}</footer>}
      </div>
    </>
  );
}
