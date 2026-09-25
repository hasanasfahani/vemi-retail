"use client";

import { useState } from "react";
import FullDemoModal from "./FullDemoModal";
import { useRole } from "./useRole";

/* Gates a module behind the full-demo request.

   Admins see the content untouched. Everyone else sees it blurred with
   a card over it — the shape of the page stays visible, so a visitor
   can tell there is something real behind the gate rather than an
   empty placeholder.

   The blur is presentation only: the content still renders and its
   data is still in the page. That is fine here because the portal runs
   on illustrative data, but it is not access control and must not be
   treated as such if real client data ever lands in these pages. */

export default function LockedOverlay({
  title,
  children,
}: {
  /* Names the module in the CTA and in the lead. */
  title: string;
  children: React.ReactNode;
}) {
  const role = useRole();
  const [open, setOpen] = useState(false);

  if (role === "admin") return <>{children}</>;

  return (
    <div className="relative">
      {/* Out of the tab order and hidden from screen readers: blurred
          text is not readable, so offering it to a keyboard or screen
          reader user would be worse than omitting it. */}
      <div
        aria-hidden
        className="pointer-events-none select-none blur-[6px]"
        style={{ filter: "blur(6px) saturate(0.85)" }}
      >
        {children}
      </div>

      <div className="absolute inset-0 flex items-start justify-center px-4 py-16">
        <div className="sticky top-28 w-full max-w-md rounded-2xl border border-line bg-white/95 p-7 text-center shadow-[var(--shadow-surface)] backdrop-blur-sm">
          <span
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: "var(--color-violet-050)" }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="var(--color-violet-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
              <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
            </svg>
          </span>

          <h2 className="t-h3 mt-4 !text-lg">{title} is part of the full platform</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            This module is available on a guided walkthrough, where we set it up
            around your categories and markets.
          </p>

          <button type="button" onClick={() => setOpen(true)} className="btn-primary mt-5 w-full">
            Request Full Demo
          </button>
        </div>
      </div>

      <FullDemoModal open={open} onClose={() => setOpen(false)} source={title} />
    </div>
  );
}
